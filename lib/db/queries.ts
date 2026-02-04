import { desc, and, eq, isNull, asc, gte, lte, sql, inArray, ne } from 'drizzle-orm';
import { db } from './drizzle';
import {
  achievements,
  activityLogs,
  categories,
  challengeCollections,
  challengeVotes,
  challenges,
  charErrorPatterns,
  collectionChallenges,
  customChallenges,
  dailyPractice,
  keyAccuracy,
  keystrokeLogs,
  sequenceErrorPatterns,
  invitations,
  referrals,
  teamChallenges,
  teamCustomChallenges,
  teamMembers,
  teams,
  typingSessions,
  userAchievements,
  userProfiles,
  users,
  teamAchievements as teamAchievementsTable,
  earnedTeamAchievements as earnedTeamAchievementsTable,
  teamOnboardingCourses,
  teamOnboardingCourseSteps,
  teamOnboardingCourseProgress,
  races,
  raceParticipants,
  spacedRepetitionItems,
} from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import {
  requireTeamAdmin,
  requireTeamOwner,
  canRemoveMember,
  canUpdateMemberRole,
  type TeamRole,
} from '@/lib/auth/permissions';

export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date()
    })
    .where(eq(teams.id, teamId));
}

export async function getUserWithTeam(userId: number) {
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getTeamForUser() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const result = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
    with: {
      team: {
        with: {
          teamMembers: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  return result?.team || null;
}

export async function getCategories() {
  return await db
    .select()
    .from(categories)
    .orderBy(asc(categories.displayOrder), asc(categories.name));
}

export async function getCategoryBySlug(slug: string) {
  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getCategoryById(id: number) {
  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getFreeCategories() {
  return await db
    .select()
    .from(categories)
    .where(eq(categories.isPremium, false))
    .orderBy(asc(categories.displayOrder), asc(categories.name));
}

export async function getCategoryWithChallenges(slug: string) {
  return await db.query.categories.findFirst({
    where: eq(categories.slug, slug),
    with: {
      challenges: true,
    },
  });
}

export async function getChallengeById(id: number) {
  return await db.query.challenges.findFirst({
    where: eq(challenges.id, id),
    with: {
      category: true,
    },
  });
}

export async function getNextChallengeInCategory(
  categoryId: number,
  currentChallengeId: number
) {
  // Get the next challenge with a higher ID in the same category
  const result = await db
    .select({ id: challenges.id })
    .from(challenges)
    .where(
      and(
        eq(challenges.categoryId, categoryId),
        // Get challenges with ID greater than current
        // This assumes challenges are ordered by ID
      )
    )
    .orderBy(asc(challenges.id))
    .limit(100);

  // Find current position and get next
  const currentIndex = result.findIndex((c) => c.id === currentChallengeId);
  if (currentIndex === -1 || currentIndex === result.length - 1) {
    // Current not found or it's the last one - return null (no wrap)
    return null;
  }

  return result[currentIndex + 1].id;
}

export async function getChallengePosition(
  categoryId: number,
  currentChallengeId: number
): Promise<{ current: number; total: number } | null> {
  // Get all challenges in the category ordered by ID
  const result = await db
    .select({ id: challenges.id })
    .from(challenges)
    .where(eq(challenges.categoryId, categoryId))
    .orderBy(asc(challenges.id))
    .limit(100);

  // Find current position (1-indexed for display)
  const currentIndex = result.findIndex((c) => c.id === currentChallengeId);
  if (currentIndex === -1) {
    return null;
  }

  return {
    current: currentIndex + 1,
    total: result.length,
  };
}

export async function getUserStats() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });
}

export async function getRecentTypingSessions(limit = 10) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db.query.typingSessions.findMany({
    where: eq(typingSessions.userId, user.id),
    orderBy: [desc(typingSessions.completedAt)],
    limit,
    with: {
      challenge: {
        with: {
          category: true,
        },
      },
    },
  });
}

export async function getUserStatsOverview() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get all user's typing sessions for calculating averages
  const sessions = await db
    .select({
      wpm: typingSessions.wpm,
      accuracy: typingSessions.accuracy,
      durationMs: typingSessions.durationMs,
      keystrokes: typingSessions.keystrokes,
      errors: typingSessions.errors,
    })
    .from(typingSessions)
    .where(eq(typingSessions.userId, user.id));

  // Get user profile for streak info
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });

  // Calculate averages
  const totalSessions = sessions.length;
  if (totalSessions === 0) {
    return {
      totalSessions: 0,
      avgWpm: 0,
      avgAccuracy: 0,
      totalPracticeTimeMs: profile?.totalPracticeTimeMs ?? 0,
      totalKeystrokes: 0,
      totalErrors: 0,
      currentStreak: profile?.currentStreak ?? 0,
      longestStreak: profile?.longestStreak ?? 0,
      bestWpm: 0,
      bestAccuracy: 0,
    };
  }

  const avgWpm = Math.round(
    sessions.reduce((sum, s) => sum + s.wpm, 0) / totalSessions
  );
  const avgAccuracy = Math.round(
    sessions.reduce((sum, s) => sum + s.accuracy, 0) / totalSessions
  );
  const totalKeystrokes = sessions.reduce((sum, s) => sum + s.keystrokes, 0);
  const totalErrors = sessions.reduce((sum, s) => sum + s.errors, 0);
  const bestWpm = Math.max(...sessions.map((s) => s.wpm));
  const bestAccuracy = Math.max(...sessions.map((s) => s.accuracy));

  return {
    totalSessions,
    avgWpm,
    avgAccuracy,
    totalPracticeTimeMs: profile?.totalPracticeTimeMs ?? 0,
    totalKeystrokes,
    totalErrors,
    currentStreak: profile?.currentStreak ?? 0,
    longestStreak: profile?.longestStreak ?? 0,
    bestWpm,
    bestAccuracy,
  };
}

export async function getCategoryPerformance() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get all sessions with category info
  const sessions = await db
    .select({
      wpm: typingSessions.wpm,
      accuracy: typingSessions.accuracy,
      categoryId: challenges.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryIsPremium: categories.isPremium,
    })
    .from(typingSessions)
    .innerJoin(challenges, eq(typingSessions.challengeId, challenges.id))
    .innerJoin(categories, eq(challenges.categoryId, categories.id))
    .where(eq(typingSessions.userId, user.id));

  // Group by category
  const categoryMap = new Map<
    number,
    {
      categoryId: number;
      categoryName: string;
      categorySlug: string;
      isPremium: boolean;
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
        categoryId: session.categoryId,
        categoryName: session.categoryName,
        categorySlug: session.categorySlug,
        isPremium: session.categoryIsPremium,
        sessions: 1,
        totalWpm: session.wpm,
        totalAccuracy: session.accuracy,
      });
    }
  }

  // Calculate averages and return sorted by sessions
  return Array.from(categoryMap.values())
    .map((cat) => ({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      categorySlug: cat.categorySlug,
      isPremium: cat.isPremium,
      sessions: cat.sessions,
      avgWpm: Math.round(cat.totalWpm / cat.sessions),
      avgAccuracy: Math.round(cat.totalAccuracy / cat.sessions),
    }))
    .sort((a, b) => b.sessions - a.sessions);
}

export async function getWpmTrend(days: number) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Calculate the start date
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // Get all sessions within the date range
  const sessions = await db
    .select({
      wpm: typingSessions.wpm,
      completedAt: typingSessions.completedAt,
    })
    .from(typingSessions)
    .where(eq(typingSessions.userId, user.id))
    .orderBy(asc(typingSessions.completedAt));

  // Filter to sessions within the date range and group by date
  const dateMap = new Map<
    string,
    { totalWpm: number; count: number }
  >();

  for (const session of sessions) {
    const sessionDate = new Date(session.completedAt);
    if (sessionDate < startDate) continue;

    const dateKey = sessionDate.toISOString().split('T')[0];
    const existing = dateMap.get(dateKey);
    if (existing) {
      existing.totalWpm += session.wpm;
      existing.count++;
    } else {
      dateMap.set(dateKey, { totalWpm: session.wpm, count: 1 });
    }
  }

  // Convert to array and calculate averages
  const result = Array.from(dateMap.entries())
    .map(([date, data]) => ({
      date,
      avgWpm: Math.round(data.totalWpm / data.count),
      sessions: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return result;
}

export interface CategoryBreakdown {
  best: {
    byWpm: { categoryId: number; categoryName: string; avgWpm: number; sessions: number } | null;
    byAccuracy: { categoryId: number; categoryName: string; avgAccuracy: number; sessions: number } | null;
  };
  worst: {
    byWpm: { categoryId: number; categoryName: string; avgWpm: number; sessions: number } | null;
    byAccuracy: { categoryId: number; categoryName: string; avgAccuracy: number; sessions: number } | null;
  };
}

export async function getCategoryBreakdown(): Promise<CategoryBreakdown> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get all sessions with category info
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
    .where(eq(typingSessions.userId, user.id));

  // Group by category and calculate averages
  const categoryMap = new Map<
    number,
    {
      categoryId: number;
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
        categoryId: session.categoryId,
        categoryName: session.categoryName,
        sessions: 1,
        totalWpm: session.wpm,
        totalAccuracy: session.accuracy,
      });
    }
  }

  // Convert to array with calculated averages
  const categoryStats = Array.from(categoryMap.values()).map((cat) => ({
    categoryId: cat.categoryId,
    categoryName: cat.categoryName,
    sessions: cat.sessions,
    avgWpm: Math.round(cat.totalWpm / cat.sessions),
    avgAccuracy: Math.round(cat.totalAccuracy / cat.sessions),
  }));

  // Need at least one category with data
  if (categoryStats.length === 0) {
    return {
      best: { byWpm: null, byAccuracy: null },
      worst: { byWpm: null, byAccuracy: null },
    };
  }

  // Sort by WPM to find best/worst
  const sortedByWpm = [...categoryStats].sort((a, b) => b.avgWpm - a.avgWpm);
  const sortedByAccuracy = [...categoryStats].sort((a, b) => b.avgAccuracy - a.avgAccuracy);

  // Only show worst if there's more than one category
  const hasMultipleCategories = categoryStats.length > 1;

  return {
    best: {
      byWpm: {
        categoryId: sortedByWpm[0].categoryId,
        categoryName: sortedByWpm[0].categoryName,
        avgWpm: sortedByWpm[0].avgWpm,
        sessions: sortedByWpm[0].sessions,
      },
      byAccuracy: {
        categoryId: sortedByAccuracy[0].categoryId,
        categoryName: sortedByAccuracy[0].categoryName,
        avgAccuracy: sortedByAccuracy[0].avgAccuracy,
        sessions: sortedByAccuracy[0].sessions,
      },
    },
    worst: hasMultipleCategories
      ? {
          byWpm: {
            categoryId: sortedByWpm[sortedByWpm.length - 1].categoryId,
            categoryName: sortedByWpm[sortedByWpm.length - 1].categoryName,
            avgWpm: sortedByWpm[sortedByWpm.length - 1].avgWpm,
            sessions: sortedByWpm[sortedByWpm.length - 1].sessions,
          },
          byAccuracy: {
            categoryId: sortedByAccuracy[sortedByAccuracy.length - 1].categoryId,
            categoryName: sortedByAccuracy[sortedByAccuracy.length - 1].categoryName,
            avgAccuracy: sortedByAccuracy[sortedByAccuracy.length - 1].avgAccuracy,
            sessions: sortedByAccuracy[sortedByAccuracy.length - 1].sessions,
          },
        }
      : { byWpm: null, byAccuracy: null },
  };
}

export async function getDailyPractice(date: string) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const result = await db
    .select()
    .from(dailyPractice)
    .where(
      and(
        eq(dailyPractice.userId, user.id),
        eq(dailyPractice.date, date)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getDailyPracticeForUser(userId: number, date: string) {
  const result = await db
    .select()
    .from(dailyPractice)
    .where(
      and(
        eq(dailyPractice.userId, userId),
        eq(dailyPractice.date, date)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getDailyPracticeHistory(days: number) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  return await db
    .select()
    .from(dailyPractice)
    .where(
      and(
        eq(dailyPractice.userId, user.id),
        gte(dailyPractice.date, startDateStr)
      )
    )
    .orderBy(asc(dailyPractice.date));
}

export async function upsertDailyPractice(
  userId: number,
  date: string,
  practiceTimeMs: number,
  sessionsCompleted: number
) {
  const existing = await getDailyPracticeForUser(userId, date);

  if (existing) {
    const [updated] = await db
      .update(dailyPractice)
      .set({
        practiceTimeMs: existing.practiceTimeMs + practiceTimeMs,
        sessionsCompleted: existing.sessionsCompleted + sessionsCompleted,
      })
      .where(eq(dailyPractice.id, existing.id))
      .returning();
    return updated;
  } else {
    const [created] = await db
      .insert(dailyPractice)
      .values({
        userId,
        date,
        practiceTimeMs,
        sessionsCompleted,
      })
      .returning();
    return created;
  }
}

export async function updateUserTotalPracticeTime(userId: number, additionalTimeMs: number) {
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });

  if (profile) {
    await db
      .update(userProfiles)
      .set({
        totalPracticeTimeMs: profile.totalPracticeTimeMs + additionalTimeMs,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values({
      userId,
      totalPracticeTimeMs: additionalTimeMs,
    });
  }
}

export async function getUserProfile(userId: number) {
  return await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });
}

export async function updateUserStreak(userId: number) {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });

  const todayPractice = await getDailyPracticeForUser(userId, today);
  const yesterdayPractice = await getDailyPracticeForUser(userId, yesterday);

  if (!profile) {
    await db.insert(userProfiles).values({
      userId,
      currentStreak: todayPractice ? 1 : 0,
      longestStreak: todayPractice ? 1 : 0,
    });
    return;
  }

  let newStreak = profile.currentStreak;

  if (todayPractice && todayPractice.sessionsCompleted === 1) {
    if (yesterdayPractice && yesterdayPractice.sessionsCompleted > 0) {
      newStreak = profile.currentStreak + 1;
    } else if (profile.currentStreak === 0) {
      newStreak = 1;
    }
  }

  const newLongestStreak = Math.max(profile.longestStreak, newStreak);

  if (newStreak !== profile.currentStreak || newLongestStreak !== profile.longestStreak) {
    await db
      .update(userProfiles)
      .set({
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId));
  }
}

