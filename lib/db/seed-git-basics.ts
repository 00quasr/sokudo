import { db } from './drizzle';
import { categories, challenges } from './schema';
import { eq } from 'drizzle-orm';

/**
 * Git Basics challenges covering 8 core commands:
 * status, add, commit, push, pull, branch, checkout, merge
 *
 * 30 challenges total, varying in difficulty:
 * - beginner: simple single commands
 * - intermediate: commands with common options/flags
 * - advanced: more complex command combinations
 */
export const gitBasicsChallenges = [
  // === STATUS (4 challenges) ===
  {
    content: 'git status',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Check the status of your working directory',
  },
  {
    content: 'git status -s',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Show status in short format',
  },
  {
    content: 'git status --short',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Show status in short format (long flag)',
  },
  {
    content: 'git status --branch',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Show branch and tracking info in short format',
  },

  // === ADD (5 challenges) ===
  {
    content: 'git add .',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Stage all changes in current directory',
  },
  {
    content: 'git add -A',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Stage all changes including deletions',
  },
  {
    content: 'git add README.md',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Stage a specific file',
  },
  {
    content: 'git add src/',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Stage all files in a directory',
  },
  {
    content: 'git add -p',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Interactively stage changes (patch mode)',
  },

  // === COMMIT (5 challenges) ===
  {
    content: 'git commit -m "initial commit"',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Commit with an inline message',
  },
  {
    content: 'git commit -m "fix: resolve login bug"',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Commit with conventional commit message',
  },
  {
    content: 'git commit --amend',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Amend the last commit',
  },
  {
    content: 'git commit -am "update README"',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Stage tracked files and commit in one step',
  },
  {
    content: 'git commit --amend --no-edit',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Amend last commit without changing message',
  },

  // === PUSH (4 challenges) ===
  {
    content: 'git push',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Push commits to the default remote',
  },
  {
    content: 'git push origin main',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Push to a specific remote and branch',
  },
  {
    content: 'git push -u origin main',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Push and set upstream tracking',
  },
  {
    content: 'git push origin feature-branch',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Push a feature branch to remote',
  },

  // === PULL (3 challenges) ===
  {
    content: 'git pull',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Fetch and merge from remote',
  },
  {
    content: 'git pull origin main',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Pull from a specific remote and branch',
  },
  {
    content: 'git pull --rebase',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Pull and rebase instead of merge',
  },

  // === BRANCH (4 challenges) ===
  {
    content: 'git branch',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'List local branches',
  },
  {
    content: 'git branch feature-auth',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Create a new branch',
  },
  {
    content: 'git branch -d feature-done',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Delete a merged branch',
  },
  {
    content: 'git branch -a',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'List all branches including remote',
  },

  // === CHECKOUT (3 challenges) ===
  {
    content: 'git checkout main',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Switch to an existing branch',
  },
  {
    content: 'git checkout -b new-feature',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Create and switch to a new branch',
  },
  {
    content: 'git checkout -- src/index.ts',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Discard changes in a specific file',
  },

  // === MERGE (2 challenges) ===
  {
    content: 'git merge feature-branch',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Merge a branch into current branch',
  },
  {
    content: 'git merge --no-ff feature-branch',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Merge with a merge commit (no fast-forward)',
  },
];

export async function seedGitBasicsChallenges() {
  console.log('Seeding Git Basics challenges...');

  // Get the Git Basics category
  const [gitBasicsCategory] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, 'git-basics'))
    .limit(1);

  if (!gitBasicsCategory) {
    console.error('Error: Git Basics category not found. Run db:seed first.');
    process.exit(1);
  }

  const categoryId = gitBasicsCategory.id;

  // Insert challenges
  const challengeData = gitBasicsChallenges.map((challenge) => ({
    ...challenge,
    categoryId,
  }));

  await db.insert(challenges).values(challengeData);

  console.log(`Seeded ${gitBasicsChallenges.length} Git Basics challenges.`);
}

// Run if executed directly
if (require.main === module) {
  seedGitBasicsChallenges()
    .catch((error) => {
      console.error('Seed Git Basics failed:', error);
      process.exit(1);
    })
    .finally(() => {
      console.log('Seed Git Basics finished. Exiting...');
      process.exit(0);
    });
}
