import { db } from './drizzle';
import { achievements } from './schema';
import type { NewAchievement } from './schema';

/**
 * Achievement definitions for Sokudo typing trainer.
 *
 * Categories:
 * - Speed: WPM milestones (50, 60, 70, 80, 90, 100)
 * - Streak: Consecutive practice days (3, 7, 14, 30, 60, 100)
 * - Category mastery: Complete all challenges in a category with 90%+ accuracy
 * - Practice milestones: Total sessions completed (100, 500, 1000)
 * - Accuracy: Session accuracy thresholds (95%, 98%, 99%)
 */
export const achievementDefinitions: NewAchievement[] = [
  // === SPEED ACHIEVEMENTS ===
  {
    slug: 'speed-50',
    name: 'Warming Up',
    description: 'Reach 50 WPM in any session',
    icon: 'gauge',
    criteria: { type: 'wpm', threshold: 50 },
  },
  {
    slug: 'speed-60',
    name: 'Getting Fast',
    description: 'Reach 60 WPM in any session',
    icon: 'gauge',
    criteria: { type: 'wpm', threshold: 60 },
  },
  {
    slug: 'speed-70',
    name: 'Quick Fingers',
    description: 'Reach 70 WPM in any session',
    icon: 'gauge',
    criteria: { type: 'wpm', threshold: 70 },
  },
  {
    slug: 'speed-80',
    name: 'Velocity',
    description: 'Reach 80 WPM in any session',
    icon: 'zap',
    criteria: { type: 'wpm', threshold: 80 },
  },
  {
    slug: 'speed-90',
    name: 'Blazing Fast',
    description: 'Reach 90 WPM in any session',
    icon: 'zap',
    criteria: { type: 'wpm', threshold: 90 },
  },
  {
    slug: 'speed-100',
    name: 'Speed Demon',
    description: 'Reach 100 WPM in any session',
    icon: 'zap',
    criteria: { type: 'wpm', threshold: 100 },
  },

  // === STREAK ACHIEVEMENTS ===
  {
    slug: 'streak-3',
    name: 'Getting Started',
    description: 'Practice for 3 consecutive days',
    icon: 'flame',
    criteria: { type: 'streak', threshold: 3 },
  },
  {
    slug: 'streak-7',
    name: 'Week Warrior',
    description: 'Practice for 7 consecutive days',
    icon: 'flame',
    criteria: { type: 'streak', threshold: 7 },
  },
  {
    slug: 'streak-14',
    name: 'Committed',
    description: 'Practice for 14 consecutive days',
    icon: 'flame',
    criteria: { type: 'streak', threshold: 14 },
  },
  {
    slug: 'streak-30',
    name: 'Monthly Master',
    description: 'Practice for 30 consecutive days',
    icon: 'flame',
    criteria: { type: 'streak', threshold: 30 },
  },
  {
    slug: 'streak-60',
    name: 'Relentless',
    description: 'Practice for 60 consecutive days',
    icon: 'flame',
    criteria: { type: 'streak', threshold: 60 },
  },
  {
    slug: 'streak-100',
    name: 'Unstoppable',
    description: 'Practice for 100 consecutive days',
    icon: 'flame',
    criteria: { type: 'streak', threshold: 100 },
  },

  // === CATEGORY MASTERY ACHIEVEMENTS ===
  {
    slug: 'mastery-git-basics',
    name: 'Git Beginner',
    description: 'Complete all Git Basics challenges with 90%+ accuracy',
    icon: 'git-branch',
    criteria: { type: 'category_mastery', categorySlug: 'git-basics', minAccuracy: 90, allChallenges: true },
  },
  {
    slug: 'mastery-git-advanced',
    name: 'Git Guru',
    description: 'Complete all Git Advanced challenges with 90%+ accuracy',
    icon: 'git-merge',
    criteria: { type: 'category_mastery', categorySlug: 'git-advanced', minAccuracy: 90, allChallenges: true },
  },
  {
    slug: 'mastery-terminal-commands',
    name: 'Terminal Native',
    description: 'Complete all Terminal Commands challenges with 90%+ accuracy',
    icon: 'terminal',
    criteria: { type: 'category_mastery', categorySlug: 'terminal-commands', minAccuracy: 90, allChallenges: true },
  },
  {
    slug: 'mastery-react-patterns',
    name: 'React Pro',
    description: 'Complete all React Patterns challenges with 90%+ accuracy',
    icon: 'code',
    criteria: { type: 'category_mastery', categorySlug: 'react-patterns', minAccuracy: 90, allChallenges: true },
  },
  {
    slug: 'mastery-typescript',
    name: 'Type Master',
    description: 'Complete all TypeScript challenges with 90%+ accuracy',
    icon: 'file-type',
    criteria: { type: 'category_mastery', categorySlug: 'typescript', minAccuracy: 90, allChallenges: true },
  },
  {
    slug: 'mastery-docker',
    name: 'Container Captain',
    description: 'Complete all Docker challenges with 90%+ accuracy',
    icon: 'container',
    criteria: { type: 'category_mastery', categorySlug: 'docker', minAccuracy: 90, allChallenges: true },
  },
  {
    slug: 'mastery-package-managers',
    name: 'Dependency Wrangler',
    description: 'Complete all Package Managers challenges with 90%+ accuracy',
    icon: 'package',
    criteria: { type: 'category_mastery', categorySlug: 'package-managers', minAccuracy: 90, allChallenges: true },
  },
  {
    slug: 'mastery-nextjs',
    name: 'Next Level',
    description: 'Complete all Next.js challenges with 90%+ accuracy',
    icon: 'layers',
    criteria: { type: 'category_mastery', categorySlug: 'nextjs', minAccuracy: 90, allChallenges: true },
  },
  {
    slug: 'mastery-ai-prompts',
    name: 'Prompt Engineer',
    description: 'Complete all AI Prompts challenges with 90%+ accuracy',
    icon: 'sparkles',
    criteria: { type: 'category_mastery', categorySlug: 'ai-prompts', minAccuracy: 90, allChallenges: true },
  },
  {
    slug: 'mastery-sql',
    name: 'Query Master',
    description: 'Complete all SQL challenges with 90%+ accuracy',
    icon: 'database',
    criteria: { type: 'category_mastery', categorySlug: 'sql', minAccuracy: 90, allChallenges: true },
  },

  // === PRACTICE MILESTONE ACHIEVEMENTS ===
  {
    slug: 'sessions-100',
    name: 'Centurion',
    description: 'Complete 100 typing sessions',
    icon: 'trophy',
    criteria: { type: 'sessions_completed', threshold: 100 },
  },
  {
    slug: 'sessions-500',
    name: 'Dedicated',
    description: 'Complete 500 typing sessions',
    icon: 'trophy',
    criteria: { type: 'sessions_completed', threshold: 500 },
  },
  {
    slug: 'sessions-1000',
    name: 'Typing Legend',
    description: 'Complete 1000 typing sessions',
    icon: 'trophy',
    criteria: { type: 'sessions_completed', threshold: 1000 },
  },

  // === ACCURACY ACHIEVEMENTS ===
  {
    slug: 'accuracy-95',
    name: 'Sharpshooter',
    description: 'Achieve 95% accuracy in a session',
    icon: 'target',
    criteria: { type: 'accuracy', threshold: 95 },
  },
  {
    slug: 'accuracy-98',
    name: 'Precision',
    description: 'Achieve 98% accuracy in a session',
    icon: 'target',
    criteria: { type: 'accuracy', threshold: 98 },
  },
  {
    slug: 'accuracy-99',
    name: 'Perfectionist',
    description: 'Achieve 99% accuracy in a session',
    icon: 'target',
    criteria: { type: 'accuracy', threshold: 99 },
  },
];

export async function seedAchievements() {
  console.log('Seeding achievement definitions...');

  await db.insert(achievements).values(achievementDefinitions).onConflictDoNothing();

  console.log(`Seeded ${achievementDefinitions.length} achievement definitions.`);
}

// Run if executed directly
if (require.main === module) {
  seedAchievements()
    .catch((error) => {
      console.error('Seed achievements failed:', error);
      process.exit(1);
    })
    .finally(() => {
      console.log('Seed achievements finished. Exiting...');
      process.exit(0);
    });
}
