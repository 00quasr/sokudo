import { db } from './drizzle';
import { categories, challenges } from './schema';
import { eq } from 'drizzle-orm';

/**
 * Package Managers challenges covering npm, yarn, and pnpm:
 * - install: installing packages and dependencies
 * - run: running scripts
 * - dlx/npx: executing packages without installing
 * - workspaces: monorepo workspace commands
 *
 * 20 challenges total, varying in difficulty:
 * - beginner: simple single commands
 * - intermediate: commands with common options/flags
 * - advanced: more complex command combinations
 */
export const packageManagersChallenges = [
  // === INSTALL (6 challenges) ===
  {
    content: 'npm install',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Install all dependencies from package.json',
  },
  {
    content: 'npm install express',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Install a package as a dependency',
  },
  {
    content: 'npm install -D typescript',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Install a package as a dev dependency',
  },
  {
    content: 'yarn add lodash',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Install a package with yarn',
  },
  {
    content: 'pnpm add -D vitest',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Install a dev dependency with pnpm',
  },
  {
    content: 'npm install --save-exact react@18.2.0',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Install exact version of a package',
  },

  // === RUN (5 challenges) ===
  {
    content: 'npm run dev',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Run the dev script from package.json',
  },
  {
    content: 'npm run build',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Run the build script',
  },
  {
    content: 'yarn test',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Run tests with yarn (shorthand)',
  },
  {
    content: 'pnpm run lint --fix',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Run lint script with arguments',
  },
  {
    content: 'npm run test -- --watch',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Run script passing additional arguments',
  },

  // === DLX/NPX (4 challenges) ===
  {
    content: 'npx create-react-app my-app',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Run a package without installing it',
  },
  {
    content: 'npx tsc --init',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Initialize TypeScript config with npx',
  },
  {
    content: 'pnpm dlx create-next-app@latest',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Run latest version of a package with pnpm dlx',
  },
  {
    content: 'yarn dlx degit user/repo my-project',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Clone a repo template with yarn dlx',
  },

  // === WORKSPACES (5 challenges) ===
  {
    content: 'npm init -w packages/core',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Initialize a new workspace package',
  },
  {
    content: 'yarn workspaces list',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'List all workspaces in the project',
  },
  {
    content: 'pnpm --filter @app/web run build',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Run build in a specific workspace with pnpm',
  },
  {
    content: 'npm run build --workspaces',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Run build script in all workspaces',
  },
  {
    content: 'pnpm -r --parallel run test',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Run tests recursively in parallel across workspaces',
  },
];

export async function seedPackageManagersChallenges() {
  console.log('Seeding Package Managers challenges...');

  // Get the Package Managers category
  const [packageManagersCategory] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, 'package-managers'))
    .limit(1);

  if (!packageManagersCategory) {
    console.error('Error: Package Managers category not found. Run db:seed first.');
    process.exit(1);
  }

  const categoryId = packageManagersCategory.id;

  // Insert challenges
  const challengeData = packageManagersChallenges.map((challenge) => ({
    ...challenge,
    categoryId,
  }));

  await db.insert(challenges).values(challengeData);

  console.log(`Seeded ${packageManagersChallenges.length} Package Managers challenges.`);
}

// Run if executed directly
if (require.main === module) {
  seedPackageManagersChallenges()
    .catch((error) => {
      console.error('Seed Package Managers failed:', error);
      process.exit(1);
    })
    .finally(() => {
      console.log('Seed Package Managers finished. Exiting...');
      process.exit(0);
    });
}
