import { describe, it, expect } from 'vitest';
import { analyzeWeaknesses } from '../analyze';
import type { KeyAccuracy, CharErrorPattern } from '@/lib/db/schema';
import type { SequenceErrorData } from '@/lib/db/queries';

function createKeyAccuracy(
  key: string,
  totalPresses: number,
  correctPresses: number,
  avgLatencyMs: number
): KeyAccuracy {
  return {
    id: 1,
    userId: 1,
    key,
    totalPresses,
    correctPresses,
    avgLatencyMs,
  };
}

function createCharError(
  expected: string,
  actual: string,
  count: number
): CharErrorPattern {
  return {
    id: 1,
    userId: 1,
    expectedChar: expected,
    actualChar: actual,
    count,
  };
}

function createSequenceError(
  sequence: string,
  totalAttempts: number,
  errorCount: number,
  avgLatencyMs: number
): SequenceErrorData {
  return {
    sequence,
    totalAttempts,
    errorCount,
    errorRate: Math.round((errorCount / totalAttempts) * 100),
    avgLatencyMs,
  };
}

describe('analyzeWeaknesses', () => {
  describe('with empty data', () => {
    it('should return empty report when no data', () => {
      const report = analyzeWeaknesses([], [], []);
      expect(report.weakestKeys).toEqual([]);
      expect(report.slowestKeys).toEqual([]);
      expect(report.commonTypos).toEqual([]);
      expect(report.problemSequences).toEqual([]);
      expect(report.summary.totalKeysTracked).toBe(0);
      expect(report.summary.topWeakness).toBeNull();
    });
  });

  describe('weakest keys', () => {
    it('should sort keys by accuracy ascending', () => {
      const keys = [
        createKeyAccuracy('a', 100, 95, 80),
        createKeyAccuracy('s', 100, 70, 90),
        createKeyAccuracy('d', 100, 85, 100),
      ];

      const report = analyzeWeaknesses(keys, [], []);
      expect(report.weakestKeys[0].key).toBe('s');
      expect(report.weakestKeys[0].accuracy).toBe(70);
      expect(report.weakestKeys[1].key).toBe('d');
      expect(report.weakestKeys[2].key).toBe('a');
    });

    it('should filter out keys with fewer than 5 presses', () => {
      const keys = [
        createKeyAccuracy('a', 100, 95, 80),
        createKeyAccuracy('b', 3, 1, 90),
      ];

      const report = analyzeWeaknesses(keys, [], []);
      expect(report.weakestKeys).toHaveLength(1);
      expect(report.weakestKeys[0].key).toBe('a');
    });

    it('should respect limit option', () => {
      const keys = Array.from({ length: 20 }, (_, i) =>
        createKeyAccuracy(String.fromCharCode(97 + i), 100, 90, 100)
      );

      const report = analyzeWeaknesses(keys, [], [], { weakKeyLimit: 5 });
      expect(report.weakestKeys).toHaveLength(5);
    });

    it('should calculate accuracy correctly', () => {
      const keys = [createKeyAccuracy('x', 200, 150, 100)];
      const report = analyzeWeaknesses(keys, [], []);
      expect(report.weakestKeys[0].accuracy).toBe(75);
    });
  });

  describe('slowest keys', () => {
    it('should sort keys by latency descending', () => {
      const keys = [
        createKeyAccuracy('a', 100, 95, 80),
        createKeyAccuracy('s', 100, 95, 200),
        createKeyAccuracy('d', 100, 95, 120),
      ];

      const report = analyzeWeaknesses(keys, [], []);
      expect(report.slowestKeys[0].key).toBe('s');
      expect(report.slowestKeys[0].avgLatencyMs).toBe(200);
      expect(report.slowestKeys[1].key).toBe('d');
      expect(report.slowestKeys[2].key).toBe('a');
    });

    it('should filter out keys with fewer than 5 presses', () => {
      const keys = [
        createKeyAccuracy('a', 100, 95, 300),
        createKeyAccuracy('b', 2, 1, 500),
      ];

      const report = analyzeWeaknesses(keys, [], []);
      expect(report.slowestKeys).toHaveLength(1);
      expect(report.slowestKeys[0].key).toBe('a');
    });

    it('should respect limit option', () => {
      const keys = Array.from({ length: 20 }, (_, i) =>
        createKeyAccuracy(String.fromCharCode(97 + i), 100, 90, 100 + i * 10)
      );

      const report = analyzeWeaknesses(keys, [], [], { slowKeyLimit: 3 });
      expect(report.slowestKeys).toHaveLength(3);
    });
  });

  describe('common typos', () => {
    it('should sort by count descending', () => {
      const errors = [
        createCharError('a', 's', 5),
        createCharError('d', 'f', 20),
        createCharError('j', 'k', 10),
      ];

      const report = analyzeWeaknesses([], errors, []);
      expect(report.commonTypos[0].expected).toBe('d');
      expect(report.commonTypos[0].count).toBe(20);
      expect(report.commonTypos[1].expected).toBe('j');
      expect(report.commonTypos[2].expected).toBe('a');
    });

    it('should respect limit option', () => {
      const errors = Array.from({ length: 20 }, (_, i) =>
        createCharError(String.fromCharCode(97 + i), 'x', 10)
      );

      const report = analyzeWeaknesses([], errors, [], { typoLimit: 5 });
      expect(report.commonTypos).toHaveLength(5);
    });

    it('should map fields correctly', () => {
      const errors = [createCharError('a', 's', 15)];
      const report = analyzeWeaknesses([], errors, []);
      expect(report.commonTypos[0]).toEqual({
        expected: 'a',
        actual: 's',
        count: 15,
      });
    });
  });

  describe('problem sequences', () => {
    it('should include sequences in report', () => {
      const sequences = [
        createSequenceError('qu', 50, 25, 150),
        createSequenceError('th', 100, 10, 80),
      ];

      const report = analyzeWeaknesses([], [], sequences);
      expect(report.problemSequences).toHaveLength(2);
      expect(report.problemSequences[0].sequence).toBe('qu');
    });

    it('should respect limit option', () => {
      const sequences = Array.from({ length: 20 }, (_, i) =>
        createSequenceError(`s${i}`, 50, 10, 100)
      );

      const report = analyzeWeaknesses([], [], sequences, { sequenceLimit: 3 });
      expect(report.problemSequences).toHaveLength(3);
    });
  });

  describe('summary', () => {
    it('should calculate overall accuracy from all significant keys', () => {
      const keys = [
        createKeyAccuracy('a', 100, 90, 80),
        createKeyAccuracy('s', 100, 80, 90),
      ];

      const report = analyzeWeaknesses(keys, [], []);
      // (90 + 80) / (100 + 100) = 170 / 200 = 85%
      expect(report.summary.overallAccuracy).toBe(85);
    });

    it('should calculate weighted average latency', () => {
      const keys = [
        createKeyAccuracy('a', 100, 90, 80),
        createKeyAccuracy('s', 100, 90, 120),
      ];

      const report = analyzeWeaknesses(keys, [], []);
      // (80*100 + 120*100) / (100 + 100) = 20000/200 = 100
      expect(report.summary.avgLatencyMs).toBe(100);
    });

    it('should count keys needing work (below 90% accuracy)', () => {
      const keys = [
        createKeyAccuracy('a', 100, 95, 80),  // 95% - OK
        createKeyAccuracy('s', 100, 85, 90),  // 85% - needs work
        createKeyAccuracy('d', 100, 70, 100), // 70% - needs work
      ];

      const report = analyzeWeaknesses(keys, [], []);
      expect(report.summary.keysNeedingWork).toBe(2);
    });

    it('should count sequences needing work (error rate >= 20%)', () => {
      const sequences = [
        createSequenceError('qu', 50, 15, 150), // 30% - needs work
        createSequenceError('th', 100, 10, 80),  // 10% - OK
        createSequenceError('gh', 40, 10, 140),  // 25% - needs work
      ];

      const report = analyzeWeaknesses([], [], sequences);
      expect(report.summary.sequencesNeedingWork).toBe(2);
    });

    it('should identify top weakness as worst key when keys need work', () => {
      const keys = [
        createKeyAccuracy('a', 100, 95, 80),
        createKeyAccuracy('x', 100, 60, 90),
      ];

      const report = analyzeWeaknesses(keys, [], []);
      expect(report.summary.topWeakness).toBe('Key "X" at 60% accuracy');
    });

    it('should identify top weakness as worst sequence when no keys need work', () => {
      const keys = [
        createKeyAccuracy('a', 100, 95, 80),
      ];
      const sequences = [
        createSequenceError('qu', 50, 15, 150), // 30% error rate
      ];

      const report = analyzeWeaknesses(keys, [], sequences);
      expect(report.summary.topWeakness).toBe('Sequence "qu" at 30% error rate');
    });

    it('should have null topWeakness when everything is fine', () => {
      const keys = [
        createKeyAccuracy('a', 100, 98, 80),
      ];
      const sequences = [
        createSequenceError('th', 100, 5, 80), // 5% error rate - OK
      ];

      const report = analyzeWeaknesses(keys, [], sequences);
      expect(report.summary.topWeakness).toBeNull();
    });

    it('should format space key label in topWeakness', () => {
      const keys = [
        createKeyAccuracy(' ', 100, 60, 80),
      ];

      const report = analyzeWeaknesses(keys, [], []);
      expect(report.summary.topWeakness).toBe('Key "Space" at 60% accuracy');
    });

    it('should return zero summary for empty data', () => {
      const report = analyzeWeaknesses([], [], []);
      expect(report.summary.overallAccuracy).toBe(0);
      expect(report.summary.avgLatencyMs).toBe(0);
      expect(report.summary.totalKeysTracked).toBe(0);
      expect(report.summary.keysNeedingWork).toBe(0);
      expect(report.summary.sequencesNeedingWork).toBe(0);
    });
  });
});
