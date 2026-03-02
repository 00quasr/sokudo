import { db } from './drizzle';
import { categories, challenges } from './schema';
import { eq } from 'drizzle-orm';

/**
 * Firebase CLI challenges
 *
 * 25 challenges covering:
 * - Hosting and deployment
 * - Firestore and database
 * - Functions and emulators
 */
export const firebaseCliChallenges = [
  // === Auth and Init ===
  {
    content: 'firebase login',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Authenticate with Firebase',
  },
  {
    content: 'firebase logout',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Sign out of Firebase',
  },
  {
    content: 'firebase init',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Initialize Firebase in project',
  },
  {
    content: 'firebase projects:list',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'List all Firebase projects',
  },
  {
    content: 'firebase use my-project',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Switch to a project',
  },

  // === Hosting ===
  {
    content: 'firebase deploy',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Deploy all Firebase services',
  },
  {
    content: 'firebase deploy --only hosting',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Deploy only hosting',
  },
  {
    content: 'firebase hosting:channel:deploy preview',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Deploy to a preview channel',
  },
  {
    content: 'firebase hosting:channel:list',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'List hosting preview channels',
  },
  {
    content: 'firebase serve',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Run local hosting server',
  },

  // === Functions ===
  {
    content: 'firebase deploy --only functions',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Deploy only functions',
  },
  {
    content: 'firebase functions:log',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'View function logs',
  },
  {
    content: 'firebase functions:shell',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Start functions shell for testing',
  },
  {
    content: 'firebase deploy --only functions:myFunction',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Deploy a specific function',
  },

  // === Emulators ===
  {
    content: 'firebase emulators:start',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Start all emulators',
  },
  {
    content: 'firebase emulators:start --only firestore',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Start only Firestore emulator',
  },
  {
    content: 'firebase emulators:exec "npm test"',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Run command with emulators',
  },
  {
    content: 'firebase emulators:export ./backup',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Export emulator data',
  },

  // === Firestore ===
  {
    content: 'firebase deploy --only firestore:rules',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Deploy Firestore security rules',
  },
  {
    content: 'firebase deploy --only firestore:indexes',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Deploy Firestore indexes',
  },
  {
    content: 'firebase firestore:delete --all-collections',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Delete all Firestore data',
  },

  // === Other Services ===
  {
    content: 'firebase deploy --only storage',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Deploy storage rules',
  },
  {
    content: 'firebase auth:import users.json',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Import auth users',
  },
  {
    content: 'firebase auth:export users.json',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Export auth users',
  },
  {
    content: 'firebase apps:create web my-app',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Create a new web app',
  },
];

export async function seedFirebaseCliChallenges() {
  console.log('Seeding Firebase CLI challenges...');

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, 'firebase-cli'))
    .limit(1);

  if (!category) {
    console.error('Error: Firebase CLI category not found. Run db:seed first.');
    process.exit(1);
  }

  const challengeData = firebaseCliChallenges.map((challenge) => ({
    ...challenge,
    categoryId: category.id,
  }));

  await db.insert(challenges).values(challengeData);

  console.log(`Seeded ${firebaseCliChallenges.length} Firebase CLI challenges.`);
}

if (require.main === module) {
  seedFirebaseCliChallenges()
    .catch((error) => {
      console.error('Seed Firebase CLI failed:', error);
      process.exit(1);
    })
    .finally(() => {
      console.log('Seed Firebase CLI finished. Exiting...');
      process.exit(0);
    });
}