export async function getKeyAccuracyForUser(userId: number) {
  return await db
    .select()
    .from(keyAccuracy)
    .where(eq(keyAccuracy.userId, userId))
    .orderBy(desc(keyAccuracy.totalPresses));
}

export async function getKeyAccuracy() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await getKeyAccuracyForUser(user.id);
}

export async function getKeyAccuracyByKey(userId: number, key: string) {
  const result = await db
    .select()
    .from(keyAccuracy)
    .where(
      and(
        eq(keyAccuracy.userId, userId),
        eq(keyAccuracy.key, key)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function upsertKeyAccuracy(
  userId: number,
  key: string,
  isCorrect: boolean,
  latencyMs: number
) {
  const existing = await getKeyAccuracyByKey(userId, key);

  if (existing) {
    const newTotalPresses = existing.totalPresses + 1;
    const newCorrectPresses = existing.correctPresses + (isCorrect ? 1 : 0);
    // Calculate running average for latency
    const newAvgLatency = Math.round(
      (existing.avgLatencyMs * existing.totalPresses + latencyMs) / newTotalPresses
    );

    const [updated] = await db
      .update(keyAccuracy)
      .set({
        totalPresses: newTotalPresses,
        correctPresses: newCorrectPresses,
        avgLatencyMs: newAvgLatency,
      })
      .where(eq(keyAccuracy.id, existing.id))
      .returning();
    return updated;
  } else {
    const [created] = await db
      .insert(keyAccuracy)
      .values({
        userId,
        key,
        totalPresses: 1,
        correctPresses: isCorrect ? 1 : 0,
        avgLatencyMs: latencyMs,
      })
      .returning();
    return created;
  }
}

export async function getWeakestKeys(userId: number, limit = 10) {
  const allKeys = await getKeyAccuracyForUser(userId);

  // Filter to keys with at least 5 presses to avoid noise
  const significantKeys = allKeys.filter((k) => k.totalPresses >= 5);

  // Sort by accuracy (correctPresses / totalPresses) ascending
  return significantKeys
    .map((k) => ({
      ...k,
      accuracy: Math.round((k.correctPresses / k.totalPresses) * 100),
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);
}

export async function getSlowestKeys(userId: number, limit = 10) {
  const allKeys = await getKeyAccuracyForUser(userId);

  // Filter to keys with at least 5 presses to avoid noise
  const significantKeys = allKeys.filter((k) => k.totalPresses >= 5);

  // Sort by avgLatencyMs descending (slowest first)
  return significantKeys
    .sort((a, b) => b.avgLatencyMs - a.avgLatencyMs)
    .slice(0, limit);
}

export async function getCharErrorPatternsForUser(userId: number) {
  return await db
    .select()
    .from(charErrorPatterns)
    .where(eq(charErrorPatterns.userId, userId))
    .orderBy(desc(charErrorPatterns.count));
}

export async function getCharErrorPatterns() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await getCharErrorPatternsForUser(user.id);
}

export async function getCharErrorPatternByChars(
  userId: number,
  expectedChar: string,
  actualChar: string
) {
  const result = await db
    .select()
    .from(charErrorPatterns)
    .where(
      and(
        eq(charErrorPatterns.userId, userId),
        eq(charErrorPatterns.expectedChar, expectedChar),
        eq(charErrorPatterns.actualChar, actualChar)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function upsertCharErrorPattern(
  userId: number,
  expectedChar: string,
  actualChar: string,
  incrementBy = 1
) {
  const existing = await getCharErrorPatternByChars(userId, expectedChar, actualChar);

  if (existing) {
    const [updated] = await db
      .update(charErrorPatterns)
      .set({
        count: existing.count + incrementBy,
      })
      .where(eq(charErrorPatterns.id, existing.id))
      .returning();
    return updated;
  } else {
    const [created] = await db
      .insert(charErrorPatterns)
      .values({
        userId,
        expectedChar,
        actualChar,
        count: incrementBy,
      })
      .returning();
    return created;
  }
}

export async function batchUpsertCharErrorPatterns(
  userId: number,
  errors: Array<{ expectedChar: string; actualChar: string; count: number }>
) {
  const results = [];
  for (const error of errors) {
    const result = await upsertCharErrorPattern(
      userId,
      error.expectedChar,
      error.actualChar,
      error.count
    );
    results.push(result);
  }
  return results;
}

export async function getMostCommonErrorsForChar(
  userId: number,
  expectedChar: string,
  limit = 5
) {
  return await db
    .select()
    .from(charErrorPatterns)
    .where(
      and(
        eq(charErrorPatterns.userId, userId),
        eq(charErrorPatterns.expectedChar, expectedChar)
      )
    )
    .orderBy(desc(charErrorPatterns.count))
    .limit(limit);
}

export async function getTopErrorPatterns(userId: number, limit = 20) {
  return await db
    .select()
    .from(charErrorPatterns)
    .where(eq(charErrorPatterns.userId, userId))
    .orderBy(desc(charErrorPatterns.count))
    .limit(limit);
}

export interface WpmByHourDataPoint {
  hour: number;
  avgWpm: number;
  sessions: number;
}

export interface CategoryMasteryData {
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  totalChallenges: number;
  completedChallenges: number;
  percentComplete: number;
  avgWpm: number;
  avgAccuracy: number;
  accuracyTrend: number; // positive = improving, negative = declining
  sessions: number;
}

export async function getCategoryMastery(): Promise<CategoryMasteryData[]> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get all categories with their challenge counts
  const allCategories = await db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      categorySlug: categories.slug,
      totalChallenges: sql<number>`COUNT(${challenges.id})::int`,
    })
    .from(categories)
    .leftJoin(challenges, eq(challenges.categoryId, categories.id))
    .groupBy(categories.id, categories.name, categories.slug)
    .orderBy(asc(categories.displayOrder), asc(categories.name));

  // Get user's sessions grouped by category and challenge
  const userSessions = await db
    .select({
      categoryId: challenges.categoryId,
      challengeId: typingSessions.challengeId,
      wpm: typingSessions.wpm,
      accuracy: typingSessions.accuracy,
      completedAt: typingSessions.completedAt,
    })
    .from(typingSessions)
    .innerJoin(challenges, eq(typingSessions.challengeId, challenges.id))
    .where(eq(typingSessions.userId, user.id))
    .orderBy(asc(typingSessions.completedAt));

  // Build mastery data for each category
  const masteryMap = new Map<number, {
    sessions: Array<{ wpm: number; accuracy: number; completedAt: Date }>;
    completedChallenges: Set<number>;
  }>();

  for (const session of userSessions) {
    const existing = masteryMap.get(session.categoryId);
    if (existing) {
      existing.sessions.push({
        wpm: session.wpm,
        accuracy: session.accuracy,
        completedAt: session.completedAt,
      });
      existing.completedChallenges.add(session.challengeId);
    } else {
      masteryMap.set(session.categoryId, {
        sessions: [{
          wpm: session.wpm,
          accuracy: session.accuracy,
          completedAt: session.completedAt,
        }],
        completedChallenges: new Set([session.challengeId]),
      });
    }
  }

  // Calculate mastery data for each category
  return allCategories.map((cat) => {
    const userData = masteryMap.get(cat.categoryId);

    if (!userData || userData.sessions.length === 0) {
      return {
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        categorySlug: cat.categorySlug,
        totalChallenges: cat.totalChallenges,
        completedChallenges: 0,
        percentComplete: 0,
        avgWpm: 0,
        avgAccuracy: 0,
        accuracyTrend: 0,
        sessions: 0,
      };
    }

    const sessions = userData.sessions;
    const avgWpm = Math.round(
      sessions.reduce((sum, s) => sum + s.wpm, 0) / sessions.length
    );
    const avgAccuracy = Math.round(
      sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length
    );

    // Calculate accuracy trend by comparing first half vs second half
    let accuracyTrend = 0;
    if (sessions.length >= 4) {
      const halfLength = Math.ceil(sessions.length / 2);
      const firstHalf = sessions.slice(0, halfLength);
      const secondHalf = sessions.slice(halfLength);

      const firstHalfAvg =
        firstHalf.reduce((sum, s) => sum + s.accuracy, 0) / firstHalf.length;
      const secondHalfAvg =
        secondHalf.reduce((sum, s) => sum + s.accuracy, 0) / secondHalf.length;

      accuracyTrend = Math.round(secondHalfAvg - firstHalfAvg);
    }

    const completedChallenges = userData.completedChallenges.size;
    const percentComplete = cat.totalChallenges > 0
      ? Math.round((completedChallenges / cat.totalChallenges) * 100)
      : 0;

    return {
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      categorySlug: cat.categorySlug,
      totalChallenges: cat.totalChallenges,
      completedChallenges,
      percentComplete,
      avgWpm,
      avgAccuracy,
      accuracyTrend,
      sessions: sessions.length,
    };
  });
}

export async function getWpmByHourOfDay(): Promise<WpmByHourDataPoint[]> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get all sessions
  const sessions = await db
    .select({
      wpm: typingSessions.wpm,
      completedAt: typingSessions.completedAt,
    })
    .from(typingSessions)
    .where(eq(typingSessions.userId, user.id));

  // Group by hour of day
  const hourMap = new Map<number, { totalWpm: number; count: number }>();

  for (const session of sessions) {
    const sessionDate = new Date(session.completedAt);
    const hour = sessionDate.getHours();

    const existing = hourMap.get(hour);
    if (existing) {
      existing.totalWpm += session.wpm;
      existing.count++;
    } else {
      hourMap.set(hour, { totalWpm: session.wpm, count: 1 });
    }
  }

  // Convert to array with calculated averages
  const result: WpmByHourDataPoint[] = Array.from(hourMap.entries())
    .map(([hour, data]) => ({
      hour,
      avgWpm: Math.round(data.totalWpm / data.count),
      sessions: data.count,
    }))
    .sort((a, b) => a.hour - b.hour);

  return result;
}

export interface MonthlyStats {
  month: number;
  year: number;
  monthLabel: string;
  totalSessions: number;
  avgWpm: number;
  avgAccuracy: number;
  totalPracticeTimeMs: number;
  bestWpm: number;
  totalKeystrokes: number;
  totalErrors: number;
  daysWithPractice: number;
}

export interface MonthlyComparison {
  thisMonth: MonthlyStats;
  lastMonth: MonthlyStats;
  changes: {
    sessions: number;
    avgWpm: number;
    avgAccuracy: number;
    practiceTime: number;
    bestWpm: number;
    daysWithPractice: number;
  };
}

export async function getMonthlyComparison(): Promise<MonthlyComparison | null> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  // Get all sessions for both months
  const sessions = await db
    .select({
      wpm: typingSessions.wpm,
      accuracy: typingSessions.accuracy,
      durationMs: typingSessions.durationMs,
      keystrokes: typingSessions.keystrokes,
      errors: typingSessions.errors,
      completedAt: typingSessions.completedAt,
    })
    .from(typingSessions)
    .where(
      and(
        eq(typingSessions.userId, user.id),
        gte(typingSessions.completedAt, lastMonthStart)
      )
    );

  // Separate sessions into this month and last month
  const thisMonthSessions = sessions.filter(
    (s) => new Date(s.completedAt) >= thisMonthStart
  );
  const lastMonthSessions = sessions.filter(
    (s) => {
      const date = new Date(s.completedAt);
      return date >= lastMonthStart && date <= lastMonthEnd;
    }
  );

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const calculateStats = (
    monthSessions: typeof sessions,
    month: number,
    year: number
  ): MonthlyStats => {
    if (monthSessions.length === 0) {
      return {
        month,
        year,
        monthLabel: `${monthNames[month]} ${year}`,
        totalSessions: 0,
        avgWpm: 0,
        avgAccuracy: 0,
        totalPracticeTimeMs: 0,
        bestWpm: 0,
        totalKeystrokes: 0,
        totalErrors: 0,
        daysWithPractice: 0,
      };
    }

    const avgWpm = Math.round(
      monthSessions.reduce((sum, s) => sum + s.wpm, 0) / monthSessions.length
    );
    const avgAccuracy = Math.round(
      monthSessions.reduce((sum, s) => sum + s.accuracy, 0) / monthSessions.length
    );
    const totalPracticeTimeMs = monthSessions.reduce((sum, s) => sum + s.durationMs, 0);
    const bestWpm = Math.max(...monthSessions.map((s) => s.wpm));
    const totalKeystrokes = monthSessions.reduce((sum, s) => sum + s.keystrokes, 0);
    const totalErrors = monthSessions.reduce((sum, s) => sum + s.errors, 0);

    // Count unique days with practice
    const uniqueDays = new Set(
      monthSessions.map((s) => new Date(s.completedAt).toISOString().split('T')[0])
    );

    return {
      month,
      year,
      monthLabel: `${monthNames[month]} ${year}`,
      totalSessions: monthSessions.length,
      avgWpm,
      avgAccuracy,
      totalPracticeTimeMs,
      bestWpm,
      totalKeystrokes,
      totalErrors,
      daysWithPractice: uniqueDays.size,
    };
  };

  const thisMonth = calculateStats(
    thisMonthSessions,
    now.getMonth(),
    now.getFullYear()
  );
  const lastMonth = calculateStats(
    lastMonthSessions,
    lastMonthStart.getMonth(),
    lastMonthStart.getFullYear()
  );

  // Calculate percentage changes (or absolute if last month was 0)
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return {
    thisMonth,
    lastMonth,
    changes: {
      sessions: calculateChange(thisMonth.totalSessions, lastMonth.totalSessions),
      avgWpm: calculateChange(thisMonth.avgWpm, lastMonth.avgWpm),
      avgAccuracy: calculateChange(thisMonth.avgAccuracy, lastMonth.avgAccuracy),
      practiceTime: calculateChange(thisMonth.totalPracticeTimeMs, lastMonth.totalPracticeTimeMs),
      bestWpm: calculateChange(thisMonth.bestWpm, lastMonth.bestWpm),
      daysWithPractice: calculateChange(thisMonth.daysWithPractice, lastMonth.daysWithPractice),
    },
  };
}

// Sequence Error Pattern Functions

export interface SequenceErrorData {
  sequence: string;
  totalAttempts: number;
  errorCount: number;
  errorRate: number;
  avgLatencyMs: number;
}

export async function getSequenceErrorPatternsForUser(userId: number) {
  return await db
    .select()
    .from(sequenceErrorPatterns)
    .where(eq(sequenceErrorPatterns.userId, userId))
    .orderBy(desc(sequenceErrorPatterns.errorCount));
}

export async function getSequenceErrorPatterns() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await getSequenceErrorPatternsForUser(user.id);
}

export async function getSequenceErrorPatternBySequence(
  userId: number,
  sequence: string
) {
  const result = await db
    .select()
    .from(sequenceErrorPatterns)
    .where(
      and(
        eq(sequenceErrorPatterns.userId, userId),
        eq(sequenceErrorPatterns.sequence, sequence)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function upsertSequenceErrorPattern(
  userId: number,
  sequence: string,
  hadError: boolean,
  latencyMs: number
) {
  const existing = await getSequenceErrorPatternBySequence(userId, sequence);

  if (existing) {
    const newTotalAttempts = existing.totalAttempts + 1;
    const newErrorCount = existing.errorCount + (hadError ? 1 : 0);
    // Calculate running average for latency
    const newAvgLatency = Math.round(
      (existing.avgLatencyMs * existing.totalAttempts + latencyMs) / newTotalAttempts
    );

    const [updated] = await db
      .update(sequenceErrorPatterns)
      .set({
        totalAttempts: newTotalAttempts,
        errorCount: newErrorCount,
        avgLatencyMs: newAvgLatency,
      })
      .where(eq(sequenceErrorPatterns.id, existing.id))
      .returning();
    return updated;
  } else {
    const [created] = await db
      .insert(sequenceErrorPatterns)
      .values({
        userId,
        sequence,
        totalAttempts: 1,
        errorCount: hadError ? 1 : 0,
        avgLatencyMs: latencyMs,
      })
      .returning();
    return created;
  }
}

export async function batchUpsertSequenceErrorPatterns(
  userId: number,
  sequences: Array<{ sequence: string; hadError: boolean; latencyMs: number }>
) {
  const results = [];
  for (const seq of sequences) {
    const result = await upsertSequenceErrorPattern(
      userId,
      seq.sequence,
      seq.hadError,
      seq.latencyMs
    );
    results.push(result);
  }
  return results;
}

export async function getProblemSequences(
  userId: number,
  limit = 20,
  minAttempts = 5
): Promise<SequenceErrorData[]> {
  const allSequences = await getSequenceErrorPatternsForUser(userId);

  // Filter to sequences with at least minAttempts to avoid noise
  const significantSequences = allSequences.filter(
    (s) => s.totalAttempts >= minAttempts
  );

  // Calculate error rate and sort by it (highest error rate first)
  return significantSequences
    .map((s) => ({
      sequence: s.sequence,
      totalAttempts: s.totalAttempts,
      errorCount: s.errorCount,
      errorRate: Math.round((s.errorCount / s.totalAttempts) * 100),
      avgLatencyMs: s.avgLatencyMs,
    }))
    .sort((a, b) => b.errorRate - a.errorRate || b.errorCount - a.errorCount)
    .slice(0, limit);
}

export async function getSlowestSequences(
  userId: number,
  limit = 20,
  minAttempts = 5
): Promise<SequenceErrorData[]> {
  const allSequences = await getSequenceErrorPatternsForUser(userId);

  // Filter to sequences with at least minAttempts
  const significantSequences = allSequences.filter(
    (s) => s.totalAttempts >= minAttempts
  );

  // Sort by avgLatencyMs descending (slowest first)
  return significantSequences
    .map((s) => ({
      sequence: s.sequence,
      totalAttempts: s.totalAttempts,
      errorCount: s.errorCount,
      errorRate: Math.round((s.errorCount / s.totalAttempts) * 100),
      avgLatencyMs: s.avgLatencyMs,
    }))
    .sort((a, b) => b.avgLatencyMs - a.avgLatencyMs)
    .slice(0, limit);
}

export async function getTopProblemSequences(limit = 10) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await getProblemSequences(user.id, limit);
}

// Session Replay Functions

export interface SessionWithKeystrokeLogs {
  id: number;
  userId: number;
  challengeId: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  keystrokes: number;
  errors: number;
  durationMs: number;
  completedAt: Date;
  challenge: {
    id: number;
    content: string;
    difficulty: string;
    syntaxType: string;
    category: {
      id: number;
      name: string;
      slug: string;
    };
  };
  keystrokeLogs: Array<{
    id: number;
    timestamp: number;
    expected: string;
    actual: string;
    isCorrect: boolean;
    latencyMs: number;
  }>;
}

export async function getSessionWithKeystrokeLogs(
  sessionId: number
): Promise<SessionWithKeystrokeLogs | null> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get the session with challenge and category info
  const session = await db.query.typingSessions.findFirst({
    where: and(
      eq(typingSessions.id, sessionId),
      eq(typingSessions.userId, user.id)
    ),
    with: {
      challenge: {
        with: {
          category: true,
        },
      },
      keystrokeLogs: {
        orderBy: [asc(keystrokeLogs.timestamp)],
      },
    },
  });

  if (!session) {
    return null;
  }

  return {
    id: session.id,
    userId: session.userId,
    challengeId: session.challengeId,
    wpm: session.wpm,
    rawWpm: session.rawWpm,
    accuracy: session.accuracy,
    keystrokes: session.keystrokes,
    errors: session.errors,
    durationMs: session.durationMs,
    completedAt: session.completedAt,
    challenge: {
      id: session.challenge.id,
      content: session.challenge.content,
      difficulty: session.challenge.difficulty,
      syntaxType: session.challenge.syntaxType,
      category: {
        id: session.challenge.category.id,
        name: session.challenge.category.name,
        slug: session.challenge.category.slug,
      },
    },
    keystrokeLogs: session.keystrokeLogs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp,
      expected: log.expected,
      actual: log.actual,
      isCorrect: log.isCorrect,
      latencyMs: log.latencyMs,
    })),
  };
}

