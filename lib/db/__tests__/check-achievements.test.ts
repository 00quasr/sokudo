import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need a robust way to mock sequential db.select() calls that each
// return a promise-like chain. Drizzle ORM queries are awaitable objects.

let selectCallIndex = 0;
let selectResults: unknown[][] = [];

function createChain(resultIndex: () => number) {
  // Create a thenable chain object. Every method returns the same chain,
  // and when awaited it resolves to the result for the current call index.
  const chain: Record<string, unknown> = {};
  const methods = ['from', 'where', 'innerJoin', 'groupBy', 'limit'];
  for (const method of methods) {
    chain[method] = vi.fn(() => chain);
  }
  // Make it awaitable
  chain.then = (resolve: (val: unknown) => unknown, reject?: (err: unknown) => unknown) => {
    const idx = resultIndex();
    const result = selectResults[idx] ?? [];
    return Promise.resolve(result).then(resolve, reject);
  };
  return chain;
}

const mockInsertValues = vi.fn().mockResolvedValue(undefined);
const mockFindFirst = vi.fn();

vi.mock('../drizzle', () => ({
  db: {
    select: vi.fn(() => {
      const idx = selectCallIndex;
      selectCallIndex++;
      return createChain(() => idx);
    }),
    insert: vi.fn(() => ({ values: mockInsertValues })),
    query: {
      userProfiles: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
  },
}));

import { checkAndUnlockAchievements } from '../check-achievements';
import { db } from '../drizzle';

function setSelectResults(...results: unknown[][]) {
  selectCallIndex = 0;
  selectResults = results;
}

describe('checkAndUnlockAchievements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectCallIndex = 0;
    selectResults = [];
    mockInsertValues.mockResolvedValue(undefined);
    mockFindFirst.mockResolvedValue(null);
  });

  describe('when user has earned all achievements', () => {
    it('should return empty array when no unearned achievements remain', async () => {
      setSelectResults(
        [{ achievementId: 1 }, { achievementId: 2 }],
        []
      );

      const result = await checkAndUnlockAchievements(1, {
        wpm: 100,
        accuracy: 99,
        challengeId: 1,
      });

      expect(result).toEqual([]);
    });
  });

  describe('wpm criteria', () => {
    it('should unlock when session wpm meets threshold', async () => {
      setSelectResults(
        [],
        [
          {
            id: 1,
            slug: 'speed-50',
            name: 'Warming Up',
            description: 'Reach 50 WPM in any session',
            icon: 'gauge',
            criteria: { type: 'wpm', threshold: 50 },
          },
        ]
      );

      const result = await checkAndUnlockAchievements(1, {
        wpm: 55,
        accuracy: 80,
        challengeId: 1,
      });

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('speed-50');
      expect(result[0].name).toBe('Warming Up');
    });

    it('should not unlock when session wpm is below threshold', async () => {
      setSelectResults(
        [],
        [
          {
            id: 1,
            slug: 'speed-50',
            name: 'Warming Up',
            description: 'Reach 50 WPM in any session',
            icon: 'gauge',
            criteria: { type: 'wpm', threshold: 50 },
          },
        ]
      );

      const result = await checkAndUnlockAchievements(1, {
        wpm: 40,
        accuracy: 80,
        challengeId: 1,
      });

      expect(result).toEqual([]);
    });

    it('should unlock when wpm exactly matches threshold', async () => {
      setSelectResults(
        [],
        [
          {
            id: 1,
            slug: 'speed-50',
            name: 'Warming Up',
            description: 'Reach 50 WPM in any session',
            icon: 'gauge',
            criteria: { type: 'wpm', threshold: 50 },
          },
        ]
      );

      const result = await checkAndUnlockAchievements(1, {
        wpm: 50,
        accuracy: 80,
        challengeId: 1,
      });

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('speed-50');
    });
  });

  describe('accuracy criteria', () => {
    it('should unlock when session accuracy meets threshold', async () => {
      setSelectResults(
        [],
        [
          {
            id: 10,
            slug: 'accuracy-95',
            name: 'Sharpshooter',
            description: 'Achieve 95% accuracy in a session',
            icon: 'target',
            criteria: { type: 'accuracy', threshold: 95 },
          },
        ]
      );

      const result = await checkAndUnlockAchievements(1, {
        wpm: 60,
        accuracy: 97,
        challengeId: 1,
      });

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('accuracy-95');
    });

    it('should not unlock when accuracy is below threshold', async () => {
      setSelectResults(
        [],
        [
          {
            id: 10,
            slug: 'accuracy-95',
            name: 'Sharpshooter',
            description: 'Achieve 95% accuracy in a session',
            icon: 'target',
            criteria: { type: 'accuracy', threshold: 95 },
          },
        ]
      );

      const result = await checkAndUnlockAchievements(1, {
        wpm: 60,
        accuracy: 90,
        challengeId: 1,
      });

      expect(result).toEqual([]);
    });
  });

  describe('streak criteria', () => {
    it('should unlock when current streak meets threshold', async () => {
      setSelectResults(
        [],
        [
          {
            id: 7,
            slug: 'streak-3',
            name: 'Getting Started',
            description: 'Practice for 3 consecutive days',
            icon: 'flame',
            criteria: { type: 'streak', threshold: 3 },
          },
        ]
      );
      mockFindFirst.mockResolvedValue({ currentStreak: 5, longestStreak: 5 });

      const result = await checkAndUnlockAchievements(1, {
        wpm: 60,
        accuracy: 80,
        challengeId: 1,
      });

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('streak-3');
    });

    it('should not unlock when streak is below threshold', async () => {
      setSelectResults(
        [],
        [
          {
            id: 7,
            slug: 'streak-3',
            name: 'Getting Started',
            description: 'Practice for 3 consecutive days',
            icon: 'flame',
            criteria: { type: 'streak', threshold: 3 },
          },
        ]
      );
      mockFindFirst.mockResolvedValue({ currentStreak: 2, longestStreak: 2 });

      const result = await checkAndUnlockAchievements(1, {
        wpm: 60,
        accuracy: 80,
        challengeId: 1,
      });

      expect(result).toEqual([]);
    });

    it('should not unlock when user profile does not exist', async () => {
      setSelectResults(
        [],
        [
          {
            id: 7,
            slug: 'streak-3',
            name: 'Getting Started',
            description: 'Practice for 3 consecutive days',
            icon: 'flame',
            criteria: { type: 'streak', threshold: 3 },
          },
        ]
      );
      mockFindFirst.mockResolvedValue(null);

      const result = await checkAndUnlockAchievements(1, {
        wpm: 60,
        accuracy: 80,
        challengeId: 1,
      });

      expect(result).toEqual([]);
    });
  });

  describe('sessions_completed criteria', () => {
    it('should unlock when total sessions meets threshold', async () => {
      setSelectResults(
        [],
        [
          {
            id: 20,
            slug: 'sessions-100',
            name: 'Centurion',
            description: 'Complete 100 typing sessions',
            icon: 'trophy',
            criteria: { type: 'sessions_completed', threshold: 100 },
          },
        ],
        [{ count: 100 }]
      );

      const result = await checkAndUnlockAchievements(1, {
        wpm: 60,
        accuracy: 80,
        challengeId: 1,
      });

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('sessions-100');
    });

    it('should not unlock when session count is below threshold', async () => {
      setSelectResults(
        [],
        [
          {
            id: 20,
            slug: 'sessions-100',
            name: 'Centurion',
            description: 'Complete 100 typing sessions',
            icon: 'trophy',
            criteria: { type: 'sessions_completed', threshold: 100 },
          },
        ],
        [{ count: 50 }]
      );

      const result = await checkAndUnlockAchievements(1, {
        wpm: 60,
        accuracy: 80,
        challengeId: 1,
      });

      expect(result).toEqual([]);
    });
  });

  describe('category_mastery criteria', () => {
    it('should unlock when all challenges completed with sufficient accuracy', async () => {
      setSelectResults(
        [],
        [
          {
            id: 13,
            slug: 'mastery-git-basics',
            name: 'Git Beginner',
            description: 'Complete all Git Basics challenges with 90%+ accuracy',
            icon: 'git-branch',
            criteria: {
              type: 'category_mastery',
              categorySlug: 'git-basics',
              minAccuracy: 90,
              allChallenges: true,
            },
          },
        ],
        [{ id: 1, totalChallenges: 3 }],
        [
          { challengeId: 1, bestAccuracy: 95 },
          { challengeId: 2, bestAccuracy: 92 },
          { challengeId: 3, bestAccuracy: 90 },
        ]
      );

      const result = await checkAndUnlockAchievements(1, {
        wpm: 60,
        accuracy: 90,
        challengeId: 3,
      });

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('mastery-git-basics');
    });

    it('should not unlock when not all challenges completed', async () => {
      setSelectResults(
        [],
        [
          {
            id: 13,
            slug: 'mastery-git-basics',
            name: 'Git Beginner',
            description: 'Complete all Git Basics challenges with 90%+ accuracy',
            icon: 'git-branch',
            criteria: {
              type: 'category_mastery',
              categorySlug: 'git-basics',
              minAccuracy: 90,
              allChallenges: true,
            },
          },
        ],
        [{ id: 1, totalChallenges: 5 }],
        [
          { challengeId: 1, bestAccuracy: 95 },
          { challengeId: 2, bestAccuracy: 92 },
        ]
      );

      const result = await checkAndUnlockAchievements(1, {
        wpm: 60,
        accuracy: 90,
        challengeId: 2,
      });

      expect(result).toEqual([]);
    });

    it('should not unlock when any challenge accuracy is below min', async () => {
      setSelectResults(
        [],
        [
          {
            id: 13,
            slug: 'mastery-git-basics',
            name: 'Git Beginner',
            description: 'Complete all Git Basics challenges with 90%+ accuracy',
            icon: 'git-branch',
            criteria: {
              type: 'category_mastery',
              categorySlug: 'git-basics',
              minAccuracy: 90,
              allChallenges: true,
            },
          },
        ],
        [{ id: 1, totalChallenges: 3 }],
        [
          { challengeId: 1, bestAccuracy: 95 },
          { challengeId: 2, bestAccuracy: 85 },
          { challengeId: 3, bestAccuracy: 92 },
        ]
      );

      const result = await checkAndUnlockAchievements(1, {
        wpm: 60,
        accuracy: 85,
        challengeId: 2,
      });

      expect(result).toEqual([]);
    });

    it('should not unlock when category does not exist', async () => {
      setSelectResults(
        [],
        [
          {
            id: 13,
            slug: 'mastery-git-basics',
            name: 'Git Beginner',
            description: 'Complete all Git Basics challenges with 90%+ accuracy',
            icon: 'git-branch',
            criteria: {
              type: 'category_mastery',
              categorySlug: 'nonexistent',
              minAccuracy: 90,
              allChallenges: true,
            },
          },
        ],
        []
      );

      const result = await checkAndUnlockAchievements(1, {
        wpm: 60,
        accuracy: 90,
        challengeId: 1,
      });

      expect(result).toEqual([]);
    });
  });

  describe('multiple achievements', () => {
    it('should unlock multiple achievements in a single session', async () => {
      setSelectResults(
        [],
        [
          {
            id: 1,
            slug: 'speed-50',
            name: 'Warming Up',
            description: 'Reach 50 WPM in any session',
            icon: 'gauge',
            criteria: { type: 'wpm', threshold: 50 },
          },
          {
            id: 10,
            slug: 'accuracy-95',
            name: 'Sharpshooter',
            description: 'Achieve 95% accuracy in a session',
            icon: 'target',
            criteria: { type: 'accuracy', threshold: 95 },
          },
        ]
      );

      const result = await checkAndUnlockAchievements(1, {
        wpm: 60,
        accuracy: 97,
        challengeId: 1,
      });

      expect(result).toHaveLength(2);
      expect(result.map((a) => a.slug).sort()).toEqual(['accuracy-95', 'speed-50']);
    });
  });

  describe('insert behavior', () => {
    it('should not call insert when no achievements are unlocked', async () => {
      setSelectResults(
        [],
        [
          {
            id: 1,
            slug: 'speed-50',
            name: 'Warming Up',
            description: 'Reach 50 WPM in any session',
            icon: 'gauge',
            criteria: { type: 'wpm', threshold: 50 },
          },
        ]
      );

      await checkAndUnlockAchievements(1, {
        wpm: 30,
        accuracy: 50,
        challengeId: 1,
      });

      expect(db.insert).not.toHaveBeenCalled();
    });

    it('should call insert with correct user and achievement IDs', async () => {
      setSelectResults(
        [],
        [
          {
            id: 5,
            slug: 'speed-80',
            name: 'Velocity',
            description: 'Reach 80 WPM in any session',
            icon: 'zap',
            criteria: { type: 'wpm', threshold: 80 },
          },
        ]
      );

      await checkAndUnlockAchievements(42, {
        wpm: 85,
        accuracy: 90,
        challengeId: 1,
      });

      expect(db.insert).toHaveBeenCalled();
      expect(mockInsertValues).toHaveBeenCalledWith([
        { userId: 42, achievementId: 5 },
      ]);
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
        ]
      );

      const result = await checkAndUnlockAchievements(1, {
        wpm: 100,
        accuracy: 100,
        challengeId: 1,
      });

      expect(result).toEqual([]);
    });
  });
});
