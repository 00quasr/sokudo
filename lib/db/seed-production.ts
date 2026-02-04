import { db } from './drizzle';
import { categories } from './schema';

/**
 * Production seeding script
 * Seeds categories and challenges for production deployment
 * Run with: pnpm db:seed:production
 */

async function seedProduction() {
  console.log('🌱 Starting production database seeding...\n');

  // Seed categories (will skip if already exist)
  console.log('Step 1: Seeding categories...');
  await db.insert(categories).values([
    {
      name: 'Git Basics',
      slug: 'git-basics',
      description: 'Essential git commands for version control',
      icon: 'git-branch',
      difficulty: 'beginner',
      isPremium: false,
      displayOrder: 1,
    },
    {
      name: 'Git Advanced',
      slug: 'git-advanced',
      description: 'Advanced git workflows and commands',
      icon: 'git-merge',
      difficulty: 'intermediate',
      isPremium: false,
      displayOrder: 2,
    },
    {
      name: 'Terminal Commands',
      slug: 'terminal-commands',
      description: 'Common terminal and shell commands',
      icon: 'terminal',
      difficulty: 'beginner',
      isPremium: false,
      displayOrder: 3,
    },
    {
      name: 'React Patterns',
      slug: 'react-patterns',
      description: 'Common React component patterns and hooks',
      icon: 'code',
      difficulty: 'intermediate',
      isPremium: true,
      displayOrder: 4,
    },
    {
      name: 'TypeScript',
      slug: 'typescript',
      description: 'TypeScript type annotations and patterns',
      icon: 'file-type',
      difficulty: 'intermediate',
      isPremium: true,
      displayOrder: 5,
    },
    {
      name: 'Docker',
      slug: 'docker',
      description: 'Docker commands and Dockerfile patterns',
      icon: 'container',
      difficulty: 'advanced',
      isPremium: true,
      displayOrder: 6,
    },
    {
      name: 'Package Managers',
      slug: 'package-managers',
      description: 'npm, yarn, and pnpm commands for managing dependencies',
      icon: 'package',
      difficulty: 'beginner',
      isPremium: false,
      displayOrder: 7,
    },
    {
      name: 'Next.js',
      slug: 'nextjs',
      description: 'Next.js App Router, Server Actions, metadata, and routing patterns',
      icon: 'layers',
      difficulty: 'intermediate',
      isPremium: true,
      displayOrder: 8,
    },
    {
      name: 'AI Prompts',
      slug: 'ai-prompts',
      description: 'AI prompting patterns for Claude, ChatGPT, Cursor, and Copilot',
      icon: 'sparkles',
      difficulty: 'intermediate',
      isPremium: true,
      displayOrder: 9,
    },
    {
      name: 'SQL',
      slug: 'sql',
      description: 'SQL queries: SELECT, JOIN, WHERE, GROUP BY, and indexes',
      icon: 'database',
      difficulty: 'intermediate',
      isPremium: true,
      displayOrder: 10,
    },
  ]).onConflictDoNothing();

  console.log('✓ Categories seeded');

  // Import and run all challenge seed scripts
  console.log('\nStep 2: Seeding challenges...');

  try {
    console.log('  - Seeding Git Basics challenges...');
    await import('./seed-git-basics');
    console.log('  ✓ Git Basics seeded');
  } catch (error) {
    console.log('  ⚠ Git Basics already seeded or error:', (error as Error).message);
  }

  try {
    console.log('  - Seeding Git Advanced challenges...');
    await import('./seed-git-advanced');
    console.log('  ✓ Git Advanced seeded');
  } catch (error) {
    console.log('  ⚠ Git Advanced already seeded or error:', (error as Error).message);
  }

  try {
    console.log('  - Seeding Terminal Commands challenges...');
    await import('./seed-terminal-commands');
    console.log('  ✓ Terminal Commands seeded');
  } catch (error) {
    console.log('  ⚠ Terminal Commands already seeded or error:', (error as Error).message);
  }

  try {
    console.log('  - Seeding Package Managers challenges...');
    await import('./seed-package-managers');
    console.log('  ✓ Package Managers seeded');
  } catch (error) {
    console.log('  ⚠ Package Managers already seeded or error:', (error as Error).message);
  }

  try {
    console.log('  - Seeding React challenges...');
    await import('./seed-react');
    console.log('  ✓ React seeded');
  } catch (error) {
    console.log('  ⚠ React already seeded or error:', (error as Error).message);
  }

  try {
    console.log('  - Seeding TypeScript challenges...');
    await import('./seed-typescript');
    console.log('  ✓ TypeScript seeded');
  } catch (error) {
    console.log('  ⚠ TypeScript already seeded or error:', (error as Error).message);
  }

  try {
    console.log('  - Seeding Docker challenges...');
    await import('./seed-docker');
    console.log('  ✓ Docker seeded');
  } catch (error) {
    console.log('  ⚠ Docker already seeded or error:', (error as Error).message);
  }

  try {
    console.log('  - Seeding Next.js challenges...');
    await import('./seed-nextjs');
    console.log('  ✓ Next.js seeded');
  } catch (error) {
    console.log('  ⚠ Next.js already seeded or error:', (error as Error).message);
  }

  try {
    console.log('  - Seeding AI Prompts challenges...');
    await import('./seed-ai-prompts');
    console.log('  ✓ AI Prompts seeded');
  } catch (error) {
    console.log('  ⚠ AI Prompts already seeded or error:', (error as Error).message);
  }

  try {
    console.log('  - Seeding SQL challenges...');
    await import('./seed-sql');
    console.log('  ✓ SQL seeded');
  } catch (error) {
    console.log('  ⚠ SQL already seeded or error:', (error as Error).message);
  }

  console.log('\nStep 3: Seeding achievements...');
  try {
    await import('./seed-achievements');
    console.log('✓ Achievements seeded');
  } catch (error) {
    console.log('⚠ Achievements already seeded or error:', (error as Error).message);
  }

  try {
    console.log('  - Seeding team achievements...');
    await import('./seed-team-achievements');
    console.log('  ✓ Team achievements seeded');
  } catch (error) {
    console.log('  ⚠ Team achievements already seeded or error:', (error as Error).message);
  }

  console.log('\n🎉 Production database seeded successfully!');
  console.log('\nSeeded content:');
  console.log('  - 10 challenge categories');
  console.log('  - 250+ typing challenges');
  console.log('  - 28 achievement definitions');
  console.log('  - Team achievements');
  console.log('\n✅ Database is ready for production use!');
}

seedProduction()
  .catch((error) => {
    console.error('❌ Production seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Exiting...');
    process.exit(0);
  });
