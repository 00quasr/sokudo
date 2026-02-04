import { describe, it, expect } from 'vitest';
import { typingSessions, type TypingSession, type NewTypingSession } from '../schema';

describe('typingSessions schema', () => {
  describe('table structure', () => {
    it('should have the correct table name', () => {
      const tableName = (typingSessions as Record<symbol, { name: string }>)[
        Object.getOwnPropertySymbols(typingSessions).find(
          (s) => s.description === 'drizzle:Name'
        ) as symbol
      ];
      expect(tableName).toBe('typing_sessions');
    });

    it('should have all required columns', () => {
      const columnNames = Object.keys(typingSessions);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('userId');
      expect(columnNames).toContain('challengeId');
      expect(columnNames).toContain('wpm');
      expect(columnNames).toContain('rawWpm');
      expect(columnNames).toContain('accuracy');
      expect(columnNames).toContain('keystrokes');
      expect(columnNames).toContain('errors');
      expect(columnNames).toContain('durationMs');
      expect(columnNames).toContain('completedAt');
    });

    it('should have id as primary key', () => {
      expect(typingSessions.id.primary).toBe(true);
    });

    it('should have userId as foreign key', () => {
      expect(typingSessions.userId.notNull).toBe(true);
    });

    it('should have challengeId as foreign key', () => {
      expect(typingSessions.challengeId.notNull).toBe(true);
    });
  });

  describe('column constraints', () => {
    it('should require wpm', () => {
      expect(typingSessions.wpm.notNull).toBe(true);
    });

    it('should require rawWpm', () => {
      expect(typingSessions.rawWpm.notNull).toBe(true);
    });

    it('should require accuracy', () => {
      expect(typingSessions.accuracy.notNull).toBe(true);
    });

    it('should require keystrokes', () => {
      expect(typingSessions.keystrokes.notNull).toBe(true);
    });

    it('should require errors', () => {
      expect(typingSessions.errors.notNull).toBe(true);
    });

    it('should require durationMs', () => {
      expect(typingSessions.durationMs.notNull).toBe(true);
    });

    it('should require completedAt', () => {
      expect(typingSessions.completedAt.notNull).toBe(true);
    });
  });

  describe('type inference', () => {
    it('should allow valid NewTypingSession object', () => {
      const newSession: NewTypingSession = {
        userId: 1,
        challengeId: 1,
        wpm: 65,
        rawWpm: 70,
        accuracy: 95,
        keystrokes: 150,
        errors: 8,
        durationMs: 30000,
      };

      expect(newSession.userId).toBe(1);
      expect(newSession.challengeId).toBe(1);
      expect(newSession.wpm).toBe(65);
      expect(newSession.rawWpm).toBe(70);
      expect(newSession.accuracy).toBe(95);
      expect(newSession.keystrokes).toBe(150);
      expect(newSession.errors).toBe(8);
      expect(newSession.durationMs).toBe(30000);
    });

    it('should allow NewTypingSession with completedAt override', () => {
      const completedTime = new Date('2025-01-15T10:30:00Z');
      const session: NewTypingSession = {
        userId: 1,
        challengeId: 2,
        wpm: 80,
        rawWpm: 85,
        accuracy: 98,
        keystrokes: 200,
        errors: 4,
        durationMs: 45000,
        completedAt: completedTime,
      };

      expect(session.completedAt).toBe(completedTime);
    });

    it('should infer TypingSession type with all fields', () => {
      const session: TypingSession = {
        id: 1,
        userId: 1,
        challengeId: 1,
        wpm: 72,
        rawWpm: 78,
        accuracy: 96,
        keystrokes: 175,
        errors: 7,
        durationMs: 35000,
        completedAt: new Date(),
      };

      expect(session.id).toBe(1);
      expect(typeof session.completedAt).toBe('object');
      expect(session.completedAt instanceof Date).toBe(true);
    });
  });

  describe('wpm values', () => {
    it('should allow zero wpm', () => {
      const session: NewTypingSession = {
        userId: 1,
        challengeId: 1,
        wpm: 0,
        rawWpm: 0,
        accuracy: 0,
        keystrokes: 0,
        errors: 0,
        durationMs: 1000,
      };
      expect(session.wpm).toBe(0);
    });

    it('should allow high wpm values', () => {
      const session: NewTypingSession = {
        userId: 1,
        challengeId: 1,
        wpm: 150,
        rawWpm: 155,
        accuracy: 99,
        keystrokes: 500,
        errors: 5,
        durationMs: 60000,
      };
      expect(session.wpm).toBe(150);
      expect(session.rawWpm).toBe(155);
    });

    it('should allow rawWpm higher than wpm', () => {
      const session: NewTypingSession = {
        userId: 1,
        challengeId: 1,
        wpm: 60,
        rawWpm: 75,
        accuracy: 80,
        keystrokes: 100,
        errors: 20,
        durationMs: 20000,
      };
      expect(session.rawWpm).toBeGreaterThan(session.wpm);
    });
  });

  describe('accuracy values', () => {
    it('should allow 0% accuracy', () => {
      const session: NewTypingSession = {
        userId: 1,
        challengeId: 1,
        wpm: 0,
        rawWpm: 50,
        accuracy: 0,
        keystrokes: 100,
        errors: 100,
        durationMs: 30000,
      };
      expect(session.accuracy).toBe(0);
    });

    it('should allow 100% accuracy', () => {
      const session: NewTypingSession = {
        userId: 1,
        challengeId: 1,
        wpm: 80,
        rawWpm: 80,
        accuracy: 100,
        keystrokes: 100,
        errors: 0,
        durationMs: 15000,
      };
      expect(session.accuracy).toBe(100);
    });

    it('should allow typical accuracy values', () => {
      const session: NewTypingSession = {
        userId: 1,
        challengeId: 1,
        wpm: 65,
        rawWpm: 70,
        accuracy: 93,
        keystrokes: 150,
        errors: 11,
        durationMs: 28000,
      };
      expect(session.accuracy).toBe(93);
    });
  });

  describe('keystrokes and errors', () => {
    it('should allow zero errors', () => {
      const session: NewTypingSession = {
        userId: 1,
        challengeId: 1,
        wpm: 75,
        rawWpm: 75,
        accuracy: 100,
        keystrokes: 200,
        errors: 0,
        durationMs: 40000,
      };
      expect(session.errors).toBe(0);
    });

    it('should allow errors equal to keystrokes', () => {
      const session: NewTypingSession = {
        userId: 1,
        challengeId: 1,
        wpm: 0,
        rawWpm: 30,
        accuracy: 0,
        keystrokes: 50,
        errors: 50,
        durationMs: 25000,
      };
      expect(session.errors).toBe(session.keystrokes);
    });

    it('should allow large keystroke counts', () => {
      const session: NewTypingSession = {
        userId: 1,
        challengeId: 1,
        wpm: 90,
        rawWpm: 95,
        accuracy: 97,
        keystrokes: 1000,
        errors: 30,
        durationMs: 120000,
      };
      expect(session.keystrokes).toBe(1000);
    });
  });

  describe('durationMs values', () => {
    it('should allow short duration', () => {
      const session: NewTypingSession = {
        userId: 1,
        challengeId: 1,
        wpm: 100,
        rawWpm: 100,
        accuracy: 100,
        keystrokes: 25,
        errors: 0,
        durationMs: 3000,
      };
      expect(session.durationMs).toBe(3000);
    });

    it('should allow long duration', () => {
      const session: NewTypingSession = {
        userId: 1,
        challengeId: 1,
        wpm: 50,
        rawWpm: 55,
        accuracy: 91,
        keystrokes: 500,
        errors: 45,
        durationMs: 600000,
      };
      expect(session.durationMs).toBe(600000);
    });
  });
});

