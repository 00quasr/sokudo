import { db } from '@/lib/db/drizzle';
import {
  connectedRepos,
  scannedCommands,
  repoGeneratedChallenges,
  repoCategories,
  type NewConnectedRepo,
  type NewScannedCommand,
  type NewRepoGeneratedChallenge,
  type NewRepoCategory,
  type ConnectedRepo,
  type ScannedCommand,
} from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createGitHubClient, parseGitHubUrl, type RepoMetadata } from './github';
import { parseFile, type ExtractedCommand } from './parsers';
import { analyzeCommands, type AnalyzedCommand } from './analyze';

export type { ExtractedCommand, AnalyzedCommand };
export { parseGitHubUrl };

// Rate limiting constants
const MAX_SCANS_PER_HOUR = 5;
const SCAN_CACHE_HOURS = 24;

export interface ScanResult {
  success: boolean;
  repoId: number;
  commandCount: number;
  error?: string;
}

export interface GenerateResult {
  success: boolean;
  challengeCount: number;
  error?: string;
}

/**
 * Connect a new GitHub repository for the user
 */
export async function connectRepo(
  userId: number,
  repoUrl: string,
  accessToken?: string
): Promise<{ success: boolean; repo?: ConnectedRepo; error?: string }> {
  // Parse the URL
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    return { success: false, error: 'Invalid GitHub URL format' };
  }

  const { owner, repo } = parsed;

  // Check if already connected
  const existing = await db
    .select()
    .from(connectedRepos)
    .where(
      and(
        eq(connectedRepos.userId, userId),
        eq(connectedRepos.owner, owner),
        eq(connectedRepos.name, repo)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return { success: true, repo: existing[0] };
  }

  // Fetch repo metadata from GitHub
  const client = createGitHubClient({ accessToken });

  try {
    const metadata = await client.getRepoMetadata(owner, repo);

    // Create the connected repo record
    const newRepo: NewConnectedRepo = {
      userId,
      repoUrl: metadata.html_url,
      owner: metadata.owner.login,
      name: metadata.name,
      description: metadata.description,
      defaultBranch: metadata.default_branch,
      isPrivate: metadata.private,
      scanStatus: 'pending',
    };

    const [created] = await db.insert(connectedRepos).values(newRepo).returning();

    return { success: true, repo: created };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to connect repository';
    return { success: false, error: message };
  }
}

/**
 * Scan a connected repository for commands
 */
