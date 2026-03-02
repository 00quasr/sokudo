import { db } from './drizzle';
import { categories, challenges } from './schema';
import { eq } from 'drizzle-orm';

/**
 * Claude Code challenges covering Anthropic CLI slash commands
 *
 * 25 challenges covering:
 * - Basic slash commands
 * - Code generation and editing
 * - Context and conversation management
 */
export const claudeCodeChallenges = [
  // === Basic Commands ===
  {
    content: '/help',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Show available commands and help',
  },
  {
    content: '/clear',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Clear the conversation history',
  },
  {
    content: '/compact',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Summarize conversation to reduce context',
  },
  {
    content: '/config',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'View or edit configuration settings',
  },
  {
    content: '/cost',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Show token usage and cost for the session',
  },

  // === Code Operations ===
  {
    content: '/review',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Review code changes or PR',
  },
  {
    content: '/commit',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Create a git commit with AI-generated message',
  },
  {
    content: '/pr',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Create a pull request',
  },
  {
    content: '/pr-comments',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'View and respond to PR comments',
  },
  {
    content: '/init',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Initialize Claude Code in a project',
  },

  // === Context Management ===
  {
    content: '/add-dir src/',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Add a directory to context',
  },
  {
    content: '/add-file package.json',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Add a specific file to context',
  },
  {
    content: '/context',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Show current context files',
  },
  {
    content: '/memory',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Manage persistent memory across sessions',
  },
  {
    content: '/terminal-setup',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Configure terminal integration',
  },

  // === Model and Settings ===
  {
    content: '/model opus',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Switch to Opus model',
  },
  {
    content: '/model sonnet',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Switch to Sonnet model',
  },
  {
    content: '/model haiku',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Switch to Haiku model',
  },
  {
    content: '/permissions',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Manage tool permissions',
  },
  {
    content: '/allowed-tools',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'View allowed tools for the session',
  },

  // === Advanced Operations ===
  {
    content: '/bug',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Report a bug or issue',
  },
  {
    content: '/doctor',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Diagnose and fix common issues',
  },
  {
    content: '/logout',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Sign out of Claude Code',
  },
  {
    content: '/status',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Check API connection status',
  },
  {
    content: '/vim',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Toggle vim keybindings mode',
  },
];

export async function seedClaudeCodeChallenges() {
  console.log('Seeding Claude Code challenges...');

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, 'claude-code'))
    .limit(1);

  if (!category) {
    console.error('Error: Claude Code category not found. Run db:seed first.');
    process.exit(1);
  }

  const challengeData = claudeCodeChallenges.map((challenge) => ({
    ...challenge,
    categoryId: category.id,
  }));

  await db.insert(challenges).values(challengeData);

  console.log(`Seeded ${claudeCodeChallenges.length} Claude Code challenges.`);
}

if (require.main === module) {
  seedClaudeCodeChallenges()
    .catch((error) => {
      console.error('Seed Claude Code failed:', error);
      process.exit(1);
    })
    .finally(() => {
      console.log('Seed Claude Code finished. Exiting...');
      process.exit(0);
    });
}
