import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimit } from '@/lib/rate-limit';
import {
  getUser,
  getUserProfile,
  getUserStatsOverview,
  getCategoryPerformance,
  getCategories,
  getRecentSessionsForAdaptive,
  getKeyAccuracyForUser,
  getCharErrorPatternsForUser,
  getProblemSequences,
} from '@/lib/db/queries';
import { analyzeWeaknesses } from '@/lib/weakness/analyze';
import { generateRecommendations } from '@/lib/practice/recommendations';
import type {
  DifficultyLevel,
  SessionPerformance,
} from '@/lib/practice/adaptive-difficulty';

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'practice:recommendations' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      stats,
      categoryPerformance,
      allCategories,
      recentSessions,
      keyData,
      errorPatterns,
      problemSeqs,
      profile,
    ] = await Promise.all([
      getUserStatsOverview(),
      getCategoryPerformance(),
      getCategories(),
      getRecentSessionsForAdaptive(10),
      getKeyAccuracyForUser(user.id),
      getCharErrorPatternsForUser(user.id),
      getProblemSequences(user.id, 10),
      getUserProfile(user.id),
    ]);

    const weaknessReport =
      keyData.length > 0 || errorPatterns.length > 0 || problemSeqs.length > 0
        ? analyzeWeaknesses(keyData, errorPatterns, problemSeqs)
        : null;

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

    const recommendations = generateRecommendations({
      sessions: sessionPerformance,
      weaknessReport,
      categoryPerformance,
      allCategories: allCategories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        difficulty: c.difficulty,
        isPremium: c.isPremium,
      })),
      currentStreak: profile?.currentStreak ?? 0,
      totalSessions: stats.totalSessions,
      avgWpm: stats.avgWpm,
      avgAccuracy: stats.avgAccuracy,
    });

    return NextResponse.json({ recommendations });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'User not authenticated'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