export async function scanRepo(
  repoId: number,
  accessToken?: string
): Promise<ScanResult> {
  // Get the repo
  const [repo] = await db
    .select()
    .from(connectedRepos)
    .where(eq(connectedRepos.id, repoId))
    .limit(1);

  if (!repo) {
    return { success: false, repoId, commandCount: 0, error: 'Repository not found' };
  }

  // Check if recently scanned
  if (repo.lastScannedAt) {
    const hoursSinceLastScan =
      (Date.now() - repo.lastScannedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastScan < SCAN_CACHE_HOURS && repo.scanStatus === 'completed') {
      // Return cached result
      const existingCommands = await db
        .select()
        .from(scannedCommands)
        .where(eq(scannedCommands.repoId, repoId));
      return { success: true, repoId, commandCount: existingCommands.length };
    }
  }

  // Update status to scanning
  await db
    .update(connectedRepos)
    .set({ scanStatus: 'scanning', errorMessage: null, updatedAt: new Date() })
    .where(eq(connectedRepos.id, repoId));

  try {
    const client = createGitHubClient({ accessToken });

    // Fetch target files
    const files = await client.getTargetFiles(repo.owner, repo.name, repo.defaultBranch);

    // Parse all files
    const allCommands: ExtractedCommand[] = [];
    for (const file of files) {
      const commands = parseFile(file.path, file.content);
      allCommands.push(...commands);
    }

    // Clear old scanned commands
    await db.delete(scannedCommands).where(eq(scannedCommands.repoId, repoId));

    // Insert new scanned commands
    if (allCommands.length > 0) {
      const commandRecords: NewScannedCommand[] = allCommands.map((cmd) => ({
        repoId,
        sourceFile: cmd.sourceFile,
        rawContent: cmd.context || '',
        extractedCommand: cmd.command,
        commandType: cmd.commandType,
        frequency: 1,
      }));

      await db.insert(scannedCommands).values(commandRecords);
    }

    // Update repo status
    await db
      .update(connectedRepos)
      .set({
        scanStatus: 'completed',
        lastScannedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(connectedRepos.id, repoId));

    return { success: true, repoId, commandCount: allCommands.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Scan failed';

    await db
      .update(connectedRepos)
      .set({
        scanStatus: 'failed',
        errorMessage: message,
        updatedAt: new Date(),
      })
      .where(eq(connectedRepos.id, repoId));

    return { success: false, repoId, commandCount: 0, error: message };
  }
}

/**
 * Generate typing challenges from scanned commands using AI
 */
export async function generateChallenges(
  repoId: number,
  userId: number
): Promise<GenerateResult> {
  // Get the repo
  const [repo] = await db
    .select()
    .from(connectedRepos)
    .where(eq(connectedRepos.id, repoId))
    .limit(1);

  if (!repo) {
    return { success: false, challengeCount: 0, error: 'Repository not found' };
  }

  // Get scanned commands
  const commands = await db
    .select()
    .from(scannedCommands)
    .where(eq(scannedCommands.repoId, repoId));

  if (commands.length === 0) {
    return { success: false, challengeCount: 0, error: 'No commands found. Run scan first.' };
  }

  // Convert to ExtractedCommand format
  const extractedCommands: ExtractedCommand[] = commands.map((cmd) => ({
    command: cmd.extractedCommand,
    sourceFile: cmd.sourceFile,
    commandType: cmd.commandType,
    context: cmd.rawContent,
  }));

  // Analyze with AI
  const analyzed = await analyzeCommands(`${repo.owner}/${repo.name}`, extractedCommands);

  // Clear old generated challenges
  await db
    .delete(repoGeneratedChallenges)
    .where(
      and(
        eq(repoGeneratedChallenges.repoId, repoId),
        eq(repoGeneratedChallenges.userId, userId)
      )
    );

  // Insert new challenges
  if (analyzed.length > 0) {
    const challengeRecords: NewRepoGeneratedChallenge[] = analyzed.map((cmd) => ({
      repoId,
      userId,
      content: cmd.content,
      difficulty: cmd.difficulty,
      syntaxType: cmd.syntaxType,
      hint: cmd.hint,
      importance: cmd.importance,
      isSelected: true,
    }));

    await db.insert(repoGeneratedChallenges).values(challengeRecords);
  }

  return { success: true, challengeCount: analyzed.length };
}

/**
 * Save generated challenges as a custom category
 */
export async function saveAsCategory(
  repoId: number,
  userId: number,
  name: string,
  description?: string,
  icon?: string
): Promise<{ success: boolean; categoryId?: number; error?: string }> {
  // Get the repo
  const [repo] = await db
    .select()
    .from(connectedRepos)
    .where(eq(connectedRepos.id, repoId))
    .limit(1);

  if (!repo) {
    return { success: false, error: 'Repository not found' };
  }

  // Get selected challenges
  const challenges = await db
    .select()
    .from(repoGeneratedChallenges)
    .where(
      and(
        eq(repoGeneratedChallenges.repoId, repoId),
        eq(repoGeneratedChallenges.userId, userId),
        eq(repoGeneratedChallenges.isSelected, true)
      )
    );

  if (challenges.length === 0) {
    return { success: false, error: 'No challenges selected' };
  }

  // Create slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Create the category
  const newCategory: NewRepoCategory = {
    userId,
    repoId,
    name,
    slug: `repo-${repo.owner}-${repo.name}-${slug}`,
    description: description || `Commands from ${repo.owner}/${repo.name}`,
    icon: icon || 'code',
    challengeCount: challenges.length,
  };

  const [created] = await db.insert(repoCategories).values(newCategory).returning();

  return { success: true, categoryId: created.id };
}

/**
 * Get all connected repos for a user
 */
export async function getUserRepos(userId: number): Promise<ConnectedRepo[]> {
  return db
    .select()
    .from(connectedRepos)
    .where(eq(connectedRepos.userId, userId))
    .orderBy(desc(connectedRepos.createdAt));
}

/**
 * Get scanned commands for a repo
 */
export async function getRepoCommands(repoId: number): Promise<ScannedCommand[]> {
  return db
    .select()
    .from(scannedCommands)
    .where(eq(scannedCommands.repoId, repoId));
}

/**
 * Get generated challenges for a repo
 */
export async function getRepoChallenges(repoId: number, userId: number) {
  return db
    .select()
    .from(repoGeneratedChallenges)
    .where(
      and(
        eq(repoGeneratedChallenges.repoId, repoId),
        eq(repoGeneratedChallenges.userId, userId)
      )
    )
    .orderBy(desc(repoGeneratedChallenges.importance));
}

/**
 * Update challenge selection status
 */
export async function updateChallengeSelection(
  challengeId: number,
  userId: number,
  isSelected: boolean
): Promise<boolean> {
  const result = await db
    .update(repoGeneratedChallenges)
    .set({ isSelected })
    .where(
      and(
        eq(repoGeneratedChallenges.id, challengeId),
        eq(repoGeneratedChallenges.userId, userId)
      )
    )
    .returning({ id: repoGeneratedChallenges.id });

  return result.length > 0;
}

/**
 * Delete a connected repo
 */
export async function deleteRepo(repoId: number, userId: number): Promise<boolean> {
  const result = await db
    .delete(connectedRepos)
    .where(
      and(
        eq(connectedRepos.id, repoId),
        eq(connectedRepos.userId, userId)
      )
    )
    .returning({ id: connectedRepos.id });

  return result.length > 0;
}

/**
 * Get user's saved repo categories for the practice page
 */
export async function getUserRepoCategories(userId: number) {
  return db
    .select({
      id: repoCategories.id,
      name: repoCategories.name,
      slug: repoCategories.slug,
      description: repoCategories.description,
      icon: repoCategories.icon,
      challengeCount: repoCategories.challengeCount,
      repoOwner: connectedRepos.owner,
      repoName: connectedRepos.name,
      createdAt: repoCategories.createdAt,
    })
    .from(repoCategories)
    .innerJoin(connectedRepos, eq(repoCategories.repoId, connectedRepos.id))
    .where(eq(repoCategories.userId, userId))
    .orderBy(desc(repoCategories.createdAt));
}
