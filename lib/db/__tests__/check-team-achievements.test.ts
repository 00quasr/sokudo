import { describe, it, expect, vi, beforeEach } from 'vitest';

let selectCallIndex = 0;
let selectResults: unknown[][] = [];

function createChain(resultIndex: () => number) {
  const chain: Record<string, unknown> = {};
  const methods = ['from', 'where', 'innerJoin', 'groupBy', 'limit'];
  for (const method of methods) {
    chain[method] = vi.fn(() => chain);
  }
  chain.then = (resolve: (val: unknown) => unknown, reject?: (err: unknown) => unknown) => {
    const idx = resultIndex();
    const result = selectResults[idx] ?? [];
    return Promise.resolve(result).then(resolve, reject);
  };
  return chain;
}

const mockInsertValues = vi.fn().mockResolvedValue(undefined);

vi.mock('../drizzle', () => ({
  db: {
    select: vi.fn(() => {
      const idx = selectCallIndex;
      selectCallIndex++;
      return createChain(() => idx);
    }),
    insert: vi.fn(() => ({ values: mockInsertValues })),
    query: {
      teamMembers: {
        findFirst: vi.fn(),
      },
    },
  },
}));

import { checkAndUnlockTeamAchievements } from '../check-team-achievements';
import { db } from '../drizzle';

function setSelectResults(...results: unknown[][]) {
  selectCallIndex = 0;
  selectResults = results;
}

