import { describe, it, expect } from 'vitest';
import {
  selectSmartChallenges,
  type SmartChallenge,
} from '../smart-practice';
import type { SessionPerformance } from '../adaptive-difficulty';
import type { WeaknessReport } from '@/lib/weakness/analyze';

function makeChallenge(overrides: Partial<SmartChallenge & { id: number }> = {}) {
  return {
    id: 1,
    content: 'git commit -m "fix: update"',
    difficulty: 'beginner',
    syntaxType: 'git',
    hint: 'Git commit',
    categoryId: 1,
    categoryName: 'Git Basics',
    categorySlug: 'git-basics',
    ...overrides,
  };
}

function makeSessions(
  count: number,
  overrides: Partial<SessionPerformance> = {}
): SessionPerformance[] {
  return Array.from({ length: count }, () => ({
    wpm: 40,
    accuracy: 85,
    errors: 5,
    keystrokes: 100,
    durationMs: 30000,
    challengeDifficulty: 'beginner' as const,
    ...overrides,
  }));
}

function makeWeaknessReport(overrides: Partial<WeaknessReport> = {}): WeaknessReport {
  return {
    weakestKeys: [],
    slowestKeys: [],
    commonTypos: [],
    problemSequences: [],
    summary: {
      overallAccuracy: 95,
      avgLatencyMs: 120,
      totalKeysTracked: 26,
      keysNeedingWork: 0,
      sequencesNeedingWork: 0,
      topWeakness: null,
    },
    ...overrides,
  };
}

