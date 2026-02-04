/**
 * Adaptive difficulty engine that auto-adjusts challenge difficulty
 * based on user performance metrics across recent sessions.
 *
 * Signals used:
 * - WPM trend (improving, stable, declining)
 * - Accuracy trend
 * - Current WPM relative to category averages
 * - Error rate consistency
 * - Session count (new users get gentler adjustments)
 */

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type DifficultyTrend = 'increase' | 'maintain' | 'decrease';

export interface SessionPerformance {
  wpm: number;
  accuracy: number;
  errors: number;
  keystrokes: number;
  durationMs: number;
  challengeDifficulty: DifficultyLevel;
}

export interface AdaptiveDifficultyResult {
  recommendedDifficulty: DifficultyLevel;
  difficultyScore: number; // 1-100 numeric score
  trend: DifficultyTrend;
  confidence: number; // 0-1, how confident the recommendation is
  reasons: string[];
}

// Thresholds for difficulty transitions
const ACCURACY_HIGH = 95;
const ACCURACY_LOW = 80;
const WPM_BEGINNER_CEILING = 35;
const WPM_INTERMEDIATE_CEILING = 65;
const MIN_SESSIONS_FOR_ADJUSTMENT = 3;
const TREND_WINDOW = 5; // sessions to consider for trend

/**
 * Compute adaptive difficulty recommendation from recent session data.
 * Sessions should be ordered newest-first.
 */
export function computeAdaptiveDifficulty(
  sessions: SessionPerformance[]
): AdaptiveDifficultyResult {
  if (sessions.length === 0) {
    return {
      recommendedDifficulty: 'beginner',
      difficultyScore: 20,
      trend: 'maintain',
      confidence: 0,
      reasons: ['No session history available. Starting at beginner difficulty.'],
    };
  }

  const recent = sessions.slice(0, TREND_WINDOW);
  const reasons: string[] = [];

  // Compute averages for recent sessions
  const avgWpm = mean(recent.map((s) => s.wpm));
  const avgAccuracy = mean(recent.map((s) => s.accuracy));
  const avgErrorRate = mean(
    recent.map((s) => (s.keystrokes > 0 ? (s.errors / s.keystrokes) * 100 : 0))
  );

  // Compute WPM trend (positive = improving)
  const wpmTrend = computeTrend(recent.map((s) => s.wpm));
  // Compute accuracy trend
  const accuracyTrend = computeTrend(recent.map((s) => s.accuracy));

  // Base difficulty score from WPM (0-100)
  let difficultyScore = wpmToScore(avgWpm);

  // Adjust score based on accuracy
  if (avgAccuracy >= ACCURACY_HIGH) {
    difficultyScore += 10;
    reasons.push(`High accuracy (${avgAccuracy.toFixed(0)}%) suggests room for harder challenges.`);
  } else if (avgAccuracy < ACCURACY_LOW) {
    difficultyScore -= 15;
    reasons.push(`Accuracy below ${ACCURACY_LOW}% (${avgAccuracy.toFixed(0)}%) — reducing difficulty.`);
  }

  // Adjust based on WPM trend
  if (wpmTrend > 2) {
    difficultyScore += 5;
    reasons.push('WPM is trending upward — increasing difficulty.');
  } else if (wpmTrend < -3) {
    difficultyScore -= 5;
    reasons.push('WPM is trending downward — easing difficulty.');
  }

  // Adjust based on accuracy trend
  if (accuracyTrend < -3 && avgAccuracy < 90) {
    difficultyScore -= 5;
    reasons.push('Accuracy is declining — easing difficulty to rebuild confidence.');
  }

  // Penalize high error rates
  if (avgErrorRate > 15) {
    difficultyScore -= 10;
    reasons.push(`High error rate (${avgErrorRate.toFixed(0)}%) — reducing difficulty.`);
  }

  // Clamp score
  difficultyScore = clamp(difficultyScore, 1, 100);

  // Map score to difficulty level
  const recommendedDifficulty = scoreToDifficulty(difficultyScore);

  // Determine trend by comparing recommended to current
  const currentDifficulty = mostCommonDifficulty(recent);
  const trend = determineTrend(currentDifficulty, recommendedDifficulty);

  if (trend === 'maintain') {
    reasons.push(`Performance is consistent at ${currentDifficulty} level.`);
  }

  // Confidence based on session count and consistency
  const confidence = computeConfidence(sessions.length, recent);

  // If not enough sessions, soften the recommendation toward current level
  if (sessions.length < MIN_SESSIONS_FOR_ADJUSTMENT && trend !== 'maintain') {
    return {
      recommendedDifficulty: currentDifficulty,
      difficultyScore,
      trend: 'maintain',
      confidence,
      reasons: [
        `Only ${sessions.length} session(s) recorded. Need at least ${MIN_SESSIONS_FOR_ADJUSTMENT} sessions before adjusting difficulty.`,
      ],
    };
  }

  return {
    recommendedDifficulty,
    difficultyScore,
    trend,
    confidence,
    reasons,
  };
}