export interface AchievementProgress {
  current: number;
  target: number;
  percentage: number;
  label: string;
}

export interface AchievementWithStatus {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  criteria: unknown;
  earnedAt: Date | null;
  progress: AchievementProgress | null;
}

interface AchievementCriteria {
  type: 'wpm' | 'accuracy' | 'streak' | 'sessions_completed' | 'category_mastery';
  threshold?: number;
  categorySlug?: string;
  minAccuracy?: number;
  allChallenges?: boolean;
}

interface UserProgressContext {
  bestWpm: number;
  bestAccuracy: number;
  currentStreak: number;
  totalSessions: number;
  categoryProgress: Map<string, { completed: number; total: number }>;
}

async function getUserProgressContext(userId: number): Promise<UserProgressContext> {
  // Get best WPM and accuracy from sessions
  const [sessionStats] = await db
    .select({
      bestWpm: sql<number>`coalesce(max(${typingSessions.wpm}), 0)::int`,
      bestAccuracy: sql<number>`coalesce(max(${typingSessions.accuracy}), 0)::int`,
      totalSessions: sql<number>`count(*)::int`,
    })
    .from(typingSessions)
    .where(eq(typingSessions.userId, userId));

  // Get streak from profile
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });

  // Get category mastery progress (challenges completed with 90%+ accuracy per category)
  const allCategories = await db
    .select({
      slug: categories.slug,
      totalChallenges: sql<number>`count(${challenges.id})::int`,
    })
    .from(categories)
    .leftJoin(challenges, eq(challenges.categoryId, categories.id))
    .groupBy(categories.id, categories.slug);

  const userCategoryStats = await db
    .select({
      categorySlug: categories.slug,
      completedChallenges: sql<number>`count(distinct ${typingSessions.challengeId})::int`,
    })
    .from(typingSessions)
    .innerJoin(challenges, eq(typingSessions.challengeId, challenges.id))
    .innerJoin(categories, eq(challenges.categoryId, categories.id))
    .where(
      and(
        eq(typingSessions.userId, userId),
        gte(typingSessions.accuracy, 90)
      )
    )
    .groupBy(categories.slug);

  const categoryProgress = new Map<string, { completed: number; total: number }>();
  for (const cat of allCategories) {
    const userCat = userCategoryStats.find((uc) => uc.categorySlug === cat.slug);
    categoryProgress.set(cat.slug, {
      completed: userCat?.completedChallenges ?? 0,
      total: cat.totalChallenges,
    });
  }

  return {
    bestWpm: sessionStats?.bestWpm ?? 0,
    bestAccuracy: sessionStats?.bestAccuracy ?? 0,
    currentStreak: profile?.currentStreak ?? 0,
    totalSessions: sessionStats?.totalSessions ?? 0,
    categoryProgress,
  };
}

export function calculateAchievementProgress(
  criteria: AchievementCriteria,
  context: UserProgressContext
): AchievementProgress | null {
  switch (criteria.type) {
    case 'wpm': {
      const target = criteria.threshold!;
      const current = Math.min(context.bestWpm, target);
      return {
        current,
        target,
        percentage: Math.min(Math.round((current / target) * 100), 100),
        label: `${current}/${target} WPM`,
      };
    }
    case 'accuracy': {
      const target = criteria.threshold!;
      const current = Math.min(context.bestAccuracy, target);
      return {
        current,
        target,
        percentage: Math.min(Math.round((current / target) * 100), 100),
        label: `${current}%/${target}%`,
      };
    }
    case 'streak': {
      const target = criteria.threshold!;
      const current = Math.min(context.currentStreak, target);
      return {
        current,
        target,
        percentage: Math.min(Math.round((current / target) * 100), 100),
        label: `${current}/${target} days`,
      };
    }
    case 'sessions_completed': {
      const target = criteria.threshold!;
      const current = Math.min(context.totalSessions, target);
      return {
        current,
        target,
        percentage: Math.min(Math.round((current / target) * 100), 100),
        label: `${current}/${target} sessions`,
      };
    }
    case 'category_mastery': {
      const catSlug = criteria.categorySlug!;
      const catData = context.categoryProgress.get(catSlug);
      if (!catData || catData.total === 0) {
        return { current: 0, target: 1, percentage: 0, label: '0% mastered' };
      }
      const current = catData.completed;
      const target = catData.total;
      return {
        current,
        target,
        percentage: Math.min(Math.round((current / target) * 100), 100),
        label: `${current}/${target} challenges`,
      };
    }
    default:
      return null;
  }
}

export async function getUserAchievements(): Promise<AchievementWithStatus[]> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const allAchievements = await db
    .select({
      id: achievements.id,
      slug: achievements.slug,
      name: achievements.name,
      description: achievements.description,
      icon: achievements.icon,
      criteria: achievements.criteria,
      earnedAt: userAchievements.earnedAt,
    })
    .from(achievements)
    .leftJoin(
      userAchievements,
      and(
        eq(userAchievements.achievementId, achievements.id),
        eq(userAchievements.userId, user.id)
      )
    )
    .orderBy(asc(achievements.id));

  const progressCtx = await getUserProgressContext(user.id);

  return allAchievements.map((a) => ({
    ...a,
    progress: a.earnedAt
      ? null
      : calculateAchievementProgress(a.criteria as AchievementCriteria, progressCtx),
  }));
}

export async function getUserCustomChallenges() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select()
    .from(customChallenges)
    .where(eq(customChallenges.userId, user.id))
    .orderBy(desc(customChallenges.createdAt));
}

