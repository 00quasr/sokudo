import { describe, it, expect } from 'vitest';
import {
  deriveQuality,
  computeNextReview,
  DEFAULT_EASE_FACTOR,
  MIN_EASE_FACTOR,
  type ReviewCard,
  type SessionQualityInput,
} from '../spaced-repetition';

describe('deriveQuality', () => {
  it('should return 5 for excellent performance (high accuracy + above avg WPM)', () => {
    expect(
      deriveQuality({ wpm: 60, accuracy: 97, userAvgWpm: 50 })
    ).toBe(5);
  });

  it('should return 4 for good accuracy (>= 90%) even with low WPM', () => {
    expect(
      deriveQuality({ wpm: 20, accuracy: 92, userAvgWpm: 50 })
    ).toBe(4);
  });

  it('should return 3 for acceptable accuracy (>= 80%)', () => {
    expect(
      deriveQuality({ wpm: 40, accuracy: 83, userAvgWpm: 50 })
    ).toBe(3);
  });

  it('should return 2 for difficult performance (accuracy >= 70%)', () => {
    expect(
      deriveQuality({ wpm: 30, accuracy: 72, userAvgWpm: 50 })
    ).toBe(2);
  });

  it('should return 1 for poor performance (accuracy >= 50%)', () => {
    expect(
      deriveQuality({ wpm: 20, accuracy: 55, userAvgWpm: 50 })
    ).toBe(1);
  });

  it('should return 0 for failure (accuracy < 50%)', () => {
    expect(
      deriveQuality({ wpm: 10, accuracy: 40, userAvgWpm: 50 })
    ).toBe(0);
  });

  it('should not return 5 if accuracy >= 95 but WPM below avg', () => {
    expect(
      deriveQuality({ wpm: 30, accuracy: 96, userAvgWpm: 50 })
    ).toBe(4);
  });

  it('should return 4 when accuracy is 95 and userAvgWpm is 0 (no history)', () => {
    expect(
      deriveQuality({ wpm: 60, accuracy: 95, userAvgWpm: 0 })
    ).toBe(4);
  });
});

