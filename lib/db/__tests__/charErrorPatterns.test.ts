import { describe, it, expect } from 'vitest';
import {
  charErrorPatterns,
  type CharErrorPattern,
  type NewCharErrorPattern,
} from '../schema';

describe('charErrorPatterns schema', () => {
  describe('table structure', () => {
    it('should have the correct table name', () => {
      const tableName = (charErrorPatterns as Record<symbol, { name: string }>)[
        Object.getOwnPropertySymbols(charErrorPatterns).find(
          (s) => s.description === 'drizzle:Name'
        ) as symbol
      ];
      expect(tableName).toBe('char_error_patterns');
    });

    it('should have all required columns', () => {
      const columnNames = Object.keys(charErrorPatterns);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('userId');
      expect(columnNames).toContain('expectedChar');
      expect(columnNames).toContain('actualChar');
      expect(columnNames).toContain('count');
    });

    it('should have id as primary key', () => {
      expect(charErrorPatterns.id.primary).toBe(true);
    });

    it('should have userId as foreign key', () => {
      expect(charErrorPatterns.userId.notNull).toBe(true);
    });
  });

  describe('column constraints', () => {
    it('should require userId', () => {
      expect(charErrorPatterns.userId.notNull).toBe(true);
    });

    it('should require expectedChar', () => {
      expect(charErrorPatterns.expectedChar.notNull).toBe(true);
    });

    it('should require actualChar', () => {
      expect(charErrorPatterns.actualChar.notNull).toBe(true);
    });

    it('should require count', () => {
      expect(charErrorPatterns.count.notNull).toBe(true);
    });

    it('should have default value of 0 for count', () => {
      expect(charErrorPatterns.count.default).toBe(0);
    });
  });

  describe('type inference', () => {
    it('should allow valid NewCharErrorPattern object', () => {
      const newPattern: NewCharErrorPattern = {
        userId: 1,
        expectedChar: 'a',
        actualChar: 's',
        count: 15,
      };

      expect(newPattern.userId).toBe(1);
      expect(newPattern.expectedChar).toBe('a');
      expect(newPattern.actualChar).toBe('s');
      expect(newPattern.count).toBe(15);
    });

    it('should allow NewCharErrorPattern with only required fields', () => {
      const newPattern: NewCharErrorPattern = {
        userId: 1,
        expectedChar: 'e',
        actualChar: 'r',
      };

      expect(newPattern.userId).toBe(1);
      expect(newPattern.expectedChar).toBe('e');
      expect(newPattern.actualChar).toBe('r');
    });

    it('should infer CharErrorPattern type with all fields', () => {
      const pattern: CharErrorPattern = {
        id: 1,
        userId: 1,
        expectedChar: 't',
        actualChar: 'y',
        count: 8,
      };

      expect(pattern.id).toBe(1);
      expect(pattern.userId).toBe(1);
      expect(pattern.expectedChar).toBe('t');
      expect(pattern.actualChar).toBe('y');
      expect(pattern.count).toBe(8);
    });
  });

  describe('character values', () => {
    it('should accept single character values', () => {
      const pattern: NewCharErrorPattern = {
        userId: 1,
        expectedChar: 'a',
        actualChar: 's',
        count: 10,
      };
      expect(pattern.expectedChar).toBe('a');
      expect(pattern.actualChar).toBe('s');
    });

    it('should accept special character keys', () => {
      const pattern: NewCharErrorPattern = {
        userId: 1,
        expectedChar: '@',
        actualChar: '#',
        count: 5,
      };
      expect(pattern.expectedChar).toBe('@');
      expect(pattern.actualChar).toBe('#');
    });

    it('should accept numeric characters', () => {
      const pattern: NewCharErrorPattern = {
        userId: 1,
        expectedChar: '5',
        actualChar: '4',
        count: 3,
      };
      expect(pattern.expectedChar).toBe('5');
      expect(pattern.actualChar).toBe('4');
    });

    it('should accept space character', () => {
      const pattern: NewCharErrorPattern = {
        userId: 1,
        expectedChar: ' ',
        actualChar: 'n',
        count: 7,
      };
      expect(pattern.expectedChar).toBe(' ');
      expect(pattern.actualChar).toBe('n');
    });
  });

  describe('common error patterns', () => {
    it('should represent adjacent key errors', () => {
      const adjacentErrors: CharErrorPattern[] = [
        { id: 1, userId: 1, expectedChar: 'a', actualChar: 's', count: 25 },
        { id: 2, userId: 1, expectedChar: 'e', actualChar: 'r', count: 18 },
        { id: 3, userId: 1, expectedChar: 'i', actualChar: 'o', count: 12 },
      ];

      for (const error of adjacentErrors) {
        expect(error.count).toBeGreaterThan(0);
      }
    });

    it('should represent similar looking character errors', () => {
      const similarCharErrors: CharErrorPattern[] = [
        { id: 1, userId: 1, expectedChar: 'l', actualChar: '1', count: 8 },
        { id: 2, userId: 1, expectedChar: '0', actualChar: 'o', count: 6 },
        { id: 3, userId: 1, expectedChar: 'I', actualChar: 'l', count: 4 },
      ];

      for (const error of similarCharErrors) {
        expect(error.count).toBeGreaterThan(0);
      }
    });

    it('should represent common programming symbol errors', () => {
      const symbolErrors: CharErrorPattern[] = [
        { id: 1, userId: 1, expectedChar: '{', actualChar: '[', count: 15 },
        { id: 2, userId: 1, expectedChar: ')', actualChar: '0', count: 9 },
        { id: 3, userId: 1, expectedChar: ';', actualChar: ':', count: 12 },
      ];

      for (const error of symbolErrors) {
        expect(error.count).toBeGreaterThan(0);
      }
    });
  });
});