export async function getPublicChallenges({
  page = 1,
  limit = 20,
  search,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  minPracticed,
}: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'createdAt' | 'timesCompleted' | 'name' | 'score';
  sortOrder?: 'asc' | 'desc';
  minPracticed?: number;
} = {}) {
  const offset = (page - 1) * limit;

  const conditions = [eq(customChallenges.isPublic, true)];

  if (search) {
    conditions.push(
      sql`(${customChallenges.name} ILIKE ${'%' + search + '%'} OR ${customChallenges.content} ILIKE ${'%' + search + '%'})`
    );
  }

  if (minPracticed !== undefined && minPracticed > 0) {
    conditions.push(gte(customChallenges.timesCompleted, minPracticed));
  }

  const whereClause = and(...conditions);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(customChallenges)
    .where(whereClause);

  const total = countResult?.count ?? 0;
  const totalPages = Math.ceil(total / limit);

  const orderFn = sortOrder === 'desc' ? desc : asc;

  // For score sorting, use a subquery to compute vote scores
  if (sortBy === 'score') {
    const challengesList = await db
      .select({
        id: customChallenges.id,
        name: customChallenges.name,
        content: customChallenges.content,
        timesCompleted: customChallenges.timesCompleted,
        createdAt: customChallenges.createdAt,
        authorName: users.name,
        authorEmail: users.email,
        voteScore: sql<number>`coalesce(sum(${challengeVotes.value}), 0)::int`,
      })
      .from(customChallenges)
      .innerJoin(users, eq(customChallenges.userId, users.id))
      .leftJoin(challengeVotes, eq(customChallenges.id, challengeVotes.challengeId))
      .where(whereClause)
      .groupBy(customChallenges.id, users.name, users.email)
      .orderBy(orderFn(sql`coalesce(sum(${challengeVotes.value}), 0)`))
      .limit(limit)
      .offset(offset);

    const challengeIds = challengesList.map((c) => c.id);
    const voteCounts = await getVoteCountsForChallenges(challengeIds);

    const challengesWithVotes = challengesList.map(({ voteScore: _, ...c }) => ({
      ...c,
      votes: voteCounts.get(c.id) ?? { upvotes: 0, downvotes: 0, score: 0 },
    }));

    return {
      challenges: challengesWithVotes,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  const sortColumn = {
    createdAt: customChallenges.createdAt,
    timesCompleted: customChallenges.timesCompleted,
    name: customChallenges.name,
  }[sortBy];

  const challengesList = await db
    .select({
      id: customChallenges.id,
      name: customChallenges.name,
      content: customChallenges.content,
      timesCompleted: customChallenges.timesCompleted,
      createdAt: customChallenges.createdAt,
      authorName: users.name,
      authorEmail: users.email,
    })
    .from(customChallenges)
    .innerJoin(users, eq(customChallenges.userId, users.id))
    .where(whereClause)
    .orderBy(orderFn(sortColumn))
    .limit(limit)
    .offset(offset);

  // Fetch vote counts for all challenges in batch
  const challengeIds = challengesList.map((c) => c.id);
  const voteCounts = await getVoteCountsForChallenges(challengeIds);

  const challengesWithVotes = challengesList.map((c) => ({
    ...c,
    votes: voteCounts.get(c.id) ?? { upvotes: 0, downvotes: 0, score: 0 },
  }));

  return {
    challenges: challengesWithVotes,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

export async function searchChallenges({
  page = 1,
  limit = 20,
  search,
  category,
  difficulty,
  sortBy = 'timesCompleted',
  sortOrder = 'desc',
}: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  difficulty?: string;
  sortBy?: 'timesCompleted' | 'avgWpm' | 'createdAt' | 'difficulty';
  sortOrder?: 'asc' | 'desc';
} = {}) {
  const offset = (page - 1) * limit;

  const conditions = [];

  if (search) {
    conditions.push(
      sql`(${challenges.content} ILIKE ${'%' + search + '%'} OR ${challenges.hint} ILIKE ${'%' + search + '%'})`
    );
  }

  if (category) {
    conditions.push(eq(categories.slug, category));
  }

  if (difficulty) {
    conditions.push(eq(challenges.difficulty, difficulty));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(challenges)
    .innerJoin(categories, eq(challenges.categoryId, categories.id))
    .where(whereClause);

  const total = countResult?.count ?? 0;
  const totalPages = Math.ceil(total / limit);

  const sortColumn = {
    timesCompleted: challenges.timesCompleted,
    avgWpm: challenges.avgWpm,
    createdAt: challenges.createdAt,
    difficulty: challenges.difficulty,
  }[sortBy];

  const orderFn = sortOrder === 'desc' ? desc : asc;

  const challengesList = await db
    .select({
      id: challenges.id,
      content: challenges.content,
      difficulty: challenges.difficulty,
      syntaxType: challenges.syntaxType,
      hint: challenges.hint,
      avgWpm: challenges.avgWpm,
      timesCompleted: challenges.timesCompleted,
      createdAt: challenges.createdAt,
      categoryId: categories.id,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryIcon: categories.icon,
    })
    .from(challenges)
    .innerJoin(categories, eq(challenges.categoryId, categories.id))
    .where(whereClause)
    .orderBy(orderFn(sortColumn))
    .limit(limit)
    .offset(offset);

  return {
    challenges: challengesList,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

export async function getPublicChallengeById(id: number) {
  const [challenge] = await db
    .select({
      id: customChallenges.id,
      name: customChallenges.name,
      content: customChallenges.content,
      isPublic: customChallenges.isPublic,
      timesCompleted: customChallenges.timesCompleted,
      createdAt: customChallenges.createdAt,
      authorName: users.name,
      authorEmail: users.email,
    })
    .from(customChallenges)
    .innerJoin(users, eq(customChallenges.userId, users.id))
    .where(
      and(
        eq(customChallenges.id, id),
        eq(customChallenges.isPublic, true)
      )
    );

  if (!challenge) return null;

  const votes = await getVoteCountsForChallenge(id);

  return { ...challenge, votes };
}

export async function getCustomChallengeById(id: number) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const [challenge] = await db
    .select()
    .from(customChallenges)
    .where(
      and(
        eq(customChallenges.id, id),
        eq(customChallenges.userId, user.id)
      )
    );

  return challenge ?? null;
}

export async function getUserVoteForChallenge(userId: number, challengeId: number) {
  const [vote] = await db
    .select()
    .from(challengeVotes)
    .where(
      and(
        eq(challengeVotes.userId, userId),
        eq(challengeVotes.challengeId, challengeId)
      )
    );

  return vote ?? null;
}

export async function getVoteCountsForChallenge(challengeId: number) {
  const [result] = await db
    .select({
      upvotes: sql<number>`coalesce(sum(case when ${challengeVotes.value} = 1 then 1 else 0 end), 0)::int`,
      downvotes: sql<number>`coalesce(sum(case when ${challengeVotes.value} = -1 then 1 else 0 end), 0)::int`,
    })
    .from(challengeVotes)
    .where(eq(challengeVotes.challengeId, challengeId));

  return {
    upvotes: result?.upvotes ?? 0,
    downvotes: result?.downvotes ?? 0,
    score: (result?.upvotes ?? 0) - (result?.downvotes ?? 0),
  };
}

export async function upsertChallengeVote(
  userId: number,
  challengeId: number,
  value: 1 | -1
) {
  const existing = await getUserVoteForChallenge(userId, challengeId);

  if (existing) {
    if (existing.value === value) {
      // Same vote again = remove vote
      await db
        .delete(challengeVotes)
        .where(eq(challengeVotes.id, existing.id));
      return null;
    }
    // Different vote = update
    const [updated] = await db
      .update(challengeVotes)
      .set({ value, updatedAt: new Date() })
      .where(eq(challengeVotes.id, existing.id))
      .returning();
    return updated;
  }

  // New vote
  const [created] = await db
    .insert(challengeVotes)
    .values({ userId, challengeId, value })
    .returning();
  return created;
}

export async function getVoteCountsForChallenges(challengeIds: number[]) {
  if (challengeIds.length === 0) return new Map<number, { upvotes: number; downvotes: number; score: number }>();

  const results = await db
    .select({
      challengeId: challengeVotes.challengeId,
      upvotes: sql<number>`coalesce(sum(case when ${challengeVotes.value} = 1 then 1 else 0 end), 0)::int`,
      downvotes: sql<number>`coalesce(sum(case when ${challengeVotes.value} = -1 then 1 else 0 end), 0)::int`,
    })
    .from(challengeVotes)
    .where(sql`${challengeVotes.challengeId} = ANY(${challengeIds})`)
    .groupBy(challengeVotes.challengeId);

  const map = new Map<number, { upvotes: number; downvotes: number; score: number }>();
  for (const row of results) {
    map.set(row.challengeId, {
      upvotes: row.upvotes,
      downvotes: row.downvotes,
      score: row.upvotes - row.downvotes,
    });
  }
  return map;
}

export async function getUserVotesForChallenges(userId: number, challengeIds: number[]) {
  if (challengeIds.length === 0) return new Map<number, number>();

  const results = await db
    .select({
      challengeId: challengeVotes.challengeId,
      value: challengeVotes.value,
    })
    .from(challengeVotes)
    .where(
      and(
        eq(challengeVotes.userId, userId),
        sql`${challengeVotes.challengeId} = ANY(${challengeIds})`
      )
    );

  const map = new Map<number, number>();
  for (const row of results) {
    map.set(row.challengeId, row.value);
  }
  return map;
}

// ---- Challenge Collections ----

export async function getUserCollections() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const collections = await db
    .select({
      id: challengeCollections.id,
      name: challengeCollections.name,
      description: challengeCollections.description,
      isPublic: challengeCollections.isPublic,
      createdAt: challengeCollections.createdAt,
      updatedAt: challengeCollections.updatedAt,
      challengeCount: sql<number>`(
        SELECT count(*)::int FROM ${collectionChallenges}
        WHERE ${collectionChallenges.collectionId} = ${challengeCollections.id}
      )`,
    })
    .from(challengeCollections)
    .where(eq(challengeCollections.userId, user.id))
    .orderBy(desc(challengeCollections.updatedAt));

  return collections;
}

export async function getCollectionById(id: number) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const [collection] = await db
    .select()
    .from(challengeCollections)
    .where(
      and(
        eq(challengeCollections.id, id),
        eq(challengeCollections.userId, user.id)
      )
    );

  if (!collection) return null;

  const items = await db
    .select({
      id: collectionChallenges.id,
      challengeId: collectionChallenges.challengeId,
      displayOrder: collectionChallenges.displayOrder,
      addedAt: collectionChallenges.addedAt,
      challengeName: customChallenges.name,
      challengeContent: customChallenges.content,
      timesCompleted: customChallenges.timesCompleted,
      isPublic: customChallenges.isPublic,
    })
    .from(collectionChallenges)
    .innerJoin(customChallenges, eq(collectionChallenges.challengeId, customChallenges.id))
    .where(eq(collectionChallenges.collectionId, id))
    .orderBy(asc(collectionChallenges.displayOrder), asc(collectionChallenges.addedAt));

  return { ...collection, challenges: items };
}

export async function getPublicCollections({
  page = 1,
  limit = 20,
  search,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'createdAt' | 'name' | 'challengeCount';
  sortOrder?: 'asc' | 'desc';
} = {}) {
  const offset = (page - 1) * limit;

  const conditions = [eq(challengeCollections.isPublic, true)];

  if (search) {
    conditions.push(
      sql`(${challengeCollections.name} ILIKE ${'%' + search + '%'} OR ${challengeCollections.description} ILIKE ${'%' + search + '%'})`
    );
  }

  const whereClause = and(...conditions);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(challengeCollections)
    .where(whereClause);

  const total = countResult?.count ?? 0;
  const totalPages = Math.ceil(total / limit);

  const orderFn = sortOrder === 'desc' ? desc : asc;

  const challengeCountSql = sql<number>`(
    SELECT count(*)::int FROM ${collectionChallenges}
    WHERE ${collectionChallenges.collectionId} = ${challengeCollections.id}
  )`;

  const sortColumn = sortBy === 'challengeCount'
    ? challengeCountSql
    : sortBy === 'name'
      ? challengeCollections.name
      : challengeCollections.createdAt;

  const collectionsList = await db
    .select({
      id: challengeCollections.id,
      name: challengeCollections.name,
      description: challengeCollections.description,
      createdAt: challengeCollections.createdAt,
      authorName: users.name,
      authorEmail: users.email,
      challengeCount: challengeCountSql,
    })
    .from(challengeCollections)
    .innerJoin(users, eq(challengeCollections.userId, users.id))
    .where(whereClause)
    .orderBy(orderFn(sortColumn))
    .limit(limit)
    .offset(offset);

  return {
    collections: collectionsList,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

export async function getPublicCollectionById(id: number) {
  const [collection] = await db
    .select({
      id: challengeCollections.id,
      name: challengeCollections.name,
      description: challengeCollections.description,
      isPublic: challengeCollections.isPublic,
      createdAt: challengeCollections.createdAt,
      authorName: users.name,
      authorEmail: users.email,
    })
    .from(challengeCollections)
    .innerJoin(users, eq(challengeCollections.userId, users.id))
    .where(
      and(
        eq(challengeCollections.id, id),
        eq(challengeCollections.isPublic, true)
      )
    );

  if (!collection) return null;

  const items = await db
    .select({
      id: collectionChallenges.id,
      challengeId: collectionChallenges.challengeId,
      displayOrder: collectionChallenges.displayOrder,
      challengeName: customChallenges.name,
      challengeContent: customChallenges.content,
      timesCompleted: customChallenges.timesCompleted,
    })
    .from(collectionChallenges)
    .innerJoin(customChallenges, eq(collectionChallenges.challengeId, customChallenges.id))
    .where(eq(collectionChallenges.collectionId, id))
    .orderBy(asc(collectionChallenges.displayOrder), asc(collectionChallenges.addedAt));

  return { ...collection, challenges: items };
}

// ---- Team Leaderboard ----

export interface TeamLeaderboardEntry {
  userId: number;
  userName: string | null;
  userEmail: string;
  role: string;
  totalSessions: number;
  avgWpm: number;
  bestWpm: number;
  avgAccuracy: number;
  totalPracticeTimeMs: number;
  currentStreak: number;
}

export async function getTeamLeaderboard(): Promise<TeamLeaderboardEntry[]> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Find the user's team
  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (!membership) {
    return [];
  }

  // Get all team members
  const members = await db
    .select({
      userId: teamMembers.userId,
      userName: users.name,
      userEmail: users.email,
      role: teamMembers.role,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, membership.teamId));

  if (members.length === 0) {
    return [];
  }

  const memberUserIds = members.map((m) => m.userId);

  // Get typing session stats for all team members
  const sessionStats = await db
    .select({
      userId: typingSessions.userId,
      totalSessions: sql<number>`count(*)::int`,
      avgWpm: sql<number>`coalesce(round(avg(${typingSessions.wpm})), 0)::int`,
      bestWpm: sql<number>`coalesce(max(${typingSessions.wpm}), 0)::int`,
      avgAccuracy: sql<number>`coalesce(round(avg(${typingSessions.accuracy})), 0)::int`,
    })
    .from(typingSessions)
    .where(inArray(typingSessions.userId, memberUserIds))
    .groupBy(typingSessions.userId);

  // Get profile data (streaks, practice time) for all team members
  const profiles = await db
    .select({
      userId: userProfiles.userId,
      currentStreak: userProfiles.currentStreak,
      totalPracticeTimeMs: userProfiles.totalPracticeTimeMs,
    })
    .from(userProfiles)
    .where(inArray(userProfiles.userId, memberUserIds));

  // Build a map for quick lookup
  const statsMap = new Map(sessionStats.map((s) => [s.userId, s]));
  const profileMap = new Map(profiles.map((p) => [p.userId, p]));

  // Combine data for each member
  const leaderboard: TeamLeaderboardEntry[] = members.map((member) => {
    const stats = statsMap.get(member.userId);
    const profile = profileMap.get(member.userId);

    return {
      userId: member.userId,
      userName: member.userName,
      userEmail: member.userEmail,
      role: member.role,
      totalSessions: stats?.totalSessions ?? 0,
      avgWpm: stats?.avgWpm ?? 0,
      bestWpm: stats?.bestWpm ?? 0,
      avgAccuracy: stats?.avgAccuracy ?? 0,
      totalPracticeTimeMs: profile?.totalPracticeTimeMs ?? 0,
      currentStreak: profile?.currentStreak ?? 0,
    };
  });

  // Sort by avgWpm descending (primary), then by totalSessions descending (secondary)
  leaderboard.sort((a, b) => {
    if (b.avgWpm !== a.avgWpm) return b.avgWpm - a.avgWpm;
    return b.totalSessions - a.totalSessions;
  });

  return leaderboard;
}

// ---- Team Stats ----

export interface TeamWpmTrendDataPoint {
  date: string;
  avgWpm: number;
  sessions: number;
}

export interface TeamCategoryPerformance {
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  sessions: number;
  avgWpm: number;
  avgAccuracy: number;
}

export interface TeamMemberActivity {
  userId: number;
  userName: string | null;
  userEmail: string;
  wpm: number;
  accuracy: number;
  categoryName: string;
  completedAt: Date;
}

export interface TeamStatsOverview {
  totalMembers: number;
  activeMembers: number;
  teamAvgWpm: number;
  teamBestWpm: number;
  teamAvgAccuracy: number;
  totalSessions: number;
  totalPracticeTimeMs: number;
  avgStreak: number;
}

export async function getTeamStatsOverview(): Promise<TeamStatsOverview | null> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (!membership) {
    return null;
  }

  const members = await db
    .select({ userId: teamMembers.userId })
    .from(teamMembers)
    .where(eq(teamMembers.teamId, membership.teamId));

  if (members.length === 0) {
    return null;
  }

  const memberUserIds = members.map((m) => m.userId);

  const sessionStats = await db
    .select({
      userId: typingSessions.userId,
      totalSessions: sql<number>`count(*)::int`,
      avgWpm: sql<number>`coalesce(round(avg(${typingSessions.wpm})), 0)::int`,
      bestWpm: sql<number>`coalesce(max(${typingSessions.wpm}), 0)::int`,
      avgAccuracy: sql<number>`coalesce(round(avg(${typingSessions.accuracy})), 0)::int`,
    })
    .from(typingSessions)
    .where(inArray(typingSessions.userId, memberUserIds))
    .groupBy(typingSessions.userId);

  const profiles = await db
    .select({
      userId: userProfiles.userId,
      currentStreak: userProfiles.currentStreak,
      totalPracticeTimeMs: userProfiles.totalPracticeTimeMs,
    })
    .from(userProfiles)
    .where(inArray(userProfiles.userId, memberUserIds));

  const activeMembers = sessionStats.filter((s) => s.totalSessions > 0);
  const totalSessions = activeMembers.reduce((sum, s) => sum + s.totalSessions, 0);
  const teamAvgWpm = activeMembers.length > 0
    ? Math.round(activeMembers.reduce((sum, s) => sum + s.avgWpm, 0) / activeMembers.length)
    : 0;
  const teamBestWpm = activeMembers.length > 0
    ? Math.max(...activeMembers.map((s) => s.bestWpm))
    : 0;
  const teamAvgAccuracy = activeMembers.length > 0
    ? Math.round(activeMembers.reduce((sum, s) => sum + s.avgAccuracy, 0) / activeMembers.length)
    : 0;
  const totalPracticeTimeMs = profiles.reduce((sum, p) => sum + p.totalPracticeTimeMs, 0);
  const avgStreak = profiles.length > 0
    ? Math.round(profiles.reduce((sum, p) => sum + p.currentStreak, 0) / profiles.length)
    : 0;

  return {
    totalMembers: members.length,
    activeMembers: activeMembers.length,
    teamAvgWpm,
    teamBestWpm,
    teamAvgAccuracy,
    totalSessions,
    totalPracticeTimeMs,
    avgStreak,
  };
}

export async function getTeamWpmTrend(days: number): Promise<TeamWpmTrendDataPoint[]> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (!membership) {
    return [];
  }

  const memberUserIds = (
    await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, membership.teamId))
  ).map((m) => m.userId);

  if (memberUserIds.length === 0) {
    return [];
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const sessions = await db
    .select({
      wpm: typingSessions.wpm,
      completedAt: typingSessions.completedAt,
    })
    .from(typingSessions)
    .where(inArray(typingSessions.userId, memberUserIds))
    .orderBy(asc(typingSessions.completedAt));

  const dateMap = new Map<string, { totalWpm: number; count: number }>();

  for (const session of sessions) {
    const sessionDate = new Date(session.completedAt);
    if (sessionDate < startDate) continue;

    const dateKey = sessionDate.toISOString().split('T')[0];
    const existing = dateMap.get(dateKey);
    if (existing) {
      existing.totalWpm += session.wpm;
      existing.count++;
    } else {
      dateMap.set(dateKey, { totalWpm: session.wpm, count: 1 });
    }
  }

  return Array.from(dateMap.entries())
    .map(([date, data]) => ({
      date,
      avgWpm: Math.round(data.totalWpm / data.count),
      sessions: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getTeamCategoryPerformance(): Promise<TeamCategoryPerformance[]> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (!membership) {
    return [];
  }

  const memberUserIds = (
    await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, membership.teamId))
  ).map((m) => m.userId);

  if (memberUserIds.length === 0) {
    return [];
  }

  const sessions = await db
    .select({
      wpm: typingSessions.wpm,
      accuracy: typingSessions.accuracy,
      categoryId: challenges.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(typingSessions)
    .innerJoin(challenges, eq(typingSessions.challengeId, challenges.id))
    .innerJoin(categories, eq(challenges.categoryId, categories.id))
    .where(inArray(typingSessions.userId, memberUserIds));

  const categoryMap = new Map<
    number,
    {
      categoryId: number;
      categoryName: string;
      categorySlug: string;
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
        categoryId: session.categoryId,
        categoryName: session.categoryName,
        categorySlug: session.categorySlug,
        sessions: 1,
        totalWpm: session.wpm,
        totalAccuracy: session.accuracy,
      });
    }
  }

  return Array.from(categoryMap.values())
    .map((cat) => ({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      categorySlug: cat.categorySlug,
      sessions: cat.sessions,
      avgWpm: Math.round(cat.totalWpm / cat.sessions),
      avgAccuracy: Math.round(cat.totalAccuracy / cat.sessions),
    }))
    .sort((a, b) => b.sessions - a.sessions);
}

export async function getTeamRecentActivity(limit: number = 10): Promise<TeamMemberActivity[]> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (!membership) {
    return [];
  }

  const memberUserIds = (
    await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, membership.teamId))
  ).map((m) => m.userId);

  if (memberUserIds.length === 0) {
    return [];
  }

  const sessions = await db
    .select({
      userId: typingSessions.userId,
      userName: users.name,
      userEmail: users.email,
      wpm: typingSessions.wpm,
      accuracy: typingSessions.accuracy,
      categoryName: categories.name,
      completedAt: typingSessions.completedAt,
    })
    .from(typingSessions)
    .innerJoin(users, eq(typingSessions.userId, users.id))
    .innerJoin(challenges, eq(typingSessions.challengeId, challenges.id))
    .innerJoin(categories, eq(challenges.categoryId, categories.id))
    .where(inArray(typingSessions.userId, memberUserIds))
    .orderBy(desc(typingSessions.completedAt))
    .limit(limit);

  return sessions;
}

