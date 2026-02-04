import { describe, it, expect } from 'vitest';
import {
  generateRecommendations,
  type RecommendationInput,
  type CategoryPerformanceData,
  type CategoryInfo,
} from '../recommendations';
import type { SessionPerformance } from '../adaptive-difficulty';
import type { WeaknessReport } from '@/lib/weakness/analyze';

function makeSession(
  overrides: Partial<SessionPerformance> = {}
): SessionPerformance {
  return {
    wpm: 40,
    accuracy: 92,
    errors: 4,
    keystrokes: 50,
    durationMs: 30000,
    challengeDifficulty: 'intermediate',
    ...overrides,
  };
}

function makeSessions(
  count: number,
  overrides: Partial<SessionPerformance> = {}
): SessionPerformance[] {
  return Array.from({ length: count }, () => makeSession(overrides));
}

function makeCategories(): CategoryInfo[] {
  return [
    { id: 1, name: 'Git Basics', slug: 'git-basics', difficulty: 'beginner', isPremium: false },
    { id: 2, name: 'Docker', slug: 'docker', difficulty: 'intermediate', isPremium: false },
    { id: 3, name: 'React', slug: 'react', difficulty: 'intermediate', isPremium: false },
    { id: 4, name: 'TypeScript', slug: 'typescript', difficulty: 'advanced', isPremium: true },
  ];
}

function makeCategoryPerformance(
  overrides: Partial<CategoryPerformanceData>[] = []
): CategoryPerformanceData[] {
  const base: CategoryPerformanceData[] = [
    { categoryId: 1, categoryName: 'Git Basics', categorySlug: 'git-basics', sessions: 10, avgWpm: 45, avgAccuracy: 93 },
  ];
  return overrides.length > 0
    ? overrides.map((o, i) => ({ ...base[0], categoryId: i + 1, ...o }))
    : base;
}

function makeWeaknessReport(
  overrides: Partial<WeaknessReport> = {}
): WeaknessReport {
  return {
    weakestKeys: [],
    slowestKeys: [],
    commonTypos: [],
    problemSequences: [],
    summary: {
      overallAccuracy: 90,
      avgLatencyMs: 120,
      totalKeysTracked: 26,
      keysNeedingWork: 0,
      sequencesNeedingWork: 0,
      topWeakness: null,
    },
    ...overrides,
  };
}

function makeInput(overrides: Partial<RecommendationInput> = {}): RecommendationInput {
  return {
    sessions: makeSessions(5),
    weaknessReport: null,
    categoryPerformance: makeCategoryPerformance(),
    allCategories: makeCategories(),
    currentStreak: 0,
    totalSessions: 5,
    avgWpm: 40,
    avgAccuracy: 92,
    ...overrides,
  };
}

