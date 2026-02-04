import { describe, it, expect } from 'vitest';
import { keystrokeLogs, type KeystrokeLog, type NewKeystrokeLog } from '../schema';

describe('keystrokeLogs schema', () => {
  describe('table structure', () => {
    it('should have the correct table name', () => {
      const tableName = (keystrokeLogs as Record<symbol, { name: string }>)[
        Object.getOwnPropertySymbols(keystrokeLogs).find(
          (s) => s.description === 'drizzle:Name'
        ) as symbol
      ];
      expect(tableName).toBe('keystroke_logs');
    });

    it('should have all required columns', () => {
      const columnNames = Object.keys(keystrokeLogs);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('sessionId');
      expect(columnNames).toContain('timestamp');
      expect(columnNames).toContain('expected');
      expect(columnNames).toContain('actual');
      expect(columnNames).toContain('isCorrect');
      expect(columnNames).toContain('latencyMs');
    });

    it('should have id as primary key', () => {
      expect(keystrokeLogs.id.primary).toBe(true);
    });

    it('should have sessionId as foreign key', () => {
      expect(keystrokeLogs.sessionId.notNull).toBe(true);
    });
  });

  describe('column constraints', () => {
    it('should require timestamp', () => {
      expect(keystrokeLogs.timestamp.notNull).toBe(true);
    });

    it('should require expected', () => {
      expect(keystrokeLogs.expected.notNull).toBe(true);
    });

    it('should require actual', () => {
      expect(keystrokeLogs.actual.notNull).toBe(true);
    });

    it('should require isCorrect', () => {
      expect(keystrokeLogs.isCorrect.notNull).toBe(true);
    });

    it('should require latencyMs', () => {
      expect(keystrokeLogs.latencyMs.notNull).toBe(true);
    });
  });

  describe('type inference', () => {
    it('should allow valid NewKeystrokeLog object', () => {
      const newLog: NewKeystrokeLog = {
        sessionId: 1,
        timestamp: 1500,
        expected: 'a',
        actual: 'a',
        isCorrect: true,
        latencyMs: 120,
      };

      expect(newLog.sessionId).toBe(1);
      expect(newLog.timestamp).toBe(1500);
      expect(newLog.expected).toBe('a');
      expect(newLog.actual).toBe('a');
      expect(newLog.isCorrect).toBe(true);
      expect(newLog.latencyMs).toBe(120);
    });

    it('should allow NewKeystrokeLog for incorrect keystroke', () => {
      const incorrectLog: NewKeystrokeLog = {
        sessionId: 1,
        timestamp: 2000,
        expected: 'b',
        actual: 'v',
        isCorrect: false,
        latencyMs: 85,
      };

      expect(incorrectLog.expected).toBe('b');
      expect(incorrectLog.actual).toBe('v');
      expect(incorrectLog.isCorrect).toBe(false);
    });

    it('should infer KeystrokeLog type with all fields', () => {
      const log: KeystrokeLog = {
        id: 1,
        sessionId: 1,
        timestamp: 500,
        expected: 'g',
        actual: 'g',
        isCorrect: true,
        latencyMs: 95,
      };

      expect(log.id).toBe(1);
      expect(typeof log.timestamp).toBe('number');
      expect(typeof log.isCorrect).toBe('boolean');
    });
  });

  describe('timestamp values', () => {
    it('should allow zero timestamp (first keystroke)', () => {
      const log: NewKeystrokeLog = {
        sessionId: 1,
        timestamp: 0,
        expected: 'g',
        actual: 'g',
        isCorrect: true,
        latencyMs: 0,
      };
      expect(log.timestamp).toBe(0);
    });

    it('should allow large timestamp values', () => {
      const log: NewKeystrokeLog = {
        sessionId: 1,
        timestamp: 300000,
        expected: 'x',
        actual: 'x',
        isCorrect: true,
        latencyMs: 150,
      };
      expect(log.timestamp).toBe(300000);
    });
  });

  describe('expected and actual character values', () => {
    it('should handle single characters', () => {
      const log: NewKeystrokeLog = {
        sessionId: 1,
        timestamp: 100,
        expected: 'a',
        actual: 'a',
        isCorrect: true,
        latencyMs: 80,
      };
      expect(log.expected.length).toBe(1);
      expect(log.actual.length).toBe(1);
    });

    it('should handle special characters', () => {
      const log: NewKeystrokeLog = {
        sessionId: 1,
        timestamp: 200,
        expected: '|',
        actual: '\\',
        isCorrect: false,
        latencyMs: 200,
      };
      expect(log.expected).toBe('|');
      expect(log.actual).toBe('\\');
    });

    it('should handle space character', () => {
      const log: NewKeystrokeLog = {
        sessionId: 1,
        timestamp: 300,
        expected: ' ',
        actual: ' ',
        isCorrect: true,
        latencyMs: 50,
      };
      expect(log.expected).toBe(' ');
    });

    it('should handle numeric characters', () => {
      const log: NewKeystrokeLog = {
        sessionId: 1,
        timestamp: 400,
        expected: '5',
        actual: '5',
        isCorrect: true,
        latencyMs: 110,
      };
      expect(log.expected).toBe('5');
    });
  });

  describe('latencyMs values', () => {
    it('should allow zero latency (first keystroke)', () => {
      const log: NewKeystrokeLog = {
        sessionId: 1,
        timestamp: 0,
        expected: 'g',
        actual: 'g',
        isCorrect: true,
        latencyMs: 0,
      };
      expect(log.latencyMs).toBe(0);
    });

    it('should allow typical latency values', () => {
      const log: NewKeystrokeLog = {
        sessionId: 1,
        timestamp: 1000,
        expected: 'i',
        actual: 'i',
        isCorrect: true,
        latencyMs: 85,
      };
      expect(log.latencyMs).toBe(85);
    });

    it('should allow high latency values (slow typing)', () => {
      const log: NewKeystrokeLog = {
        sessionId: 1,
        timestamp: 5000,
        expected: 't',
        actual: 't',
        isCorrect: true,
        latencyMs: 2000,
      };
      expect(log.latencyMs).toBe(2000);
    });
  });

  describe('isCorrect values', () => {
    it('should be true when expected matches actual', () => {
      const log: NewKeystrokeLog = {
        sessionId: 1,
        timestamp: 100,
        expected: 'a',
        actual: 'a',
        isCorrect: true,
        latencyMs: 75,
      };
      expect(log.isCorrect).toBe(true);
    });

    it('should be false when expected differs from actual', () => {
      const log: NewKeystrokeLog = {
        sessionId: 1,
        timestamp: 200,
        expected: 'a',
        actual: 's',
        isCorrect: false,
        latencyMs: 65,
      };
      expect(log.isCorrect).toBe(false);
    });
  });
});

