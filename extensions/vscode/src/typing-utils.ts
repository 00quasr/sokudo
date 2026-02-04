/**
 * Core typing metrics calculation utilities.
 * These are pure functions with no VS Code dependencies, enabling easy unit testing.
 */

export interface SessionStats {
  wpm: number;
  accuracy: number;
  totalKeystrokes: number;
  errors: number;
  startTime: number | null;
}

/**
 * Calculate WPM from character count and elapsed time.
 * Standard: 1 word = 5 characters.
 */
export function calculateWpm(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  return Math.round((correctChars / 5) / minutes);
}

/**
 * Calculate accuracy percentage.
 */
export function calculateAccuracy(
  correctKeystrokes: number,
  totalKeystrokes: number
): number {
  if (totalKeystrokes === 0) return 100;
  return Math.round((correctKeystrokes / totalKeystrokes) * 100);
}

/**
 * Format a duration in milliseconds to a human-readable string.
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
