export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface SessionPerformance {
  wpm: number;
  accuracy: number;
  difficulty: DifficultyLevel;
}

export interface AdaptiveConfig {
  /** Minimum sessions needed before adjusting difficulty */
  minSessions: number;
  /** WPM threshold to consider promotion (percentage of category avg or absolute) */
  promoteWpmThreshold: number;
  /** Accuracy threshold (%) to consider promotion */
  promoteAccuracyThreshold: number;
  /** WPM threshold below which we consider demotion */
  demoteWpmThreshold: number;
  /** Accuracy threshold (%) below which we consider demotion */
  demoteAccuracyThreshold: number;
  /** Number of recent sessions to consider */
  windowSize: number;
}

export interface AdaptiveRecommendation {
  recommendedDifficulty: DifficultyLevel;
  currentDifficulty: DifficultyLevel;
  reason: string;
  confidence: number;
}

const DEFAULT_CONFIG: AdaptiveConfig = {
  minSessions: 3,
  promoteWpmThreshold: 50,
  promoteAccuracyThreshold: 90,
  demoteWpmThreshold: 25,
  demoteAccuracyThreshold: 70,
  windowSize: 5,
};

const DIFFICULTY_ORDER: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];

function getDifficultyIndex(level: DifficultyLevel): number {
  return DIFFICULTY_ORDER.indexOf(level);
}

function clampDifficulty(index: number): DifficultyLevel {
  const clamped = Math.max(0, Math.min(index, DIFFICULTY_ORDER.length - 1));
  return DIFFICULTY_ORDER[clamped];
}

/**
 * Calculate the average WPM and accuracy from a set of sessions.
 */
function calculateAverages(sessions: SessionPerformance[]): {
  avgWpm: number;
  avgAccuracy: number;
} {
  if (sessions.length === 0) {
    return { avgWpm: 0, avgAccuracy: 0 };
  }
  const avgWpm = Math.round(
    sessions.reduce((sum, s) => sum + s.wpm, 0) / sessions.length
  );
  const avgAccuracy = Math.round(
    sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length
  );
  return { avgWpm, avgAccuracy };
}

/**
 * Determine the most common difficulty level from recent sessions.
 */
function getMostCommonDifficulty(sessions: SessionPerformance[]): DifficultyLevel {
  if (sessions.length === 0) return 'beginner';

  const counts: Record<DifficultyLevel, number> = {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
  };

  for (const session of sessions) {
    counts[session.difficulty]++;
  }

  let maxCount = 0;
  let maxDifficulty: DifficultyLevel = 'beginner';
  for (const level of DIFFICULTY_ORDER) {
    if (counts[level] > maxCount) {
      maxCount = counts[level];
      maxDifficulty = level;
    }
  }

  return maxDifficulty;
}

/**
 * Calculate a confidence score (0-1) based on how many sessions
 * and how consistent the performance is.
 */
function calculateConfidence(
  sessions: SessionPerformance[],
  config: AdaptiveConfig
): number {
  if (sessions.length === 0) return 0;

  // More sessions = higher confidence, up to windowSize
  const sessionFactor = Math.min(sessions.length / config.windowSize, 1);

  // Lower variance in WPM = higher confidence
  const avgWpm = sessions.reduce((sum, s) => sum + s.wpm, 0) / sessions.length;
  const variance =
    sessions.reduce((sum, s) => sum + Math.pow(s.wpm - avgWpm, 2), 0) /
    sessions.length;
  const stdDev = Math.sqrt(variance);
  // Normalize: stdDev of 0 = 1.0 confidence, stdDev of 30+ = low confidence
  const consistencyFactor = Math.max(0, 1 - stdDev / 30);

  return Math.round((sessionFactor * 0.6 + consistencyFactor * 0.4) * 100) / 100;
}

/**
 * Recommend a difficulty level based on recent session performance.
 *
 * The algorithm:
 * 1. Determines the current difficulty from the most common recent level
 * 2. Calculates average WPM and accuracy over the recent window
 * 3. If both WPM and accuracy exceed promotion thresholds → promote
 * 4. If either WPM or accuracy fall below demotion thresholds → demote
 * 5. Otherwise → maintain current level
 */
