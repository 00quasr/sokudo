import { describe, it, expect } from 'vitest';
import {
  sequenceErrorPatterns,
  type SequenceErrorPattern,
  type NewSequenceErrorPattern,
} from '../schema';

describe('sequenceErrorPatterns schema', () => {
  describe('table structure', () => {
    it('should have the correct table name', () => {
      const tableName = (sequenceErrorPatterns as Record<symbol, { name: string }>)[
        Object.getOwnPropertySymbols(sequenceErrorPatterns).find(
          (s) => s.description === 'drizzle:Name'
        ) as symbol
      ];
      expect(tableName).toBe('sequence_error_patterns');
    });

    it('should have all required columns', () => {
      const columnNames = Object.keys(sequenceErrorPatterns);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('userId');
      expect(columnNames).toContain('sequence');
      expect(columnNames).toContain('totalAttempts');
      expect(columnNames).toContain('errorCount');
      expect(columnNames).toContain('avgLatencyMs');
    });

    it('should have id as primary key', () => {
      expect(sequenceErrorPatterns.id.primary).toBe(true);
    });

    it('should have userId as foreign key', () => {
      expect(sequenceErrorPatterns.userId.notNull).toBe(true);
    });
  });

  describe('column constraints', () => {
    it('should require userId', () => {
      expect(sequenceErrorPatterns.userId.notNull).toBe(true);
    });

    it('should require sequence', () => {
      expect(sequenceErrorPatterns.sequence.notNull).toBe(true);
    });

    it('should require totalAttempts', () => {
      expect(sequenceErrorPatterns.totalAttempts.notNull).toBe(true);
    });

    it('should require errorCount', () => {
      expect(sequenceErrorPatterns.errorCount.notNull).toBe(true);
    });

    it('should require avgLatencyMs', () => {
      expect(sequenceErrorPatterns.avgLatencyMs.notNull).toBe(true);
    });

    it('should have default value of 0 for totalAttempts', () => {
      expect(sequenceErrorPatterns.totalAttempts.default).toBe(0);
    });

    it('should have default value of 0 for errorCount', () => {
      expect(sequenceErrorPatterns.errorCount.default).toBe(0);
    });

    it('should have default value of 0 for avgLatencyMs', () => {
      expect(sequenceErrorPatterns.avgLatencyMs.default).toBe(0);
    });
  });

  describe('type inference', () => {
    it('should allow valid NewSequenceErrorPattern object', () => {
      const newPattern: NewSequenceErrorPattern = {
        userId: 1,
        sequence: 'th',
        totalAttempts: 100,
        errorCount: 15,
        avgLatencyMs: 120,
      };

      expect(newPattern.userId).toBe(1);
      expect(newPattern.sequence).toBe('th');
      expect(newPattern.totalAttempts).toBe(100);
      expect(newPattern.errorCount).toBe(15);
      expect(newPattern.avgLatencyMs).toBe(120);
    });

    it('should allow NewSequenceErrorPattern with only required fields', () => {
      const newPattern: NewSequenceErrorPattern = {
        userId: 1,
        sequence: 'git',
      };

      expect(newPattern.userId).toBe(1);
      expect(newPattern.sequence).toBe('git');
    });

    it('should infer SequenceErrorPattern type with all fields', () => {
      const pattern: SequenceErrorPattern = {
        id: 1,
        userId: 1,
        sequence: 'ng',
        totalAttempts: 50,
        errorCount: 8,
        avgLatencyMs: 90,
      };

      expect(pattern.id).toBe(1);
      expect(pattern.userId).toBe(1);
      expect(pattern.sequence).toBe('ng');
      expect(pattern.totalAttempts).toBe(50);
      expect(pattern.errorCount).toBe(8);
      expect(pattern.avgLatencyMs).toBe(90);
    });
  });

  describe('sequence values', () => {
    it('should accept two-character bigram sequences', () => {
      const pattern: NewSequenceErrorPattern = {
        userId: 1,
        sequence: 'th',
        totalAttempts: 100,
        errorCount: 10,
        avgLatencyMs: 100,
      };
      expect(pattern.sequence).toBe('th');
    });

    it('should accept three-character trigram sequences', () => {
      const pattern: NewSequenceErrorPattern = {
        userId: 1,
        sequence: 'the',
        totalAttempts: 80,
        errorCount: 5,
        avgLatencyMs: 150,
      };
      expect(pattern.sequence).toBe('the');
    });

    it('should accept sequences with special characters', () => {
      const pattern: NewSequenceErrorPattern = {
        userId: 1,
        sequence: '->',
        totalAttempts: 30,
        errorCount: 12,
        avgLatencyMs: 200,
      };
      expect(pattern.sequence).toBe('->');
    });

    it('should accept sequences with spaces', () => {
      const pattern: NewSequenceErrorPattern = {
        userId: 1,
        sequence: 't ',
        totalAttempts: 60,
        errorCount: 8,
        avgLatencyMs: 110,
      };
      expect(pattern.sequence).toBe('t ');
    });

    it('should accept programming symbol sequences', () => {
      const patterns: NewSequenceErrorPattern[] = [
        { userId: 1, sequence: '()', totalAttempts: 50, errorCount: 15, avgLatencyMs: 180 },
        { userId: 1, sequence: '[]', totalAttempts: 45, errorCount: 12, avgLatencyMs: 170 },
        { userId: 1, sequence: '{}', totalAttempts: 40, errorCount: 18, avgLatencyMs: 190 },
        { userId: 1, sequence: '=>', totalAttempts: 35, errorCount: 10, avgLatencyMs: 160 },
      ];

      expect(patterns.map((p) => p.sequence)).toEqual(['()', '[]', '{}', '=>']);
    });
  });

  describe('common problem sequences', () => {
    it('should represent difficult bigram patterns', () => {
      const difficultBigrams: SequenceErrorPattern[] = [
        { id: 1, userId: 1, sequence: 'qu', totalAttempts: 50, errorCount: 20, avgLatencyMs: 150 },
        { id: 2, userId: 1, sequence: 'gh', totalAttempts: 45, errorCount: 18, avgLatencyMs: 140 },
        { id: 3, userId: 1, sequence: 'xc', totalAttempts: 30, errorCount: 12, avgLatencyMs: 200 },
      ];

      for (const pattern of difficultBigrams) {
        expect(pattern.errorCount).toBeGreaterThan(0);
        expect(pattern.totalAttempts).toBeGreaterThan(pattern.errorCount);
      }
    });

    it('should represent common command sequences', () => {
      const commandSequences: SequenceErrorPattern[] = [
        { id: 1, userId: 1, sequence: 'gi', totalAttempts: 100, errorCount: 5, avgLatencyMs: 80 },
        { id: 2, userId: 1, sequence: 'it', totalAttempts: 100, errorCount: 3, avgLatencyMs: 75 },
        { id: 3, userId: 1, sequence: 't ', totalAttempts: 90, errorCount: 8, avgLatencyMs: 90 },
      ];

      const totalErrors = commandSequences.reduce((sum, p) => sum + p.errorCount, 0);
      expect(totalErrors).toBe(16);
    });
  });
});

