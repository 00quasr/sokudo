import { db } from './drizzle';
import { categories, challenges } from './schema';
import { eq } from 'drizzle-orm';

/**
 * Vercel CLI challenges
 *
 * 25 challenges covering:
 * - Deployment
 * - Environment variables
 * - Domains and projects
 */
export const vercelCliChallenges = [
  // === Basic Commands ===
  {
    content: 'vercel',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Deploy to Vercel (preview)',
  },
  {
    content: 'vercel --prod',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Deploy to production',
  },
  {
    content: 'vercel login',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Authenticate with Vercel',
  },
  {
    content: 'vercel logout',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Sign out of Vercel',
  },
  {
    content: 'vercel whoami',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Show current user',
  },

  // === Project Management ===
  {
    content: 'vercel init',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Initialize a new project',
  },
  {
    content: 'vercel link',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Link directory to a Vercel project',
  },
  {
    content: 'vercel unlink',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Unlink project from directory',
  },
  {
    content: 'vercel project ls',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'List all projects',
  },
  {
    content: 'vercel project rm my-project',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Delete a project',
  },

  // === Environment Variables ===
  {
    content: 'vercel env ls',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'List environment variables',
  },
  {
    content: 'vercel env add',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Add an environment variable',
  },
  {
    content: 'vercel env rm SECRET_KEY',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Remove an environment variable',
  },
  {
    content: 'vercel env pull .env.local',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Pull env vars to local file',
  },
  {
    content: 'vercel env pull --environment production',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Pull production env vars',
  },

  // === Domains ===
  {
    content: 'vercel domains ls',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'List domains',
  },
  {
    content: 'vercel domains add example.com',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Add a custom domain',
  },
  {
    content: 'vercel domains rm example.com',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Remove a domain',
  },
  {
    content: 'vercel alias set my-deploy.vercel.app example.com',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Set up a domain alias',
  },

  // === Dev and Inspect ===
  {
    content: 'vercel dev',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Run local development server',
  },
  {
    content: 'vercel build',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Build project locally',
  },
  {
    content: 'vercel inspect my-deploy.vercel.app',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Inspect a deployment',
  },
  {
    content: 'vercel logs my-project',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'View deployment logs',
  },
  {
    content: 'vercel rollback',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Rollback to previous deployment',
  },
  {
    content: 'vercel promote my-deploy.vercel.app',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Promote preview to production',
  },
];

export async function seedVercelCliChallenges() {
  console.log('Seeding Vercel CLI challenges...');

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, 'vercel-cli'))
    .limit(1);

  if (!category) {
    console.error('Error: Vercel CLI category not found. Run db:seed first.');
    process.exit(1);
  }

  const challengeData = vercelCliChallenges.map((challenge) => ({
    ...challenge,
    categoryId: category.id,
  }));

  await db.insert(challenges).values(challengeData);

  console.log(`Seeded ${vercelCliChallenges.length} Vercel CLI challenges.`);
}

if (require.main === module) {
  seedVercelCliChallenges()
    .catch((error) => {
      console.error('Seed Vercel CLI failed:', error);
      process.exit(1);
    })
    .finally(() => {
      console.log('Seed Vercel CLI finished. Exiting...');
      process.exit(0);
    });
}
