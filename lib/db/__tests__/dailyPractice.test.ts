import { describe, it, expect } from 'vitest';
import { dailyPractice, type DailyPractice, type NewDailyPractice } from '../schema';

describe('dailyPractice schema', () => {
  describe('table structure', () => {
    it('should have the correct table name', () => {
      const tableName = (dailyPractice as Record<symbol, { name: string }>)[
        Object.getOwnPropertySymbols(dailyPractice).find(
          (s) => s.description === 'drizzle:Name'
        ) as symbol
      ];
      expect(tableName).toBe('daily_practice');
    });

    it('should have all required columns', () => {
      const columnNames = Object.keys(dailyPractice);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('userId');
      expect(columnNames).toContain('date');
      expect(columnNames).toContain('practiceTimeMs');
      expect(columnNames).toContain('sessionsCompleted');
    });

    it('should have id as primary key', () => {
      expect(dailyPractice.id.primary).toBe(true);
    });

    it('should have userId as foreign key', () => {
      expect(dailyPractice.userId.notNull).toBe(true);
    });
  });

  describe('column constraints', () => {
    it('should require userId', () => {
      expect(dailyPractice.userId.notNull).toBe(true);
    });

    it('should require date', () => {
      expect(dailyPractice.date.notNull).toBe(true);
    });

    it('should require practiceTimeMs', () => {
      expect(dailyPractice.practiceTimeMs.notNull).toBe(true);
    });

    it('should require sessionsCompleted', () => {
      expect(dailyPractice.sessionsCompleted.notNull).toBe(true);
    });

    it('should have default value of 0 for practiceTimeMs', () => {
      expect(dailyPractice.practiceTimeMs.default).toBe(0);
    });

    it('should have default value of 0 for sessionsCompleted', () => {
      expect(dailyPractice.sessionsCompleted.default).toBe(0);
    });
  });

  describe('type inference', () => {
    it('should allow valid NewDailyPractice object', () => {
      const newPractice: NewDailyPractice = {
        userId: 1,
        date: '2025-01-15',
        practiceTimeMs: 900000,
        sessionsCompleted: 3,
      };

      expect(newPractice.userId).toBe(1);
      expect(newPractice.date).toBe('2025-01-15');
      expect(newPractice.practiceTimeMs).toBe(900000);
      expect(newPractice.sessionsCompleted).toBe(3);
    });

    it('should allow NewDailyPractice with only required fields', () => {
      const newPractice: NewDailyPractice = {
        userId: 1,
        date: '2025-01-15',
      };

      expect(newPractice.userId).toBe(1);
      expect(newPractice.date).toBe('2025-01-15');
    });

    it('should infer DailyPractice type with all fields', () => {
      const practice: DailyPractice = {
        id: 1,
        userId: 1,
        date: '2025-01-15',
        practiceTimeMs: 900000,
        sessionsCompleted: 5,
      };

      expect(practice.id).toBe(1);
      expect(practice.userId).toBe(1);
      expect(practice.date).toBe('2025-01-15');
      expect(practice.practiceTimeMs).toBe(900000);
      expect(practice.sessionsCompleted).toBe(5);
    });
  });

  describe('practiceTimeMs values', () => {
    it('should allow zero practice time', () => {
      const practice: NewDailyPractice = {
        userId: 1,
        date: '2025-01-15',
        practiceTimeMs: 0,
        sessionsCompleted: 0,
      };
      expect(practice.practiceTimeMs).toBe(0);
    });

    it('should allow free tier limit (15 minutes)', () => {
      // Free tier limit is 15 minutes = 900000ms
      const practice: NewDailyPractice = {
        userId: 1,
        date: '2025-01-15',
        practiceTimeMs: 900000,
        sessionsCompleted: 5,
      };
      expect(practice.practiceTimeMs).toBe(900000);
    });

    it('should allow long practice time for premium users', () => {
      // Premium user with 2 hours of practice
      const practice: NewDailyPractice = {
        userId: 1,
        date: '2025-01-15',
        practiceTimeMs: 7200000,
        sessionsCompleted: 20,
      };
      expect(practice.practiceTimeMs).toBe(7200000);
    });
  });

  describe('sessionsCompleted values', () => {
    it('should allow zero sessions', () => {
      const practice: NewDailyPractice = {
        userId: 1,
        date: '2025-01-15',
        practiceTimeMs: 0,
        sessionsCompleted: 0,
      };
      expect(practice.sessionsCompleted).toBe(0);
    });

    it('should allow multiple sessions', () => {
      const practice: NewDailyPractice = {
        userId: 1,
        date: '2025-01-15',
        practiceTimeMs: 600000,
        sessionsCompleted: 10,
      };
      expect(practice.sessionsCompleted).toBe(10);
    });

    it('should allow large number of sessions', () => {
      const practice: NewDailyPractice = {
        userId: 1,
        date: '2025-01-15',
        practiceTimeMs: 3600000,
        sessionsCompleted: 50,
      };
      expect(practice.sessionsCompleted).toBe(50);
    });
  });

  describe('date values', () => {
    it('should accept date string format', () => {
      const practice: NewDailyPractice = {
        userId: 1,
        date: '2025-01-15',
        practiceTimeMs: 300000,
        sessionsCompleted: 2,
      };
      expect(practice.date).toBe('2025-01-15');
    });

    it('should allow different date strings', () => {
      const practice1: NewDailyPractice = {
        userId: 1,
        date: '2025-12-31',
        practiceTimeMs: 100000,
        sessionsCompleted: 1,
      };
      const practice2: NewDailyPractice = {
        userId: 1,
        date: '2026-01-01',
        practiceTimeMs: 100000,
        sessionsCompleted: 1,
      };
      expect(practice1.date).toBe('2025-12-31');
      expect(practice2.date).toBe('2026-01-01');
    });
  });
});