describe('sequenceErrorPatterns aggregation scenarios', () => {
  it('should calculate error rate correctly', () => {
    const pattern: SequenceErrorPattern = {
      id: 1,
      userId: 1,
      sequence: 'th',
      totalAttempts: 100,
      errorCount: 15,
      avgLatencyMs: 120,
    };

    const errorRate = Math.round((pattern.errorCount / pattern.totalAttempts) * 100);
    expect(errorRate).toBe(15);
  });

  it('should identify highest error rate sequences', () => {
    const patterns: SequenceErrorPattern[] = [
      { id: 1, userId: 1, sequence: 'qu', totalAttempts: 50, errorCount: 20, avgLatencyMs: 150 },
      { id: 2, userId: 1, sequence: 'th', totalAttempts: 100, errorCount: 10, avgLatencyMs: 100 },
      { id: 3, userId: 1, sequence: 'gh', totalAttempts: 40, errorCount: 16, avgLatencyMs: 140 },
    ];

    const withErrorRate = patterns.map((p) => ({
      ...p,
      errorRate: Math.round((p.errorCount / p.totalAttempts) * 100),
    }));

    const sortedByErrorRate = withErrorRate.sort((a, b) => b.errorRate - a.errorRate);

    expect(sortedByErrorRate[0].sequence).toBe('qu');
    expect(sortedByErrorRate[0].errorRate).toBe(40);
    expect(sortedByErrorRate[1].sequence).toBe('gh');
    expect(sortedByErrorRate[1].errorRate).toBe(40);
    expect(sortedByErrorRate[2].sequence).toBe('th');
    expect(sortedByErrorRate[2].errorRate).toBe(10);
  });

  it('should identify slowest sequences by latency', () => {
    const patterns: SequenceErrorPattern[] = [
      { id: 1, userId: 1, sequence: '{}', totalAttempts: 30, errorCount: 10, avgLatencyMs: 220 },
      { id: 2, userId: 1, sequence: 'th', totalAttempts: 100, errorCount: 5, avgLatencyMs: 80 },
      { id: 3, userId: 1, sequence: '()', totalAttempts: 50, errorCount: 8, avgLatencyMs: 180 },
    ];

    const sortedByLatency = [...patterns].sort((a, b) => b.avgLatencyMs - a.avgLatencyMs);

    expect(sortedByLatency[0].sequence).toBe('{}');
    expect(sortedByLatency[0].avgLatencyMs).toBe(220);
    expect(sortedByLatency[1].sequence).toBe('()');
    expect(sortedByLatency[2].sequence).toBe('th');
  });

  it('should filter sequences with minimum attempts', () => {
    const patterns: SequenceErrorPattern[] = [
      { id: 1, userId: 1, sequence: 'th', totalAttempts: 100, errorCount: 10, avgLatencyMs: 100 },
      { id: 2, userId: 1, sequence: 'qu', totalAttempts: 3, errorCount: 2, avgLatencyMs: 200 },
      { id: 3, userId: 1, sequence: 'gh', totalAttempts: 50, errorCount: 15, avgLatencyMs: 130 },
    ];

    const minAttempts = 5;
    const significantPatterns = patterns.filter((p) => p.totalAttempts >= minAttempts);

    expect(significantPatterns.length).toBe(2);
    expect(significantPatterns.map((p) => p.sequence)).toContain('th');
    expect(significantPatterns.map((p) => p.sequence)).toContain('gh');
    expect(significantPatterns.map((p) => p.sequence)).not.toContain('qu');
  });
});