describe('checkAndUnlockTeamAchievements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectCallIndex = 0;
    selectResults = [];
    mockInsertValues.mockResolvedValue(undefined);
  });

  describe('when team has earned all achievements', () => {
    it('should return empty array when no unearned achievements remain', async () => {
      setSelectResults(
        // earnedRows
        [{ achievementId: 1 }, { achievementId: 2 }],
        // unearnedAchievements (empty since all are filtered)
        []
      );

      const result = await checkAndUnlockTeamAchievements(1);
      expect(result).toEqual([]);
    });
  });

  describe('team_sessions criteria', () => {
    it('should unlock when total sessions meet threshold', async () => {
      setSelectResults(
        // earnedRows (none)
        [],
        // unearnedAchievements
        [
          {
            id: 1,
            slug: 'team-sessions-50',
            name: 'First Fifty',
            description: 'Complete 50 sessions as a team',
            icon: 'users',
            criteria: { type: 'team_sessions', threshold: 50 },
          },
        ],
        // team members
        [{ userId: 10 }, { userId: 20 }],
        // session stats per user
        [
          { userId: 10, totalSessions: 30, avgWpm: 60, avgAccuracy: 90 },
          { userId: 20, totalSessions: 25, avgWpm: 55, avgAccuracy: 88 },
        ],
        // profiles
        [
          { userId: 10, currentStreak: 5, totalPracticeTimeMs: 100000 },
          { userId: 20, currentStreak: 3, totalPracticeTimeMs: 200000 },
        ],
        // completed team challenges
        [{ count: 2 }]
      );

      const result = await checkAndUnlockTeamAchievements(1);
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('team-sessions-50');
    });

    it('should not unlock when sessions below threshold', async () => {
      setSelectResults(
        [],
        [
          {
            id: 1,
            slug: 'team-sessions-50',
            name: 'First Fifty',
            description: 'Complete 50 sessions as a team',
            icon: 'users',
            criteria: { type: 'team_sessions', threshold: 50 },
          },
        ],
        [{ userId: 10 }, { userId: 20 }],
        [
          { userId: 10, totalSessions: 10, avgWpm: 60, avgAccuracy: 90 },
          { userId: 20, totalSessions: 15, avgWpm: 55, avgAccuracy: 88 },
        ],
        [
          { userId: 10, currentStreak: 5, totalPracticeTimeMs: 100000 },
          { userId: 20, currentStreak: 3, totalPracticeTimeMs: 200000 },
        ],
        [{ count: 0 }]
      );

      const result = await checkAndUnlockTeamAchievements(1);
      expect(result).toEqual([]);
    });
  });

  describe('team_avg_wpm criteria', () => {
    it('should unlock when team avg WPM meets threshold', async () => {
      setSelectResults(
        [],
        [
          {
            id: 2,
            slug: 'team-avg-wpm-60',
            name: 'Team Velocity',
            description: 'Reach a team average of 60 WPM',
            icon: 'gauge',
            criteria: { type: 'team_avg_wpm', threshold: 60 },
          },
        ],
        [{ userId: 10 }, { userId: 20 }],
        [
          { userId: 10, totalSessions: 10, avgWpm: 65, avgAccuracy: 90 },
          { userId: 20, totalSessions: 10, avgWpm: 60, avgAccuracy: 88 },
        ],
        [
          { userId: 10, currentStreak: 5, totalPracticeTimeMs: 100000 },
          { userId: 20, currentStreak: 3, totalPracticeTimeMs: 200000 },
        ],
        [{ count: 0 }]
      );

      const result = await checkAndUnlockTeamAchievements(1);
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('team-avg-wpm-60');
    });

    it('should not unlock when avg WPM is below threshold', async () => {
      setSelectResults(
        [],
        [
          {
            id: 2,
            slug: 'team-avg-wpm-60',
            name: 'Team Velocity',
            description: 'Reach a team average of 60 WPM',
            icon: 'gauge',
            criteria: { type: 'team_avg_wpm', threshold: 60 },
          },
        ],
        [{ userId: 10 }, { userId: 20 }],
        [
          { userId: 10, totalSessions: 10, avgWpm: 40, avgAccuracy: 90 },
          { userId: 20, totalSessions: 10, avgWpm: 50, avgAccuracy: 88 },
        ],
        [
          { userId: 10, currentStreak: 5, totalPracticeTimeMs: 100000 },
          { userId: 20, currentStreak: 3, totalPracticeTimeMs: 200000 },
        ],
        [{ count: 0 }]
      );

      const result = await checkAndUnlockTeamAchievements(1);
      expect(result).toEqual([]);
    });
  });

  describe('team_all_active criteria', () => {
    it('should unlock when all members have sessions', async () => {
      setSelectResults(
        [],
        [
          {
            id: 3,
            slug: 'team-all-active',
            name: 'Full House',
            description: 'Every team member completes at least one session',
            icon: 'check-circle',
            criteria: { type: 'team_all_active' },
          },
        ],
        [{ userId: 10 }, { userId: 20 }],
        [
          { userId: 10, totalSessions: 5, avgWpm: 60, avgAccuracy: 90 },
          { userId: 20, totalSessions: 3, avgWpm: 55, avgAccuracy: 88 },
        ],
        [
          { userId: 10, currentStreak: 5, totalPracticeTimeMs: 100000 },
          { userId: 20, currentStreak: 3, totalPracticeTimeMs: 200000 },
        ],
        [{ count: 0 }]
      );

      const result = await checkAndUnlockTeamAchievements(1);
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('team-all-active');
    });

    it('should not unlock when not all members have sessions', async () => {
      setSelectResults(
        [],
        [
          {
            id: 3,
            slug: 'team-all-active',
            name: 'Full House',
            description: 'Every team member completes at least one session',
            icon: 'check-circle',
            criteria: { type: 'team_all_active' },
          },
        ],
        [{ userId: 10 }, { userId: 20 }, { userId: 30 }],
        // Only 2 of 3 members have sessions
        [
          { userId: 10, totalSessions: 5, avgWpm: 60, avgAccuracy: 90 },
          { userId: 20, totalSessions: 3, avgWpm: 55, avgAccuracy: 88 },
        ],
        [
          { userId: 10, currentStreak: 5, totalPracticeTimeMs: 100000 },
          { userId: 20, currentStreak: 3, totalPracticeTimeMs: 200000 },
          { userId: 30, currentStreak: 0, totalPracticeTimeMs: 0 },
        ],
        [{ count: 0 }]
      );

      const result = await checkAndUnlockTeamAchievements(1);
      expect(result).toEqual([]);
    });
  });

  describe('team_practice_time criteria', () => {
    it('should unlock when total practice time meets threshold', async () => {
      setSelectResults(
        [],
        [
          {
            id: 4,
            slug: 'team-practice-1h',
            name: 'Hour of Power',
            description: 'Accumulate 1 hour of team practice time',
            icon: 'clock',
            criteria: { type: 'team_practice_time', thresholdMs: 3600000 },
          },
        ],
        [{ userId: 10 }, { userId: 20 }],
        [
          { userId: 10, totalSessions: 10, avgWpm: 60, avgAccuracy: 90 },
          { userId: 20, totalSessions: 10, avgWpm: 55, avgAccuracy: 88 },
        ],
        [
          { userId: 10, currentStreak: 5, totalPracticeTimeMs: 2000000 },
          { userId: 20, currentStreak: 3, totalPracticeTimeMs: 2000000 },
        ],
        [{ count: 0 }]
      );

      const result = await checkAndUnlockTeamAchievements(1);
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('team-practice-1h');
    });
  });

  describe('team_avg_accuracy criteria', () => {
    it('should unlock when team avg accuracy meets threshold', async () => {
      setSelectResults(
        [],
        [
          {
            id: 5,
            slug: 'team-avg-accuracy-90',
            name: 'Precision Team',
            description: 'Reach a team average accuracy of 90%',
            icon: 'target',
            criteria: { type: 'team_avg_accuracy', threshold: 90 },
          },
        ],
        [{ userId: 10 }, { userId: 20 }],
        [
          { userId: 10, totalSessions: 10, avgWpm: 60, avgAccuracy: 92 },
          { userId: 20, totalSessions: 10, avgWpm: 55, avgAccuracy: 91 },
        ],
        [
          { userId: 10, currentStreak: 5, totalPracticeTimeMs: 100000 },
          { userId: 20, currentStreak: 3, totalPracticeTimeMs: 200000 },
        ],
        [{ count: 0 }]
      );

      const result = await checkAndUnlockTeamAchievements(1);
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('team-avg-accuracy-90');
    });
  });

  describe('team_min_streak criteria', () => {
    it('should unlock when all members have minimum streak', async () => {
      setSelectResults(
        [],
        [
          {
            id: 6,
            slug: 'team-streak-3',
            name: 'Team Rhythm',
            description: 'Have every member maintain a 3-day streak simultaneously',
            icon: 'flame',
            criteria: { type: 'team_min_streak', threshold: 3 },
          },
        ],
        [{ userId: 10 }, { userId: 20 }],
        [
          { userId: 10, totalSessions: 10, avgWpm: 60, avgAccuracy: 90 },
          { userId: 20, totalSessions: 10, avgWpm: 55, avgAccuracy: 88 },
        ],
        [
          { userId: 10, currentStreak: 5, totalPracticeTimeMs: 100000 },
          { userId: 20, currentStreak: 4, totalPracticeTimeMs: 200000 },
        ],
        [{ count: 0 }]
      );

      const result = await checkAndUnlockTeamAchievements(1);
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('team-streak-3');
    });

    it('should not unlock when any member has streak below threshold', async () => {
      setSelectResults(
        [],
        [
          {
            id: 6,
            slug: 'team-streak-3',
            name: 'Team Rhythm',
            description: 'Have every member maintain a 3-day streak simultaneously',
            icon: 'flame',
            criteria: { type: 'team_min_streak', threshold: 3 },
          },
        ],
        [{ userId: 10 }, { userId: 20 }],
        [
          { userId: 10, totalSessions: 10, avgWpm: 60, avgAccuracy: 90 },
          { userId: 20, totalSessions: 10, avgWpm: 55, avgAccuracy: 88 },
        ],
        [
          { userId: 10, currentStreak: 5, totalPracticeTimeMs: 100000 },
          { userId: 20, currentStreak: 2, totalPracticeTimeMs: 200000 },
        ],
        [{ count: 0 }]
      );

      const result = await checkAndUnlockTeamAchievements(1);
      expect(result).toEqual([]);
    });
  });

  describe('team_challenges_completed criteria', () => {
    it('should unlock when team challenge count meets threshold', async () => {
      setSelectResults(
        [],
        [
          {
            id: 7,
            slug: 'team-challenges-5',
            name: 'Challenge Accepted',
            description: 'Complete 5 team challenges',
            icon: 'swords',
            criteria: { type: 'team_challenges_completed', threshold: 5 },
          },
        ],
        [{ userId: 10 }, { userId: 20 }],
        [
          { userId: 10, totalSessions: 10, avgWpm: 60, avgAccuracy: 90 },
          { userId: 20, totalSessions: 10, avgWpm: 55, avgAccuracy: 88 },
        ],
        [
          { userId: 10, currentStreak: 5, totalPracticeTimeMs: 100000 },
          { userId: 20, currentStreak: 3, totalPracticeTimeMs: 200000 },
        ],
        [{ count: 6 }]
      );

      const result = await checkAndUnlockTeamAchievements(1);
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('team-challenges-5');
    });
  });

  describe('multiple achievements', () => {
    it('should unlock multiple achievements at once', async () => {
      setSelectResults(
        [],
        [
          {
            id: 1,
            slug: 'team-sessions-50',
            name: 'First Fifty',
            description: 'Complete 50 sessions as a team',
            icon: 'users',
            criteria: { type: 'team_sessions', threshold: 50 },
          },
          {
            id: 3,
            slug: 'team-all-active',
            name: 'Full House',
            description: 'Every team member completes at least one session',
            icon: 'check-circle',
            criteria: { type: 'team_all_active' },
          },
        ],
        [{ userId: 10 }, { userId: 20 }],
        [
          { userId: 10, totalSessions: 30, avgWpm: 60, avgAccuracy: 90 },
          { userId: 20, totalSessions: 25, avgWpm: 55, avgAccuracy: 88 },
        ],
        [
          { userId: 10, currentStreak: 5, totalPracticeTimeMs: 100000 },
          { userId: 20, currentStreak: 3, totalPracticeTimeMs: 200000 },
        ],
        [{ count: 0 }]
      );

      const result = await checkAndUnlockTeamAchievements(1);
      expect(result).toHaveLength(2);
      expect(result.map((a) => a.slug).sort()).toEqual(['team-all-active', 'team-sessions-50']);
    });
  });

  describe('insert behavior', () => {
    it('should not call insert when no achievements are unlocked', async () => {
      setSelectResults(
        [],
        [
          {
            id: 1,
            slug: 'team-sessions-50',
            name: 'First Fifty',
            description: 'Complete 50 sessions as a team',
            icon: 'users',
            criteria: { type: 'team_sessions', threshold: 50 },
          },
        ],
        [{ userId: 10 }],
        [{ userId: 10, totalSessions: 5, avgWpm: 30, avgAccuracy: 70 }],
        [{ userId: 10, currentStreak: 1, totalPracticeTimeMs: 10000 }],
        [{ count: 0 }]
      );

      await checkAndUnlockTeamAchievements(1);
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('should call insert with correct team and achievement IDs', async () => {
      setSelectResults(
        [],
        [
          {
            id: 5,
            slug: 'team-avg-accuracy-90',
            name: 'Precision Team',
            description: 'Reach a team average accuracy of 90%',
            icon: 'target',
            criteria: { type: 'team_avg_accuracy', threshold: 90 },
          },
        ],
        [{ userId: 10 }],
        [{ userId: 10, totalSessions: 10, avgWpm: 60, avgAccuracy: 95 }],
        [{ userId: 10, currentStreak: 5, totalPracticeTimeMs: 100000 }],
        [{ count: 0 }]
      );

      await checkAndUnlockTeamAchievements(42);
      expect(db.insert).toHaveBeenCalled();
      expect(mockInsertValues).toHaveBeenCalledWith([
        { teamId: 42, achievementId: 5 },
      ]);
    });
  });

  describe('no team members', () => {
    it('should return empty array when team has no members', async () => {
      setSelectResults(
        [],
        [
          {
            id: 1,
            slug: 'team-sessions-50',
            name: 'First Fifty',
            description: 'Complete 50 sessions as a team',
            icon: 'users',
            criteria: { type: 'team_sessions', threshold: 50 },
          },
        ],
        // Empty members
        []
      );

      const result = await checkAndUnlockTeamAchievements(1);
      expect(result).toEqual([]);
    });
  });

  describe('unknown criteria type', () => {
    it('should not unlock achievements with unknown criteria type', async () => {
      setSelectResults(
        [],
        [
          {
            id: 99,
            slug: 'unknown-type',
            name: 'Unknown',
            description: 'Unknown criteria type',
            icon: 'question',
            criteria: { type: 'unknown_type', threshold: 1 },
          },
        ],
        [{ userId: 10 }],
        [{ userId: 10, totalSessions: 100, avgWpm: 100, avgAccuracy: 100 }],
        [{ userId: 10, currentStreak: 100, totalPracticeTimeMs: 99999999 }],
        [{ count: 100 }]
      );

      const result = await checkAndUnlockTeamAchievements(1);
      expect(result).toEqual([]);
    });
  });
});
