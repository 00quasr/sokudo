import { describe, it, expect } from 'vitest';
import {
  raceParticipants,
  type RaceParticipant,
  type NewRaceParticipant,
} from '../schema';

describe('raceParticipants schema', () => {
  describe('table structure', () => {
    it('should have the correct table name', () => {
      const tableName = (
        raceParticipants as Record<symbol, { name: string }>
      )[
        Object.getOwnPropertySymbols(raceParticipants).find(
          (s) => s.description === 'drizzle:Name'
        ) as symbol
      ];
      expect(tableName).toBe('race_participants');
    });

    it('should have all required columns', () => {
      const columnNames = Object.keys(raceParticipants);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('raceId');
      expect(columnNames).toContain('userId');
      expect(columnNames).toContain('currentChallengeIndex');
      expect(columnNames).toContain('wpm');
      expect(columnNames).toContain('accuracy');
      expect(columnNames).toContain('finishedAt');
      expect(columnNames).toContain('rank');
      expect(columnNames).toContain('createdAt');
    });

    it('should have id as primary key', () => {
      expect(raceParticipants.id.primary).toBe(true);
    });

    it('should have raceId as not null', () => {
      expect(raceParticipants.raceId.notNull).toBe(true);
    });

    it('should have userId as not null', () => {
      expect(raceParticipants.userId.notNull).toBe(true);
    });

    it('should have currentChallengeIndex as not null', () => {
      expect(raceParticipants.currentChallengeIndex.notNull).toBe(true);
    });
  });

  describe('column defaults', () => {
    it('should default currentChallengeIndex to 0', () => {
      expect(raceParticipants.currentChallengeIndex.default).toBe(0);
    });
  });

  describe('nullable columns', () => {
    it('should allow null wpm', () => {
      const participant: NewRaceParticipant = {
        raceId: 1,
        userId: 1,
        wpm: null,
      };
      expect(participant.wpm).toBeNull();
    });

    it('should allow null accuracy', () => {
      const participant: NewRaceParticipant = {
        raceId: 1,
        userId: 1,
        accuracy: null,
      };
      expect(participant.accuracy).toBeNull();
    });

    it('should allow null finishedAt', () => {
      const participant: NewRaceParticipant = {
        raceId: 1,
        userId: 1,
        finishedAt: null,
      };
      expect(participant.finishedAt).toBeNull();
    });

    it('should allow null rank', () => {
      const participant: NewRaceParticipant = {
        raceId: 1,
        userId: 1,
        rank: null,
      };
      expect(participant.rank).toBeNull();
    });
  });

  describe('type inference', () => {
    it('should allow valid NewRaceParticipant with all fields', () => {
      const participant: NewRaceParticipant = {
        raceId: 1,
        userId: 2,
        currentChallengeIndex: 3,
        wpm: 85,
        accuracy: 97,
        finishedAt: new Date(),
        rank: 1,
      };

      expect(participant.raceId).toBe(1);
      expect(participant.userId).toBe(2);
      expect(participant.currentChallengeIndex).toBe(3);
      expect(participant.wpm).toBe(85);
      expect(participant.accuracy).toBe(97);
      expect(participant.finishedAt).toBeInstanceOf(Date);
      expect(participant.rank).toBe(1);
    });

    it('should allow NewRaceParticipant with only required fields', () => {
      const participant: NewRaceParticipant = {
        raceId: 1,
        userId: 2,
      };

      expect(participant.raceId).toBe(1);
      expect(participant.userId).toBe(2);
      expect(participant.currentChallengeIndex).toBeUndefined();
      expect(participant.wpm).toBeUndefined();
      expect(participant.accuracy).toBeUndefined();
      expect(participant.finishedAt).toBeUndefined();
      expect(participant.rank).toBeUndefined();
    });

    it('should infer RaceParticipant type with all fields', () => {
      const participant: RaceParticipant = {
        id: 1,
        raceId: 1,
        userId: 2,
        currentChallengeIndex: 5,
        wpm: 85,
        accuracy: 97,
        finishedAt: new Date(),
        rank: 1,
        createdAt: new Date(),
      };

      expect(participant.id).toBe(1);
      expect(participant.raceId).toBe(1);
      expect(participant.userId).toBe(2);
      expect(participant.currentChallengeIndex).toBe(5);
      expect(participant.wpm).toBe(85);
      expect(participant.accuracy).toBe(97);
      expect(participant.finishedAt).toBeInstanceOf(Date);
      expect(participant.rank).toBe(1);
      expect(participant.createdAt).toBeInstanceOf(Date);
    });

    it('should allow nullable fields to be null in RaceParticipant', () => {
      const participant: RaceParticipant = {
        id: 1,
        raceId: 1,
        userId: 2,
        currentChallengeIndex: 0,
        wpm: null,
        accuracy: null,
        finishedAt: null,
        rank: null,
        createdAt: new Date(),
      };

      expect(participant.currentChallengeIndex).toBe(0);
      expect(participant.wpm).toBeNull();
      expect(participant.accuracy).toBeNull();
      expect(participant.finishedAt).toBeNull();
      expect(participant.rank).toBeNull();
    });
  });

  describe('currentChallengeIndex field', () => {
    it('should accept 0 for first challenge', () => {
      const participant: NewRaceParticipant = {
        raceId: 1,
        userId: 1,
        currentChallengeIndex: 0,
      };
      expect(participant.currentChallengeIndex).toBe(0);
    });

    it('should accept positive integers for challenge progress', () => {
      const participant: NewRaceParticipant = {
        raceId: 1,
        userId: 1,
        currentChallengeIndex: 7,
      };
      expect(participant.currentChallengeIndex).toBe(7);
    });
  });

  describe('rank values', () => {
    it('should accept rank 1 for winner', () => {
      const participant: NewRaceParticipant = {
        raceId: 1,
        userId: 1,
        rank: 1,
      };
      expect(participant.rank).toBe(1);
    });

    it('should accept higher rank values', () => {
      const participant: NewRaceParticipant = {
        raceId: 1,
        userId: 1,
        rank: 4,
      };
      expect(participant.rank).toBe(4);
    });
  });

  describe('wpm and accuracy values', () => {
    it('should accept typical wpm values', () => {
      const participant: NewRaceParticipant = {
        raceId: 1,
        userId: 1,
        wpm: 120,
      };
      expect(participant.wpm).toBe(120);
    });

    it('should accept accuracy as percentage integer', () => {
      const participant: NewRaceParticipant = {
        raceId: 1,
        userId: 1,
        accuracy: 100,
      };
      expect(participant.accuracy).toBe(100);
    });
  });

  describe('finishedAt field', () => {
    it('should accept a Date for finishedAt', () => {
      const now = new Date();
      const participant: NewRaceParticipant = {
        raceId: 1,
        userId: 1,
        finishedAt: now,
      };
      expect(participant.finishedAt).toBe(now);
    });

    it('should accept null for participants who did not finish', () => {
      const participant: NewRaceParticipant = {
        raceId: 1,
        userId: 1,
        finishedAt: null,
      };
      expect(participant.finishedAt).toBeNull();
    });
  });
});