describe('generateRecommendations', () => {
  describe('new user with no sessions', () => {
    it('should return a single "start practicing" recommendation', () => {
      const result = generateRecommendations(makeInput({ totalSessions: 0 }));
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('practice_more');
      expect(result[0].actionHref).toBe('/practice');
    });
  });

  describe('user with few sessions', () => {
    it('should encourage building a habit when under 5 sessions', () => {
      const result = generateRecommendations(
        makeInput({
          totalSessions: 3,
          sessions: makeSessions(3),
        })
      );
      const practiceMore = result.find((r) => r.type === 'practice_more');
      expect(practiceMore).toBeDefined();
      expect(practiceMore!.description).toContain('3 sessions');
    });
  });

  describe('weak category recommendations', () => {
    it('should recommend practicing a category with low accuracy', () => {
      const result = generateRecommendations(
        makeInput({
          categoryPerformance: makeCategoryPerformance([
            { categoryName: 'Docker', categorySlug: 'docker', sessions: 5, avgWpm: 35, avgAccuracy: 78 },
            { categoryName: 'Git Basics', categorySlug: 'git-basics', sessions: 8, avgWpm: 50, avgAccuracy: 95 },
          ]),
        })
      );
      const weakCat = result.find(
        (r) => r.type === 'weak_category' && r.title.includes('Docker')
      );
      expect(weakCat).toBeDefined();
      expect(weakCat!.priority).toBe('high');
      expect(weakCat!.metric).toBe('78% accuracy');
    });

    it('should not flag categories with fewer than 3 sessions', () => {
      const result = generateRecommendations(
        makeInput({
          categoryPerformance: makeCategoryPerformance([
            { categoryName: 'Docker', categorySlug: 'docker', sessions: 2, avgWpm: 20, avgAccuracy: 60 },
          ]),
        })
      );
      const weakCat = result.find(
        (r) => r.type === 'weak_category' && r.title.includes('Docker')
      );
      expect(weakCat).toBeUndefined();
    });

    it('should recommend a slow category when WPM is well below average', () => {
      const result = generateRecommendations(
        makeInput({
          avgWpm: 50,
          categoryPerformance: makeCategoryPerformance([
            { categoryName: 'Docker', categorySlug: 'docker', sessions: 5, avgWpm: 30, avgAccuracy: 92 },
            { categoryName: 'Git Basics', categorySlug: 'git-basics', sessions: 8, avgWpm: 55, avgAccuracy: 95 },
          ]),
        })
      );
      const slowCat = result.find(
        (r) => r.type === 'weak_category' && r.title.includes('Speed up')
      );
      expect(slowCat).toBeDefined();
    });
  });

  describe('unexplored category recommendations', () => {
    it('should suggest unpracticed non-premium categories', () => {
      const result = generateRecommendations(
        makeInput({
          categoryPerformance: makeCategoryPerformance([
            { categoryName: 'Git Basics', categorySlug: 'git-basics', sessions: 10, avgWpm: 50, avgAccuracy: 95 },
          ]),
        })
      );
      const unexplored = result.find((r) => r.type === 'unexplored_category');
      expect(unexplored).toBeDefined();
      // Should not suggest premium TypeScript, should suggest Docker or React
      expect(unexplored!.title).not.toContain('TypeScript');
    });

    it('should not suggest premium categories as unexplored', () => {
      const result = generateRecommendations(
        makeInput({
          allCategories: [
            { id: 1, name: 'Git Basics', slug: 'git-basics', difficulty: 'beginner', isPremium: false },
            { id: 2, name: 'TypeScript', slug: 'typescript', difficulty: 'advanced', isPremium: true },
          ],
          categoryPerformance: makeCategoryPerformance([
            { categoryName: 'Git Basics', categorySlug: 'git-basics', sessions: 10, avgWpm: 50, avgAccuracy: 95 },
          ]),
        })
      );
      const unexplored = result.find((r) => r.type === 'unexplored_category');
      expect(unexplored).toBeUndefined();
    });
  });

  describe('weakness-based recommendations', () => {
    it('should recommend focusing on weak keys', () => {
      const report = makeWeaknessReport({
        weakestKeys: [
          { key: 'e', accuracy: 65, totalPresses: 100, correctPresses: 65, avgLatencyMs: 150 },
          { key: 'r', accuracy: 72, totalPresses: 80, correctPresses: 58, avgLatencyMs: 140 },
        ],
      });
      const result = generateRecommendations(
        makeInput({ weaknessReport: report })
      );
      const weakKey = result.find((r) => r.type === 'weak_key');
      expect(weakKey).toBeDefined();
      expect(weakKey!.title).toContain("'E'");
      expect(weakKey!.title).toContain('1 other key');
      expect(weakKey!.priority).toBe('high');
    });

    it('should recommend fixing common typos', () => {
      const report = makeWeaknessReport({
        commonTypos: [{ expected: 'e', actual: 'r', count: 15 }],
      });
      const result = generateRecommendations(
        makeInput({ weaknessReport: report })
      );
      const typo = result.find((r) => r.type === 'common_typo');
      expect(typo).toBeDefined();
      expect(typo!.title).toContain("'E'");
      expect(typo!.title).toContain("'R'");
    });

    it('should recommend slow key practice', () => {
      const report = makeWeaknessReport({
        slowestKeys: [
          { key: '{', avgLatencyMs: 450, totalPresses: 50, accuracy: 90 },
        ],
      });
      const result = generateRecommendations(
        makeInput({ weaknessReport: report })
      );
      const slowKey = result.find((r) => r.type === 'slow_key');
      expect(slowKey).toBeDefined();
      expect(slowKey!.metric).toBe('450ms avg');
    });

    it('should recommend problem sequence practice', () => {
      const report = makeWeaknessReport({
        problemSequences: [
          { sequence: 'th', totalAttempts: 100, errorCount: 30, avgLatencyMs: 200, errorRate: 30 },
        ],
      });
      const result = generateRecommendations(
        makeInput({ weaknessReport: report })
      );
      const seq = result.find((r) => r.type === 'problem_sequence');
      expect(seq).toBeDefined();
      expect(seq!.title).toContain('"th"');
    });

    it('should not recommend slow keys below 300ms threshold', () => {
      const report = makeWeaknessReport({
        slowestKeys: [
          { key: 'a', avgLatencyMs: 200, totalPresses: 50, accuracy: 95 },
        ],
      });
      const result = generateRecommendations(
        makeInput({ weaknessReport: report })
      );
      const slowKey = result.find((r) => r.type === 'slow_key');
      expect(slowKey).toBeUndefined();
    });
  });

  describe('difficulty recommendations', () => {
    it('should suggest harder challenges when trending up', () => {
      // Need 10+ sessions for confidence >= 0.4 (sessionFactor = 10/20 = 0.5)
      const sessions = [
        makeSession({ wpm: 60, accuracy: 96 }),
        makeSession({ wpm: 57, accuracy: 96 }),
        makeSession({ wpm: 55, accuracy: 95 }),
        makeSession({ wpm: 52, accuracy: 95 }),
        makeSession({ wpm: 48, accuracy: 94 }),
        makeSession({ wpm: 44, accuracy: 93 }),
        makeSession({ wpm: 42, accuracy: 93 }),
        makeSession({ wpm: 40, accuracy: 92 }),
        makeSession({ wpm: 38, accuracy: 92 }),
        makeSession({ wpm: 36, accuracy: 92 }),
      ];
      const result = generateRecommendations(
        makeInput({ sessions, totalSessions: 20 })
      );
      const diffUp = result.find((r) => r.type === 'difficulty_up');
      expect(diffUp).toBeDefined();
    });

    it('should suggest easier challenges when trending down', () => {
      // Sessions newest-first: WPM declining, mostly intermediate difficulty
      const sessions = [
        makeSession({ wpm: 25, accuracy: 75, challengeDifficulty: 'beginner' }),
        makeSession({ wpm: 28, accuracy: 77, challengeDifficulty: 'beginner' }),
        makeSession({ wpm: 30, accuracy: 78, challengeDifficulty: 'intermediate' }),
        makeSession({ wpm: 33, accuracy: 80, challengeDifficulty: 'intermediate' }),
        makeSession({ wpm: 38, accuracy: 85, challengeDifficulty: 'intermediate' }),
        makeSession({ wpm: 42, accuracy: 88, challengeDifficulty: 'intermediate' }),
        makeSession({ wpm: 45, accuracy: 90, challengeDifficulty: 'intermediate' }),
        makeSession({ wpm: 48, accuracy: 91, challengeDifficulty: 'intermediate' }),
        makeSession({ wpm: 50, accuracy: 92, challengeDifficulty: 'intermediate' }),
        makeSession({ wpm: 52, accuracy: 93, challengeDifficulty: 'intermediate' }),
      ];
      const result = generateRecommendations(
        makeInput({ sessions, totalSessions: 20 })
      );
      const diffDown = result.find((r) => r.type === 'difficulty_down');
      expect(diffDown).toBeDefined();
    });

    it('should not suggest difficulty change with fewer than 3 sessions', () => {
      const sessions = [
        makeSession({ wpm: 80, accuracy: 98 }),
        makeSession({ wpm: 70, accuracy: 97 }),
      ];
      const result = generateRecommendations(
        makeInput({ sessions, totalSessions: 2 })
      );
      const diffRec = result.find(
        (r) => r.type === 'difficulty_up' || r.type === 'difficulty_down'
      );
      expect(diffRec).toBeUndefined();
    });
  });

  describe('focus recommendations', () => {
    it('should recommend accuracy focus when below 85%', () => {
      const result = generateRecommendations(
        makeInput({ avgAccuracy: 78 })
      );
      const acc = result.find((r) => r.type === 'accuracy_focus');
      expect(acc).toBeDefined();
      expect(acc!.priority).toBe('high');
    });

    it('should recommend speed focus when accuracy is high but WPM is low', () => {
      const result = generateRecommendations(
        makeInput({ avgAccuracy: 95, avgWpm: 22 })
      );
      const speed = result.find((r) => r.type === 'speed_focus');
      expect(speed).toBeDefined();
    });

    it('should not recommend speed focus when WPM is adequate', () => {
      const result = generateRecommendations(
        makeInput({ avgAccuracy: 95, avgWpm: 50 })
      );
      const speed = result.find((r) => r.type === 'speed_focus');
      expect(speed).toBeUndefined();
    });
  });

  describe('streak recommendations', () => {
    it('should encourage maintaining a streak of 3+ days', () => {
      const result = generateRecommendations(
        makeInput({ currentStreak: 5 })
      );
      const streak = result.find((r) => r.type === 'streak_reminder');
      expect(streak).toBeDefined();
      expect(streak!.description).toContain('5-day');
    });

    it('should not show streak reminder for streaks under 3', () => {
      const result = generateRecommendations(
        makeInput({ currentStreak: 2 })
      );
      const streak = result.find((r) => r.type === 'streak_reminder');
      expect(streak).toBeUndefined();
    });
  });

  describe('recommendation limits', () => {
    it('should return at most 5 recommendations', () => {
      const report = makeWeaknessReport({
        weakestKeys: [
          { key: 'e', accuracy: 50, totalPresses: 100, correctPresses: 50, avgLatencyMs: 400 },
          { key: 'r', accuracy: 55, totalPresses: 80, correctPresses: 44, avgLatencyMs: 350 },
        ],
        slowestKeys: [
          { key: '{', avgLatencyMs: 500, totalPresses: 50, accuracy: 85 },
        ],
        commonTypos: [
          { expected: 'e', actual: 'r', count: 20 },
        ],
        problemSequences: [
          { sequence: 'th', totalAttempts: 100, errorCount: 40, avgLatencyMs: 200, errorRate: 40 },
        ],
      });

      const result = generateRecommendations(
        makeInput({
          weaknessReport: report,
          avgAccuracy: 75,
          currentStreak: 7,
          categoryPerformance: makeCategoryPerformance([
            { categoryName: 'Docker', categorySlug: 'docker', sessions: 5, avgWpm: 25, avgAccuracy: 70 },
            { categoryName: 'Git Basics', categorySlug: 'git-basics', sessions: 8, avgWpm: 55, avgAccuracy: 95 },
          ]),
        })
      );

      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should prioritize high priority recommendations first', () => {
      const report = makeWeaknessReport({
        weakestKeys: [
          { key: 'e', accuracy: 50, totalPresses: 100, correctPresses: 50, avgLatencyMs: 150 },
        ],
      });

      const result = generateRecommendations(
        makeInput({
          weaknessReport: report,
          avgAccuracy: 75,
          currentStreak: 5,
        })
      );

      // First recommendations should be high priority
      const highPriorityCount = result.filter((r) => r.priority === 'high').length;
      if (highPriorityCount > 0) {
        expect(result[0].priority).toBe('high');
      }
    });
  });

  describe('action hrefs', () => {
    it('should link weakness-based recommendations to personalized practice', () => {
      const report = makeWeaknessReport({
        weakestKeys: [
          { key: 'e', accuracy: 60, totalPresses: 100, correctPresses: 60, avgLatencyMs: 150 },
        ],
      });
      const result = generateRecommendations(
        makeInput({ weaknessReport: report })
      );
      const weakKey = result.find((r) => r.type === 'weak_key');
      expect(weakKey?.actionHref).toBe('/practice/personalized');
    });

    it('should link category recommendations to the category page', () => {
      const result = generateRecommendations(
        makeInput({
          categoryPerformance: makeCategoryPerformance([
            { categoryName: 'Docker', categorySlug: 'docker', sessions: 5, avgWpm: 35, avgAccuracy: 72 },
          ]),
        })
      );
      const weakCat = result.find((r) => r.type === 'weak_category');
      expect(weakCat?.actionHref).toBe('/practice/docker');
    });
  });
});
