import { stripe } from '../payments/stripe';
import { db } from './drizzle';
import { users, teams, teamMembers, categories, developerOnboardingSteps } from './schema';
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

  // Seed developer onboarding steps
  await db.insert(developerOnboardingSteps).values([
    {
      stepKey: 'welcome',
      title: 'Welcome to Sokudo',
      description: 'Learn how to get started with Sokudo and build your typing speed for developer workflows',
      content: 'Welcome to Sokudo! This platform helps you build muscle memory for typing git commands, terminal workflows, React patterns, and more. Let\'s get you started!',
      category: 'getting-started',
      stepOrder: 1,
      isOptional: false,
    },
    {
      stepKey: 'first-practice',
      title: 'Complete Your First Practice Session',
      description: 'Try out the typing practice with a beginner-level challenge',
      content: 'Start with a simple git command or terminal challenge. Focus on accuracy first, then speed will come naturally. Navigate to the Practice page and select a category to begin.',
      category: 'getting-started',
      stepOrder: 2,
      isOptional: false,
    },
    {
      stepKey: 'explore-categories',
      title: 'Explore Challenge Categories',
      description: 'Browse available categories like Git, Terminal, React, TypeScript, and more',
      content: 'Sokudo offers multiple categories covering different developer workflows. Free categories include Git Basics, Terminal Commands, and Package Managers. Premium categories unlock React, TypeScript, Docker, and SQL.',
      category: 'getting-started',
      stepOrder: 3,
      isOptional: false,
    },
    {
      stepKey: 'understand-metrics',
      title: 'Understanding Your Metrics',
      description: 'Learn about WPM, accuracy, and how to track your progress',
      content: 'Your typing performance is measured in WPM (words per minute), where a "word" is 5 characters. Accuracy shows the percentage of correct keystrokes. View your stats in the Dashboard to see your improvement over time.',
      category: 'features',
      stepOrder: 4,
      isOptional: false,
    },
    {
      stepKey: 'set-preferences',
      title: 'Set Your Preferences',
      description: 'Customize your preferred categories and notification settings',
      content: 'Visit Settings > General to set your preferred categories. This helps us recommend relevant challenges. You can also enable push notifications for streak reminders.',
      category: 'features',
      stepOrder: 5,
      isOptional: true,
    },
    {
      stepKey: 'daily-practice',
      title: 'Build a Daily Practice Habit',
      description: 'Learn about streaks and daily practice goals',
      content: 'Consistency is key to building muscle memory. Set a goal to practice daily and maintain your streak. The free tier includes 15 minutes of practice per day.',
      category: 'features',
      stepOrder: 6,
      isOptional: true,
    },
    {
      stepKey: 'multiplayer-races',
      title: 'Try Multiplayer Races',
      description: 'Challenge other developers in real-time typing races',
      content: 'Once you\'re comfortable with the basics, try racing against other developers. Visit the Races page to join a lobby or challenge a friend.',
      category: 'advanced',
      stepOrder: 7,
      isOptional: true,
    },
    {
      stepKey: 'custom-challenges',
      title: 'Create Custom Challenges',
      description: 'Build your own typing challenges for specific workflows',
      content: 'Have a command or code snippet you use frequently? Create a custom challenge to practice it. Visit the Challenges page to create, vote, and share challenges with the community.',
      category: 'advanced',
      stepOrder: 8,
      isOptional: true,
    },
    {
      stepKey: 'api-integration',
      title: 'Explore API Integration',
      description: 'Learn how to integrate Sokudo with your development workflow',
      content: 'Sokudo provides a REST API for tracking your typing sessions, retrieving statistics, and more. Generate an API key in Settings > Security to get started. Check out our API documentation for details.',
      category: 'developer',
      stepOrder: 9,
      isOptional: true,
    },
    {
      stepKey: 'team-features',
      title: 'Set Up Team Features',
      description: 'Invite team members and create onboarding courses for your organization',
      content: 'Premium teams can invite members, create custom onboarding courses, and track team progress. Visit the Team page to invite members and set up team challenges.',
      category: 'developer',
      stepOrder: 10,
      isOptional: true,
    },
  ]);

  console.log('Developer onboarding steps seeded.');
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