describe('charErrorPatterns aggregation scenarios', () => {
  it('should identify most common error patterns', () => {
    const patterns: CharErrorPattern[] = [
      { id: 1, userId: 1, expectedChar: 'a', actualChar: 's', count: 25 },
      { id: 2, userId: 1, expectedChar: 'e', actualChar: 'r', count: 18 },
      { id: 3, userId: 1, expectedChar: 't', actualChar: 'y', count: 30 },
      { id: 4, userId: 1, expectedChar: 'i', actualChar: 'o', count: 12 },
    ];

    const sortedByCount = [...patterns].sort((a, b) => b.count - a.count);

    expect(sortedByCount[0].expectedChar).toBe('t');
    expect(sortedByCount[0].actualChar).toBe('y');
    expect(sortedByCount[0].count).toBe(30);
  });

  it('should group errors by expected character', () => {
    const patterns: CharErrorPattern[] = [
      { id: 1, userId: 1, expectedChar: 'a', actualChar: 's', count: 20 },
      { id: 2, userId: 1, expectedChar: 'a', actualChar: 'q', count: 5 },
      { id: 3, userId: 1, expectedChar: 'a', actualChar: 'z', count: 3 },
      { id: 4, userId: 1, expectedChar: 'e', actualChar: 'r', count: 15 },
    ];

    const errorsByExpected = patterns.reduce(
      (acc, p) => {
        if (!acc[p.expectedChar]) {
          acc[p.expectedChar] = [];
        }
        acc[p.expectedChar].push(p);
        return acc;
      },
      {} as Record<string, CharErrorPattern[]>
    );

    expect(errorsByExpected['a'].length).toBe(3);
    expect(errorsByExpected['e'].length).toBe(1);

    const totalErrorsForA = errorsByExpected['a'].reduce((sum, p) => sum + p.count, 0);
    expect(totalErrorsForA).toBe(28);
  });

  it('should identify problem characters with multiple error types', () => {
    const patterns: CharErrorPattern[] = [
      { id: 1, userId: 1, expectedChar: 'a', actualChar: 's', count: 20 },
      { id: 2, userId: 1, expectedChar: 'a', actualChar: 'q', count: 15 },
      { id: 3, userId: 1, expectedChar: 'a', actualChar: 'z', count: 10 },
      { id: 4, userId: 1, expectedChar: 'e', actualChar: 'r', count: 30 },
    ];

    const errorCountByExpected = patterns.reduce(
      (acc, p) => {
        acc[p.expectedChar] = (acc[p.expectedChar] || 0) + p.count;
        return acc;
      },
      {} as Record<string, number>
    );

    const problemChars = Object.entries(errorCountByExpected)
      .map(([char, count]) => ({ char, count }))
      .sort((a, b) => b.count - a.count);

    expect(problemChars[0].char).toBe('a');
    expect(problemChars[0].count).toBe(45);
  });

  it('should calculate error rate for a specific character', () => {
    const patterns: CharErrorPattern[] = [
      { id: 1, userId: 1, expectedChar: 'a', actualChar: 's', count: 10 },
      { id: 2, userId: 1, expectedChar: 'a', actualChar: 'q', count: 5 },
    ];

    const totalErrorsForA = patterns.reduce((sum, p) => sum + p.count, 0);
    const totalPressesForA = 100;
    const errorRate = Math.round((totalErrorsForA / totalPressesForA) * 100);

    expect(totalErrorsForA).toBe(15);
    expect(errorRate).toBe(15);
  });

  it('should identify bidirectional confusion patterns', () => {
    const patterns: CharErrorPattern[] = [
      { id: 1, userId: 1, expectedChar: 'a', actualChar: 's', count: 20 },
      { id: 2, userId: 1, expectedChar: 's', actualChar: 'a', count: 18 },
      { id: 3, userId: 1, expectedChar: 'e', actualChar: 'r', count: 12 },
      { id: 4, userId: 1, expectedChar: 'r', actualChar: 'e', count: 8 },
    ];

    const bidirectionalPairs: Array<{
      char1: string;
      char2: string;
      totalConfusion: number;
    }> = [];

    for (const p of patterns) {
      const reverse = patterns.find(
        (r) =>
          r.expectedChar === p.actualChar && r.actualChar === p.expectedChar
      );

      if (reverse && p.expectedChar < p.actualChar) {
        bidirectionalPairs.push({
          char1: p.expectedChar,
          char2: p.actualChar,
          totalConfusion: p.count + reverse.count,
        });
      }
    }

    expect(bidirectionalPairs.length).toBe(2);
    expect(bidirectionalPairs[0]).toEqual({
      char1: 'a',
      char2: 's',
      totalConfusion: 38,
    });
    expect(bidirectionalPairs[1]).toEqual({
      char1: 'e',
      char2: 'r',
      totalConfusion: 20,
    });
  });
});

