import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, sql, desc, asc } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  typingSessions,
  challenges,
  categories,
  userProfiles,
  dailyPractice,
} from '@/lib/db/schema';
import { authenticateApiKey } from '@/lib/auth/api-key';
import { apiRateLimit } from '@/lib/rate-limit';

const querySchema = z.object({
  trendDays: z.coerce.number().int().positive().max(365).default(30),
});

export async function GET(request: NextRequest) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'v1:stats', limit: 30, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await authenticateApiKey(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      trendDays: searchParams.get('trendDays') ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.errors },
        { status: 400 }
      );
    }

    const { trendDays } = queryResult.data;

    // Fetch overview stats
    const [overviewResult] = await db
      .select({
        totalSessions: sql<number>`count(*)::int`,
        avgWpm: sql<number>`coalesce(round(avg(${typingSessions.wpm}))::int, 0)`,
        avgAccuracy: sql<number>`coalesce(round(avg(${typingSessions.accuracy}))::int, 0)`,
        totalKeystrokes: sql<number>`coalesce(sum(${typingSessions.keystrokes})::int, 0)`,
        totalErrors: sql<number>`coalesce(sum(${typingSessions.errors})::int, 0)`,
        bestWpm: sql<number>`coalesce(max(${typingSessions.wpm})::int, 0)`,
        bestAccuracy: sql<number>`coalesce(max(${typingSessions.accuracy})::int, 0)`,
        totalPracticeTimeMs: sql<number>`coalesce(sum(${typingSessions.durationMs})::int, 0)`,
      })
      .from(typingSessions)
      .where(eq(typingSessions.userId, user.id));

    // Fetch streak info from profile
    const [profile] = await db
      .select({
        currentStreak: userProfiles.currentStreak,
        longestStreak: userProfiles.longestStreak,
      })
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1);

    const overview = {
      ...overviewResult,
      currentStreak: profile?.currentStreak ?? 0,
      longestStreak: profile?.longestStreak ?? 0,
    };

    // Fetch category performance
    const categoryPerformance = await db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        categorySlug: categories.slug,
        sessions: sql<number>`count(*)::int`,
        avgWpm: sql<number>`round(avg(${typingSessions.wpm}))::int`,
        avgAccuracy: sql<number>`round(avg(${typingSessions.accuracy}))::int`,
      })
      .from(typingSessions)
      .innerJoin(challenges, eq(typingSessions.challengeId, challenges.id))
      .innerJoin(categories, eq(challenges.categoryId, categories.id))
      .where(eq(typingSessions.userId, user.id))
      .groupBy(categories.id, categories.name, categories.slug)
      .orderBy(desc(sql`count(*)`));

    // Fetch WPM trend
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - trendDays);

    const wpmTrend = await db
      .select({
        date: sql<string>`${typingSessions.completedAt}::date::text`,
        avgWpm: sql<number>`round(avg(${typingSessions.wpm}))::int`,
        sessions: sql<number>`count(*)::int`,
      })
      .from(typingSessions)
      .where(
        sql`${typingSessions.userId} = ${user.id} AND ${typingSessions.completedAt} >= ${cutoffDate}`
      )
      .groupBy(sql`${typingSessions.completedAt}::date`)
      .orderBy(asc(sql`${typingSessions.completedAt}::date`));

    return NextResponse.json({
      overview,
      categoryPerformance,
      wpmTrend,
    });
  } catch (error) {
    console.error('Error in GET /api/v1/stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