export function recommendDifficulty(
  recentSessions: SessionPerformance[],
  config: Partial<AdaptiveConfig> = {}
): AdaptiveRecommendation {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  // Not enough data - return beginner with low confidence
  if (recentSessions.length < fullConfig.minSessions) {
    const currentDifficulty = recentSessions.length > 0
      ? getMostCommonDifficulty(recentSessions)
      : 'beginner';
    return {
      recommendedDifficulty: currentDifficulty,
      currentDifficulty,
      reason: `Need at least ${fullConfig.minSessions} sessions for adaptive adjustment (have ${recentSessions.length})`,
      confidence: 0,
    };
  }

  // Use the most recent sessions within the window
  const windowedSessions = recentSessions.slice(0, fullConfig.windowSize);
  const currentDifficulty = getMostCommonDifficulty(windowedSessions);
  const currentIndex = getDifficultyIndex(currentDifficulty);
  const { avgWpm, avgAccuracy } = calculateAverages(windowedSessions);
  const confidence = calculateConfidence(windowedSessions, fullConfig);

  // Check for promotion
  if (
    avgWpm >= fullConfig.promoteWpmThreshold &&
    avgAccuracy >= fullConfig.promoteAccuracyThreshold
  ) {
    if (currentIndex < DIFFICULTY_ORDER.length - 1) {
      const newDifficulty = clampDifficulty(currentIndex + 1);
      return {
        recommendedDifficulty: newDifficulty,
        currentDifficulty,
        reason: `Strong performance (${avgWpm} WPM, ${avgAccuracy}% accuracy) suggests moving to ${newDifficulty}`,
        confidence,
      };
    }
    return {
      recommendedDifficulty: currentDifficulty,
      currentDifficulty,
      reason: `Already at highest difficulty with strong performance (${avgWpm} WPM, ${avgAccuracy}% accuracy)`,
      confidence,
    };
  }

  // Check for demotion
  if (
    avgWpm < fullConfig.demoteWpmThreshold ||
    avgAccuracy < fullConfig.demoteAccuracyThreshold
  ) {
    if (currentIndex > 0) {
      const newDifficulty = clampDifficulty(currentIndex - 1);
      const reasons: string[] = [];
      if (avgWpm < fullConfig.demoteWpmThreshold) {
        reasons.push(`low WPM (${avgWpm})`);
      }
      if (avgAccuracy < fullConfig.demoteAccuracyThreshold) {
        reasons.push(`low accuracy (${avgAccuracy}%)`);
      }
      return {
        recommendedDifficulty: newDifficulty,
        currentDifficulty,
        reason: `${reasons.join(' and ')} suggests moving to ${newDifficulty}`,
        confidence,
      };
    }
    return {
      recommendedDifficulty: currentDifficulty,
      currentDifficulty,
      reason: `Already at lowest difficulty, keep practicing to improve`,
      confidence,
    };
  }

  // Maintain current level
  return {
    recommendedDifficulty: currentDifficulty,
    currentDifficulty,
    reason: `Performing well at current level (${avgWpm} WPM, ${avgAccuracy}% accuracy)`,
    confidence,
  };
}

/**
 * Get adaptive config with difficulty-scaled thresholds.
 * Higher difficulties expect higher baseline performance.
 */
export function getScaledConfig(
  currentDifficulty: DifficultyLevel,
  baseConfig: Partial<AdaptiveConfig> = {}
): AdaptiveConfig {
  const config = { ...DEFAULT_CONFIG, ...baseConfig };

  switch (currentDifficulty) {
    case 'beginner':
      return {
        ...config,
        promoteWpmThreshold: 40,
        promoteAccuracyThreshold: 85,
        demoteWpmThreshold: 15,
        demoteAccuracyThreshold: 60,
      };
    case 'intermediate':
      return {
        ...config,
        promoteWpmThreshold: 55,
        promoteAccuracyThreshold: 90,
        demoteWpmThreshold: 30,
        demoteAccuracyThreshold: 70,
      };
    case 'advanced':
      return {
        ...config,
        promoteWpmThreshold: 70,
        promoteAccuracyThreshold: 95,
        demoteWpmThreshold: 40,
        demoteAccuracyThreshold: 75,
      };
  }
}