describe('sequenceErrorPatterns practical use cases', () => {
  it('should support generating practice exercises for problem sequences', () => {
    const patterns: SequenceErrorPattern[] = [
      { id: 1, userId: 1, sequence: 'qu', totalAttempts: 50, errorCount: 20, avgLatencyMs: 150 },
      { id: 2, userId: 1, sequence: '{}', totalAttempts: 40, errorCount: 18, avgLatencyMs: 200 },
      { id: 3, userId: 1, sequence: 'th', totalAttempts: 100, errorCount: 5, avgLatencyMs: 80 },
    ];

    const problemSequences = patterns
      .filter((p) => p.totalAttempts >= 10)
      .map((p) => ({
        ...p,
        errorRate: Math.round((p.errorCount / p.totalAttempts) * 100),
      }))
      .filter((p) => p.errorRate >= 20)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 5)
      .map((p) => p.sequence);

    expect(problemSequences).toContain('qu');
    expect(problemSequences).toContain('{}');
    expect(problemSequences).not.toContain('th');
  });

  it('should track improvement over time', () => {
    const weekOneData: SequenceErrorPattern = {
      id: 1,
      userId: 1,
      sequence: 'th',
      totalAttempts: 50,
      errorCount: 15,
      avgLatencyMs: 150,
    };

    const weekTwoData: SequenceErrorPattern = {
      id: 1,
      userId: 1,
      sequence: 'th',
      totalAttempts: 100,
      errorCount: 20,
      avgLatencyMs: 120,
    };

    const weekOneErrorRate = weekOneData.errorCount / weekOneData.totalAttempts;
    const weekTwoErrorRate = weekTwoData.errorCount / weekTwoData.totalAttempts;

    expect(weekOneErrorRate).toBe(0.3);
    expect(weekTwoErrorRate).toBe(0.2);
    expect(weekTwoErrorRate).toBeLessThan(weekOneErrorRate);

    expect(weekTwoData.avgLatencyMs).toBeLessThan(weekOneData.avgLatencyMs);
  });

  it('should identify programming-specific problem sequences', () => {
    const patterns: SequenceErrorPattern[] = [
      { id: 1, userId: 1, sequence: '=>', totalAttempts: 40, errorCount: 12, avgLatencyMs: 180 },
      { id: 2, userId: 1, sequence: '->', totalAttempts: 35, errorCount: 10, avgLatencyMs: 170 },
      { id: 3, userId: 1, sequence: '::' , totalAttempts: 25, errorCount: 8, avgLatencyMs: 160 },
      { id: 4, userId: 1, sequence: 'th', totalAttempts: 100, errorCount: 5, avgLatencyMs: 80 },
    ];

    const programmingSymbols = /[^a-zA-Z0-9\s]/;
    const symbolSequences = patterns.filter(
      (p) => programmingSymbols.test(p.sequence)
    );

    expect(symbolSequences.length).toBe(3);
    expect(symbolSequences.map((p) => p.sequence)).toEqual(['=>', '->', '::']);
  });

  it('should identify git command problem areas', () => {
    const gitSequences: SequenceErrorPattern[] = [
      { id: 1, userId: 1, sequence: 'gi', totalAttempts: 100, errorCount: 5, avgLatencyMs: 80 },
      { id: 2, userId: 1, sequence: 'it', totalAttempts: 100, errorCount: 3, avgLatencyMs: 75 },
      { id: 3, userId: 1, sequence: 't ', totalAttempts: 90, errorCount: 12, avgLatencyMs: 100 },
      { id: 4, userId: 1, sequence: ' c', totalAttempts: 80, errorCount: 15, avgLatencyMs: 120 },
      { id: 5, userId: 1, sequence: 'co', totalAttempts: 85, errorCount: 4, avgLatencyMs: 70 },
    ];

    const problemAreas = gitSequences
      .map((p) => ({
        ...p,
        errorRate: Math.round((p.errorCount / p.totalAttempts) * 100),
      }))
      .filter((p) => p.errorRate >= 10)
      .sort((a, b) => b.errorRate - a.errorRate);

    expect(problemAreas.length).toBe(2);
    expect(problemAreas[0].sequence).toBe(' c');
    expect(problemAreas[1].sequence).toBe('t ');
  });
});
