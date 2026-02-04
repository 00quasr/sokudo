/**
 * WPM (Words Per Minute) calculation utilities for typing metrics.
 *
 * Standard word length is defined as 5 characters.
 * WPM = (correctChars / 5) / minutes
 */

export const CHARS_PER_WORD = 5;

/**
 * Calculate WPM (Words Per Minute) based on correct characters typed.
 *
 * @param correctChars - Number of correctly typed characters
 * @param durationMs - Duration in milliseconds
 * @returns WPM rounded to nearest integer, or 0 if duration is invalid
 *
 * @example
 * // 50 correct characters in 1 minute = 10 WPM
 * calculateWpm(50, 60000) // => 10
 *
 * // 25 correct characters in 30 seconds = 10 WPM
 * calculateWpm(25, 30000) // => 10
 */
export function calculateWpm(correctChars: number, durationMs: number): number {
  if (durationMs <= 0) return 0;
  if (correctChars < 0) return 0;

  const minutes = durationMs / 60000;
  const words = correctChars / CHARS_PER_WORD;

  return Math.round(words / minutes);
}

/**
 * Calculate raw WPM including all keystrokes (correct and incorrect).
 *
 * @param totalKeystrokes - Total number of keystrokes (including errors)
 * @param durationMs - Duration in milliseconds
 * @returns Raw WPM rounded to nearest integer
 */
export function calculateRawWpm(
  totalKeystrokes: number,
  durationMs: number
): number {
  return calculateWpm(totalKeystrokes, durationMs);
}

/**
 * Calculate net WPM accounting for errors.
 * Net WPM = ((totalChars / 5) - errors) / minutes
 *
 * @param totalChars - Total characters typed
 * @param errors - Number of errors (uncorrected)
 * @param durationMs - Duration in milliseconds
 * @returns Net WPM, minimum 0
 */
export function calculateNetWpm(
  totalChars: number,
  errors: number,
  durationMs: number
): number {
  if (durationMs <= 0) return 0;
  if (totalChars < 0) return 0;

  const minutes = durationMs / 60000;
  const grossWords = totalChars / CHARS_PER_WORD;
  const netWords = grossWords - errors;

  return Math.max(0, Math.round(netWords / minutes));
}

/**
 * Calculate accuracy as a percentage.
 *
 * @param correctChars - Number of correct characters
 * @param totalChars - Total characters typed
 * @returns Accuracy percentage (0-100), rounded to nearest integer
 */
export function calculateAccuracy(
  correctChars: number,
  totalChars: number
): number {
  if (totalChars === 0) return 100;
  if (correctChars < 0 || totalChars < 0) return 0;

  return Math.round((correctChars / totalChars) * 100);
}

/**
 * Convert milliseconds to minutes.
 *
 * @param ms - Duration in milliseconds
 * @returns Duration in minutes
 */
export function msToMinutes(ms: number): number {
  return ms / 60000;
}

/**
 * Convert WPM to characters per second.
 *
 * @param wpm - Words per minute
 * @returns Characters per second
 */
export function wpmToCharsPerSecond(wpm: number): number {
  // WPM * 5 chars/word / 60 seconds
  return (wpm * CHARS_PER_WORD) / 60;
}

/**
 * Convert characters per second to WPM.
 *
 * @param cps - Characters per second
 * @returns Words per minute
 */
export function charsPerSecondToWpm(cps: number): number {
  // CPS * 60 seconds / 5 chars/word
  return Math.round((cps * 60) / CHARS_PER_WORD);
}

/**
 * Latency statistics for a typing session.
 */
export interface LatencyStats {
  /** Average latency in milliseconds */
  avgLatencyMs: number;
  /** Minimum latency in milliseconds */
  minLatencyMs: number;
  /** Maximum latency in milliseconds */
  maxLatencyMs: number;
  /** Standard deviation of latency in milliseconds */
  stdDevLatencyMs: number;
  /** p50 (median) latency in milliseconds */
  p50LatencyMs: number;
  /** p95 latency in milliseconds */
  p95LatencyMs: number;
}

/**
 * Calculate latency statistics from an array of latency values.
 * Excludes the first keystroke (latency 0) from calculations.
 *
 * @param latencies - Array of latency values in milliseconds
 * @returns LatencyStats object with calculated statistics
 *
 * @example
 * calculateLatencyStats([0, 100, 150, 120, 130])
 * // Returns stats based on [100, 150, 120, 130] (first keystroke excluded)
 */
export function calculateLatencyStats(latencies: number[]): LatencyStats {
  // Filter out the first keystroke (latency 0) and any invalid values
  const validLatencies = latencies.filter((l, i) => i > 0 || l > 0);

  if (validLatencies.length === 0) {
    return {
      avgLatencyMs: 0,
      minLatencyMs: 0,
      maxLatencyMs: 0,
      stdDevLatencyMs: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
    };
  }

  // Sort for percentile calculations
  const sorted = [...validLatencies].sort((a, b) => a - b);

  // Calculate average
  const sum = validLatencies.reduce((acc, l) => acc + l, 0);
  const avg = sum / validLatencies.length;

  // Calculate standard deviation
  const squaredDiffs = validLatencies.map((l) => Math.pow(l - avg, 2));
  const avgSquaredDiff = squaredDiffs.reduce((acc, d) => acc + d, 0) / validLatencies.length;
  const stdDev = Math.sqrt(avgSquaredDiff);

  // Calculate percentiles
  const p50Index = Math.floor(sorted.length * 0.5);
  const p95Index = Math.min(Math.floor(sorted.length * 0.95), sorted.length - 1);

  return {
    avgLatencyMs: Math.round(avg),
    minLatencyMs: sorted[0],
    maxLatencyMs: sorted[sorted.length - 1],
    stdDevLatencyMs: Math.round(stdDev),
    p50LatencyMs: sorted[p50Index],
    p95LatencyMs: sorted[p95Index],
  };
}
