import { db } from '@/lib/db/drizzle';
import {
  users,
  userProfiles,
  typingSessions,
  challenges,
  categories,
  keyAccuracy,
} from '@/lib/db/schema';
import { eq, and, gte, lt, desc, asc, isNull } from 'drizzle-orm';
import type { WeeklyReportData } from './types';

function getWeekBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(0, 0, 0, 0);

  return { start, end };
}

function getPreviousWeekBounds(date: Date): { start: Date; end: Date } {
  const end = new Date(date);
  end.setDate(end.getDate() - 7);
  end.setHours(0, 0, 0, 0);

  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

async function getWeeklyStats(userId: number, startDate: Date, endDate: Date) {
  const sessions = await db
    .select({
      wpm: typingSessions.wpm,
      accuracy: typingSessions.accuracy,
      keystrokes: typingSessions.keystrokes,
      errors: typingSessions.errors,
      durationMs: typingSessions.durationMs,
    })
    .from(typingSessions)
    .where(
      and(
        eq(typingSessions.userId, userId),
        gte(typingSessions.completedAt, startDate),
        lt(typingSessions.completedAt, endDate)
      )
    );

  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalPracticeTimeMs: 0,
      avgWpm: 0,
      avgAccuracy: 0,
      bestWpm: 0,
      bestAccuracy: 0,
      totalKeystrokes: 0,
      totalErrors: 0,
    };
  }

  const totalSessions = sessions.length;
  const totalPracticeTimeMs = sessions.reduce((sum, s) => sum + s.durationMs, 0);
  const avgWpm = Math.round(
    sessions.reduce((sum, s) => sum + s.wpm, 0) / totalSessions
  );
  const avgAccuracy = Math.round(
    sessions.reduce((sum, s) => sum + s.accuracy, 0) / totalSessions
  );
  const bestWpm = Math.max(...sessions.map((s) => s.wpm));
  const bestAccuracy = Math.max(...sessions.map((s) => s.accuracy));
  const totalKeystrokes = sessions.reduce((sum, s) => sum + s.keystrokes, 0);
  const totalErrors = sessions.reduce((sum, s) => sum + s.errors, 0);

  return {
    totalSessions,
    totalPracticeTimeMs,
    avgWpm,
    avgAccuracy,
    bestWpm,
    bestAccuracy,
    totalKeystrokes,
    totalErrors,
  };
}

async function getTopCategories(
  userId: number,
  startDate: Date,
  endDate: Date,
  limit = 3
) {
  const sessions = await db
    .select({
      wpm: typingSessions.wpm,
      accuracy: typingSessions.accuracy,
      categoryId: challenges.categoryId,
      categoryName: categories.name,
    })
    .from(typingSessions)
    .innerJoin(challenges, eq(typingSessions.challengeId, challenges.id))
    .innerJoin(categories, eq(challenges.categoryId, categories.id))
    .where(
      and(
        eq(typingSessions.userId, userId),
        gte(typingSessions.completedAt, startDate),
        lt(typingSessions.completedAt, endDate)
      )
    );

  const categoryMap = new Map<
    number,
    {
      categoryName: string;
      sessions: number;
      totalWpm: number;
      totalAccuracy: number;
    }
  >();

  for (const session of sessions) {
    const existing = categoryMap.get(session.categoryId);
    if (existing) {
      existing.sessions++;
      existing.totalWpm += session.wpm;
      existing.totalAccuracy += session.accuracy;
    } else {
      categoryMap.set(session.categoryId, {
        categoryName: session.categoryName,
        sessions: 1,
        totalWpm: session.wpm,
        totalAccuracy: session.accuracy,
      });
    }
  }

  return Array.from(categoryMap.values())
    .map((cat) => ({
      categoryName: cat.categoryName,
      sessions: cat.sessions,
      avgWpm: Math.round(cat.totalWpm / cat.sessions),
      avgAccuracy: Math.round(cat.totalAccuracy / cat.sessions),
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, limit);
}

async function getWeakestKeys(userId: number, limit = 5) {
  const keys = await db
    .select()
    .from(keyAccuracy)
    .where(eq(keyAccuracy.userId, userId))
    .orderBy(desc(keyAccuracy.totalPresses));

  const significantKeys = keys.filter((k) => k.totalPresses >= 5);

  return significantKeys
    .map((k) => ({
      key: k.key,
      accuracy: Math.round((k.correctPresses / k.totalPresses) * 100),
      totalPresses: k.totalPresses,
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);
}

export async function generateWeeklyReport(
  userId: number,
  reportDate: Date = new Date()
): Promise<WeeklyReportData | null> {
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

  const { start: weekStart, end: weekEnd } = getWeekBounds(reportDate);
  const { start: prevStart, end: prevEnd } = getPreviousWeekBounds(reportDate);

  const currentStats = await getWeeklyStats(userId, weekStart, weekEnd);
  const previousStats = await getWeeklyStats(userId, prevStart, prevEnd);

  const topCategories = await getTopCategories(userId, weekStart, weekEnd);
  const weakestKeys = await getWeakestKeys(userId);

  const comparison = {
    wpmChange: currentStats.avgWpm - previousStats.avgWpm,
    accuracyChange: currentStats.avgAccuracy - previousStats.avgAccuracy,
    sessionsChange: currentStats.totalSessions - previousStats.totalSessions,
    practiceTimeChange:
      currentStats.totalPracticeTimeMs - previousStats.totalPracticeTimeMs,
  };

  return {
    userId: user[0].id,
    userEmail: user[0].email,
    userName: user[0].name,
    weekStartDate: weekStart.toISOString().split('T')[0],
    weekEndDate: weekEnd.toISOString().split('T')[0],
    stats: currentStats,
    comparison,
    topCategories,
    weakestKeys,
    streakInfo: {
      currentStreak: profile[0]?.currentStreak ?? 0,
      longestStreak: profile[0]?.longestStreak ?? 0,
    },
  };
}

export async function getUsersForWeeklyReport(): Promise<number[]> {
  const usersWithPrefs = await db
    .select({
      userId: userProfiles.userId,
      preferences: userProfiles.preferences,
    })
    .from(userProfiles)
    .innerJoin(users, eq(userProfiles.userId, users.id))
    .where(isNull(users.deletedAt));

  return usersWithPrefs
    .filter((u) => {
      const prefs = u.preferences as { weeklyReportEnabled?: boolean } | null;
      return prefs?.weeklyReportEnabled !== false;
    })
    .map((u) => u.userId);
}
