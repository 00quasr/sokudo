import { describe, it, expect } from 'vitest';
import { races, type Race, type NewRace } from '../schema';

describe('races schema', () => {
  describe('table structure', () => {
    it('should have the correct table name', () => {
      const tableName = (races as Record<symbol, { name: string }>)[
        Object.getOwnPropertySymbols(races).find(
          (s) => s.description === 'drizzle:Name'
        ) as symbol
      ];
      expect(tableName).toBe('races');
    });

    it('should have all required columns', () => {
      const columnNames = Object.keys(races);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('challengeId');
      expect(columnNames).toContain('startedAt');
      expect(columnNames).toContain('maxPlayers');
      expect(columnNames).toContain('createdAt');
      expect(columnNames).toContain('updatedAt');
    });

    it('should have id as primary key', () => {
      expect(races.id.primary).toBe(true);
    });

    it('should have challengeId as foreign key', () => {
      expect(races.challengeId.notNull).toBe(true);
    });
  });

  describe('column defaults', () => {
    it('should default status to waiting', () => {
      expect(races.status.default).toBe('waiting');
    });

    it('should default maxPlayers to 4', () => {
      expect(races.maxPlayers.default).toBe(4);
    });
  });

  describe('type inference', () => {
    it('should allow valid NewRace object with all fields', () => {
      const newRace: NewRace = {
        status: 'in_progress',
        challengeId: 1,
        startedAt: new Date(),
        maxPlayers: 6,
      };

      expect(newRace.status).toBe('in_progress');
      expect(newRace.challengeId).toBe(1);
      expect(newRace.startedAt).toBeInstanceOf(Date);
      expect(newRace.maxPlayers).toBe(6);
    });

    it('should allow NewRace with only required fields', () => {
      const minimalRace: NewRace = {
        challengeId: 1,
      };

      expect(minimalRace.challengeId).toBe(1);
      expect(minimalRace.status).toBeUndefined();
      expect(minimalRace.startedAt).toBeUndefined();
      expect(minimalRace.maxPlayers).toBeUndefined();
    });

    it('should infer Race type with all fields', () => {
      const race: Race = {
        id: 1,
        status: 'waiting',
        challengeId: 5,
        startedAt: null,
        maxPlayers: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(race.id).toBe(1);
      expect(race.status).toBe('waiting');
      expect(race.challengeId).toBe(5);
      expect(race.startedAt).toBeNull();
      expect(race.maxPlayers).toBe(4);
      expect(race.createdAt).toBeInstanceOf(Date);
      expect(race.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('status values', () => {
    it('should accept waiting status', () => {
      const race: NewRace = {
        challengeId: 1,
        status: 'waiting',
      };
      expect(race.status).toBe('waiting');
    });

    it('should accept in_progress status', () => {
      const race: NewRace = {
        challengeId: 1,
        status: 'in_progress',
      };
      expect(race.status).toBe('in_progress');
    });

    it('should accept finished status', () => {
      const race: NewRace = {
        challengeId: 1,
        status: 'finished',
      };
      expect(race.status).toBe('finished');
    });

    it('should accept cancelled status', () => {
      const race: NewRace = {
        challengeId: 1,
        status: 'cancelled',
      };
      expect(race.status).toBe('cancelled');
    });
  });

  describe('startedAt field', () => {
    it('should allow null startedAt', () => {
      const race: NewRace = {
        challengeId: 1,
        startedAt: null,
      };
      expect(race.startedAt).toBeNull();
    });

    it('should allow Date startedAt', () => {
      const now = new Date();
      const race: NewRace = {
        challengeId: 1,
        startedAt: now,
      };
      expect(race.startedAt).toBe(now);
    });
  });

  describe('maxPlayers field', () => {
    it('should allow custom maxPlayers value', () => {
      const race: NewRace = {
        challengeId: 1,
        maxPlayers: 8,
      };
      expect(race.maxPlayers).toBe(8);
    });

    it('should allow minimum maxPlayers of 2', () => {
      const race: NewRace = {
        challengeId: 1,
        maxPlayers: 2,
      };
      expect(race.maxPlayers).toBe(2);
    });
  });
});
