import { db } from './drizzle';
import { categories, challenges } from './schema';
import { eq } from 'drizzle-orm';

/**
 * Prisma CLI challenges
 *
 * 25 challenges covering:
 * - Schema and migrations
 * - Database operations
 * - Prisma Studio
 */
export const prismaCliChallenges = [
  // === Init and Generate ===
  {
    content: 'npx prisma init',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Initialize Prisma in your project',
  },
  {
    content: 'npx prisma generate',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Generate Prisma Client',
  },
  {
    content: 'npx prisma format',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Format the schema file',
  },
  {
    content: 'npx prisma validate',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Validate the schema file',
  },

  // === Migrations ===
  {
    content: 'npx prisma migrate dev',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Run migrations in development',
  },
  {
    content: 'npx prisma migrate dev --name init',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Create named migration',
  },
  {
    content: 'npx prisma migrate deploy',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Apply migrations in production',
  },
  {
    content: 'npx prisma migrate reset',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Reset database and apply migrations',
  },
  {
    content: 'npx prisma migrate status',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Check migration status',
  },
  {
    content: 'npx prisma migrate resolve --applied 20240101000000_init',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Mark migration as applied',
  },

  // === Database Operations ===
  {
    content: 'npx prisma db push',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Push schema changes without migrations',
  },
  {
    content: 'npx prisma db pull',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Pull schema from existing database',
  },
  {
    content: 'npx prisma db seed',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Run seed script',
  },
  {
    content: 'npx prisma db execute --file ./script.sql',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Execute a SQL file',
  },

  // === Studio ===
  {
    content: 'npx prisma studio',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Open Prisma Studio GUI',
  },
  {
    content: 'npx prisma studio --port 5555',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Open Studio on custom port',
  },

  // === Debug and Info ===
  {
    content: 'npx prisma version',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Show Prisma version info',
  },
  {
    content: 'npx prisma --help',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Show available commands',
  },
  {
    content: 'DEBUG="*" npx prisma migrate dev',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Run with debug logging',
  },

  // === Common Workflows ===
  {
    content: 'npx prisma migrate dev --create-only',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Create migration without applying',
  },
  {
    content: 'npx prisma generate --watch',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Watch schema and regenerate',
  },
  {
    content: 'npx prisma db push --force-reset',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Force reset and push schema',
  },
  {
    content: 'npx prisma db push --accept-data-loss',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Push schema accepting data loss',
  },
  {
    content: 'npx prisma init --datasource-provider postgresql',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Init with specific database provider',
  },
  {
    content: 'npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Generate SQL diff from schema',
  },
];

export async function seedPrismaCliChallenges() {
  console.log('Seeding Prisma CLI challenges...');

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, 'prisma-cli'))
    .limit(1);

  if (!category) {
    console.error('Error: Prisma CLI category not found. Run db:seed first.');
    process.exit(1);
  }

  const challengeData = prismaCliChallenges.map((challenge) => ({
    ...challenge,
    categoryId: category.id,
  }));

  await db.insert(challenges).values(challengeData);

  console.log(`Seeded ${prismaCliChallenges.length} Prisma CLI challenges.`);
}

if (require.main === module) {
  seedPrismaCliChallenges()
    .catch((error) => {
      console.error('Seed Prisma CLI failed:', error);
      process.exit(1);
    })
    .finally(() => {
      console.log('Seed Prisma CLI finished. Exiting...');
      process.exit(0);
    });
}