describe('selectSmartChallenges', () => {
  describe('basic selection', () => {
    it('should return empty when no challenges exist', () => {
      const result = selectSmartChallenges([], [], [], null);
      expect(result.challenges).toHaveLength(0);
      expect(result.summary).toContain('No challenges available');
    });

    it('should select challenges up to the limit', () => {
      const challenges = Array.from({ length: 10 }, (_, i) =>
        makeChallenge({ id: i + 1, categoryId: i % 3 + 1 })
      );

      const result = selectSmartChallenges(challenges, [], [], null, { limit: 5 });
      expect(result.challenges).toHaveLength(5);
    });

    it('should return all challenges when fewer than limit exist', () => {
      const challenges = [
        makeChallenge({ id: 1 }),
        makeChallenge({ id: 2 }),
      ];

      const result = selectSmartChallenges(challenges, [], [], null, { limit: 5 });
      expect(result.challenges).toHaveLength(2);
    });
  });

  describe('difficulty matching', () => {
    it('should prefer challenges matching recommended difficulty', () => {
      const challenges = [
        makeChallenge({ id: 1, difficulty: 'advanced', categoryId: 1 }),
        makeChallenge({ id: 2, difficulty: 'beginner', categoryId: 2 }),
        makeChallenge({ id: 3, difficulty: 'beginner', categoryId: 3 }),
      ];

      // No sessions = beginner recommended
      const result = selectSmartChallenges(challenges, [], [], null, { limit: 2 });

      // Beginner challenges should score higher
      const beginnerChallenges = result.challenges.filter(
        (c) => c.difficulty === 'beginner'
      );
      expect(beginnerChallenges.length).toBeGreaterThanOrEqual(1);
    });

    it('should recommend higher difficulty when sessions show strong performance', () => {
      const challenges = [
        makeChallenge({ id: 1, difficulty: 'beginner', categoryId: 1 }),
        makeChallenge({ id: 2, difficulty: 'intermediate', categoryId: 2 }),
        makeChallenge({ id: 3, difficulty: 'advanced', categoryId: 3 }),
      ];

      const sessions = makeSessions(5, {
        wpm: 70,
        accuracy: 97,
        challengeDifficulty: 'intermediate',
      });

      const result = selectSmartChallenges(challenges, sessions, [], null, { limit: 1 });

      // With high WPM and accuracy, should recommend advanced
      expect(result.adaptive.recommendedDifficulty).toBe('advanced');
      expect(result.challenges[0].difficulty).toBe('advanced');
    });
  });

  describe('freshness', () => {
    it('should penalize recently completed challenges', () => {
      const challenges = [
        makeChallenge({ id: 1, content: 'git status', categoryId: 1 }),
        makeChallenge({ id: 2, content: 'git log --oneline', categoryId: 2 }),
      ];

      const recentSessionInfo = [
        { challengeId: 1, categoryId: 1 },
      ];

      const result = selectSmartChallenges(
        challenges, [], recentSessionInfo, null, { limit: 2 }
      );

      // Challenge 2 (not recently done) should score higher than challenge 1
      expect(result.challenges[0].id).toBe(2);
    });
  });

  describe('category variety', () => {
    it('should favor under-practiced categories', () => {
      const challenges = [
        makeChallenge({ id: 1, categoryId: 1, categoryName: 'Git' }),
        makeChallenge({ id: 2, categoryId: 1, categoryName: 'Git' }),
        makeChallenge({ id: 3, categoryId: 2, categoryName: 'Docker' }),
        makeChallenge({ id: 4, categoryId: 3, categoryName: 'SQL' }),
      ];

      const recentSessionInfo = [
        { challengeId: 10, categoryId: 1 },
        { challengeId: 11, categoryId: 1 },
        { challengeId: 12, categoryId: 1 },
      ];

      const result = selectSmartChallenges(
        challenges, [], recentSessionInfo, null, { limit: 3 }
      );

      // Should include challenges from category 2 and 3 (new categories)
      const categoryIds = new Set(result.challenges.map((c) => c.categoryId));
      expect(categoryIds.size).toBeGreaterThanOrEqual(2);
    });

    it('should ensure variety in final selection', () => {
      // Create 10 challenges in category 1, 2 in category 2
      const challenges = [
        ...Array.from({ length: 10 }, (_, i) =>
          makeChallenge({ id: i + 1, categoryId: 1, categoryName: 'Git' })
        ),
        makeChallenge({ id: 11, categoryId: 2, categoryName: 'Docker' }),
        makeChallenge({ id: 12, categoryId: 2, categoryName: 'Docker' }),
      ];

      const result = selectSmartChallenges(challenges, [], [], null, { limit: 5 });

      // Should not have all 5 from category 1
      const cat1Count = result.challenges.filter((c) => c.categoryId === 1).length;
      const cat2Count = result.challenges.filter((c) => c.categoryId === 2).length;
      expect(cat1Count).toBeLessThanOrEqual(3);
      expect(cat2Count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('weakness targeting', () => {
    it('should prefer challenges containing weak characters', () => {
      const challenges = [
        makeChallenge({ id: 1, content: 'print("hello world")', categoryId: 1 }),
        makeChallenge({ id: 2, content: 'zzzzz qqqqq xxxxx', categoryId: 2 }),
      ];

      const report = makeWeaknessReport({
        weakestKeys: [
          { key: 'z', accuracy: 60, totalPresses: 20, correctPresses: 12, avgLatencyMs: 200 },
          { key: 'q', accuracy: 65, totalPresses: 15, correctPresses: 10, avgLatencyMs: 180 },
        ],
      });

      const result = selectSmartChallenges(
        challenges, [], [], report, { limit: 1 }
      );

      // Challenge with weak characters should score higher
      expect(result.challenges[0].id).toBe(2);
    });

    it('should score challenges with problem sequences higher', () => {
      const challenges = [
        makeChallenge({ id: 1, content: 'git status', categoryId: 1 }),
        makeChallenge({
          id: 2,
          content: 'the thread throttles through the threshold',
          categoryId: 2,
        }),
      ];

      const report = makeWeaknessReport({
        problemSequences: [
          { sequence: 'th', totalAttempts: 50, errorCount: 15, errorRate: 30, avgLatencyMs: 200 },
        ],
      });

      const result = selectSmartChallenges(
        challenges, [], [], report, { limit: 1 }
      );

      // Challenge 2 has many 'th' sequences
      expect(result.challenges[0].id).toBe(2);
    });
  });

  describe('result structure', () => {
    it('should include adaptive info in result', () => {
      const challenges = [makeChallenge({ id: 1 })];
      const sessions = makeSessions(5);

      const result = selectSmartChallenges(challenges, sessions, [], null);

      expect(result.adaptive).toBeDefined();
      expect(result.adaptive.recommendedDifficulty).toBeDefined();
      expect(result.adaptive.difficultyScore).toBeGreaterThan(0);
      expect(result.adaptive.confidence).toBeGreaterThanOrEqual(0);
      expect(result.adaptive.reasons).toBeInstanceOf(Array);
    });

    it('should include summary', () => {
      const challenges = [makeChallenge({ id: 1 })];
      const result = selectSmartChallenges(challenges, [], [], null);

      expect(result.summary).toBeTruthy();
      expect(typeof result.summary).toBe('string');
    });

    it('should include score and reasons on each challenge', () => {
      const challenges = [makeChallenge({ id: 1 })];
      const result = selectSmartChallenges(challenges, [], [], null);

      expect(result.challenges[0].score).toBeDefined();
      expect(typeof result.challenges[0].score).toBe('number');
      expect(result.challenges[0].reasons).toBeInstanceOf(Array);
    });
  });

  describe('combined scoring', () => {
    it('should rank challenges considering all factors together', () => {
      const challenges = [
        // Recently completed, wrong difficulty, no weakness match
        makeChallenge({
          id: 1,
          difficulty: 'advanced',
          content: 'SELECT * FROM users',
          categoryId: 1,
        }),
        // Not recent, right difficulty, has weak chars, new category
        makeChallenge({
          id: 2,
          difficulty: 'beginner',
          content: 'git push zzz qqq',
          categoryId: 2,
        }),
        // Not recent, right difficulty, no weakness match
        makeChallenge({
          id: 3,
          difficulty: 'beginner',
          content: 'git pull origin main',
          categoryId: 1,
        }),
      ];

      const recentSessionInfo = [{ challengeId: 1, categoryId: 1 }];
      const report = makeWeaknessReport({
        weakestKeys: [
          { key: 'z', accuracy: 60, totalPresses: 20, correctPresses: 12, avgLatencyMs: 200 },
          { key: 'q', accuracy: 65, totalPresses: 15, correctPresses: 10, avgLatencyMs: 180 },
        ],
      });

      const result = selectSmartChallenges(
        challenges, [], recentSessionInfo, report, { limit: 3 }
      );

      // Challenge 2 should rank highest (right difficulty + weak chars + new category + not recent)
      expect(result.challenges[0].id).toBe(2);
      // Challenge 1 should rank lowest (wrong difficulty + recent)
      expect(result.challenges[result.challenges.length - 1].id).toBe(1);
    });
  });
});