// ---- Team Member WPM Comparison ----

export interface TeamMemberWpmTrendDataPoint {
  date: string;
  avgWpm: number;
  sessions: number;
}

export interface TeamMemberWpmComparison {
  userId: number;
  userName: string | null;
  userEmail: string;
  data: TeamMemberWpmTrendDataPoint[];
}

export async function getTeamMemberWpmComparison(
  days: number
): Promise<TeamMemberWpmComparison[]> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (!membership) {
    return [];
  }

  const members = await db
    .select({
      userId: teamMembers.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, membership.teamId));

  if (members.length === 0) {
    return [];
  }

  const memberUserIds = members.map((m) => m.userId);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const sessions = await db
    .select({
      userId: typingSessions.userId,
      wpm: typingSessions.wpm,
      completedAt: typingSessions.completedAt,
    })
    .from(typingSessions)
    .where(inArray(typingSessions.userId, memberUserIds))
    .orderBy(asc(typingSessions.completedAt));

  // Group sessions by userId, then by date
  const userDateMap = new Map<
    number,
    Map<string, { totalWpm: number; count: number }>
  >();

  for (const session of sessions) {
    const sessionDate = new Date(session.completedAt);
    if (sessionDate < startDate) continue;

    const dateKey = sessionDate.toISOString().split('T')[0];

    if (!userDateMap.has(session.userId)) {
      userDateMap.set(session.userId, new Map());
    }

    const dateMap = userDateMap.get(session.userId)!;
    const existing = dateMap.get(dateKey);
    if (existing) {
      existing.totalWpm += session.wpm;
      existing.count++;
    } else {
      dateMap.set(dateKey, { totalWpm: session.wpm, count: 1 });
    }
  }

  // Build result for each member
  return members
    .map((member) => {
      const dateMap = userDateMap.get(member.userId);
      const data: TeamMemberWpmTrendDataPoint[] = dateMap
        ? Array.from(dateMap.entries())
            .map(([date, d]) => ({
              date,
              avgWpm: Math.round(d.totalWpm / d.count),
              sessions: d.count,
            }))
            .sort((a, b) => a.date.localeCompare(b.date))
        : [];

      return {
        userId: member.userId,
        userName: member.userName,
        userEmail: member.userEmail,
        data,
      };
    })
    .filter((m) => m.data.length > 0);
}

// ---- Team Practice Challenges ----

export interface TeamChallengeWithDetails {
  id: number;
  teamId: number;
  challengeId: number;
  status: string;
  expiresAt: Date | null;
  createdAt: Date;
  creatorName: string | null;
  creatorEmail: string;
  challengeContent: string;
  challengeDifficulty: string;
  challengeSyntaxType: string;
  challengeHint: string | null;
  categoryName: string;
  categorySlug: string;
  participantCount: number;
}

export interface TeamChallengeResult {
  userId: number;
  userName: string | null;
  userEmail: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  errors: number;
  durationMs: number;
  completedAt: Date;
}

export async function getTeamChallenges(): Promise<TeamChallengeWithDetails[]> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (!membership) {
    return [];
  }

  const rows = await db
    .select({
      id: teamChallenges.id,
      teamId: teamChallenges.teamId,
      challengeId: teamChallenges.challengeId,
      status: teamChallenges.status,
      expiresAt: teamChallenges.expiresAt,
      createdAt: teamChallenges.createdAt,
      creatorName: users.name,
      creatorEmail: users.email,
      challengeContent: challenges.content,
      challengeDifficulty: challenges.difficulty,
      challengeSyntaxType: challenges.syntaxType,
      challengeHint: challenges.hint,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(teamChallenges)
    .innerJoin(users, eq(teamChallenges.createdBy, users.id))
    .innerJoin(challenges, eq(teamChallenges.challengeId, challenges.id))
    .innerJoin(categories, eq(challenges.categoryId, categories.id))
    .where(eq(teamChallenges.teamId, membership.teamId))
    .orderBy(desc(teamChallenges.createdAt));

  // Get participant counts for each team challenge
  const teamChallengeIds = rows.map((r) => r.challengeId);
  const memberUserIds = (
    await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, membership.teamId))
  ).map((m) => m.userId);

  const participantCounts = teamChallengeIds.length > 0 && memberUserIds.length > 0
    ? await db
        .select({
          challengeId: typingSessions.challengeId,
          count: sql<number>`count(distinct ${typingSessions.userId})::int`,
        })
        .from(typingSessions)
        .where(
          and(
            inArray(typingSessions.challengeId, teamChallengeIds),
            inArray(typingSessions.userId, memberUserIds)
          )
        )
        .groupBy(typingSessions.challengeId)
    : [];

  const countMap = new Map(participantCounts.map((p) => [p.challengeId, p.count]));

  return rows.map((row) => ({
    ...row,
    participantCount: countMap.get(row.challengeId) ?? 0,
  }));
}

