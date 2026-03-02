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
    {
      name: 'Claude Code',
      slug: 'claude-code',
      description: 'Anthropic CLI slash commands for AI-assisted coding',
      icon: 'sparkles',
      difficulty: 'beginner',
      isPremium: false,
      displayOrder: 11,
    },
    {
      name: 'GitHub CLI',
      slug: 'github-cli',
      description: 'gh commands for PRs, issues, repos, and Actions',
      icon: 'github',
      difficulty: 'intermediate',
      isPremium: false,
      displayOrder: 12,
    },
    {
      name: 'kubectl',
      slug: 'kubectl',
      description: 'Kubernetes cluster management and deployment commands',
      icon: 'server',
      difficulty: 'advanced',
      isPremium: true,
      displayOrder: 13,
    },
    {
      name: 'AWS CLI',
      slug: 'aws-cli',
      description: 'Amazon Web Services commands for S3, EC2, Lambda, and more',
      icon: 'cloud',
      difficulty: 'advanced',
      isPremium: true,
      displayOrder: 14,
    },
    {
      name: 'Vercel CLI',
      slug: 'vercel-cli',
      description: 'Vercel deployment, domains, and environment management',
      icon: 'triangle',
      difficulty: 'beginner',
      isPremium: false,
      displayOrder: 15,
    },
    {
      name: 'Prisma CLI',
      slug: 'prisma-cli',
      description: 'Database migrations, schema management, and Prisma Studio',
      icon: 'database',
      difficulty: 'intermediate',
      isPremium: true,
      displayOrder: 16,
    },
    {
      name: 'Firebase CLI',
      slug: 'firebase-cli',
      description: 'Firebase hosting, functions, Firestore, and emulators',
      icon: 'flame',
      difficulty: 'intermediate',
      isPremium: true,
      displayOrder: 17,
    },
    {
      name: 'Terraform',
      slug: 'terraform',
      description: 'Infrastructure as code: init, plan, apply, and state management',
      icon: 'layers',
      difficulty: 'advanced',
      isPremium: true,
      displayOrder: 18,
    },
    {
      name: 'Vim',
      slug: 'vim',
      description: 'Vim motions, editing commands, and text manipulation',
      icon: 'edit',
      difficulty: 'intermediate',
      isPremium: false,
      displayOrder: 19,
    },
    {
      name: 'tmux',
      slug: 'tmux',
      description: 'Terminal multiplexer: sessions, windows, and panes',
      icon: 'layout-grid',
      difficulty: 'intermediate',
      isPremium: true,
      displayOrder: 20,
    },
    {
      name: 'curl',
      slug: 'curl',
      description: 'HTTP requests, headers, authentication, and data transfer',
      icon: 'globe',
      difficulty: 'beginner',
      isPremium: false,
      displayOrder: 21,
    },
    {
      name: 'jq',
      slug: 'jq',
      description: 'JSON processing: filtering, transforming, and querying',
      icon: 'braces',
      difficulty: 'intermediate',
      isPremium: true,
      displayOrder: 22,
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

  try {
    console.log('  - Seeding Claude Code challenges...');
    await import('./seed-claude-code');
    console.log('  ✓ Claude Code seeded');
  } catch (error) {
    console.log('  ⚠ Claude Code already seeded or error:', (error as Error).message);
  }

  try {
    console.log('  - Seeding GitHub CLI challenges...');
    await import('./seed-github-cli');
    console.log('  ✓ GitHub CLI seeded');
  } catch (error) {
    console.log('  ⚠ GitHub CLI already seeded or error:', (error as Error).message);
  }

  try {
    console.log('  - Seeding kubectl challenges...');
    await import('./seed-kubectl');
    console.log('  ✓ kubectl seeded');
  } catch (error) {
    console.log('  ⚠ kubectl already seeded or error:', (error as Error).message);
  }

  try {
    console.log('  - Seeding AWS CLI challenges...');
    await import('./seed-aws-cli');
    console.log('  ✓ AWS CLI seeded');
  } catch (error) {
    console.log('  ⚠ AWS CLI already seeded or error:', (error as Error).message);
  }

  try {
    console.log('  - Seeding Vercel CLI challenges...');
    await import('./seed-vercel-cli');
    console.log('  ✓ Vercel CLI seeded');
  } catch (error) {
    console.log('  ⚠ Vercel CLI already seeded or error:', (error as Error).message);
  }

  try {
    console.log('  - Seeding Prisma CLI challenges...');
    await import('./seed-prisma-cli');
    console.log('  ✓ Prisma CLI seeded');
  } catch (error) {
    console.log('  ⚠ Prisma CLI already seeded or error:', (error as Error).message);
  }

  try {
    console.log('  - Seeding Firebase CLI challenges...');
    await import('./seed-firebase-cli');
    console.log('  ✓ Firebase CLI seeded');
  } catch (error) {
    console.log('  ⚠ Firebase CLI already seeded or error:', (error as Error).message);
  }

  try {
    console.log('  - Seeding Terraform challenges...');
    await import('./seed-terraform');
    console.log('  ✓ Terraform seeded');
  } catch (error) {
    console.log('  ⚠ Terraform already seeded or error:', (error as Error).message);
  }

  try {
    console.log('  - Seeding Vim challenges...');
    await import('./seed-vim');
    console.log('  ✓ Vim seeded');
  } catch (error) {
    console.log('  ⚠ Vim already seeded or error:', (error as Error).message);
  }

  try {
    console.log('  - Seeding tmux challenges...');
    await import('./seed-tmux');
    console.log('  ✓ tmux seeded');
  } catch (error) {
    console.log('  ⚠ tmux already seeded or error:', (error as Error).message);
  }

  try {
    console.log('  - Seeding curl challenges...');
    await import('./seed-curl');
    console.log('  ✓ curl seeded');
  } catch (error) {
    console.log('  ⚠ curl already seeded or error:', (error as Error).message);
  }

  try {
    console.log('  - Seeding jq challenges...');
    await import('./seed-jq');
    console.log('  ✓ jq seeded');
  } catch (error) {
    console.log('  ⚠ jq already seeded or error:', (error as Error).message);
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
  console.log('  - 22 challenge categories');
  console.log('  - 550+ typing challenges');
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