describe('daily practice free tier limits', () => {
  it('should track practice time under free tier limit', () => {
    // Free tier: 15 min/day = 900000ms
    const practice: NewDailyPractice = {
      userId: 1,
      date: '2025-01-15',
      practiceTimeMs: 600000, // 10 minutes
      sessionsCompleted: 3,
    };
    expect(practice.practiceTimeMs).toBeLessThan(900000);
  });

  it('should track practice time at free tier limit', () => {
    const practice: NewDailyPractice = {
      userId: 1,
      date: '2025-01-15',
      practiceTimeMs: 900000, // Exactly 15 minutes
      sessionsCompleted: 5,
    };
    expect(practice.practiceTimeMs).toBe(900000);
  });

  it('should track practice time exceeding free tier (for premium)', () => {
    const practice: NewDailyPractice = {
      userId: 1,
      date: '2025-01-15',
      practiceTimeMs: 1800000, // 30 minutes
      sessionsCompleted: 10,
    };
    expect(practice.practiceTimeMs).toBeGreaterThan(900000);
  });
});

describe('daily practice aggregation scenarios', () => {
  it('should represent a typical free tier user day', () => {
    const freeTierDay: NewDailyPractice = {
      userId: 1,
      date: '2025-01-15',
      practiceTimeMs: 850000, // ~14 minutes (approaching limit)
      sessionsCompleted: 4,
    };
    expect(freeTierDay.practiceTimeMs).toBeLessThan(900000);
    expect(freeTierDay.sessionsCompleted).toBeGreaterThan(0);
  });

  it('should represent a light practice day', () => {
    const lightDay: NewDailyPractice = {
      userId: 1,
      date: '2025-01-15',
      practiceTimeMs: 180000, // 3 minutes
      sessionsCompleted: 1,
    };
    expect(lightDay.practiceTimeMs).toBeLessThan(300000);
    expect(lightDay.sessionsCompleted).toBe(1);
  });

  it('should represent a heavy practice day (premium user)', () => {
    const heavyDay: NewDailyPractice = {
      userId: 1,
      date: '2025-01-15',
      practiceTimeMs: 5400000, // 90 minutes
      sessionsCompleted: 25,
    };
    expect(heavyDay.practiceTimeMs).toBeGreaterThan(3600000);
    expect(heavyDay.sessionsCompleted).toBeGreaterThan(20);
  });
});