export async function getTeamChallengeById(
  teamChallengeId: number
): Promise<TeamChallengeWithDetails | null> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (!membership) {
    return null;
  }

  const [row] = await db
    .select({
      id: teamChallenges.id,
      teamId: teamChallenges.teamId,
      challengeId: teamChallenges.challengeId,
      status: teamChallenges.status,
      expiresAt: teamChallenges.expiresAt,
      createdAt: teamChallenges.createdAt,
      creatorName: users.name,
      creatorEmail: users.email,
      challengeContent: challenges.content,
      challengeDifficulty: challenges.difficulty,
      challengeSyntaxType: challenges.syntaxType,
      challengeHint: challenges.hint,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(teamChallenges)
    .innerJoin(users, eq(teamChallenges.createdBy, users.id))
    .innerJoin(challenges, eq(teamChallenges.challengeId, challenges.id))
    .innerJoin(categories, eq(challenges.categoryId, categories.id))
    .where(
      and(
        eq(teamChallenges.id, teamChallengeId),
        eq(teamChallenges.teamId, membership.teamId)
      )
    );

  if (!row) return null;

  // Get participant count
  const memberUserIds = (
    await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, membership.teamId))
  ).map((m) => m.userId);

  const [participantResult] = await db
    .select({
      count: sql<number>`count(distinct ${typingSessions.userId})::int`,
    })
    .from(typingSessions)
    .where(
      and(
        eq(typingSessions.challengeId, row.challengeId),
        inArray(typingSessions.userId, memberUserIds)
      )
    );

  return {
    ...row,
    participantCount: participantResult?.count ?? 0,
  };
}

export async function getTeamChallengeResults(
  teamChallengeId: number
): Promise<TeamChallengeResult[]> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (!membership) {
    return [];
  }

  // Verify team challenge belongs to this team
  const [tc] = await db
    .select({
      challengeId: teamChallenges.challengeId,
    })
    .from(teamChallenges)
    .where(
      and(
        eq(teamChallenges.id, teamChallengeId),
        eq(teamChallenges.teamId, membership.teamId)
      )
    );

  if (!tc) return [];

  // Get team member IDs
  const memberUserIds = (
    await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, membership.teamId))
  ).map((m) => m.userId);

  if (memberUserIds.length === 0) return [];

  // Get each member's best session for this challenge (highest WPM)
  const sessions = await db
    .select({
      userId: typingSessions.userId,
      userName: users.name,
      userEmail: users.email,
      wpm: typingSessions.wpm,
      rawWpm: typingSessions.rawWpm,
      accuracy: typingSessions.accuracy,
      errors: typingSessions.errors,
      durationMs: typingSessions.durationMs,
      completedAt: typingSessions.completedAt,
    })
    .from(typingSessions)
    .innerJoin(users, eq(typingSessions.userId, users.id))
    .where(
      and(
        eq(typingSessions.challengeId, tc.challengeId),
        inArray(typingSessions.userId, memberUserIds)
      )
    )
    .orderBy(desc(typingSessions.wpm));

  // Keep only the best session per user
  const bestByUser = new Map<number, TeamChallengeResult>();
  for (const session of sessions) {
    if (!bestByUser.has(session.userId)) {
      bestByUser.set(session.userId, session);
    }
  }

  // Return sorted by WPM descending
  return Array.from(bestByUser.values()).sort((a, b) => b.wpm - a.wpm);
}

export async function createTeamChallenge(
  challengeId: number,
  expiresAt?: Date
) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (!membership) {
    throw new Error('User is not a member of any team');
  }

  const [created] = await db
    .insert(teamChallenges)
    .values({
      teamId: membership.teamId,
      challengeId,
      createdBy: user.id,
      expiresAt: expiresAt ?? null,
    })
    .returning();

  return created;
}

// ---- Team Custom Challenges (visible only to team members) ----

export interface TeamCustomChallengeWithCreator {
  id: number;
  teamId: number;
  createdBy: number;
  name: string;
  content: string;
  difficulty: string;
  syntaxType: string;
  hint: string | null;
  createdAt: Date;
  updatedAt: Date;
  creatorName: string | null;
  creatorEmail: string;
}

export async function getTeamCustomChallenges(): Promise<TeamCustomChallengeWithCreator[]> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (!membership) {
    return [];
  }

  const rows = await db
    .select({
      id: teamCustomChallenges.id,
      teamId: teamCustomChallenges.teamId,
      createdBy: teamCustomChallenges.createdBy,
      name: teamCustomChallenges.name,
      content: teamCustomChallenges.content,
      difficulty: teamCustomChallenges.difficulty,
      syntaxType: teamCustomChallenges.syntaxType,
      hint: teamCustomChallenges.hint,
      createdAt: teamCustomChallenges.createdAt,
      updatedAt: teamCustomChallenges.updatedAt,
      creatorName: users.name,
      creatorEmail: users.email,
    })
    .from(teamCustomChallenges)
    .innerJoin(users, eq(teamCustomChallenges.createdBy, users.id))
    .where(eq(teamCustomChallenges.teamId, membership.teamId))
    .orderBy(desc(teamCustomChallenges.createdAt));

  return rows;
}

export async function getTeamCustomChallengeById(
  id: number
): Promise<TeamCustomChallengeWithCreator | null> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (!membership) {
    return null;
  }

  const [row] = await db
    .select({
      id: teamCustomChallenges.id,
      teamId: teamCustomChallenges.teamId,
      createdBy: teamCustomChallenges.createdBy,
      name: teamCustomChallenges.name,
      content: teamCustomChallenges.content,
      difficulty: teamCustomChallenges.difficulty,
      syntaxType: teamCustomChallenges.syntaxType,
      hint: teamCustomChallenges.hint,
      createdAt: teamCustomChallenges.createdAt,
      updatedAt: teamCustomChallenges.updatedAt,
      creatorName: users.name,
      creatorEmail: users.email,
    })
    .from(teamCustomChallenges)
    .innerJoin(users, eq(teamCustomChallenges.createdBy, users.id))
    .where(
      and(
        eq(teamCustomChallenges.id, id),
        eq(teamCustomChallenges.teamId, membership.teamId)
      )
    );

  return row ?? null;
}

export async function createTeamCustomChallenge(data: {
  name: string;
  content: string;
  difficulty?: string;
  syntaxType?: string;
  hint?: string;
}) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (!membership) {
    throw new Error('User is not a member of any team');
  }

  const [created] = await db
    .insert(teamCustomChallenges)
    .values({
      teamId: membership.teamId,
      createdBy: user.id,
      name: data.name,
      content: data.content,
      difficulty: data.difficulty ?? 'beginner',
      syntaxType: data.syntaxType ?? 'plain',
      hint: data.hint ?? null,
    })
    .returning();

  return created;
}

export async function updateTeamCustomChallenge(
  id: number,
  data: {
    name?: string;
    content?: string;
    difficulty?: string;
    syntaxType?: string;
    hint?: string | null;
  }
) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (!membership) {
    throw new Error('User is not a member of any team');
  }

  // Only the creator can update
  const [existing] = await db
    .select()
    .from(teamCustomChallenges)
    .where(
      and(
        eq(teamCustomChallenges.id, id),
        eq(teamCustomChallenges.teamId, membership.teamId),
        eq(teamCustomChallenges.createdBy, user.id)
      )
    );

  if (!existing) {
    throw new Error('Team custom challenge not found or not authorized');
  }

  const [updated] = await db
    .update(teamCustomChallenges)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(teamCustomChallenges.id, id))
    .returning();

  return updated;
}

export async function deleteTeamCustomChallenge(id: number) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (!membership) {
    throw new Error('User is not a member of any team');
  }

  // Only the creator or team owner can delete
  const [existing] = await db
    .select()
    .from(teamCustomChallenges)
    .where(
      and(
        eq(teamCustomChallenges.id, id),
        eq(teamCustomChallenges.teamId, membership.teamId)
      )
    );

  if (!existing) {
    throw new Error('Team custom challenge not found');
  }

  if (existing.createdBy !== user.id && membership.role !== 'owner') {
    throw new Error('Not authorized to delete this challenge');
  }

  await db
    .delete(teamCustomChallenges)
    .where(eq(teamCustomChallenges.id, id));
}

export async function getTeamInvitations() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (!membership) {
    return [];
  }

  const result = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      status: invitations.status,
      invitedAt: invitations.invitedAt,
      invitedByName: users.name,
      invitedByEmail: users.email,
    })
    .from(invitations)
    .leftJoin(users, eq(invitations.invitedBy, users.id))
    .where(eq(invitations.teamId, membership.teamId))
    .orderBy(desc(invitations.invitedAt));

  return result;
}

// ---- Team Activity Feed ----

export type TeamActivityFeedItemType = 'practice' | 'action';

export interface TeamActivityFeedItem {
  type: TeamActivityFeedItemType;
  userId: number;
  userName: string | null;
  userEmail: string;
  timestamp: Date;
  // Practice session fields (type === 'practice')
  wpm?: number;
  accuracy?: number;
  categoryName?: string;
  durationMs?: number;
  // Action fields (type === 'action')
  action?: string;
}

export async function getTeamActivityFeed(
  limit: number = 30
): Promise<TeamActivityFeedItem[]> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (!membership) {
    return [];
  }

  const memberUserIds = (
    await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, membership.teamId))
  ).map((m) => m.userId);

  if (memberUserIds.length === 0) {
    return [];
  }

  // Fetch recent practice sessions
  const practiceSessions = await db
    .select({
      userId: typingSessions.userId,
      userName: users.name,
      userEmail: users.email,
      wpm: typingSessions.wpm,
      accuracy: typingSessions.accuracy,
      categoryName: categories.name,
      durationMs: typingSessions.durationMs,
      completedAt: typingSessions.completedAt,
    })
    .from(typingSessions)
    .innerJoin(users, eq(typingSessions.userId, users.id))
    .innerJoin(challenges, eq(typingSessions.challengeId, challenges.id))
    .innerJoin(categories, eq(challenges.categoryId, categories.id))
    .where(inArray(typingSessions.userId, memberUserIds))
    .orderBy(desc(typingSessions.completedAt))
    .limit(limit);

  // Fetch recent team actions (admin activity)
  const teamActions = await db
    .select({
      userId: activityLogs.userId,
      userName: users.name,
      userEmail: users.email,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.teamId, membership.teamId))
    .orderBy(desc(activityLogs.timestamp))
    .limit(limit);

  // Merge and sort by timestamp descending
  const feed: TeamActivityFeedItem[] = [];

  for (const session of practiceSessions) {
    feed.push({
      type: 'practice',
      userId: session.userId,
      userName: session.userName,
      userEmail: session.userEmail,
      timestamp: session.completedAt,
      wpm: session.wpm,
      accuracy: session.accuracy,
      categoryName: session.categoryName,
      durationMs: session.durationMs,
    });
  }

  for (const action of teamActions) {
    if (action.userId === null) continue;
    feed.push({
      type: 'action',
      userId: action.userId,
      userName: action.userName,
      userEmail: action.userEmail ?? '',
      timestamp: action.timestamp,
      action: action.action,
    });
  }

  feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return feed.slice(0, limit);
}

export interface TeamAchievementWithStatus {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt: Date | null;
}

export async function getTeamAchievements(): Promise<TeamAchievementWithStatus[]> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (!membership) {
    return [];
  }

  const allAchievements = await db.select().from(teamAchievementsTable);

  const earned = await db
    .select({
      achievementId: earnedTeamAchievementsTable.achievementId,
      earnedAt: earnedTeamAchievementsTable.earnedAt,
    })
    .from(earnedTeamAchievementsTable)
    .where(eq(earnedTeamAchievementsTable.teamId, membership.teamId));

  const earnedMap = new Map(earned.map((e) => [e.achievementId, e.earnedAt]));

  return allAchievements.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    description: a.description,
    icon: a.icon,
    earned: earnedMap.has(a.id),
    earnedAt: earnedMap.get(a.id) ?? null,
  }));
}

// ---- Team Onboarding Courses ----

export interface OnboardingCourseWithDetails {
  id: number;
  teamId: number;
  createdBy: number;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  creatorName: string | null;
  creatorEmail: string;
  stepCount: number;
}

export interface OnboardingCourseStepWithChallenge {
  id: number;
  courseId: number;
  challengeId: number;
  stepOrder: number;
  createdAt: Date;
  challengeContent: string;
  challengeDifficulty: string;
  challengeSyntaxType: string;
  challengeHint: string | null;
  categoryName: string;
  categorySlug: string;
}

export interface OnboardingCourseDetail extends OnboardingCourseWithDetails {
  steps: OnboardingCourseStepWithChallenge[];
}

export interface OnboardingCourseProgressEntry {
  stepId: number;
  userId: number;
  userName: string | null;
  userEmail: string;
  sessionId: number | null;
  wpm: number | null;
  accuracy: number | null;
  completedAt: Date;
}

export async function getTeamOnboardingCourses(): Promise<OnboardingCourseWithDetails[]> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (!membership) {
    return [];
  }

  const rows = await db
    .select({
      id: teamOnboardingCourses.id,
      teamId: teamOnboardingCourses.teamId,
      createdBy: teamOnboardingCourses.createdBy,
      name: teamOnboardingCourses.name,
      description: teamOnboardingCourses.description,
      status: teamOnboardingCourses.status,
      createdAt: teamOnboardingCourses.createdAt,
      updatedAt: teamOnboardingCourses.updatedAt,
      creatorName: users.name,
      creatorEmail: users.email,
      stepCount: sql<number>`(
        SELECT count(*)::int FROM team_onboarding_course_steps
        WHERE team_onboarding_course_steps.course_id = ${teamOnboardingCourses.id}
      )`,
    })
    .from(teamOnboardingCourses)
    .innerJoin(users, eq(teamOnboardingCourses.createdBy, users.id))
    .where(eq(teamOnboardingCourses.teamId, membership.teamId))
    .orderBy(desc(teamOnboardingCourses.createdAt));

  return rows;
}

