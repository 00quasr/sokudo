import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser, getCategoryAggregateStats } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';

const getCategoryStatsQuerySchema = z.object({
  categoryId: z.coerce.number().int().positive(),
});

export type GetCategoryStatsQuery = z.infer<typeof getCategoryStatsQuerySchema>;

export interface CategoryStatsResponse {
  totalSessions: number;
  uniqueChallenges: number;
  avgWpm: number;
  avgAccuracy: number;
  totalTimeMs: number;
  totalErrors: number;
  bestWpm: number;
}

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'category-stats' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryResult = getCategoryStatsQuerySchema.safeParse({
      categoryId: searchParams.get('categoryId'),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.errors },
        { status: 400 }
      );
    }

    const { categoryId } = queryResult.data;

    const stats = await getCategoryAggregateStats(categoryId);

    if (!stats) {
      return NextResponse.json(
        { error: 'No sessions found for this category' },
        { status: 404 }
      );
    }

    const response: CategoryStatsResponse = stats;

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching category stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