/**
 * Given a list of challenges and an adaptive result, filter and sort
 * challenges to return the most appropriate ones.
 */
export function filterChallengesByDifficulty<
  T extends { difficulty: string }
>(
  challenges: T[],
  result: AdaptiveDifficultyResult
): T[] {
  const { recommendedDifficulty } = result;

  // Primary: exact match. Secondary: adjacent difficulty.
  const exact = challenges.filter(
    (c) => c.difficulty === recommendedDifficulty
  );
  if (exact.length > 0) return exact;

  // Fall back to adjacent difficulty
  const adjacent = getAdjacentDifficulty(recommendedDifficulty);
  const fallback = challenges.filter((c) =>
    adjacent.includes(c.difficulty as DifficultyLevel)
  );
  if (fallback.length > 0) return fallback;

  // No filtering possible, return all
  return challenges;
}

// --- Internal helpers ---

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Compute trend as average change per session.
 * Values should be newest-first; we reverse to get chronological order.
 * Returns positive for improvement, negative for decline.
 */
function computeTrend(values: number[]): number {
  if (values.length < 2) return 0;

  // Reverse so it's oldest-first (chronological)
  const chronological = [...values].reverse();
  let totalDelta = 0;
  for (let i = 1; i < chronological.length; i++) {
    totalDelta += chronological[i] - chronological[i - 1];
  }
  return totalDelta / (chronological.length - 1);
}

function wpmToScore(wpm: number): number {
  if (wpm <= WPM_BEGINNER_CEILING) {
    // 0-35 WPM maps to score 1-33
    return clamp(Math.round((wpm / WPM_BEGINNER_CEILING) * 33), 1, 33);
  }
  if (wpm <= WPM_INTERMEDIATE_CEILING) {
    // 35-65 WPM maps to score 34-66
    const ratio =
      (wpm - WPM_BEGINNER_CEILING) /
      (WPM_INTERMEDIATE_CEILING - WPM_BEGINNER_CEILING);
    return clamp(Math.round(34 + ratio * 32), 34, 66);
  }
  // 65+ WPM maps to score 67-100
  const ratio = Math.min((wpm - WPM_INTERMEDIATE_CEILING) / 35, 1);
  return clamp(Math.round(67 + ratio * 33), 67, 100);
}

function scoreToDifficulty(score: number): DifficultyLevel {
  if (score <= 33) return 'beginner';
  if (score <= 66) return 'intermediate';
  return 'advanced';
}

function mostCommonDifficulty(sessions: SessionPerformance[]): DifficultyLevel {
  const counts: Record<DifficultyLevel, number> = {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
  };
  for (const s of sessions) {
    if (s.challengeDifficulty in counts) {
      counts[s.challengeDifficulty]++;
    }
  }
  const entries = Object.entries(counts) as [DifficultyLevel, number][];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

function determineTrend(
  current: DifficultyLevel,
  recommended: DifficultyLevel
): DifficultyTrend {
  const levels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];
  const currentIdx = levels.indexOf(current);
  const recommendedIdx = levels.indexOf(recommended);
  if (recommendedIdx > currentIdx) return 'increase';
  if (recommendedIdx < currentIdx) return 'decrease';
  return 'maintain';
}

function getAdjacentDifficulty(level: DifficultyLevel): DifficultyLevel[] {
  switch (level) {
    case 'beginner':
      return ['intermediate'];
    case 'intermediate':
      return ['beginner', 'advanced'];
    case 'advanced':
      return ['intermediate'];
  }
}

function computeConfidence(
  totalSessions: number,
  recent: SessionPerformance[]
): number {
  // More sessions = higher confidence (caps at 20 sessions)
  const sessionFactor = Math.min(totalSessions / 20, 1);

  // Lower variance in recent WPM = higher confidence
  const wpmValues = recent.map((s) => s.wpm);
  const wpmVariance = variance(wpmValues);
  // Normalize: <100 variance is very consistent (1.0), >400 is inconsistent (0.5)
  const consistencyFactor = clamp(1 - (wpmVariance - 100) / 600, 0.5, 1);

  return Math.round(sessionFactor * consistencyFactor * 100) / 100;
}

function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return mean(values.map((v) => (v - avg) ** 2));
}
