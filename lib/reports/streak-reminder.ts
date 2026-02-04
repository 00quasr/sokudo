import { db } from '@/lib/db/drizzle';
import { users, userProfiles, dailyPractice } from '@/lib/db/schema';
import { eq, and, isNull, gte } from 'drizzle-orm';
import type { StreakReminderData } from './types';

export async function getStreakReminderData(
  userId: number,
  today: string
): Promise<StreakReminderData | null> {
  const user = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  const profile = await db
    .select({
      currentStreak: userProfiles.currentStreak,
      longestStreak: userProfiles.longestStreak,
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  const currentStreak = profile[0]?.currentStreak ?? 0;
  const longestStreak = profile[0]?.longestStreak ?? 0;

  // Find the user's most recent practice date
  const recentPractice = await db
    .select({ date: dailyPractice.date })
    .from(dailyPractice)
    .where(
      and(
        eq(dailyPractice.userId, userId),
        gte(dailyPractice.sessionsCompleted, 1)
      )
    )
    .orderBy(dailyPractice.date)
    .limit(1);

  const lastPracticeDate = recentPractice[0]?.date ?? null;

  return {
    userId: user[0].id,
    userEmail: user[0].email,
    userName: user[0].name,
    currentStreak,
    longestStreak,
    lastPracticeDate,
  };
}

export async function getUsersForStreakReminder(today: string): Promise<number[]> {
  // Find users with a streak >= 1 who haven't practiced today
  const usersWithStreaks = await db
    .select({
      userId: userProfiles.userId,
      preferences: userProfiles.preferences,
      currentStreak: userProfiles.currentStreak,
    })
    .from(userProfiles)
    .innerJoin(users, eq(userProfiles.userId, users.id))
    .where(
      and(
        isNull(users.deletedAt),
        gte(userProfiles.currentStreak, 1)
      )
    );

  const eligibleUserIds: number[] = [];

  for (const user of usersWithStreaks) {
    // Check if streak reminders are enabled (default: true)
    const prefs = user.preferences as { streakReminderEnabled?: boolean } | null;
    if (prefs?.streakReminderEnabled === false) {
      continue;
    }

    // Check if user has already practiced today
    const todayPractice = await db
      .select({ id: dailyPractice.id })
      .from(dailyPractice)
      .where(
        and(
          eq(dailyPractice.userId, user.userId),
          eq(dailyPractice.date, today),
          gte(dailyPractice.sessionsCompleted, 1)
        )
      )
      .limit(1);

    if (todayPractice.length === 0) {
      eligibleUserIds.push(user.userId);
    }
  }

  return eligibleUserIds;
}

export async function getUsersForPushStreakReminder(today: string): Promise<number[]> {
  // Find users with a streak >= 1, push notifications enabled, who haven't practiced today
  const usersWithStreaks = await db
    .select({
      userId: userProfiles.userId,
      preferences: userProfiles.preferences,
      currentStreak: userProfiles.currentStreak,
    })
    .from(userProfiles)
    .innerJoin(users, eq(userProfiles.userId, users.id))
    .where(
      and(
        isNull(users.deletedAt),
        gte(userProfiles.currentStreak, 1)
      )
    );

  const eligibleUserIds: number[] = [];

  for (const user of usersWithStreaks) {
    // Check if push notifications are enabled (default: false)
    const prefs = user.preferences as { pushNotificationsEnabled?: boolean } | null;
    if (prefs?.pushNotificationsEnabled !== true) {
      continue;
    }

    // Check if user has already practiced today
    const todayPractice = await db
      .select({ id: dailyPractice.id })
      .from(dailyPractice)
      .where(
        and(
          eq(dailyPractice.userId, user.userId),
          eq(dailyPractice.date, today),
          gte(dailyPractice.sessionsCompleted, 1)
        )
      )
      .limit(1);

    if (todayPractice.length === 0) {
      eligibleUserIds.push(user.userId);
    }
  }

  return eligibleUserIds;
}
