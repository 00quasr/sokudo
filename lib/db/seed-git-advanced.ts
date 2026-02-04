import { db } from './drizzle';
import { categories, challenges } from './schema';
import { eq } from 'drizzle-orm';

/**
 * Git Advanced challenges covering 5 advanced commands:
 * rebase, stash, cherry-pick, reflog, bisect
 *
 * 25 challenges total, varying in difficulty:
 * - intermediate: standard usage of these advanced commands
 * - advanced: complex options and workflows
 */
export const gitAdvancedChallenges = [
  // === REBASE (6 challenges) ===
  {
    content: 'git rebase main',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Rebase current branch onto main',
  },
  {
    content: 'git rebase origin/main',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Rebase current branch onto remote main',
  },
  {
    content: 'git rebase --continue',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Continue rebase after resolving conflicts',
  },
  {
    content: 'git rebase --abort',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Abort the current rebase operation',
  },
  {
    content: 'git rebase --skip',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Skip the current commit during rebase',
  },
  {
    content: 'git rebase --onto main feature-a feature-b',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Rebase a range of commits onto a new base',
  },

  // === STASH (6 challenges) ===
  {
    content: 'git stash',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Stash uncommitted changes',
  },
  {
    content: 'git stash pop',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Apply and remove the latest stash',
  },
  {
    content: 'git stash list',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'List all stashed changes',
  },
  {
    content: 'git stash apply',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Apply the latest stash without removing it',
  },
  {
    content: 'git stash drop',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Remove the latest stash',
  },
  {
    content: 'git stash push -m "work in progress"',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Stash changes with a descriptive message',
  },

  // === CHERRY-PICK (5 challenges) ===
  {
    content: 'git cherry-pick abc1234',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Apply a specific commit to current branch',
  },
  {
    content: 'git cherry-pick --continue',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Continue cherry-pick after resolving conflicts',
  },
  {
    content: 'git cherry-pick --abort',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Abort the current cherry-pick operation',
  },
  {
    content: 'git cherry-pick -n abc1234',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Cherry-pick without committing (stage only)',
  },
  {
    content: 'git cherry-pick abc1234..def5678',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Cherry-pick a range of commits',
  },

  // === REFLOG (4 challenges) ===
  {
    content: 'git reflog',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Show reference log of HEAD changes',
  },
  {
    content: 'git reflog show main',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Show reflog for a specific branch',
  },
  {
    content: 'git reset --hard HEAD@{1}',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Restore to previous HEAD state using reflog',
  },
  {
    content: 'git checkout HEAD@{2}',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Checkout a previous HEAD state from reflog',
  },

  // === BISECT (4 challenges) ===
  {
    content: 'git bisect start',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Start a binary search for a bug',
  },
  {
    content: 'git bisect bad',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Mark current commit as bad during bisect',
  },
  {
    content: 'git bisect good abc1234',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Mark a commit as good during bisect',
  },
  {
    content: 'git bisect reset',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'End bisect session and return to original HEAD',
  },
];

export async function seedGitAdvancedChallenges() {
  console.log('Seeding Git Advanced challenges...');

  // Get the Git Advanced category
  const [gitAdvancedCategory] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, 'git-advanced'))
    .limit(1);

  if (!gitAdvancedCategory) {
    console.error('Error: Git Advanced category not found. Run db:seed first.');
    process.exit(1);
  }

  const categoryId = gitAdvancedCategory.id;

  // Insert challenges
  const challengeData = gitAdvancedChallenges.map((challenge) => ({
    ...challenge,
    categoryId,
  }));

  await db.insert(challenges).values(challengeData);

  console.log(`Seeded ${gitAdvancedChallenges.length} Git Advanced challenges.`);
}

// Run if executed directly
if (require.main === module) {
  seedGitAdvancedChallenges()
    .catch((error) => {
      console.error('Seed Git Advanced failed:', error);
      process.exit(1);
    })
    .finally(() => {
      console.log('Seed Git Advanced finished. Exiting...');
      process.exit(0);
    });
}