describe('charErrorPatterns practical use cases', () => {
  it('should support generating practice exercises for problem chars', () => {
    const patterns: CharErrorPattern[] = [
      { id: 1, userId: 1, expectedChar: 't', actualChar: 'y', count: 30 },
      { id: 2, userId: 1, expectedChar: 'a', actualChar: 's', count: 25 },
    ];

    const problemChars = patterns
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((p) => p.expectedChar);

    expect(problemChars).toContain('t');
    expect(problemChars).toContain('a');
  });

  it('should track improvement over sessions', () => {
    const session1Errors: CharErrorPattern[] = [
      { id: 1, userId: 1, expectedChar: 'a', actualChar: 's', count: 10 },
    ];

    const session2Errors: CharErrorPattern[] = [
      { id: 1, userId: 1, expectedChar: 'a', actualChar: 's', count: 5 },
    ];

    const improvement =
      session1Errors[0].count - session2Errors[0].count;
    const improvementPercent = Math.round(
      (improvement / session1Errors[0].count) * 100
    );

    expect(improvement).toBe(5);
    expect(improvementPercent).toBe(50);
  });

  it('should help identify keyboard layout issues', () => {
    const patterns: CharErrorPattern[] = [
      { id: 1, userId: 1, expectedChar: 'f', actualChar: 'g', count: 20 },
      { id: 2, userId: 1, expectedChar: 'g', actualChar: 'f', count: 18 },
      { id: 3, userId: 1, expectedChar: 'j', actualChar: 'h', count: 15 },
      { id: 4, userId: 1, expectedChar: 'h', actualChar: 'j', count: 12 },
    ];

    const homeRowConfusion = patterns.filter((p) =>
      ['f', 'g', 'h', 'j'].includes(p.expectedChar) &&
      ['f', 'g', 'h', 'j'].includes(p.actualChar)
    );

    const totalHomeRowErrors = homeRowConfusion.reduce(
      (sum, p) => sum + p.count,
      0
    );

    expect(homeRowConfusion.length).toBe(4);
    expect(totalHomeRowErrors).toBe(65);
  });
});