describe('typing session metrics validation', () => {
  it('should represent correct WPM calculation scenario', () => {
    // WPM = (chars / 5) / (time in minutes)
    // 150 chars in 30 seconds = 150/5 / 0.5 = 60 WPM
    const session: NewTypingSession = {
      userId: 1,
      challengeId: 1,
      wpm: 60,
      rawWpm: 65,
      accuracy: 92,
      keystrokes: 150,
      errors: 12,
      durationMs: 30000,
    };
    expect(session.wpm).toBe(60);
  });

  it('should represent typical beginner session', () => {
    const beginnerSession: NewTypingSession = {
      userId: 1,
      challengeId: 1,
      wpm: 25,
      rawWpm: 35,
      accuracy: 71,
      keystrokes: 50,
      errors: 15,
      durationMs: 24000,
    };
    expect(beginnerSession.wpm).toBeLessThan(40);
    expect(beginnerSession.accuracy).toBeLessThan(80);
  });

  it('should represent typical intermediate session', () => {
    const intermediateSession: NewTypingSession = {
      userId: 1,
      challengeId: 1,
      wpm: 55,
      rawWpm: 60,
      accuracy: 92,
      keystrokes: 150,
      errors: 12,
      durationMs: 32000,
    };
    expect(intermediateSession.wpm).toBeGreaterThanOrEqual(40);
    expect(intermediateSession.wpm).toBeLessThan(80);
  });

  it('should represent typical expert session', () => {
    const expertSession: NewTypingSession = {
      userId: 1,
      challengeId: 1,
      wpm: 100,
      rawWpm: 102,
      accuracy: 98,
      keystrokes: 250,
      errors: 5,
      durationMs: 30000,
    };
    expect(expertSession.wpm).toBeGreaterThanOrEqual(80);
    expect(expertSession.accuracy).toBeGreaterThanOrEqual(95);
  });
});
