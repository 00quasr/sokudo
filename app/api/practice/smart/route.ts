import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import {
  getUser,
  getUserProfile,
  getRecentSessionsForAdaptive,
  getRecentSessionChallengeIds,
  getAllChallengesWithCategories,
  getKeyAccuracyForUser,
  getCharErrorPatternsForUser,
  getProblemSequences,
} from '@/lib/db/queries';
import { analyzeWeaknesses } from '@/lib/weakness/analyze';
import { selectSmartChallenges } from '@/lib/practice/smart-practice';
import { canAccessPremiumCategories } from '@/lib/limits/constants';
import type { DifficultyLevel, SessionPerformance } from '@/lib/practice/adaptive-difficulty';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(5),
});

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'practice:smart' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      limit: searchParams.get('limit') ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.errors },
        { status: 400 }
      );
    }

    const { limit } = queryResult.data;

    // Fetch all data in parallel
    const [
      recentSessions,
      recentChallengeIds,
      allChallenges,
      keyData,
      errorPatterns,
      problemSeqs,
      profile,
    ] = await Promise.all([
      getRecentSessionsForAdaptive(10),
      getRecentSessionChallengeIds(20),
      getAllChallengesWithCategories(),
      getKeyAccuracyForUser(user.id),
      getCharErrorPatternsForUser(user.id),
      getProblemSequences(user.id, 10),
      getUserProfile(user.id),
    ]);

    // Filter out premium challenges if user is on free tier
    const canAccessPremium = canAccessPremiumCategories(
      profile?.subscriptionTier ?? 'free'
    );
    const accessibleChallenges = canAccessPremium
      ? allChallenges
      : allChallenges.filter((c) => !c.isPremium);

    // Build weakness report (may be empty for new users)
    const weaknessReport =
      keyData.length > 0 || errorPatterns.length > 0 || problemSeqs.length > 0
        ? analyzeWeaknesses(keyData, errorPatterns, problemSeqs)
        : null;

    // Convert sessions to the format the adaptive engine expects
    const sessionPerformance: SessionPerformance[] = recentSessions.map((s) => ({
      wpm: s.wpm,
      accuracy: s.accuracy,
      errors: s.errors,
      keystrokes: s.keystrokes,
      durationMs: s.durationMs,
      challengeDifficulty: s.challengeDifficulty as DifficultyLevel,
    }));

    // Run smart selection
    const result = selectSmartChallenges(
      accessibleChallenges,
      sessionPerformance,
      recentChallengeIds,
      weaknessReport,
      { limit }
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'User not authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error computing smart practice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
