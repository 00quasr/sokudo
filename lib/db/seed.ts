import { stripe } from '../payments/stripe';
import { db } from './drizzle';
import { users, teams, teamMembers, categories } from './schema';
import { hashPassword } from '@/lib/auth/session';

async function createStripeProducts() {
  console.log('Creating Stripe products and prices...');

  const baseProduct = await stripe.products.create({
    name: 'Base',
    description: 'Base subscription plan',
  });

  await stripe.prices.create({
    product: baseProduct.id,
    unit_amount: 800, // $8 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  const plusProduct = await stripe.products.create({
    name: 'Plus',
    description: 'Plus subscription plan',
  });

  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200, // $12 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  console.log('Stripe products and prices created successfully.');
}

async function seed() {
  const email = 'test@test.com';
  const password = 'admin123';
  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values([
      {
        email: email,
        passwordHash: passwordHash,
        role: "owner",
      },
    ])
    .returning();

  console.log('Initial user created.');

  const [team] = await db
    .insert(teams)
    .values({
      name: 'Test Team',
    })
    .returning();

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId: user.id,
    role: 'owner',
  });

  await createStripeProducts();

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
  ]);

  console.log('Categories seeded.');
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