export async function getTeamOnboardingCourseById(
  courseId: number
): Promise<OnboardingCourseDetail | null> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (!membership) {
    return null;
  }

  const [courseRow] = await db
    .select({
      id: teamOnboardingCourses.id,
      teamId: teamOnboardingCourses.teamId,
      createdBy: teamOnboardingCourses.createdBy,
      name: teamOnboardingCourses.name,
      description: teamOnboardingCourses.description,
      status: teamOnboardingCourses.status,
      createdAt: teamOnboardingCourses.createdAt,
      updatedAt: teamOnboardingCourses.updatedAt,
      creatorName: users.name,
      creatorEmail: users.email,
    })
    .from(teamOnboardingCourses)
    .innerJoin(users, eq(teamOnboardingCourses.createdBy, users.id))
    .where(
      and(
        eq(teamOnboardingCourses.id, courseId),
        eq(teamOnboardingCourses.teamId, membership.teamId)
      )
    );

  if (!courseRow) return null;

  const steps = await db
    .select({
      id: teamOnboardingCourseSteps.id,
      courseId: teamOnboardingCourseSteps.courseId,
      challengeId: teamOnboardingCourseSteps.challengeId,
      stepOrder: teamOnboardingCourseSteps.stepOrder,
      createdAt: teamOnboardingCourseSteps.createdAt,
      challengeContent: challenges.content,
      challengeDifficulty: challenges.difficulty,
      challengeSyntaxType: challenges.syntaxType,
      challengeHint: challenges.hint,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(teamOnboardingCourseSteps)
    .innerJoin(challenges, eq(teamOnboardingCourseSteps.challengeId, challenges.id))
    .innerJoin(categories, eq(challenges.categoryId, categories.id))
    .where(eq(teamOnboardingCourseSteps.courseId, courseId))
    .orderBy(asc(teamOnboardingCourseSteps.stepOrder));

  return {
    ...courseRow,
    stepCount: steps.length,
    steps,
  };
}

export async function createTeamOnboardingCourse(data: {
  name: string;
  description?: string;
  challengeIds: number[];
}) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (!membership) {
    throw new Error('User is not a member of any team');
  }

  // Only owner/admin can create courses
  if (membership.role !== 'owner' && membership.role !== 'admin') {
    throw new Error('Only team admins can create onboarding courses');
  }

  const [course] = await db
    .insert(teamOnboardingCourses)
    .values({
      teamId: membership.teamId,
      createdBy: user.id,
      name: data.name,
      description: data.description ?? null,
    })
    .returning();

  if (data.challengeIds.length > 0) {
    await db.insert(teamOnboardingCourseSteps).values(
      data.challengeIds.map((challengeId, index) => ({
        courseId: course.id,
        challengeId,
        stepOrder: index + 1,
      }))
    );
  }

  return course;
}

export async function updateTeamOnboardingCourse(
  courseId: number,
  data: {
    name?: string;
    description?: string | null;
    status?: string;
  }
) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (!membership) {
    throw new Error('User is not a member of any team');
  }

  if (membership.role !== 'owner' && membership.role !== 'admin') {
    throw new Error('Only team admins can update onboarding courses');
  }

  const [existing] = await db
    .select()
    .from(teamOnboardingCourses)
    .where(
      and(
        eq(teamOnboardingCourses.id, courseId),
        eq(teamOnboardingCourses.teamId, membership.teamId)
      )
    );

  if (!existing) {
    throw new Error('Onboarding course not found');
  }

  const [updated] = await db
    .update(teamOnboardingCourses)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(teamOnboardingCourses.id, courseId))
    .returning();

  return updated;
}

export async function deleteTeamOnboardingCourse(courseId: number) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (!membership) {
    throw new Error('User is not a member of any team');
  }

  if (membership.role !== 'owner' && membership.role !== 'admin') {
    throw new Error('Only team admins can delete onboarding courses');
  }

  const [existing] = await db
    .select()
    .from(teamOnboardingCourses)
    .where(
      and(
        eq(teamOnboardingCourses.id, courseId),
        eq(teamOnboardingCourses.teamId, membership.teamId)
      )
    );

  if (!existing) {
    throw new Error('Onboarding course not found');
  }

  await db
    .delete(teamOnboardingCourses)
    .where(eq(teamOnboardingCourses.id, courseId));
}

export async function getOnboardingCourseProgress(
  courseId: number
): Promise<OnboardingCourseProgressEntry[]> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (!membership) {
    return [];
  }

  // Verify course belongs to team
  const [course] = await db
    .select({ id: teamOnboardingCourses.id })
    .from(teamOnboardingCourses)
    .where(
      and(
        eq(teamOnboardingCourses.id, courseId),
        eq(teamOnboardingCourses.teamId, membership.teamId)
      )
    );

  if (!course) return [];

  const rows = await db
    .select({
      stepId: teamOnboardingCourseProgress.stepId,
      userId: teamOnboardingCourseProgress.userId,
      userName: users.name,
      userEmail: users.email,
      sessionId: teamOnboardingCourseProgress.sessionId,
      wpm: typingSessions.wpm,
      accuracy: typingSessions.accuracy,
      completedAt: teamOnboardingCourseProgress.completedAt,
    })
    .from(teamOnboardingCourseProgress)
    .innerJoin(users, eq(teamOnboardingCourseProgress.userId, users.id))
    .leftJoin(typingSessions, eq(teamOnboardingCourseProgress.sessionId, typingSessions.id))
    .where(eq(teamOnboardingCourseProgress.courseId, courseId))
    .orderBy(asc(teamOnboardingCourseProgress.stepId), desc(teamOnboardingCourseProgress.completedAt));

  return rows;
}

export async function markOnboardingStepComplete(data: {
  courseId: number;
  stepId: number;
  sessionId?: number;
}) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (!membership) {
    throw new Error('User is not a member of any team');
  }

  // Verify step belongs to a course in this team
  const [step] = await db
    .select({
      id: teamOnboardingCourseSteps.id,
      courseId: teamOnboardingCourseSteps.courseId,
    })
    .from(teamOnboardingCourseSteps)
    .innerJoin(
      teamOnboardingCourses,
      eq(teamOnboardingCourseSteps.courseId, teamOnboardingCourses.id)
    )
    .where(
      and(
        eq(teamOnboardingCourseSteps.id, data.stepId),
        eq(teamOnboardingCourseSteps.courseId, data.courseId),
        eq(teamOnboardingCourses.teamId, membership.teamId)
      )
    );

  if (!step) {
    throw new Error('Course step not found');
  }

  const [progress] = await db
    .insert(teamOnboardingCourseProgress)
    .values({
      courseId: data.courseId,
      userId: user.id,
      stepId: data.stepId,
      sessionId: data.sessionId ?? null,
    })
    .onConflictDoUpdate({
      target: [teamOnboardingCourseProgress.userId, teamOnboardingCourseProgress.stepId],
      set: {
        sessionId: data.sessionId ?? null,
        completedAt: new Date(),
      },
    })
    .returning();

  return progress;
}

// ---- Admin: Team Member Management ----

export async function removeTeamMember(targetUserId: number) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const actorMembership = await requireTeamAdmin(user.id);

  const targetMembership = await db.query.teamMembers.findFirst({
    where: and(
      eq(teamMembers.userId, targetUserId),
      eq(teamMembers.teamId, actorMembership.teamId)
    ),
  });

  if (!targetMembership) {
    throw new Error('Target user is not a member of this team');
  }

  const allowed = await canRemoveMember(
    actorMembership.role,
    targetMembership.role,
    user.id,
    targetUserId
  );

  if (!allowed) {
    throw new Error('Not authorized to remove this team member');
  }

  await db
    .delete(teamMembers)
    .where(eq(teamMembers.id, targetMembership.id));

  await db.insert(activityLogs).values({
    teamId: actorMembership.teamId,
    userId: user.id,
    action: 'REMOVE_TEAM_MEMBER',
  });

  return { success: true };
}

export async function updateTeamMemberRole(targetUserId: number, newRole: TeamRole) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const actorMembership = await requireTeamOwner(user.id);

  const targetMembership = await db.query.teamMembers.findFirst({
    where: and(
      eq(teamMembers.userId, targetUserId),
      eq(teamMembers.teamId, actorMembership.teamId)
    ),
  });

  if (!targetMembership) {
    throw new Error('Target user is not a member of this team');
  }

  const allowed = await canUpdateMemberRole(
    actorMembership.role,
    targetMembership.role,
    newRole,
    user.id,
    targetUserId
  );

  if (!allowed) {
    throw new Error('Not authorized to change this member\'s role');
  }

  const [updated] = await db
    .update(teamMembers)
    .set({ role: newRole })
    .where(eq(teamMembers.id, targetMembership.id))
    .returning();

  await db.insert(activityLogs).values({
    teamId: actorMembership.teamId,
    userId: user.id,
    action: 'UPDATE_MEMBER_ROLE',
  });

  return updated;
}

export async function getTeamMembersWithStats() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await requireTeamAdmin(user.id);

  const members = await db
    .select({
      id: teamMembers.id,
      userId: teamMembers.userId,
      role: teamMembers.role,
      joinedAt: teamMembers.joinedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, membership.teamId))
    .orderBy(asc(teamMembers.joinedAt));

  const memberUserIds = members.map((m) => m.userId);
  if (memberUserIds.length === 0) return [];

  const statsRows = await db
    .select({
      userId: typingSessions.userId,
      totalSessions: sql<number>`count(*)::int`,
      avgWpm: sql<number>`coalesce(avg(${typingSessions.wpm}), 0)::int`,
      avgAccuracy: sql<number>`coalesce(avg(${typingSessions.accuracy}), 0)::int`,
      totalPracticeMs: sql<number>`coalesce(sum(${typingSessions.durationMs}), 0)::int`,
    })
    .from(typingSessions)
    .where(inArray(typingSessions.userId, memberUserIds))
    .groupBy(typingSessions.userId);

  const statsMap = new Map(statsRows.map((s) => [s.userId, s]));

  return members.map((m) => ({
    ...m,
    stats: statsMap.get(m.userId) ?? {
      userId: m.userId,
      totalSessions: 0,
      avgWpm: 0,
      avgAccuracy: 0,
      totalPracticeMs: 0,
    },
  }));
}

export async function createTeamInvitation(data: {
  email: string;
  role: TeamRole;
}) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await requireTeamAdmin(user.id);

  // Check if invitation already exists
  const existing = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.teamId, membership.teamId),
        eq(invitations.email, data.email),
        eq(invitations.status, 'pending')
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error('A pending invitation already exists for this email');
  }

  // Check if user is already a team member
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (existingUser.length > 0) {
    const existingMember = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.userId, existingUser[0].id),
        eq(teamMembers.teamId, membership.teamId)
      ),
    });

    if (existingMember) {
      throw new Error('User is already a member of this team');
    }
  }

  const [invitation] = await db
    .insert(invitations)
    .values({
      teamId: membership.teamId,
      email: data.email,
      role: data.role,
      invitedBy: user.id,
    })
    .returning();

  await db.insert(activityLogs).values({
    teamId: membership.teamId,
    userId: user.id,
    action: 'INVITE_TEAM_MEMBER',
  });

  return invitation;
}

export async function cancelTeamInvitation(invitationId: number) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const membership = await requireTeamAdmin(user.id);

  const [existing] = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.id, invitationId),
        eq(invitations.teamId, membership.teamId),
        eq(invitations.status, 'pending')
      )
    );

  if (!existing) {
    throw new Error('Invitation not found');
  }

  const [updated] = await db
    .update(invitations)
    .set({ status: 'cancelled' })
    .where(eq(invitations.id, invitationId))
    .returning();

  return updated;
}

// ---- Public Profile ----

export async function getUserByUsername(username: string) {
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.username, username), isNull(users.deletedAt)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export interface PublicProfileStats {
  totalSessions: number;
  avgWpm: number;
  avgAccuracy: number;
  bestWpm: number;
  bestAccuracy: number;
  totalPracticeTimeMs: number;
  currentStreak: number;
  longestStreak: number;
}

export async function getPublicProfileStats(userId: number): Promise<PublicProfileStats> {
  const sessions = await db
    .select({
      wpm: typingSessions.wpm,
      accuracy: typingSessions.accuracy,
      keystrokes: typingSessions.keystrokes,
    })
    .from(typingSessions)
    .where(eq(typingSessions.userId, userId));

  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });

  const totalSessions = sessions.length;
  if (totalSessions === 0) {
    return {
      totalSessions: 0,
      avgWpm: 0,
      avgAccuracy: 0,
      bestWpm: 0,
      bestAccuracy: 0,
      totalPracticeTimeMs: profile?.totalPracticeTimeMs ?? 0,
      currentStreak: profile?.currentStreak ?? 0,
      longestStreak: profile?.longestStreak ?? 0,
    };
  }

  const avgWpm = Math.round(
    sessions.reduce((sum, s) => sum + s.wpm, 0) / totalSessions
  );
  const avgAccuracy = Math.round(
    sessions.reduce((sum, s) => sum + s.accuracy, 0) / totalSessions
  );
  const bestWpm = Math.max(...sessions.map((s) => s.wpm));
  const bestAccuracy = Math.max(...sessions.map((s) => s.accuracy));

  return {
    totalSessions,
    avgWpm,
    avgAccuracy,
    bestWpm,
    bestAccuracy,
    totalPracticeTimeMs: profile?.totalPracticeTimeMs ?? 0,
    currentStreak: profile?.currentStreak ?? 0,
    longestStreak: profile?.longestStreak ?? 0,
  };
}

export async function getPublicCategoryPerformance(userId: number) {
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
    .where(eq(typingSessions.userId, userId));

  const categoryMap = new Map<
    number,
    { categoryName: string; sessions: number; totalWpm: number; totalAccuracy: number }
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
    .sort((a, b) => b.sessions - a.sessions);
}

export async function getPublicRecentSessions(userId: number, limit = 10) {
  return await db
    .select({
      wpm: typingSessions.wpm,
      accuracy: typingSessions.accuracy,
      durationMs: typingSessions.durationMs,
      completedAt: typingSessions.completedAt,
      categoryName: categories.name,
    })
    .from(typingSessions)
    .innerJoin(challenges, eq(typingSessions.challengeId, challenges.id))
    .innerJoin(categories, eq(challenges.categoryId, categories.id))
    .where(eq(typingSessions.userId, userId))
    .orderBy(desc(typingSessions.completedAt))
    .limit(limit);
}

