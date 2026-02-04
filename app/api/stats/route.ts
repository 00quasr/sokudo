import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getUser,
  getUserStatsOverview,
  getCategoryPerformance,
  getWpmTrend,
  getCategoryBreakdown,
} from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';

const getStatsQuerySchema = z.object({
  trendDays: z.coerce.number().int().positive().max(365).default(30),
});

export type GetStatsQuery = z.infer<typeof getStatsQuerySchema>;

export interface UserStatsResponse {
  overview: {
    totalSessions: number;
    avgWpm: number;
    avgAccuracy: number;
    totalPracticeTimeMs: number;
    totalKeystrokes: number;
    totalErrors: number;
    currentStreak: number;
    longestStreak: number;
    bestWpm: number;
    bestAccuracy: number;
  };
  categoryPerformance: Array<{
    categoryId: number;
    categoryName: string;
    categorySlug: string;
    sessions: number;
    avgWpm: number;
    avgAccuracy: number;
  }>;
  wpmTrend: Array<{
    date: string;
    avgWpm: number;
    sessions: number;
  }>;
  categoryBreakdown: {
    best: {
      byWpm: { categoryId: number; categoryName: string; avgWpm: number; sessions: number } | null;
      byAccuracy: { categoryId: number; categoryName: string; avgAccuracy: number; sessions: number } | null;
    };
    worst: {
      byWpm: { categoryId: number; categoryName: string; avgWpm: number; sessions: number } | null;
      byAccuracy: { categoryId: number; categoryName: string; avgAccuracy: number; sessions: number } | null;
    };
  };
}

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'stats' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryResult = getStatsQuerySchema.safeParse({
      trendDays: searchParams.get('trendDays') ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.errors },
        { status: 400 }
      );
    }

    const { trendDays } = queryResult.data;

    // Fetch all stats in parallel
    const [overview, categoryPerformance, wpmTrend, categoryBreakdown] = await Promise.all([
      getUserStatsOverview(),
      getCategoryPerformance(),
      getWpmTrend(trendDays),
      getCategoryBreakdown(),
    ]);

    const response: UserStatsResponse = {
      overview,
      categoryPerformance,
      wpmTrend,
      categoryBreakdown,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
