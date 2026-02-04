import { describe, it, expect } from 'vitest';
import {
  recommendDifficulty,
  getScaledConfig,
  type SessionPerformance,
  type DifficultyLevel,
} from '../adaptive-difficulty';

function makeSessions(
  count: number,
  overrides: Partial<SessionPerformance> = {}
): SessionPerformance[] {
  return Array.from({ length: count }, () => ({
    wpm: 40,
    accuracy: 85,
    difficulty: 'beginner' as DifficultyLevel,
    ...overrides,
  }));
}

describe('recommendDifficulty', () => {
  describe('insufficient data', () => {
    it('should return beginner with 0 confidence when no sessions exist', () => {
      const result = recommendDifficulty([]);
      expect(result.recommendedDifficulty).toBe('beginner');
      expect(result.currentDifficulty).toBe('beginner');
      expect(result.confidence).toBe(0);
    });

    it('should return current difficulty when fewer than minSessions', () => {
      const sessions = makeSessions(2, { difficulty: 'intermediate' });
      const result = recommendDifficulty(sessions, { minSessions: 3 });
      expect(result.recommendedDifficulty).toBe('intermediate');
      expect(result.confidence).toBe(0);
      expect(result.reason).toContain('Need at least 3 sessions');
    });

    it('should return beginner when 1 beginner session and minSessions is 3', () => {
      const sessions = makeSessions(1, { difficulty: 'beginner' });
      const result = recommendDifficulty(sessions, { minSessions: 3 });
      expect(result.recommendedDifficulty).toBe('beginner');
    });
  });

  describe('promotion', () => {
    it('should promote from beginner to intermediate when performing well', () => {
      const sessions = makeSessions(5, {
        wpm: 60,
        accuracy: 95,
        difficulty: 'beginner',
      });
      const result = recommendDifficulty(sessions);
      expect(result.recommendedDifficulty).toBe('intermediate');
      expect(result.currentDifficulty).toBe('beginner');
      expect(result.reason).toContain('Strong performance');
    });

    it('should promote from intermediate to advanced when performing well', () => {
      const sessions = makeSessions(5, {
        wpm: 60,
        accuracy: 95,
        difficulty: 'intermediate',
      });
      const result = recommendDifficulty(sessions);
      expect(result.recommendedDifficulty).toBe('advanced');
      expect(result.currentDifficulty).toBe('intermediate');
    });

    it('should stay at advanced when already at highest difficulty', () => {
      const sessions = makeSessions(5, {
        wpm: 80,
        accuracy: 98,
        difficulty: 'advanced',
      });
      const result = recommendDifficulty(sessions);
      expect(result.recommendedDifficulty).toBe('advanced');
      expect(result.reason).toContain('Already at highest difficulty');
    });

    it('should not promote if WPM is high but accuracy is low', () => {
      const sessions = makeSessions(5, {
        wpm: 80,
        accuracy: 70,
        difficulty: 'beginner',
      });
      const result = recommendDifficulty(sessions);
      // Should not be intermediate since accuracy doesn't meet threshold
      expect(result.recommendedDifficulty).not.toBe('intermediate');
    });

    it('should not promote if accuracy is high but WPM is low', () => {
      const sessions = makeSessions(5, {
        wpm: 20,
        accuracy: 98,
        difficulty: 'beginner',
      });
      const result = recommendDifficulty(sessions);
      expect(result.recommendedDifficulty).not.toBe('intermediate');
    });
  });

  describe('demotion', () => {
    it('should demote from intermediate to beginner with low WPM', () => {
      const sessions = makeSessions(5, {
        wpm: 15,
        accuracy: 85,
        difficulty: 'intermediate',
      });
      const result = recommendDifficulty(sessions);
      expect(result.recommendedDifficulty).toBe('beginner');
      expect(result.reason).toContain('low WPM');
    });

    it('should demote from intermediate to beginner with low accuracy', () => {
      const sessions = makeSessions(5, {
        wpm: 40,
        accuracy: 55,
        difficulty: 'intermediate',
      });
      const result = recommendDifficulty(sessions);
      expect(result.recommendedDifficulty).toBe('beginner');
      expect(result.reason).toContain('low accuracy');
    });

    it('should demote from advanced to intermediate with low WPM and accuracy', () => {
      const sessions = makeSessions(5, {
        wpm: 15,
        accuracy: 50,
        difficulty: 'advanced',
      });
      const result = recommendDifficulty(sessions);
      expect(result.recommendedDifficulty).toBe('intermediate');
      expect(result.reason).toContain('low WPM');
      expect(result.reason).toContain('low accuracy');
    });

    it('should stay at beginner when already at lowest difficulty', () => {
      const sessions = makeSessions(5, {
        wpm: 10,
        accuracy: 50,
        difficulty: 'beginner',
      });
      const result = recommendDifficulty(sessions);
      expect(result.recommendedDifficulty).toBe('beginner');
      expect(result.reason).toContain('Already at lowest difficulty');
    });
  });

  describe('maintaining level', () => {
    it('should maintain current level with average performance', () => {
      const sessions = makeSessions(5, {
        wpm: 35,
        accuracy: 82,
        difficulty: 'beginner',
      });
      const result = recommendDifficulty(sessions);
      expect(result.recommendedDifficulty).toBe('beginner');
      expect(result.reason).toContain('Performing well at current level');
    });

    it('should maintain intermediate with moderate performance', () => {
      const sessions = makeSessions(5, {
        wpm: 35,
        accuracy: 82,
        difficulty: 'intermediate',
      });
      const result = recommendDifficulty(sessions);
      expect(result.recommendedDifficulty).toBe('intermediate');
    });
  });

  describe('window size', () => {
    it('should only consider the most recent sessions within windowSize', () => {
      // 3 recent sessions with high performance, 7 older with low
      const recentSessions = makeSessions(3, {
        wpm: 60,
        accuracy: 95,
        difficulty: 'beginner',
      });
      const olderSessions = makeSessions(7, {
        wpm: 10,
        accuracy: 50,
        difficulty: 'beginner',
      });
      const allSessions = [...recentSessions, ...olderSessions];
      const result = recommendDifficulty(allSessions, { windowSize: 3, minSessions: 3 });
      // Should promote based on only the 3 recent sessions
      expect(result.recommendedDifficulty).toBe('intermediate');
    });
  });

  describe('confidence', () => {
    it('should have higher confidence with more sessions', () => {
      const fewSessions = makeSessions(3, { wpm: 40, accuracy: 85, difficulty: 'beginner' });
      const manySessions = makeSessions(5, { wpm: 40, accuracy: 85, difficulty: 'beginner' });

      const resultFew = recommendDifficulty(fewSessions);
      const resultMany = recommendDifficulty(manySessions);

      expect(resultMany.confidence).toBeGreaterThanOrEqual(resultFew.confidence);
    });

    it('should have higher confidence with consistent WPM', () => {
      const consistentSessions = makeSessions(5, { wpm: 40, accuracy: 85, difficulty: 'beginner' });
      const inconsistentSessions = [
        { wpm: 20, accuracy: 85, difficulty: 'beginner' as DifficultyLevel },
        { wpm: 60, accuracy: 85, difficulty: 'beginner' as DifficultyLevel },
        { wpm: 25, accuracy: 85, difficulty: 'beginner' as DifficultyLevel },
        { wpm: 55, accuracy: 85, difficulty: 'beginner' as DifficultyLevel },
        { wpm: 30, accuracy: 85, difficulty: 'beginner' as DifficultyLevel },
      ];

      const resultConsistent = recommendDifficulty(consistentSessions);
      const resultInconsistent = recommendDifficulty(inconsistentSessions);

      expect(resultConsistent.confidence).toBeGreaterThan(resultInconsistent.confidence);
    });
  });

  describe('mixed difficulty sessions', () => {
    it('should use the most common difficulty as current level', () => {
      const sessions: SessionPerformance[] = [
        { wpm: 60, accuracy: 95, difficulty: 'intermediate' },
        { wpm: 55, accuracy: 92, difficulty: 'intermediate' },
        { wpm: 50, accuracy: 90, difficulty: 'beginner' },
        { wpm: 58, accuracy: 93, difficulty: 'intermediate' },
        { wpm: 52, accuracy: 91, difficulty: 'beginner' },
      ];
      const result = recommendDifficulty(sessions);
      expect(result.currentDifficulty).toBe('intermediate');
    });
  });
});

