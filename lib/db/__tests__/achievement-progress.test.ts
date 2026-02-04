import { describe, it, expect } from 'vitest';
import { calculateAchievementProgress } from '../queries';

const emptyContext = {
  bestWpm: 0,
  bestAccuracy: 0,
  currentStreak: 0,
  totalSessions: 0,
  categoryProgress: new Map<string, { completed: number; total: number }>(),
};

describe('calculateAchievementProgress', () => {
  describe('wpm achievements', () => {
    it('should return 0% progress when no sessions exist', () => {
      const result = calculateAchievementProgress(
        { type: 'wpm', threshold: 100 },
        emptyContext
      );
      expect(result).toEqual({
        current: 0,
        target: 100,
        percentage: 0,
        label: '0/100 WPM',
      });
    });

    it('should calculate partial progress toward WPM threshold', () => {
      const result = calculateAchievementProgress(
        { type: 'wpm', threshold: 100 },
        { ...emptyContext, bestWpm: 80 }
      );
      expect(result).toEqual({
        current: 80,
        target: 100,
        percentage: 80,
        label: '80/100 WPM',
      });
    });

    it('should cap progress at 100% when threshold is met', () => {
      const result = calculateAchievementProgress(
        { type: 'wpm', threshold: 50 },
        { ...emptyContext, bestWpm: 75 }
      );
      expect(result).toEqual({
        current: 50,
        target: 50,
        percentage: 100,
        label: '50/50 WPM',
      });
    });

    it('should handle exact threshold match', () => {
      const result = calculateAchievementProgress(
        { type: 'wpm', threshold: 60 },
        { ...emptyContext, bestWpm: 60 }
      );
      expect(result).toEqual({
        current: 60,
        target: 60,
        percentage: 100,
        label: '60/60 WPM',
      });
    });
  });

  describe('accuracy achievements', () => {
    it('should return 0% progress when no sessions exist', () => {
      const result = calculateAchievementProgress(
        { type: 'accuracy', threshold: 95 },
        emptyContext
      );
      expect(result).toEqual({
        current: 0,
        target: 95,
        percentage: 0,
        label: '0%/95%',
      });
    });

    it('should calculate partial progress toward accuracy threshold', () => {
      const result = calculateAchievementProgress(
        { type: 'accuracy', threshold: 98 },
        { ...emptyContext, bestAccuracy: 92 }
      );
      expect(result).toEqual({
        current: 92,
        target: 98,
        percentage: 94,
        label: '92%/98%',
      });
    });

    it('should cap progress at 100%', () => {
      const result = calculateAchievementProgress(
        { type: 'accuracy', threshold: 95 },
        { ...emptyContext, bestAccuracy: 99 }
      );
      expect(result).toEqual({
        current: 95,
        target: 95,
        percentage: 100,
        label: '95%/95%',
      });
    });
  });

  describe('streak achievements', () => {
    it('should return 0% progress with no streak', () => {
      const result = calculateAchievementProgress(
        { type: 'streak', threshold: 7 },
        emptyContext
      );
      expect(result).toEqual({
        current: 0,
        target: 7,
        percentage: 0,
        label: '0/7 days',
      });
    });

    it('should calculate partial streak progress', () => {
      const result = calculateAchievementProgress(
        { type: 'streak', threshold: 30 },
        { ...emptyContext, currentStreak: 12 }
      );
      expect(result).toEqual({
        current: 12,
        target: 30,
        percentage: 40,
        label: '12/30 days',
      });
    });

    it('should cap streak progress at 100%', () => {
      const result = calculateAchievementProgress(
        { type: 'streak', threshold: 7 },
        { ...emptyContext, currentStreak: 15 }
      );
      expect(result).toEqual({
        current: 7,
        target: 7,
        percentage: 100,
        label: '7/7 days',
      });
    });
  });

  describe('sessions_completed achievements', () => {
    it('should return 0% with no sessions', () => {
      const result = calculateAchievementProgress(
        { type: 'sessions_completed', threshold: 100 },
        emptyContext
      );
      expect(result).toEqual({
        current: 0,
        target: 100,
        percentage: 0,
        label: '0/100 sessions',
      });
    });

    it('should calculate partial session progress', () => {
      const result = calculateAchievementProgress(
        { type: 'sessions_completed', threshold: 500 },
        { ...emptyContext, totalSessions: 250 }
      );
      expect(result).toEqual({
        current: 250,
        target: 500,
        percentage: 50,
        label: '250/500 sessions',
      });
    });

    it('should cap session progress at 100%', () => {
      const result = calculateAchievementProgress(
        { type: 'sessions_completed', threshold: 100 },
        { ...emptyContext, totalSessions: 150 }
      );
      expect(result).toEqual({
        current: 100,
        target: 100,
        percentage: 100,
        label: '100/100 sessions',
      });
    });
  });

  describe('category_mastery achievements', () => {
    it('should return 0% when category has no data', () => {
      const result = calculateAchievementProgress(
        { type: 'category_mastery', categorySlug: 'git-basics', minAccuracy: 90, allChallenges: true },
        emptyContext
      );
      expect(result).toEqual({
        current: 0,
        target: 1,
        percentage: 0,
        label: '0% mastered',
      });
    });

    it('should calculate partial category mastery', () => {
      const categoryProgress = new Map([
        ['git-basics', { completed: 3, total: 10 }],
      ]);
      const result = calculateAchievementProgress(
        { type: 'category_mastery', categorySlug: 'git-basics', minAccuracy: 90, allChallenges: true },
        { ...emptyContext, categoryProgress }
      );
      expect(result).toEqual({
        current: 3,
        target: 10,
        percentage: 30,
        label: '3/10 challenges',
      });
    });

    it('should return 100% when all challenges are completed', () => {
      const categoryProgress = new Map([
        ['react-patterns', { completed: 5, total: 5 }],
      ]);
      const result = calculateAchievementProgress(
        { type: 'category_mastery', categorySlug: 'react-patterns', minAccuracy: 90, allChallenges: true },
        { ...emptyContext, categoryProgress }
      );
      expect(result).toEqual({
        current: 5,
        target: 5,
        percentage: 100,
        label: '5/5 challenges',
      });
    });

    it('should handle unknown category slug', () => {
      const result = calculateAchievementProgress(
        { type: 'category_mastery', categorySlug: 'unknown', minAccuracy: 90, allChallenges: true },
        emptyContext
      );
      expect(result).toEqual({
        current: 0,
        target: 1,
        percentage: 0,
        label: '0% mastered',
      });
    });
  });

  describe('unknown criteria type', () => {
    it('should return null for unknown type', () => {
      const result = calculateAchievementProgress(
        { type: 'unknown' as never },
        emptyContext
      );
      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should round percentage correctly', () => {
      const result = calculateAchievementProgress(
        { type: 'sessions_completed', threshold: 3 },
        { ...emptyContext, totalSessions: 1 }
      );
      expect(result).toEqual({
        current: 1,
        target: 3,
        percentage: 33,
        label: '1/3 sessions',
      });
    });

    it('should handle large numbers', () => {
      const result = calculateAchievementProgress(
        { type: 'sessions_completed', threshold: 1000 },
        { ...emptyContext, totalSessions: 999 }
      );
      expect(result).toEqual({
        current: 999,
        target: 1000,
        percentage: 100,
        label: '999/1000 sessions',
      });
    });
  });
});
