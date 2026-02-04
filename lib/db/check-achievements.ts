import { eq, and, sql, notInArray } from 'drizzle-orm';
import { db } from './drizzle';
import {
  achievements,
  userAchievements,
  typingSessions,
  userProfiles,
  challenges,
  categories,
} from './schema';
import type { Achievement } from './schema';

interface AchievementCriteria {
  type: 'wpm' | 'accuracy' | 'streak' | 'sessions_completed' | 'category_mastery';
  threshold?: number;
  categorySlug?: string;
  minAccuracy?: number;
  allChallenges?: boolean;
}

interface SessionContext {
  wpm: number;
  accuracy: number;
  challengeId: number;
}

interface UnlockedAchievement {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
}

/**
 * Check and unlock achievements for a user after completing a session.
 * Returns the list of newly unlocked achievements.
 */
export async function checkAndUnlockAchievements(
  userId: number,
  session: SessionContext
): Promise<UnlockedAchievement[]> {
  // Get IDs of achievements the user already has
  const earnedRows = await db
    .select({ achievementId: userAchievements.achievementId })
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));

  const earnedIds = earnedRows.map((r) => r.achievementId);

  // Get all achievements the user hasn't earned yet
  const unearnedAchievements: Achievement[] = earnedIds.length > 0
    ? await db
        .select()
        .from(achievements)
        .where(notInArray(achievements.id, earnedIds))
    : await db.select().from(achievements);

  if (unearnedAchievements.length === 0) {
    return [];
  }

  // Evaluate each unearned achievement
  const newlyUnlocked: UnlockedAchievement[] = [];

  for (const achievement of unearnedAchievements) {
    const criteria = achievement.criteria as AchievementCriteria;
    const met = await evaluateCriteria(userId, criteria, session);

    if (met) {
      newlyUnlocked.push({
        id: achievement.id,
        slug: achievement.slug,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
      });
    }
  }

  // Insert all newly unlocked achievements
  if (newlyUnlocked.length > 0) {
    await db.insert(userAchievements).values(
      newlyUnlocked.map((a) => ({
        userId,
        achievementId: a.id,
      }))
    );
  }

  return newlyUnlocked;
}

async function evaluateCriteria(
  userId: number,
  criteria: AchievementCriteria,
  session: SessionContext
): Promise<boolean> {
  switch (criteria.type) {
    case 'wpm':
      return evaluateWpm(session, criteria.threshold!);
    case 'accuracy':
      return evaluateAccuracy(session, criteria.threshold!);
    case 'streak':
      return evaluateStreak(userId, criteria.threshold!);
    case 'sessions_completed':
      return evaluateSessionsCompleted(userId, criteria.threshold!);
    case 'category_mastery':
      return evaluateCategoryMastery(
        userId,
        criteria.categorySlug!,
        criteria.minAccuracy!
      );
    default:
      return false;
  }
}

function evaluateWpm(session: SessionContext, threshold: number): boolean {
  return session.wpm >= threshold;
}

function evaluateAccuracy(session: SessionContext, threshold: number): boolean {
  return session.accuracy >= threshold;
}

async function evaluateStreak(userId: number, threshold: number): Promise<boolean> {
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });

  if (!profile) return false;
  return profile.currentStreak >= threshold;
}

async function evaluateSessionsCompleted(userId: number, threshold: number): Promise<boolean> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(typingSessions)
    .where(eq(typingSessions.userId, userId));

  return (result?.count ?? 0) >= threshold;
}

async function evaluateCategoryMastery(
  userId: number,
  categorySlug: string,
  minAccuracy: number
): Promise<boolean> {
  // Get the category and its total challenge count
  const [category] = await db
    .select({
      id: categories.id,
      totalChallenges: sql<number>`(
        SELECT count(*)::int FROM ${challenges}
        WHERE ${challenges.categoryId} = ${categories.id}
      )`,
    })
    .from(categories)
    .where(eq(categories.slug, categorySlug))
    .limit(1);

  if (!category || category.totalChallenges === 0) return false;

  // Get distinct challenges completed by the user in this category with avg accuracy
  const userChallengeStats = await db
    .select({
      challengeId: typingSessions.challengeId,
      bestAccuracy: sql<number>`max(${typingSessions.accuracy})::int`,
    })
    .from(typingSessions)
    .innerJoin(challenges, eq(typingSessions.challengeId, challenges.id))
    .where(
      and(
        eq(typingSessions.userId, userId),
        eq(challenges.categoryId, category.id)
      )
    )
    .groupBy(typingSessions.challengeId);

  // Must have completed all challenges in the category
  if (userChallengeStats.length < category.totalChallenges) return false;

  // Every challenge must have at least one session with accuracy >= minAccuracy
  return userChallengeStats.every((s) => s.bestAccuracy >= minAccuracy);
}
