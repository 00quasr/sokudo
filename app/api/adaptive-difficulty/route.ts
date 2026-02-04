import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getUser,
  getRecentSessionsForCategory,
  getChallengeByDifficulty,
} from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  recommendDifficulty,
  getScaledConfig,
  type DifficultyLevel,
  type SessionPerformance,
} from '@/lib/adaptive-difficulty';
import { apiRateLimit } from '@/lib/rate-limit';

const querySchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  categorySlug: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'adaptive-difficulty' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      categoryId: searchParams.get('categoryId') ?? undefined,
      categorySlug: searchParams.get('categorySlug') ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.errors },
        { status: 400 }
      );
    }

    const { categoryId, categorySlug } = queryResult.data;

    if (!categoryId && !categorySlug) {
      return NextResponse.json(
        { error: 'Either categoryId or categorySlug is required' },
        { status: 400 }
      );
    }

    // Resolve category ID from slug if needed
    let resolvedCategoryId = categoryId;
    if (!resolvedCategoryId && categorySlug) {
      const category = await db.query.categories.findFirst({
        where: eq(categories.slug, categorySlug),
      });
      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }
      resolvedCategoryId = category.id;
    }

    // Get recent sessions for this category
    const recentSessions = await getRecentSessionsForCategory(
      resolvedCategoryId!,
      5
    );

    // Map to SessionPerformance format
    const performances: SessionPerformance[] = recentSessions.map((s) => ({
      wpm: s.wpm,
      accuracy: s.accuracy,
      difficulty: s.difficulty as DifficultyLevel,
    }));

    // Get current difficulty from most recent session, or default to beginner
    const currentDifficulty: DifficultyLevel =
      performances.length > 0 ? performances[0].difficulty : 'beginner';

    // Get scaled config based on current difficulty
    const config = getScaledConfig(currentDifficulty);

    // Get recommendation
    const recommendation = recommendDifficulty(performances, config);

    // Get a suggested next challenge at the recommended difficulty
    const suggestedChallenge = await getChallengeByDifficulty(
      resolvedCategoryId!,
      recommendation.recommendedDifficulty
    );

    return NextResponse.json({
      recommendation,
      suggestedChallenge: suggestedChallenge
        ? { id: suggestedChallenge.id, difficulty: suggestedChallenge.difficulty }
        : null,
      recentPerformance: {
        sessions: performances.length,
        avgWpm:
          performances.length > 0
            ? Math.round(
                performances.reduce((s, p) => s + p.wpm, 0) / performances.length
              )
            : 0,
        avgAccuracy:
          performances.length > 0
            ? Math.round(
                performances.reduce((s, p) => s + p.accuracy, 0) /
                  performances.length
              )
            : 0,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'User not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    console.error('Adaptive difficulty error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