describe('computeNextReview', () => {
  const now = new Date('2025-01-15T12:00:00Z');

  describe('failed review (quality < 3)', () => {
    it('should reset repetitions to 0 and set interval to 1 day', () => {
      const card: ReviewCard = {
        easeFactor: DEFAULT_EASE_FACTOR,
        interval: 10,
        repetitions: 3,
      };

      const result = computeNextReview(card, 2, now);
      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
    });

    it('should decrease ease factor on failure', () => {
      const card: ReviewCard = {
        easeFactor: DEFAULT_EASE_FACTOR,
        interval: 5,
        repetitions: 2,
      };

      const result = computeNextReview(card, 1, now);
      expect(result.easeFactor).toBeLessThan(DEFAULT_EASE_FACTOR);
    });

    it('should not decrease ease factor below MIN_EASE_FACTOR', () => {
      const card: ReviewCard = {
        easeFactor: MIN_EASE_FACTOR,
        interval: 5,
        repetitions: 2,
      };

      const result = computeNextReview(card, 0, now);
      expect(result.easeFactor).toBeGreaterThanOrEqual(MIN_EASE_FACTOR);
    });

    it('should set next review to tomorrow on failure', () => {
      const card: ReviewCard = {
        easeFactor: DEFAULT_EASE_FACTOR,
        interval: 30,
        repetitions: 5,
      };

      const result = computeNextReview(card, 0, now);
      const expected = new Date('2025-01-16T12:00:00Z');
      expect(result.nextReviewAt.getTime()).toBe(expected.getTime());
    });
  });

  describe('successful review (quality >= 3)', () => {
    it('should set interval to 1 for first successful review', () => {
      const card: ReviewCard = {
        easeFactor: DEFAULT_EASE_FACTOR,
        interval: 0,
        repetitions: 0,
      };

      const result = computeNextReview(card, 4, now);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    it('should set interval to 6 for second successful review', () => {
      const card: ReviewCard = {
        easeFactor: DEFAULT_EASE_FACTOR,
        interval: 1,
        repetitions: 1,
      };

      const result = computeNextReview(card, 4, now);
      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
    });

    it('should multiply interval by ease factor for subsequent reviews', () => {
      const card: ReviewCard = {
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      };

      const result = computeNextReview(card, 4, now);
      // 6 * 2.5 = 15
      expect(result.interval).toBe(15);
      expect(result.repetitions).toBe(3);
    });

    it('should cap interval at 365 days', () => {
      const card: ReviewCard = {
        easeFactor: 2.5,
        interval: 200,
        repetitions: 5,
      };

      const result = computeNextReview(card, 5, now);
      expect(result.interval).toBeLessThanOrEqual(365);
    });

    it('should increase ease factor for quality 5', () => {
      const card: ReviewCard = {
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      };

      const result = computeNextReview(card, 5, now);
      expect(result.easeFactor).toBeGreaterThan(2.5);
    });

    it('should not change ease factor much for quality 4', () => {
      const card: ReviewCard = {
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      };

      const result = computeNextReview(card, 4, now);
      // Quality 4: delta = 0.1 - 1 * (0.08 + 1 * 0.02) = 0
      expect(result.easeFactor).toBe(2.5);
    });

    it('should decrease ease factor for quality 3', () => {
      const card: ReviewCard = {
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      };

      const result = computeNextReview(card, 3, now);
      expect(result.easeFactor).toBeLessThan(2.5);
    });

    it('should compute correct next review date', () => {
      const card: ReviewCard = {
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      };

      const result = computeNextReview(card, 4, now);
      // interval = 15 (6 * 2.5), so next review 15 days later
      const expected = new Date('2025-01-30T12:00:00Z');
      expect(result.nextReviewAt.getTime()).toBe(expected.getTime());
    });
  });

  describe('SM-2 progression', () => {
    it('should produce increasing intervals over multiple successful reviews', () => {
      let card: ReviewCard = {
        easeFactor: DEFAULT_EASE_FACTOR,
        interval: 0,
        repetitions: 0,
      };

      const intervals: number[] = [];

      for (let i = 0; i < 6; i++) {
        const result = computeNextReview(card, 4, now);
        intervals.push(result.interval);
        card = {
          easeFactor: result.easeFactor,
          interval: result.interval,
          repetitions: result.repetitions,
        };
      }

      // Intervals should generally increase
      // First: 1, Second: 6, then grow by easeFactor
      expect(intervals[0]).toBe(1);
      expect(intervals[1]).toBe(6);
      for (let i = 2; i < intervals.length; i++) {
        expect(intervals[i]).toBeGreaterThan(intervals[i - 1]);
      }
    });

    it('should reset to short intervals after a failure mid-sequence', () => {
      // Start with a card that has been reviewed several times
      const card: ReviewCard = {
        easeFactor: 2.5,
        interval: 30,
        repetitions: 4,
      };

      // Fail the review
      const result = computeNextReview(card, 1, now);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);

      // Next success should start from beginning again
      const recovery = computeNextReview(
        { easeFactor: result.easeFactor, interval: result.interval, repetitions: result.repetitions },
        4,
        now
      );
      expect(recovery.interval).toBe(1);
      expect(recovery.repetitions).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle quality values outside 0-5 by clamping', () => {
      const card: ReviewCard = {
        easeFactor: DEFAULT_EASE_FACTOR,
        interval: 6,
        repetitions: 2,
      };

      const result = computeNextReview(card, -1, now);
      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);

      const result2 = computeNextReview(card, 7, now);
      expect(result2.repetitions).toBe(3);
    });

    it('should handle decimal quality by rounding', () => {
      const card: ReviewCard = {
        easeFactor: DEFAULT_EASE_FACTOR,
        interval: 0,
        repetitions: 0,
      };

      // 3.7 rounds to 4 -> successful
      const result = computeNextReview(card, 3.7, now);
      expect(result.repetitions).toBe(1);

      // 2.4 rounds to 2 -> failure
      const result2 = computeNextReview(card, 2.4, now);
      expect(result2.repetitions).toBe(0);
    });
  });
});
