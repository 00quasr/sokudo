/**
 * SM-2 based spaced repetition engine for Sokudo.
 *
 * Maps typing session performance (WPM + accuracy) to an SM-2 quality
 * rating (0-5), then updates the review schedule accordingly.
 *
 * SM-2 overview:
 * - quality >= 3: correct response, advance interval
 * - quality < 3: incorrect, reset to short interval
 * - easeFactor adjusts based on quality (min 1.3)
 * - interval grows: 1 day -> 6 days -> interval * easeFactor
 */

// ---- Types ----

export interface ReviewCard {
  easeFactor: number; // e.g. 2.5
  interval: number; // days
  repetitions: number;
}

export interface ReviewUpdate {
  easeFactor: number;
  interval: number; // days
  repetitions: number;
  nextReviewAt: Date;
}

export interface SessionQualityInput {
  wpm: number;
  accuracy: number;
  userAvgWpm: number;
}

// ---- Constants ----

export const MIN_EASE_FACTOR = 1.3;
export const DEFAULT_EASE_FACTOR = 2.5;

// ---- Core Algorithm ----

/**
 * Derive an SM-2 quality rating (0-5) from typing session performance.
 *
 * Quality mapping:
 *   5 - excellent:  accuracy >= 95% AND wpm >= userAvg
 *   4 - good:       accuracy >= 90%
 *   3 - acceptable: accuracy >= 80%
 *   2 - difficult:  accuracy >= 70%
 *   1 - poor:       accuracy >= 50%
 *   0 - failure:    accuracy < 50%
 */
export function deriveQuality(input: SessionQualityInput): number {
  const { wpm, accuracy, userAvgWpm } = input;

  if (accuracy >= 95 && userAvgWpm > 0 && wpm >= userAvgWpm) return 5;
  if (accuracy >= 90) return 4;
  if (accuracy >= 80) return 3;
  if (accuracy >= 70) return 2;
  if (accuracy >= 50) return 1;
  return 0;
}

/**
 * Compute the next review state using the SM-2 algorithm.
 */
export function computeNextReview(
  card: ReviewCard,
  quality: number,
  now: Date = new Date()
): ReviewUpdate {
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  if (q < 3) {
    // Failed review: reset repetitions, short interval
    const newEF = Math.max(MIN_EASE_FACTOR, card.easeFactor - 0.2);
    return {
      easeFactor: round2(newEF),
      interval: 1,
      repetitions: 0,
      nextReviewAt: addDays(now, 1),
    };
  }

  // Successful review (quality >= 3)
  let newInterval: number;
  const newRepetitions = card.repetitions + 1;

  if (card.repetitions === 0) {
    newInterval = 1;
  } else if (card.repetitions === 1) {
    newInterval = 6;
  } else {
    newInterval = Math.round(card.interval * card.easeFactor);
  }

  // Update ease factor using SM-2 formula
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  const newEF = Math.max(MIN_EASE_FACTOR, card.easeFactor + delta);

  // Cap interval at 365 days
  newInterval = Math.min(newInterval, 365);

  return {
    easeFactor: round2(newEF),
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewAt: addDays(now, newInterval),
  };
}

// ---- Helpers ----

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
