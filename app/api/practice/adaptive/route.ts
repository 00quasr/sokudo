import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import { getUser, getRecentSessionsForAdaptive } from '@/lib/db/queries';
import {
  computeAdaptiveDifficulty,
  filterChallengesByDifficulty,
  type DifficultyLevel,
  type SessionPerformance,
} from '@/lib/practice/adaptive-difficulty';
import { db } from '@/lib/db/drizzle';
import { challenges, categories } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

const querySchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(20).default(5),
});

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'practice:adaptive' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      categoryId: searchParams.get('categoryId') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.errors },
        { status: 400 }
      );
    }

    const { categoryId, limit } = queryResult.data;

    // Fetch recent sessions for the adaptive algorithm
    const recentSessions = await getRecentSessionsForAdaptive(10);

    const sessionPerformance: SessionPerformance[] = recentSessions.map(
      (s) => ({
        wpm: s.wpm,
        accuracy: s.accuracy,
        errors: s.errors,
        keystrokes: s.keystrokes,
        durationMs: s.durationMs,
        challengeDifficulty: s.challengeDifficulty as DifficultyLevel,
      })
    );

    // Compute adaptive difficulty recommendation
    const adaptiveResult = computeAdaptiveDifficulty(sessionPerformance);

    // Fetch challenges matching the recommended difficulty
    const conditions = categoryId
      ? and(
          eq(challenges.categoryId, categoryId),
          eq(challenges.difficulty, adaptiveResult.recommendedDifficulty)
        )
      : eq(challenges.difficulty, adaptiveResult.recommendedDifficulty);

    let matchingChallenges = await db
      .select({
        id: challenges.id,
        content: challenges.content,
        difficulty: challenges.difficulty,
        syntaxType: challenges.syntaxType,
        hint: challenges.hint,
        categoryId: challenges.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(challenges)
      .innerJoin(categories, eq(challenges.categoryId, categories.id))
      .where(conditions);

    // If no exact match, use filterChallengesByDifficulty for fallback
    if (matchingChallenges.length === 0) {
      const allConditions = categoryId
        ? eq(challenges.categoryId, categoryId)
        : undefined;

      const allChallenges = await db
        .select({
          id: challenges.id,
          content: challenges.content,
          difficulty: challenges.difficulty,
          syntaxType: challenges.syntaxType,
          hint: challenges.hint,
          categoryId: challenges.categoryId,
          categoryName: categories.name,
          categorySlug: categories.slug,
        })
        .from(challenges)
        .innerJoin(categories, eq(challenges.categoryId, categories.id))
        .where(allConditions);

      matchingChallenges = filterChallengesByDifficulty(
        allChallenges,
        adaptiveResult
      );
    }

    // Shuffle and limit
    const shuffled = matchingChallenges
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);

    return NextResponse.json({
      adaptive: {
        recommendedDifficulty: adaptiveResult.recommendedDifficulty,
        difficultyScore: adaptiveResult.difficultyScore,
        trend: adaptiveResult.trend,
        confidence: adaptiveResult.confidence,
        reasons: adaptiveResult.reasons,
      },
      challenges: shuffled,
    });
  } catch (error) {
    console.error('Error computing adaptive difficulty:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
