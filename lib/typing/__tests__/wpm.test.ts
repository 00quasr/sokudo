import { describe, it, expect } from 'vitest';
import {
  calculateWpm,
  calculateRawWpm,
  calculateNetWpm,
  calculateAccuracy,
  msToMinutes,
  wpmToCharsPerSecond,
  charsPerSecondToWpm,
  calculateLatencyStats,
  CHARS_PER_WORD,
} from '../wpm';

describe('wpm utilities', () => {
  describe('CHARS_PER_WORD constant', () => {
    it('should be 5 (standard word length)', () => {
      expect(CHARS_PER_WORD).toBe(5);
    });
  });

  describe('calculateWpm', () => {
    it('should calculate WPM correctly for 1 minute', () => {
      // 50 characters in 1 minute = 10 words per minute
      expect(calculateWpm(50, 60000)).toBe(10);
    });

    it('should calculate WPM correctly for 30 seconds', () => {
      // 25 characters in 30 seconds = 10 WPM
      expect(calculateWpm(25, 30000)).toBe(10);
    });

    it('should calculate WPM correctly for 2 minutes', () => {
      // 100 characters in 2 minutes = 10 WPM
      expect(calculateWpm(100, 120000)).toBe(10);
    });

    it('should return 0 for 0 duration', () => {
      expect(calculateWpm(50, 0)).toBe(0);
    });

    it('should return 0 for negative duration', () => {
      expect(calculateWpm(50, -1000)).toBe(0);
    });

    it('should return 0 for negative characters', () => {
      expect(calculateWpm(-10, 60000)).toBe(0);
    });

    it('should return 0 for 0 characters', () => {
      expect(calculateWpm(0, 60000)).toBe(0);
    });

    it('should round to nearest integer', () => {
      // 7 characters in 1 minute = 1.4 WPM -> rounds to 1
      expect(calculateWpm(7, 60000)).toBe(1);

      // 8 characters in 1 minute = 1.6 WPM -> rounds to 2
      expect(calculateWpm(8, 60000)).toBe(2);
    });

    it('should handle very short durations (high WPM)', () => {
      // 5 characters in 1 second = 60 WPM
      expect(calculateWpm(5, 1000)).toBe(60);
    });

    it('should handle typical typing speeds', () => {
      // Average typist: ~40 WPM = 200 chars/min = ~3.33 chars/sec
      // 200 characters in 1 minute
      expect(calculateWpm(200, 60000)).toBe(40);

      // Professional typist: ~80 WPM = 400 chars/min
      expect(calculateWpm(400, 60000)).toBe(80);

      // Expert typist: ~100 WPM = 500 chars/min
      expect(calculateWpm(500, 60000)).toBe(100);
    });

    it('should handle real-world typing session (12 seconds)', () => {
      // 30 characters in 12 seconds
      // 30/5 = 6 words, 12 seconds = 0.2 minutes
      // WPM = 6 / 0.2 = 30
      expect(calculateWpm(30, 12000)).toBe(30);
    });

    it('should handle fractional calculations correctly', () => {
      // 23 characters in 45 seconds
      // 23/5 = 4.6 words, 45000ms = 0.75 minutes
      // WPM = 4.6 / 0.75 = 6.133... -> rounds to 6
      expect(calculateWpm(23, 45000)).toBe(6);
    });
  });

  describe('calculateRawWpm', () => {
    it('should calculate raw WPM including errors', () => {
      // 60 total keystrokes (including errors) in 1 minute = 12 raw WPM
      expect(calculateRawWpm(60, 60000)).toBe(12);
    });

    it('should return 0 for invalid inputs', () => {
      expect(calculateRawWpm(50, 0)).toBe(0);
      expect(calculateRawWpm(50, -1000)).toBe(0);
    });

    it('should behave the same as calculateWpm', () => {
      // Raw WPM is just WPM with total keystrokes instead of correct chars
      expect(calculateRawWpm(100, 60000)).toBe(calculateWpm(100, 60000));
    });
  });

  describe('calculateNetWpm', () => {
    it('should calculate net WPM accounting for errors', () => {
      // 50 total chars, 2 errors, 1 minute
      // Gross words: 50/5 = 10
      // Net words: 10 - 2 = 8
      // Net WPM: 8
      expect(calculateNetWpm(50, 2, 60000)).toBe(8);
    });

    it('should return 0 when errors exceed gross words', () => {
      // 10 chars = 2 words, 5 errors
      // Net words: 2 - 5 = -3 -> clamped to 0
      expect(calculateNetWpm(10, 5, 60000)).toBe(0);
    });

    it('should return gross WPM when no errors', () => {
      expect(calculateNetWpm(50, 0, 60000)).toBe(10);
    });

    it('should return 0 for invalid duration', () => {
      expect(calculateNetWpm(50, 2, 0)).toBe(0);
      expect(calculateNetWpm(50, 2, -1000)).toBe(0);
    });

    it('should return 0 for negative characters', () => {
      expect(calculateNetWpm(-10, 2, 60000)).toBe(0);
    });
  });

  describe('calculateAccuracy', () => {
    it('should return 100% for perfect accuracy', () => {
      expect(calculateAccuracy(100, 100)).toBe(100);
    });

    it('should calculate accuracy percentage correctly', () => {
      expect(calculateAccuracy(75, 100)).toBe(75);
      expect(calculateAccuracy(9, 10)).toBe(90);
      expect(calculateAccuracy(1, 2)).toBe(50);
    });

    it('should return 100% when no characters typed', () => {
      expect(calculateAccuracy(0, 0)).toBe(100);
    });

    it('should return 0% for all errors', () => {
      expect(calculateAccuracy(0, 10)).toBe(0);
    });

    it('should return 0 for negative inputs', () => {
      expect(calculateAccuracy(-5, 10)).toBe(0);
      expect(calculateAccuracy(5, -10)).toBe(0);
    });

    it('should round to nearest integer', () => {
      // 2/3 = 66.67% -> rounds to 67%
      expect(calculateAccuracy(2, 3)).toBe(67);

      // 1/3 = 33.33% -> rounds to 33%
      expect(calculateAccuracy(1, 3)).toBe(33);
    });

    it('should handle typical accuracy values', () => {
      // 95% accuracy
      expect(calculateAccuracy(95, 100)).toBe(95);

      // 98% accuracy
      expect(calculateAccuracy(98, 100)).toBe(98);
    });
  });

  describe('msToMinutes', () => {
    it('should convert milliseconds to minutes', () => {
      expect(msToMinutes(60000)).toBe(1);
      expect(msToMinutes(30000)).toBe(0.5);
      expect(msToMinutes(120000)).toBe(2);
    });

    it('should handle 0', () => {
      expect(msToMinutes(0)).toBe(0);
    });

    it('should handle fractional values', () => {
      expect(msToMinutes(45000)).toBe(0.75);
      expect(msToMinutes(15000)).toBe(0.25);
    });
  });

  describe('wpmToCharsPerSecond', () => {
    it('should convert WPM to characters per second', () => {
      // 60 WPM = 300 chars/min = 5 chars/sec
      expect(wpmToCharsPerSecond(60)).toBe(5);
    });

    it('should handle 0 WPM', () => {
      expect(wpmToCharsPerSecond(0)).toBe(0);
    });

    it('should handle typical WPM values', () => {
      // 40 WPM = 200 chars/min = 3.33 chars/sec
      expect(wpmToCharsPerSecond(40)).toBeCloseTo(3.333, 2);

      // 100 WPM = 500 chars/min = 8.33 chars/sec
      expect(wpmToCharsPerSecond(100)).toBeCloseTo(8.333, 2);
    });
  });

  describe('charsPerSecondToWpm', () => {
    it('should convert characters per second to WPM', () => {
      // 5 chars/sec = 300 chars/min = 60 WPM
      expect(charsPerSecondToWpm(5)).toBe(60);
    });

    it('should handle 0 CPS', () => {
      expect(charsPerSecondToWpm(0)).toBe(0);
    });

    it('should round to nearest integer', () => {
      // 3.33 chars/sec = ~40 WPM
      expect(charsPerSecondToWpm(3.33)).toBe(40);
    });

    it('should be inverse of wpmToCharsPerSecond (approximately)', () => {
      const wpm = 60;
      const cps = wpmToCharsPerSecond(wpm);
      expect(charsPerSecondToWpm(cps)).toBe(wpm);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete typing session metrics', () => {
      // Scenario: User types "git commit -m 'fix'" (20 chars) in 12 seconds
      // with 2 errors (18 correct, 20 total)
      const totalChars = 20;
      const correctChars = 18;
      const durationMs = 12000;
      const errors = 2;

      const wpm = calculateWpm(correctChars, durationMs);
      const rawWpm = calculateRawWpm(totalChars, durationMs);
      const netWpm = calculateNetWpm(totalChars, errors, durationMs);
      const accuracy = calculateAccuracy(correctChars, totalChars);

      // WPM: 18/5 = 3.6 words in 0.2 min = 18 WPM
      expect(wpm).toBe(18);

      // Raw WPM: 20/5 = 4 words in 0.2 min = 20 WPM
      expect(rawWpm).toBe(20);

      // Net WPM: (4 - 2) = 2 words in 0.2 min = 10 WPM
      expect(netWpm).toBe(10);

      // Accuracy: 18/20 = 90%
      expect(accuracy).toBe(90);
    });

    it('should handle very fast typist', () => {
      // 150 WPM typist, 750 chars in 1 minute
      const correctChars = 750;
      const durationMs = 60000;

      expect(calculateWpm(correctChars, durationMs)).toBe(150);
    });

    it('should handle slow beginner', () => {
      // 10 chars in 30 seconds
      // 10/5 = 2 words in 0.5 min = 4 WPM
      expect(calculateWpm(10, 30000)).toBe(4);
    });
  });

  describe('calculateLatencyStats', () => {
    it('should return zero stats for empty array', () => {
      const stats = calculateLatencyStats([]);
      expect(stats).toEqual({
        avgLatencyMs: 0,
        minLatencyMs: 0,
        maxLatencyMs: 0,
        stdDevLatencyMs: 0,
        p50LatencyMs: 0,
        p95LatencyMs: 0,
      });
    });

    it('should handle array with only first keystroke (latency 0)', () => {
      // First keystroke always has latency 0, but if it's the only value
      // and is 0, we filter it out
      const stats = calculateLatencyStats([0]);
      expect(stats.avgLatencyMs).toBe(0);
    });

    it('should calculate average latency correctly', () => {
      // [0, 100, 200, 300] -> avg of [100, 200, 300] = 200
      const stats = calculateLatencyStats([0, 100, 200, 300]);
      expect(stats.avgLatencyMs).toBe(200);
    });

    it('should calculate min and max latency', () => {
      const stats = calculateLatencyStats([0, 50, 100, 150, 200]);
      expect(stats.minLatencyMs).toBe(50);
      expect(stats.maxLatencyMs).toBe(200);
    });

    it('should calculate standard deviation', () => {
      // [0, 100, 100, 100, 100] -> all same values, stdDev = 0
      const stats = calculateLatencyStats([0, 100, 100, 100, 100]);
      expect(stats.stdDevLatencyMs).toBe(0);
    });

    it('should calculate non-zero standard deviation', () => {
      // [0, 100, 200] -> mean = 150, variance = ((50^2 + 50^2) / 2) = 2500, stdDev = 50
      const stats = calculateLatencyStats([0, 100, 200]);
      expect(stats.stdDevLatencyMs).toBe(50);
    });

    it('should calculate p50 (median) latency', () => {
      // [0, 100, 150, 200, 250] -> valid latencies [100, 150, 200, 250] (4 elements)
      // sorted [100, 150, 200, 250], p50 index = floor(4 * 0.5) = 2 -> 200
      const stats = calculateLatencyStats([0, 100, 150, 200, 250]);
      expect(stats.p50LatencyMs).toBe(200);
    });

    it('should calculate p95 latency', () => {
      // 20 values (excluding first 0): indices 0-19
      // p95 index = floor(20 * 0.95) = 19
      const latencies = [0, ...Array.from({ length: 20 }, (_, i) => (i + 1) * 10)];
      const stats = calculateLatencyStats(latencies);
      expect(stats.p95LatencyMs).toBe(200);
    });

    it('should handle realistic typing session latencies', () => {
      // Simulate typing "hello" with varying speeds
      const latencies = [0, 120, 95, 110, 105]; // First keystroke is 0
      const stats = calculateLatencyStats(latencies);

      // avg of [120, 95, 110, 105] = 430 / 4 = 107.5 -> 108
      expect(stats.avgLatencyMs).toBe(108);
      expect(stats.minLatencyMs).toBe(95);
      expect(stats.maxLatencyMs).toBe(120);
    });

    it('should handle single keystroke after first', () => {
      const stats = calculateLatencyStats([0, 150]);
      expect(stats.avgLatencyMs).toBe(150);
      expect(stats.minLatencyMs).toBe(150);
      expect(stats.maxLatencyMs).toBe(150);
      expect(stats.stdDevLatencyMs).toBe(0);
      expect(stats.p50LatencyMs).toBe(150);
      expect(stats.p95LatencyMs).toBe(150);
    });

    it('should handle all non-zero latencies (started mid-session)', () => {
      // Edge case where all values are non-zero
      const stats = calculateLatencyStats([100, 150, 200]);
      expect(stats.avgLatencyMs).toBe(150);
      expect(stats.minLatencyMs).toBe(100);
      expect(stats.maxLatencyMs).toBe(200);
    });

    it('should round average and stdDev to integers', () => {
      // [0, 100, 101] -> avg = 100.5, should round to 101
      const stats = calculateLatencyStats([0, 100, 101]);
      expect(stats.avgLatencyMs).toBe(101);
    });
  });
});
