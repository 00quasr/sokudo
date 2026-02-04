import { describe, it, expect } from 'vitest';
import {
  computeAdaptiveDifficulty,
  filterChallengesByDifficulty,
  type SessionPerformance,
  type AdaptiveDifficultyResult,
} from '../adaptive-difficulty';

function makeSession(
  overrides: Partial<SessionPerformance> = {}
): SessionPerformance {
  return {
    wpm: 40,
    accuracy: 92,
    errors: 4,
    keystrokes: 50,
    durationMs: 30000,
    challengeDifficulty: 'intermediate',
    ...overrides,
  };
}

function makeSessions(
  count: number,
  overrides: Partial<SessionPerformance> = {}
): SessionPerformance[] {
  return Array.from({ length: count }, () => makeSession(overrides));
}

describe('computeAdaptiveDifficulty', () => {
  describe('empty sessions', () => {
    it('should return beginner with zero confidence for no sessions', () => {
      const result = computeAdaptiveDifficulty([]);
      expect(result.recommendedDifficulty).toBe('beginner');
      expect(result.difficultyScore).toBe(20);
      expect(result.trend).toBe('maintain');
      expect(result.confidence).toBe(0);
      expect(result.reasons).toHaveLength(1);
      expect(result.reasons[0]).toContain('No session history');
    });
  });

  describe('beginner performance', () => {
    it('should recommend beginner for low WPM', () => {
      const sessions = makeSessions(5, {
        wpm: 20,
        accuracy: 85,
        challengeDifficulty: 'beginner',
      });
      const result = computeAdaptiveDifficulty(sessions);
      expect(result.recommendedDifficulty).toBe('beginner');
      expect(result.difficultyScore).toBeLessThanOrEqual(33);
    });

    it('should recommend beginner for very low WPM even with high accuracy', () => {
      const sessions = makeSessions(5, {
        wpm: 15,
        accuracy: 98,
        challengeDifficulty: 'beginner',
      });
      const result = computeAdaptiveDifficulty(sessions);
      expect(result.recommendedDifficulty).toBe('beginner');
    });
  });

  describe('intermediate performance', () => {
    it('should recommend intermediate for moderate WPM and accuracy', () => {
      const sessions = makeSessions(5, {
        wpm: 50,
        accuracy: 92,
        challengeDifficulty: 'intermediate',
      });
      const result = computeAdaptiveDifficulty(sessions);
      expect(result.recommendedDifficulty).toBe('intermediate');
      expect(result.difficultyScore).toBeGreaterThan(33);
      expect(result.difficultyScore).toBeLessThanOrEqual(66);
    });
  });

  describe('advanced performance', () => {
    it('should recommend advanced for high WPM and accuracy', () => {
      const sessions = makeSessions(5, {
        wpm: 80,
        accuracy: 97,
        errors: 1,
        keystrokes: 100,
        challengeDifficulty: 'advanced',
      });
      const result = computeAdaptiveDifficulty(sessions);
      expect(result.recommendedDifficulty).toBe('advanced');
      expect(result.difficultyScore).toBeGreaterThan(66);
    });
  });

  describe('accuracy impact', () => {
    it('should reduce difficulty for low accuracy', () => {
      const sessions = makeSessions(5, {
        wpm: 50,
        accuracy: 75,
        errors: 12,
        keystrokes: 50,
        challengeDifficulty: 'intermediate',
      });
      const result = computeAdaptiveDifficulty(sessions);
      // Low accuracy should push score down
      expect(result.reasons.some((r) => r.includes('Accuracy below'))).toBe(true);
    });

    it('should boost difficulty for very high accuracy', () => {
      const sessions = makeSessions(5, {
        wpm: 50,
        accuracy: 98,
        errors: 1,
        keystrokes: 50,
        challengeDifficulty: 'intermediate',
      });
      const result = computeAdaptiveDifficulty(sessions);
      expect(result.reasons.some((r) => r.includes('High accuracy'))).toBe(true);
    });
  });

  describe('trend detection', () => {
    it('should detect upward WPM trend', () => {
      // Sessions are newest-first, so WPM should decrease in array order for an upward trend
      const sessions: SessionPerformance[] = [
        makeSession({ wpm: 60 }),
        makeSession({ wpm: 55 }),
        makeSession({ wpm: 50 }),
        makeSession({ wpm: 45 }),
        makeSession({ wpm: 40 }),
      ];
      const result = computeAdaptiveDifficulty(sessions);
      expect(result.reasons.some((r) => r.includes('trending upward'))).toBe(true);
    });

    it('should detect downward WPM trend', () => {
      // Sessions are newest-first, so WPM should increase in array order for a downward trend
      const sessions: SessionPerformance[] = [
        makeSession({ wpm: 30 }),
        makeSession({ wpm: 35 }),
        makeSession({ wpm: 40 }),
        makeSession({ wpm: 45 }),
        makeSession({ wpm: 50 }),
      ];
      const result = computeAdaptiveDifficulty(sessions);
      expect(result.reasons.some((r) => r.includes('trending downward'))).toBe(true);
    });
  });

  describe('minimum sessions threshold', () => {
    it('should not adjust difficulty with fewer than 3 sessions', () => {
      // A single beginner session with high WPM that would normally trigger increase
      const sessions = [
        makeSession({ wpm: 80, accuracy: 98, challengeDifficulty: 'beginner' }),
        makeSession({ wpm: 75, accuracy: 97, challengeDifficulty: 'beginner' }),
      ];
      const result = computeAdaptiveDifficulty(sessions);
      // Should maintain current difficulty (beginner) due to insufficient data
      expect(result.trend).toBe('maintain');
      expect(result.reasons[0]).toContain('Need at least');
    });

    it('should adjust difficulty with 3+ sessions', () => {
      const sessions = makeSessions(3, {
        wpm: 80,
        accuracy: 98,
        errors: 1,
        keystrokes: 100,
        challengeDifficulty: 'beginner',
      });
      const result = computeAdaptiveDifficulty(sessions);
      // Should recommend increase since performance is way above beginner level
      expect(result.trend).toBe('increase');
    });
  });

  describe('error rate impact', () => {
    it('should penalize high error rates', () => {
      const sessions = makeSessions(5, {
        wpm: 55,
        accuracy: 85,
        errors: 10,
        keystrokes: 50, // 20% error rate
        challengeDifficulty: 'intermediate',
      });
      const result = computeAdaptiveDifficulty(sessions);
      expect(result.reasons.some((r) => r.includes('error rate'))).toBe(true);
    });
  });

  describe('difficulty trend direction', () => {
    it('should return increase when recommended > current', () => {
      const sessions = makeSessions(5, {
        wpm: 80,
        accuracy: 97,
        errors: 1,
        keystrokes: 100,
        challengeDifficulty: 'beginner',
      });
      const result = computeAdaptiveDifficulty(sessions);
      expect(result.trend).toBe('increase');
    });

    it('should return decrease when recommended < current', () => {
      const sessions = makeSessions(5, {
        wpm: 20,
        accuracy: 70,
        errors: 15,
        keystrokes: 50,
        challengeDifficulty: 'advanced',
      });
      const result = computeAdaptiveDifficulty(sessions);
      expect(result.trend).toBe('decrease');
    });

    it('should return maintain when performance matches current level', () => {
      const sessions = makeSessions(5, {
        wpm: 50,
        accuracy: 92,
        challengeDifficulty: 'intermediate',
      });
      const result = computeAdaptiveDifficulty(sessions);
      expect(result.trend).toBe('maintain');
    });
  });

  describe('confidence', () => {
    it('should have low confidence with few sessions', () => {
      const sessions = makeSessions(3, { wpm: 50, accuracy: 92 });
      const result = computeAdaptiveDifficulty(sessions);
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should have higher confidence with many sessions', () => {
      const sessions = makeSessions(10, { wpm: 50, accuracy: 92 });
      const resultFew = computeAdaptiveDifficulty(sessions.slice(0, 3));
      const resultMany = computeAdaptiveDifficulty(sessions);
      expect(resultMany.confidence).toBeGreaterThan(resultFew.confidence);
    });

    it('should have higher confidence with consistent WPM', () => {
      const consistent = makeSessions(10, { wpm: 50, accuracy: 92 });
      const inconsistent: SessionPerformance[] = [
        makeSession({ wpm: 80 }),
        makeSession({ wpm: 30 }),
        makeSession({ wpm: 70 }),
        makeSession({ wpm: 25 }),
        makeSession({ wpm: 75 }),
        makeSession({ wpm: 35 }),
        makeSession({ wpm: 65 }),
        makeSession({ wpm: 40 }),
        makeSession({ wpm: 60 }),
        makeSession({ wpm: 45 }),
      ];
      const resultConsistent = computeAdaptiveDifficulty(consistent);
      const resultInconsistent = computeAdaptiveDifficulty(inconsistent);
      expect(resultConsistent.confidence).toBeGreaterThanOrEqual(
        resultInconsistent.confidence
      );
    });
  });

  describe('score bounds', () => {
    it('should clamp score between 1 and 100', () => {
      // Very low performance
      const low = computeAdaptiveDifficulty(
        makeSessions(5, {
          wpm: 5,
          accuracy: 50,
          errors: 25,
          keystrokes: 50,
          challengeDifficulty: 'beginner',
        })
      );
      expect(low.difficultyScore).toBeGreaterThanOrEqual(1);

      // Very high performance
      const high = computeAdaptiveDifficulty(
        makeSessions(5, {
          wpm: 150,
          accuracy: 100,
          errors: 0,
          keystrokes: 100,
          challengeDifficulty: 'advanced',
        })
      );
      expect(high.difficultyScore).toBeLessThanOrEqual(100);
    });
  });
});