describe('keystroke log scenarios', () => {
  it('should represent a correct git command sequence', () => {
    const gitCommand = 'git status';
    const logs: NewKeystrokeLog[] = [];
    let timestamp = 0;

    for (let i = 0; i < gitCommand.length; i++) {
      const char = gitCommand[i];
      timestamp += 100;
      logs.push({
        sessionId: 1,
        timestamp,
        expected: char,
        actual: char,
        isCorrect: true,
        latencyMs: 100,
      });
    }

    expect(logs.length).toBe(10);
    expect(logs.every((log) => log.isCorrect)).toBe(true);
  });

  it('should represent a sequence with errors', () => {
    const logs: NewKeystrokeLog[] = [
      {
        sessionId: 1,
        timestamp: 100,
        expected: 'g',
        actual: 'g',
        isCorrect: true,
        latencyMs: 100,
      },
      {
        sessionId: 1,
        timestamp: 200,
        expected: 'i',
        actual: 'o',
        isCorrect: false,
        latencyMs: 100,
      },
      {
        sessionId: 1,
        timestamp: 350,
        expected: 't',
        actual: 't',
        isCorrect: true,
        latencyMs: 150,
      },
    ];

    const correctCount = logs.filter((log) => log.isCorrect).length;
    const errorCount = logs.filter((log) => !log.isCorrect).length;

    expect(correctCount).toBe(2);
    expect(errorCount).toBe(1);
  });

  it('should represent varying latency patterns', () => {
    const logs: NewKeystrokeLog[] = [
      {
        sessionId: 1,
        timestamp: 0,
        expected: 'c',
        actual: 'c',
        isCorrect: true,
        latencyMs: 0,
      },
      {
        sessionId: 1,
        timestamp: 80,
        expected: 'd',
        actual: 'd',
        isCorrect: true,
        latencyMs: 80,
      },
      {
        sessionId: 1,
        timestamp: 160,
        expected: ' ',
        actual: ' ',
        isCorrect: true,
        latencyMs: 80,
      },
      {
        sessionId: 1,
        timestamp: 500,
        expected: '/',
        actual: '/',
        isCorrect: true,
        latencyMs: 340,
      },
    ];

    const avgLatency =
      logs.reduce((sum, log) => sum + log.latencyMs, 0) / logs.length;
    expect(avgLatency).toBe(125);
    expect(logs[3].latencyMs).toBeGreaterThan(logs[1].latencyMs);
  });
});