describe('getScaledConfig', () => {
  it('should return lower thresholds for beginner', () => {
    const config = getScaledConfig('beginner');
    expect(config.promoteWpmThreshold).toBe(40);
    expect(config.promoteAccuracyThreshold).toBe(85);
    expect(config.demoteWpmThreshold).toBe(15);
    expect(config.demoteAccuracyThreshold).toBe(60);
  });

  it('should return moderate thresholds for intermediate', () => {
    const config = getScaledConfig('intermediate');
    expect(config.promoteWpmThreshold).toBe(55);
    expect(config.promoteAccuracyThreshold).toBe(90);
    expect(config.demoteWpmThreshold).toBe(30);
    expect(config.demoteAccuracyThreshold).toBe(70);
  });

  it('should return higher thresholds for advanced', () => {
    const config = getScaledConfig('advanced');
    expect(config.promoteWpmThreshold).toBe(70);
    expect(config.promoteAccuracyThreshold).toBe(95);
    expect(config.demoteWpmThreshold).toBe(40);
    expect(config.demoteAccuracyThreshold).toBe(75);
  });

  it('should allow overriding base config values', () => {
    const config = getScaledConfig('beginner', { minSessions: 10, windowSize: 8 });
    expect(config.minSessions).toBe(10);
    expect(config.windowSize).toBe(8);
    // But scaled values should still be applied
    expect(config.promoteWpmThreshold).toBe(40);
  });
});