describe('filterChallengesByDifficulty', () => {
  const challenges = [
    { id: 1, difficulty: 'beginner', content: 'easy' },
    { id: 2, difficulty: 'beginner', content: 'easy2' },
    { id: 3, difficulty: 'intermediate', content: 'medium' },
    { id: 4, difficulty: 'intermediate', content: 'medium2' },
    { id: 5, difficulty: 'advanced', content: 'hard' },
    { id: 6, difficulty: 'advanced', content: 'hard2' },
  ];

  function makeAdaptiveResult(
    overrides: Partial<AdaptiveDifficultyResult> = {}
  ): AdaptiveDifficultyResult {
    return {
      recommendedDifficulty: 'intermediate',
      difficultyScore: 50,
      trend: 'maintain',
      confidence: 0.8,
      reasons: [],
      ...overrides,
    };
  }

  it('should filter to exact difficulty match', () => {
    const result = filterChallengesByDifficulty(
      challenges,
      makeAdaptiveResult({ recommendedDifficulty: 'intermediate' })
    );
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.difficulty === 'intermediate')).toBe(true);
  });

  it('should filter beginner challenges', () => {
    const result = filterChallengesByDifficulty(
      challenges,
      makeAdaptiveResult({ recommendedDifficulty: 'beginner' })
    );
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.difficulty === 'beginner')).toBe(true);
  });

  it('should filter advanced challenges', () => {
    const result = filterChallengesByDifficulty(
      challenges,
      makeAdaptiveResult({ recommendedDifficulty: 'advanced' })
    );
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.difficulty === 'advanced')).toBe(true);
  });

  it('should fall back to adjacent difficulty when no exact match', () => {
    const onlyBeginner = [
      { id: 1, difficulty: 'beginner', content: 'easy' },
    ];
    const result = filterChallengesByDifficulty(
      onlyBeginner,
      makeAdaptiveResult({ recommendedDifficulty: 'intermediate' })
    );
    expect(result).toHaveLength(1);
    expect(result[0].difficulty).toBe('beginner');
  });

  it('should return all challenges when no match at any level', () => {
    const emptyMatch: typeof challenges = [];
    const result = filterChallengesByDifficulty(
      emptyMatch,
      makeAdaptiveResult({ recommendedDifficulty: 'intermediate' })
    );
    expect(result).toHaveLength(0);
  });

  it('should return all when nothing matches recommended or adjacent', () => {
    const onlyAdvanced = [
      { id: 5, difficulty: 'advanced', content: 'hard' },
    ];
    // Beginner recommended, adjacent is intermediate, but only advanced exists
    const result = filterChallengesByDifficulty(
      onlyAdvanced,
      makeAdaptiveResult({ recommendedDifficulty: 'beginner' })
    );
    // Falls back to all challenges
    expect(result).toHaveLength(1);
  });
});
