import { db } from './drizzle';
import { categories, challenges } from './schema';
import { eq } from 'drizzle-orm';

/**
 * GitHub CLI (gh) challenges
 *
 * 30 challenges covering:
 * - PRs, issues, repos
 * - Actions and workflows
 * - Auth and config
 */
export const githubCliChallenges = [
  // === Auth ===
  {
    content: 'gh auth login',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Authenticate with GitHub',
  },
  {
    content: 'gh auth status',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Check authentication status',
  },
  {
    content: 'gh auth logout',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Sign out of GitHub',
  },

  // === Pull Requests ===
  {
    content: 'gh pr list',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'List open pull requests',
  },
  {
    content: 'gh pr create',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Create a new pull request',
  },
  {
    content: 'gh pr view',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'View current pull request',
  },
  {
    content: 'gh pr checkout 123',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Checkout a PR by number',
  },
  {
    content: 'gh pr merge --squash',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Squash and merge a PR',
  },
  {
    content: 'gh pr review --approve',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Approve a pull request',
  },
  {
    content: 'gh pr create --fill',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Create PR with auto-filled title and body',
  },
  {
    content: 'gh pr diff',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'View PR diff in terminal',
  },

  // === Issues ===
  {
    content: 'gh issue list',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'List open issues',
  },
  {
    content: 'gh issue create',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Create a new issue',
  },
  {
    content: 'gh issue view 42',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'View issue by number',
  },
  {
    content: 'gh issue close 42',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Close an issue',
  },
  {
    content: 'gh issue list --label bug',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'List issues with specific label',
  },

  // === Repos ===
  {
    content: 'gh repo clone owner/repo',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Clone a repository',
  },
  {
    content: 'gh repo create',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Create a new repository',
  },
  {
    content: 'gh repo view',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'View repository details',
  },
  {
    content: 'gh repo fork',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Fork the current repository',
  },
  {
    content: 'gh repo view --web',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Open repo in browser',
  },

  // === Actions ===
  {
    content: 'gh run list',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'List recent workflow runs',
  },
  {
    content: 'gh run view',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'View a workflow run',
  },
  {
    content: 'gh run watch',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Watch a workflow run in real-time',
  },
  {
    content: 'gh workflow run deploy.yml',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Trigger a workflow manually',
  },
  {
    content: 'gh run rerun 123456',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Re-run a failed workflow',
  },

  // === Other ===
  {
    content: 'gh gist create file.txt',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Create a gist from a file',
  },
  {
    content: 'gh release create v1.0.0',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Create a new release',
  },
  {
    content: 'gh api repos/{owner}/{repo}',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Make a raw API request',
  },
  {
    content: 'gh codespace create',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Create a new codespace',
  },
];

export async function seedGithubCliChallenges() {
  console.log('Seeding GitHub CLI challenges...');

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, 'github-cli'))
    .limit(1);

  if (!category) {
    console.error('Error: GitHub CLI category not found. Run db:seed first.');
    process.exit(1);
  }

  const challengeData = githubCliChallenges.map((challenge) => ({
    ...challenge,
    categoryId: category.id,
  }));

  await db.insert(challenges).values(challengeData);

  console.log(`Seeded ${githubCliChallenges.length} GitHub CLI challenges.`);
}

if (require.main === module) {
  seedGithubCliChallenges()
    .catch((error) => {
      console.error('Seed GitHub CLI failed:', error);
      process.exit(1);
    })
    .finally(() => {
      console.log('Seed GitHub CLI finished. Exiting...');
      process.exit(0);
    });
}