export async function getPublicUserAchievements(userId: number) {
  return await db
    .select({
      name: achievements.name,
      icon: achievements.icon,
      earnedAt: userAchievements.earnedAt,
    })
    .from(userAchievements)
    .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
    .where(eq(userAchievements.userId, userId))
    .orderBy(desc(userAchievements.earnedAt));
}

export async function isUsernameTaken(username: string, excludeUserId?: number) {
  const conditions = [eq(users.username, username), isNull(users.deletedAt)];
  if (excludeUserId !== undefined) {
    conditions.push(ne(users.id, excludeUserId));
  }
  const result = await db
    .select({ id: users.id })
    .from(users)
    .where(and(...conditions))
    .limit(1);

  return result.length > 0;
}

export interface ReferralEntry {
  id: number;
  referredName: string | null;
  referredEmail: string;
  status: string;
  rewardGiven: boolean;
  createdAt: Date;
}

export interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  rewardsEarned: number;
}

export async function getReferralStats(userId: number): Promise<ReferralStats> {
  const rows = await db
    .select({
      status: referrals.status,
      rewardGiven: referrals.rewardGiven,
    })
    .from(referrals)
    .where(eq(referrals.referrerId, userId));

  const totalReferrals = rows.length;
  const pendingReferrals = rows.filter((r) => r.status === 'pending').length;
  const completedReferrals = rows.filter((r) => r.status === 'completed').length;
  const rewardsEarned = rows.filter((r) => r.rewardGiven).length;

  return { totalReferrals, pendingReferrals, completedReferrals, rewardsEarned };
}

export async function getReferrals(userId: number): Promise<ReferralEntry[]> {
  const rows = await db
    .select({
      id: referrals.id,
      referredName: users.name,
      referredEmail: users.email,
      status: referrals.status,
      rewardGiven: referrals.rewardGiven,
      createdAt: referrals.createdAt,
    })
    .from(referrals)
    .innerJoin(users, eq(referrals.referredId, users.id))
    .where(eq(referrals.referrerId, userId))
    .orderBy(desc(referrals.createdAt));

  return rows;
}

export interface ReferralLeaderboardEntry {
  rank: number;
  userId: number;
  userName: string | null;
  username: string | null;
  completedReferrals: number;
}

export async function getReferralLeaderboard(
  limit = 10
): Promise<ReferralLeaderboardEntry[]> {
  const rows = await db
    .select({
      userId: users.id,
      userName: users.name,
      username: users.username,
      completedReferrals: sql<number>`count(*)::int`,
    })
    .from(referrals)
    .innerJoin(users, eq(referrals.referrerId, users.id))
    .where(eq(referrals.status, 'completed'))
    .groupBy(users.id, users.name, users.username)
    .orderBy(sql`count(*) desc`)
    .limit(limit);

  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

export async function getRaceHistory(limit = 50) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get all races the user participated in
  const participations = await db.query.raceParticipants.findMany({
    where: eq(raceParticipants.userId, user.id),
    orderBy: [desc(raceParticipants.createdAt)],
    limit,
    with: {
      race: {
        with: {
          category: true,
          participants: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                  username: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return participations;
}

// Weakness Analysis

export async function getUserWeaknessReport() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const [keyData, errorPatterns, problemSeqs] = await Promise.all([
    getKeyAccuracyForUser(user.id),
    getCharErrorPatternsForUser(user.id),
    getProblemSequences(user.id, 10),
  ]);

  const { analyzeWeaknesses } = await import('@/lib/weakness/analyze');
  return analyzeWeaknesses(keyData, errorPatterns, problemSeqs);
}

/**
 * Get recent typing sessions for a specific category, ordered newest first.
 * Used by the adaptive difficulty system to assess performance.
 */
export async function getRecentSessionsForCategory(
  categoryId: number,
  limit = 5
) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      wpm: typingSessions.wpm,
      accuracy: typingSessions.accuracy,
      difficulty: challenges.difficulty,
      completedAt: typingSessions.completedAt,
    })
    .from(typingSessions)
    .innerJoin(challenges, eq(typingSessions.challengeId, challenges.id))
    .where(
      and(
        eq(typingSessions.userId, user.id),
        eq(challenges.categoryId, categoryId)
      )
    )
    .orderBy(desc(typingSessions.completedAt))
    .limit(limit);
}

/**
 * Get a random challenge in a category at a specific difficulty level.
 * Used by adaptive difficulty to pick the next challenge.
 */
export async function getChallengeByDifficulty(
  categoryId: number,
  difficulty: string
) {
  const results = await db
    .select()
    .from(challenges)
    .where(
      and(
        eq(challenges.categoryId, categoryId),
        eq(challenges.difficulty, difficulty)
      )
    );

  if (results.length === 0) {
    return null;
  }

  // Pick a random challenge from the available ones
  const randomIndex = Math.floor(Math.random() * results.length);
  return results[randomIndex];
}

export async function getRecentSessionsForAdaptive(limit = 10) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      wpm: typingSessions.wpm,
      accuracy: typingSessions.accuracy,
      errors: typingSessions.errors,
      keystrokes: typingSessions.keystrokes,
      durationMs: typingSessions.durationMs,
      challengeDifficulty: challenges.difficulty,
    })
    .from(typingSessions)
    .innerJoin(challenges, eq(typingSessions.challengeId, challenges.id))
    .where(eq(typingSessions.userId, user.id))
    .orderBy(desc(typingSessions.completedAt))
    .limit(limit);
}

/**
 * Get recent session challenge and category IDs for smart practice freshness check.
 */
export async function getRecentSessionChallengeIds(limit = 20) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      challengeId: typingSessions.challengeId,
      categoryId: challenges.categoryId,
    })
    .from(typingSessions)
    .innerJoin(challenges, eq(typingSessions.challengeId, challenges.id))
    .where(eq(typingSessions.userId, user.id))
    .orderBy(desc(typingSessions.completedAt))
    .limit(limit);
}

/**
 * Get all challenges with their category info for smart practice scoring.
 */
export async function getAllChallengesWithCategories() {
  return await db
    .select({
      id: challenges.id,
      content: challenges.content,
      difficulty: challenges.difficulty,
      syntaxType: challenges.syntaxType,
      hint: challenges.hint,
      categoryId: challenges.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      isPremium: categories.isPremium,
    })
    .from(challenges)
    .innerJoin(categories, eq(challenges.categoryId, categories.id));
}

/**
 * Get aggregate statistics for all completed sessions in a category.
 * Used for category completion summary.
 */
export async function getCategoryAggregateStats(categoryId: number) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get all sessions for this category
  const sessions = await db
    .select({
      wpm: typingSessions.wpm,
      accuracy: typingSessions.accuracy,
      durationMs: typingSessions.durationMs,
      errors: typingSessions.errors,
      challengeId: typingSessions.challengeId,
    })
    .from(typingSessions)
    .innerJoin(challenges, eq(typingSessions.challengeId, challenges.id))
    .where(
      and(
        eq(typingSessions.userId, user.id),
        eq(challenges.categoryId, categoryId)
      )
    )
    .orderBy(desc(typingSessions.completedAt));

  if (sessions.length === 0) {
    return null;
  }

  // Calculate aggregate stats
  const totalSessions = sessions.length;
  const uniqueChallenges = new Set(sessions.map(s => s.challengeId)).size;
  const avgWpm = Math.round(
    sessions.reduce((sum, s) => sum + s.wpm, 0) / totalSessions
  );
  const avgAccuracy = Math.round(
    sessions.reduce((sum, s) => sum + s.accuracy, 0) / totalSessions
  );
  const totalTimeMs = sessions.reduce((sum, s) => sum + s.durationMs, 0);
  const totalErrors = sessions.reduce((sum, s) => sum + s.errors, 0);
  const bestWpm = Math.max(...sessions.map(s => s.wpm));

  return {
    totalSessions,
    uniqueChallenges,
    avgWpm,
    avgAccuracy,
    totalTimeMs,
    totalErrors,
    bestWpm,
  };
}

// ---- Spaced Repetition Queries ----

/**
 * Get due review items for the current user, ordered by most overdue first.
 */
export async function getDueReviewItems(limit = 10) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const now = new Date();

  return await db
    .select({
      id: spacedRepetitionItems.id,
      challengeId: spacedRepetitionItems.challengeId,
      easeFactor: spacedRepetitionItems.easeFactor,
      interval: spacedRepetitionItems.interval,
      repetitions: spacedRepetitionItems.repetitions,
      nextReviewAt: spacedRepetitionItems.nextReviewAt,
      lastReviewedAt: spacedRepetitionItems.lastReviewedAt,
      lastQuality: spacedRepetitionItems.lastQuality,
      challengeContent: challenges.content,
      challengeDifficulty: challenges.difficulty,
      challengeSyntaxType: challenges.syntaxType,
      challengeHint: challenges.hint,
      categoryId: categories.id,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(spacedRepetitionItems)
    .innerJoin(challenges, eq(spacedRepetitionItems.challengeId, challenges.id))
    .innerJoin(categories, eq(challenges.categoryId, categories.id))
    .where(
      and(
        eq(spacedRepetitionItems.userId, user.id),
        sql`${spacedRepetitionItems.nextReviewAt} <= ${now}`
      )
    )
    .orderBy(asc(spacedRepetitionItems.nextReviewAt))
    .limit(limit);
}

/**
 * Get a spaced repetition item by user and challenge ID.
 */
export async function getSpacedRepetitionItem(userId: number, challengeId: number) {
  const rows = await db
    .select()
    .from(spacedRepetitionItems)
    .where(
      and(
        eq(spacedRepetitionItems.userId, userId),
        eq(spacedRepetitionItems.challengeId, challengeId)
      )
    )
    .limit(1);

  return rows.length > 0 ? rows[0] : null;
}

/**
 * Upsert a spaced repetition item after a review.
 */
export async function upsertSpacedRepetitionItem(
  userId: number,
  challengeId: number,
  data: {
    easeFactor: number;
    interval: number;
    repetitions: number;
    nextReviewAt: Date;
    lastQuality: number;
  }
) {
  const existing = await getSpacedRepetitionItem(userId, challengeId);
  const now = new Date();

  if (existing) {
    await db
      .update(spacedRepetitionItems)
      .set({
        easeFactor: data.easeFactor,
        interval: data.interval,
        repetitions: data.repetitions,
        nextReviewAt: data.nextReviewAt,
        lastReviewedAt: now,
        lastQuality: data.lastQuality,
        updatedAt: now,
      })
      .where(eq(spacedRepetitionItems.id, existing.id));
  } else {
    await db.insert(spacedRepetitionItems).values({
      userId,
      challengeId,
      easeFactor: data.easeFactor,
      interval: data.interval,
      repetitions: data.repetitions,
      nextReviewAt: data.nextReviewAt,
      lastReviewedAt: now,
      lastQuality: data.lastQuality,
    });
  }
}

/**
 * Get the count of due review items for a user.
 */
export async function getDueReviewCount(userId: number): Promise<number> {
  const now = new Date();
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(spacedRepetitionItems)
    .where(
      and(
        eq(spacedRepetitionItems.userId, userId),
        sql`${spacedRepetitionItems.nextReviewAt} <= ${now}`
      )
    );

  return result?.count ?? 0;
}

/**
 * Get all review items for a user (for stats display).
 */
export async function getUserReviewStats(userId: number) {
  const now = new Date();

  const [stats] = await db
    .select({
      totalItems: sql<number>`count(*)::int`,
      dueItems: sql<number>`count(*) filter (where ${spacedRepetitionItems.nextReviewAt} <= ${now})::int`,
      avgEaseFactor: sql<number>`round(avg(${spacedRepetitionItems.easeFactor})::numeric, 2)`,
      avgInterval: sql<number>`round(avg(${spacedRepetitionItems.interval})::numeric, 1)`,
    })
    .from(spacedRepetitionItems)
    .where(eq(spacedRepetitionItems.userId, userId));

  return {
    totalItems: stats?.totalItems ?? 0,
    dueItems: stats?.dueItems ?? 0,
    avgEaseFactor: stats?.avgEaseFactor ?? 2.5,
    avgInterval: stats?.avgInterval ?? 0,
  };
}

/**
 * Get the average WPM for a user (by userId, no auth check).
 * Used internally by spaced repetition to compute quality ratings.
 */
export async function getUserAvgWpm(userId: number): Promise<number> {
  const [result] = await db
    .select({ avgWpm: sql<number>`coalesce(round(avg(${typingSessions.wpm})), 0)::int` })
    .from(typingSessions)
    .where(eq(typingSessions.userId, userId));

  return result?.avgWpm ?? 0;
}

/**
 * Get upcoming review items (not yet due) for schedule display.
 */
export async function getUpcomingReviewItems(userId: number, limit = 20) {
  const now = new Date();

  return await db
    .select({
      id: spacedRepetitionItems.id,
      challengeId: spacedRepetitionItems.challengeId,
      easeFactor: spacedRepetitionItems.easeFactor,
      interval: spacedRepetitionItems.interval,
      repetitions: spacedRepetitionItems.repetitions,
      nextReviewAt: spacedRepetitionItems.nextReviewAt,
      lastReviewedAt: spacedRepetitionItems.lastReviewedAt,
      lastQuality: spacedRepetitionItems.lastQuality,
      challengeContent: challenges.content,
      challengeDifficulty: challenges.difficulty,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(spacedRepetitionItems)
    .innerJoin(challenges, eq(spacedRepetitionItems.challengeId, challenges.id))
    .innerJoin(categories, eq(challenges.categoryId, categories.id))
    .where(
      and(
        eq(spacedRepetitionItems.userId, userId),
        sql`${spacedRepetitionItems.nextReviewAt} > ${now}`
      )
    )
    .orderBy(asc(spacedRepetitionItems.nextReviewAt))
    .limit(limit);
}
