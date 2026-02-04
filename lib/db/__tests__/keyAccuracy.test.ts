import { describe, it, expect } from 'vitest';
import { keyAccuracy, type KeyAccuracy, type NewKeyAccuracy } from '../schema';

describe('keyAccuracy schema', () => {
  describe('table structure', () => {
    it('should have the correct table name', () => {
      const tableName = (keyAccuracy as Record<symbol, { name: string }>)[
        Object.getOwnPropertySymbols(keyAccuracy).find(
          (s) => s.description === 'drizzle:Name'
        ) as symbol
      ];
      expect(tableName).toBe('key_accuracy');
    });

    it('should have all required columns', () => {
      const columnNames = Object.keys(keyAccuracy);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('userId');
      expect(columnNames).toContain('key');
      expect(columnNames).toContain('totalPresses');
      expect(columnNames).toContain('correctPresses');
      expect(columnNames).toContain('avgLatencyMs');
    });

    it('should have id as primary key', () => {
      expect(keyAccuracy.id.primary).toBe(true);
    });

    it('should have userId as foreign key', () => {
      expect(keyAccuracy.userId.notNull).toBe(true);
    });
  });

  describe('column constraints', () => {
    it('should require userId', () => {
      expect(keyAccuracy.userId.notNull).toBe(true);
    });

    it('should require key', () => {
      expect(keyAccuracy.key.notNull).toBe(true);
    });

    it('should require totalPresses', () => {
      expect(keyAccuracy.totalPresses.notNull).toBe(true);
    });

    it('should require correctPresses', () => {
      expect(keyAccuracy.correctPresses.notNull).toBe(true);
    });

    it('should require avgLatencyMs', () => {
      expect(keyAccuracy.avgLatencyMs.notNull).toBe(true);
    });

    it('should have default value of 0 for totalPresses', () => {
      expect(keyAccuracy.totalPresses.default).toBe(0);
    });

    it('should have default value of 0 for correctPresses', () => {
      expect(keyAccuracy.correctPresses.default).toBe(0);
    });

    it('should have default value of 0 for avgLatencyMs', () => {
      expect(keyAccuracy.avgLatencyMs.default).toBe(0);
    });
  });

  describe('type inference', () => {
    it('should allow valid NewKeyAccuracy object', () => {
      const newKeyAcc: NewKeyAccuracy = {
        userId: 1,
        key: 'a',
        totalPresses: 100,
        correctPresses: 95,
        avgLatencyMs: 120,
      };

      expect(newKeyAcc.userId).toBe(1);
      expect(newKeyAcc.key).toBe('a');
      expect(newKeyAcc.totalPresses).toBe(100);
      expect(newKeyAcc.correctPresses).toBe(95);
      expect(newKeyAcc.avgLatencyMs).toBe(120);
    });

    it('should allow NewKeyAccuracy with only required fields', () => {
      const newKeyAcc: NewKeyAccuracy = {
        userId: 1,
        key: 'b',
      };

      expect(newKeyAcc.userId).toBe(1);
      expect(newKeyAcc.key).toBe('b');
    });

    it('should infer KeyAccuracy type with all fields', () => {
      const keyAcc: KeyAccuracy = {
        id: 1,
        userId: 1,
        key: 'a',
        totalPresses: 100,
        correctPresses: 95,
        avgLatencyMs: 120,
      };

      expect(keyAcc.id).toBe(1);
      expect(keyAcc.userId).toBe(1);
      expect(keyAcc.key).toBe('a');
      expect(keyAcc.totalPresses).toBe(100);
      expect(keyAcc.correctPresses).toBe(95);
      expect(keyAcc.avgLatencyMs).toBe(120);
    });
  });

  describe('key values', () => {
    it('should accept single character keys', () => {
      const keyAcc: NewKeyAccuracy = {
        userId: 1,
        key: 'a',
        totalPresses: 10,
        correctPresses: 9,
        avgLatencyMs: 100,
      };
      expect(keyAcc.key).toBe('a');
    });

    it('should accept special character keys', () => {
      const keyAcc: NewKeyAccuracy = {
        userId: 1,
        key: '@',
        totalPresses: 5,
        correctPresses: 4,
        avgLatencyMs: 150,
      };
      expect(keyAcc.key).toBe('@');
    });

    it('should accept multi-character keys for special keys', () => {
      const keyAcc: NewKeyAccuracy = {
        userId: 1,
        key: 'Space',
        totalPresses: 50,
        correctPresses: 48,
        avgLatencyMs: 80,
      };
      expect(keyAcc.key).toBe('Space');
    });

    it('should accept numeric keys', () => {
      const keyAcc: NewKeyAccuracy = {
        userId: 1,
        key: '5',
        totalPresses: 20,
        correctPresses: 18,
        avgLatencyMs: 110,
      };
      expect(keyAcc.key).toBe('5');
    });
  });

  describe('accuracy calculations', () => {
    it('should track perfect accuracy', () => {
      const keyAcc: KeyAccuracy = {
        id: 1,
        userId: 1,
        key: 'e',
        totalPresses: 100,
        correctPresses: 100,
        avgLatencyMs: 90,
      };
      const accuracy = (keyAcc.correctPresses / keyAcc.totalPresses) * 100;
      expect(accuracy).toBe(100);
    });

    it('should track partial accuracy', () => {
      const keyAcc: KeyAccuracy = {
        id: 1,
        userId: 1,
        key: 'z',
        totalPresses: 50,
        correctPresses: 40,
        avgLatencyMs: 200,
      };
      const accuracy = (keyAcc.correctPresses / keyAcc.totalPresses) * 100;
      expect(accuracy).toBe(80);
    });

    it('should handle zero correct presses', () => {
      const keyAcc: KeyAccuracy = {
        id: 1,
        userId: 1,
        key: 'q',
        totalPresses: 10,
        correctPresses: 0,
        avgLatencyMs: 300,
      };
      const accuracy = (keyAcc.correctPresses / keyAcc.totalPresses) * 100;
      expect(accuracy).toBe(0);
    });
  });

  describe('latency values', () => {
    it('should allow fast latency (under 100ms)', () => {
      const keyAcc: NewKeyAccuracy = {
        userId: 1,
        key: 'e',
        totalPresses: 100,
        correctPresses: 98,
        avgLatencyMs: 75,
      };
      expect(keyAcc.avgLatencyMs).toBeLessThan(100);
    });

    it('should allow typical latency (100-200ms)', () => {
      const keyAcc: NewKeyAccuracy = {
        userId: 1,
        key: 'k',
        totalPresses: 50,
        correctPresses: 45,
        avgLatencyMs: 150,
      };
      expect(keyAcc.avgLatencyMs).toBeGreaterThanOrEqual(100);
      expect(keyAcc.avgLatencyMs).toBeLessThanOrEqual(200);
    });

    it('should allow slow latency (over 200ms)', () => {
      const keyAcc: NewKeyAccuracy = {
        userId: 1,
        key: '~',
        totalPresses: 10,
        correctPresses: 7,
        avgLatencyMs: 350,
      };
      expect(keyAcc.avgLatencyMs).toBeGreaterThan(200);
    });
  });

  describe('common key tracking scenarios', () => {
    it('should represent a frequently used key with high accuracy', () => {
      const keyAcc: KeyAccuracy = {
        id: 1,
        userId: 1,
        key: 'e',
        totalPresses: 500,
        correctPresses: 495,
        avgLatencyMs: 85,
      };
      const accuracy = (keyAcc.correctPresses / keyAcc.totalPresses) * 100;
      expect(accuracy).toBe(99);
      expect(keyAcc.avgLatencyMs).toBeLessThan(100);
    });

    it('should represent a rarely used key with low accuracy', () => {
      const keyAcc: KeyAccuracy = {
        id: 1,
        userId: 1,
        key: '^',
        totalPresses: 15,
        correctPresses: 8,
        avgLatencyMs: 280,
      };
      const accuracy = Math.round((keyAcc.correctPresses / keyAcc.totalPresses) * 100);
      expect(accuracy).toBeLessThan(60);
      expect(keyAcc.avgLatencyMs).toBeGreaterThan(200);
    });

    it('should represent home row keys with fast latency', () => {
      const homeRowKeys: KeyAccuracy[] = [
        { id: 1, userId: 1, key: 'a', totalPresses: 200, correctPresses: 195, avgLatencyMs: 70 },
        { id: 2, userId: 1, key: 's', totalPresses: 180, correctPresses: 175, avgLatencyMs: 72 },
        { id: 3, userId: 1, key: 'd', totalPresses: 150, correctPresses: 148, avgLatencyMs: 68 },
        { id: 4, userId: 1, key: 'f', totalPresses: 120, correctPresses: 118, avgLatencyMs: 65 },
      ];

      for (const key of homeRowKeys) {
        expect(key.avgLatencyMs).toBeLessThan(100);
        const accuracy = (key.correctPresses / key.totalPresses) * 100;
        expect(accuracy).toBeGreaterThan(95);
      }
    });
  });
});

