import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, desc, sql, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { typingSessions, users, challenges, categories } from '@/lib/db/schema';
import { authenticateApiKey } from '@/lib/auth/api-key';
import { apiRateLimit } from '@/lib/rate-limit';
import {
  getOrSetLeaderboard,
  getV1LeaderboardCacheKey,
} from '@/lib/cache/leaderboard-cache';

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  categorySlug: z.string().optional(),
  timeframe: z.enum(['all', 'week', 'month']).default('all'),
});

export async function GET(request: NextRequest) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'v1:leaderboard', limit: 30, windowMs: 60_000 });
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
      limit: searchParams.get('limit') ?? undefined,
      categorySlug: searchParams.get('categorySlug') ?? undefined,
      timeframe: searchParams.get('timeframe') ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.errors },
        { status: 400 }
      );
    }

    const { limit, categorySlug, timeframe } = queryResult.data;

    // Generate cache key
    const cacheKey = getV1LeaderboardCacheKey({
      limit,
      categorySlug,
      timeframe,
    });

    // Fetch leaderboard with caching
    const result = await getOrSetLeaderboard(
      { key: cacheKey, ttl: 300 }, // 5 minutes TTL
      async () => {
        const timeCondition =
          timeframe === 'week'
            ? sql`${typingSessions.completedAt} >= NOW() - INTERVAL '7 days'`
            : timeframe === 'month'
              ? sql`${typingSessions.completedAt} >= NOW() - INTERVAL '30 days'`
              : undefined;

        const selectFields = {
          userId: users.id,
          username: users.username,
          name: users.name,
          bestWpm: sql<number>`max(${typingSessions.wpm})::int`,
          avgWpm: sql<number>`round(avg(${typingSessions.wpm}))::int`,
          avgAccuracy: sql<number>`round(avg(${typingSessions.accuracy}))::int`,
          totalSessions: sql<number>`count(*)::int`,
        };

        let leaderboard;

        if (categorySlug) {
          const whereCondition = timeCondition
            ? and(eq(categories.slug, categorySlug), timeCondition)
            : eq(categories.slug, categorySlug);

          leaderboard = await db
            .select(selectFields)
            .from(typingSessions)
            .innerJoin(users, eq(typingSessions.userId, users.id))
            .innerJoin(challenges, eq(typingSessions.challengeId, challenges.id))
            .innerJoin(categories, eq(challenges.categoryId, categories.id))
            .where(whereCondition)
            .groupBy(users.id, users.username, users.name)
            .orderBy(desc(sql`max(${typingSessions.wpm})`))
            .limit(limit);
        } else {
          leaderboard = await db
            .select(selectFields)
            .from(typingSessions)
            .innerJoin(users, eq(typingSessions.userId, users.id))
            .where(timeCondition)
            .groupBy(users.id, users.username, users.name)
            .orderBy(desc(sql`max(${typingSessions.wpm})`))
            .limit(limit);
        }

        const ranked = leaderboard.map((entry, index) => ({
          rank: index + 1,
          ...entry,
        }));

        return {
          leaderboard: ranked,
          timeframe,
          categorySlug: categorySlug ?? null,
        };
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/v1/leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