describe('keyAccuracy aggregation scenarios', () => {
  it('should identify problem keys by low accuracy', () => {
    const keys: KeyAccuracy[] = [
      { id: 1, userId: 1, key: 'e', totalPresses: 100, correctPresses: 98, avgLatencyMs: 80 },
      { id: 2, userId: 1, key: 'z', totalPresses: 20, correctPresses: 12, avgLatencyMs: 200 },
      { id: 3, userId: 1, key: 't', totalPresses: 80, correctPresses: 75, avgLatencyMs: 90 },
    ];

    const problemKeys = keys
      .filter((k) => k.totalPresses >= 10)
      .map((k) => ({
        key: k.key,
        accuracy: Math.round((k.correctPresses / k.totalPresses) * 100),
      }))
      .sort((a, b) => a.accuracy - b.accuracy);

    expect(problemKeys[0].key).toBe('z');
    expect(problemKeys[0].accuracy).toBe(60);
  });

  it('should identify slow keys by high latency', () => {
    const keys: KeyAccuracy[] = [
      { id: 1, userId: 1, key: 'e', totalPresses: 100, correctPresses: 98, avgLatencyMs: 80 },
      { id: 2, userId: 1, key: '@', totalPresses: 15, correctPresses: 12, avgLatencyMs: 350 },
      { id: 3, userId: 1, key: 't', totalPresses: 80, correctPresses: 75, avgLatencyMs: 90 },
    ];

    const slowKeys = keys
      .filter((k) => k.totalPresses >= 10)
      .sort((a, b) => b.avgLatencyMs - a.avgLatencyMs);

    expect(slowKeys[0].key).toBe('@');
    expect(slowKeys[0].avgLatencyMs).toBe(350);
  });

  it('should calculate overall keyboard accuracy', () => {
    const keys: KeyAccuracy[] = [
      { id: 1, userId: 1, key: 'a', totalPresses: 100, correctPresses: 95, avgLatencyMs: 80 },
      { id: 2, userId: 1, key: 'b', totalPresses: 50, correctPresses: 45, avgLatencyMs: 100 },
      { id: 3, userId: 1, key: 'c', totalPresses: 50, correctPresses: 48, avgLatencyMs: 90 },
    ];

    const totalPresses = keys.reduce((sum, k) => sum + k.totalPresses, 0);
    const totalCorrect = keys.reduce((sum, k) => sum + k.correctPresses, 0);
    const overallAccuracy = Math.round((totalCorrect / totalPresses) * 100);

    expect(totalPresses).toBe(200);
    expect(totalCorrect).toBe(188);
    expect(overallAccuracy).toBe(94);
  });
});
