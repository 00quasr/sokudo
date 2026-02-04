/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the queries module
vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  getUserStatsOverview: vi.fn(),
  getRecentTypingSessions: vi.fn(),
  getCategoryPerformance: vi.fn(),
  getCategoryBreakdown: vi.fn(),
  getWpmTrend: vi.fn(),
  getWpmByHourOfDay: vi.fn(),
  getCategoryMastery: vi.fn(),
  getMonthlyComparison: vi.fn(),
  getDailyPracticeHistory: vi.fn(),
  getUserWeaknessReport: vi.fn(),
}));

import {
  getUser,
  getUserStatsOverview,
  getRecentTypingSessions,
  getCategoryPerformance,
  getCategoryBreakdown,
  getWpmTrend,
  getWpmByHourOfDay,
  getCategoryMastery,
  getMonthlyComparison,
  getDailyPracticeHistory,
  getUserWeaknessReport,
} from '@/lib/db/queries';
import StatsPage from '../page';

const mockStatsOverview = {
  totalSessions: 25,
  avgWpm: 65,
  avgAccuracy: 94,
  totalPracticeTimeMs: 3600000, // 1 hour
  totalKeystrokes: 5000,
  totalErrors: 150,
  currentStreak: 5,
  longestStreak: 10,
  bestWpm: 85,
  bestAccuracy: 100,
};

const mockEmptyStats = {
  totalSessions: 0,
  avgWpm: 0,
  avgAccuracy: 0,
  totalPracticeTimeMs: 0,
  totalKeystrokes: 0,
  totalErrors: 0,
  currentStreak: 0,
  longestStreak: 0,
  bestWpm: 0,
  bestAccuracy: 0,
};

const mockRecentSessions = [
  {
    id: 1,
    userId: 1,
    challengeId: 1,
    wpm: 70,
    rawWpm: 75,
    accuracy: 95,
    keystrokes: 200,
    errors: 10,
    durationMs: 60000,
    completedAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    challenge: {
      id: 1,
      categoryId: 1,
      content: 'git commit -m "test"',
      difficulty: 'beginner',
      syntaxType: 'git',
      hint: null,
      avgWpm: 60,
      timesCompleted: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: {
        id: 1,
        name: 'Git Basics',
        slug: 'git-basics',
        description: 'Essential git commands',
        icon: 'git-branch',
        difficulty: 'beginner',
        isPremium: false,
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
  },
  {
    id: 2,
    userId: 1,
    challengeId: 2,
    wpm: 55,
    rawWpm: 60,
    accuracy: 90,
    keystrokes: 150,
    errors: 15,
    durationMs: 45000,
    completedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    challenge: {
      id: 2,
      categoryId: 2,
      content: 'docker build -t myapp .',
      difficulty: 'intermediate',
      syntaxType: 'docker',
      hint: null,
      avgWpm: 50,
      timesCompleted: 50,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: {
        id: 2,
        name: 'Docker',
        slug: 'docker',
        description: 'Docker commands',
        icon: 'container',
        difficulty: 'intermediate',
        isPremium: true,
        displayOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
  },
];

const mockCategoryPerformance = [
  {
    categoryId: 1,
    categoryName: 'Git Basics',
    categorySlug: 'git-basics',
    sessions: 15,
    avgWpm: 70,
    avgAccuracy: 95,
  },
  {
    categoryId: 2,
    categoryName: 'Docker',
    categorySlug: 'docker',
    sessions: 10,
    avgWpm: 55,
    avgAccuracy: 90,
  },
];

const mockCategoryBreakdown = {
  best: {
    byWpm: { categoryId: 1, categoryName: 'Git Basics', avgWpm: 70, sessions: 15 },
    byAccuracy: { categoryId: 1, categoryName: 'Git Basics', avgAccuracy: 95, sessions: 15 },
  },
  worst: {
    byWpm: { categoryId: 2, categoryName: 'Docker', avgWpm: 55, sessions: 10 },
    byAccuracy: { categoryId: 2, categoryName: 'Docker', avgAccuracy: 90, sessions: 10 },
  },
};

const mockEmptyCategoryBreakdown = {
  best: { byWpm: null, byAccuracy: null },
  worst: { byWpm: null, byAccuracy: null },
};

const mockCategoryMastery = [
  {
    categoryId: 1,
    categoryName: 'Git Basics',
    categorySlug: 'git-basics',
    totalChallenges: 10,
    completedChallenges: 5,
    percentComplete: 50,
    avgWpm: 70,
    avgAccuracy: 95,
    accuracyTrend: 3,
    sessions: 15,
  },
  {
    categoryId: 2,
    categoryName: 'Docker',
    categorySlug: 'docker',
    totalChallenges: 8,
    completedChallenges: 2,
    percentComplete: 25,
    avgWpm: 55,
    avgAccuracy: 90,
    accuracyTrend: -2,
    sessions: 10,
  },
];

describe('StatsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for getUser
    vi.mocked(getUser).mockResolvedValue({
      id: 1,
      name: 'Test User',
      username: 'testuser',
      email: 'test@test.com',
      passwordHash: 'hash',
      role: 'member',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    // Default mock for WPM trend - return empty array
    vi.mocked(getWpmTrend).mockResolvedValue([]);
    // Default mock for category breakdown
    vi.mocked(getCategoryBreakdown).mockResolvedValue(mockCategoryBreakdown);
    // Default mock for WPM by hour - return empty array
    vi.mocked(getWpmByHourOfDay).mockResolvedValue([]);
    // Default mock for category mastery - return empty array
    vi.mocked(getCategoryMastery).mockResolvedValue(mockCategoryMastery);
    // Default mock for monthly comparison - return null (no data)
    vi.mocked(getMonthlyComparison).mockResolvedValue(null);
    // Default mock for daily practice history - return empty array
    vi.mocked(getDailyPracticeHistory).mockResolvedValue([]);
    // Default mock for weakness report
    vi.mocked(getUserWeaknessReport).mockResolvedValue({
      weakestKeys: [],
      slowestKeys: [],
      commonTypos: [],
      problemSequences: [],
      summary: {
        overallAccuracy: 0,
        avgLatencyMs: 0,
        totalKeysTracked: 0,
        keysNeedingWork: 0,
        sequencesNeedingWork: 0,
        topWeakness: null,
      },
    });
  });

  describe('page title', () => {
    it('should render the page title', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(
        mockCategoryPerformance
      );

      const page = await StatsPage();
      render(page);

      expect(screen.getByText('Your Stats')).toBeTruthy();
    });
  });

  describe('empty state', () => {
    it('should show empty state when no sessions', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockEmptyStats);
      vi.mocked(getRecentTypingSessions).mockResolvedValue([]);
      vi.mocked(getCategoryPerformance).mockResolvedValue([]);
      vi.mocked(getCategoryBreakdown).mockResolvedValue(mockEmptyCategoryBreakdown);

      const page = await StatsPage();
      render(page);

      expect(screen.getByText('No stats yet')).toBeTruthy();
      expect(
        screen.getByText(/Complete some typing challenges/i)
      ).toBeTruthy();
    });

    it('should not show stats cards when no data', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockEmptyStats);
      vi.mocked(getRecentTypingSessions).mockResolvedValue([]);
      vi.mocked(getCategoryPerformance).mockResolvedValue([]);
      vi.mocked(getCategoryBreakdown).mockResolvedValue(mockEmptyCategoryBreakdown);

      const page = await StatsPage();
      render(page);

      expect(screen.queryByText('Personal Bests')).toBeNull();
      expect(screen.queryByText('Keystroke Stats')).toBeNull();
    });
  });

  describe('overview stats', () => {
    it('should display average WPM', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(
        mockCategoryPerformance
      );

      const page = await StatsPage();
      render(page);

      expect(screen.getByText('Avg WPM')).toBeTruthy();
      expect(screen.getByText('65')).toBeTruthy();
    });

    it('should display average accuracy', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(
        mockCategoryPerformance
      );

      const page = await StatsPage();
      render(page);

      expect(screen.getByText('Avg Accuracy')).toBeTruthy();
      expect(screen.getByText('94%')).toBeTruthy();
    });

    it('should display practice time formatted correctly', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(
        mockCategoryPerformance
      );

      const page = await StatsPage();
      render(page);

      expect(screen.getByText('Practice Time')).toBeTruthy();
      expect(screen.getByText('1h 0m')).toBeTruthy();
    });

    it('should display current streak', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(
        mockCategoryPerformance
      );

      const page = await StatsPage();
      render(page);

      expect(screen.getByText('Current Streak')).toBeTruthy();
      expect(screen.getByText('5 days')).toBeTruthy();
    });
  });

  describe('personal bests', () => {
    it('should display best WPM', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(
        mockCategoryPerformance
      );

      const page = await StatsPage();
      render(page);

      expect(screen.getByText('Personal Bests')).toBeTruthy();
      expect(screen.getByText('Best WPM')).toBeTruthy();
      expect(screen.getByText('85')).toBeTruthy();
    });

    it('should display best accuracy', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(
        mockCategoryPerformance
      );

      const page = await StatsPage();
      render(page);

      expect(screen.getByText('Best Accuracy')).toBeTruthy();
      expect(screen.getByText('100%')).toBeTruthy();
    });

    it('should display longest streak', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(
        mockCategoryPerformance
      );

      const page = await StatsPage();
      render(page);

      expect(screen.getByText('Longest Streak')).toBeTruthy();
      expect(screen.getByText('10 days')).toBeTruthy();
    });

    it('should display total sessions', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(
        mockCategoryPerformance
      );

      const page = await StatsPage();
      render(page);

      expect(screen.getByText('Total Sessions')).toBeTruthy();
      expect(screen.getByText('25')).toBeTruthy();
    });
  });

  describe('keystroke stats', () => {
    it('should display total keystrokes', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(
        mockCategoryPerformance
      );

      const page = await StatsPage();
      render(page);

      expect(screen.getByText('Keystroke Stats')).toBeTruthy();
      expect(screen.getByText('Total Keystrokes')).toBeTruthy();
      expect(screen.getByText('5,000')).toBeTruthy();
    });

    it('should display total errors', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(
        mockCategoryPerformance
      );

      const page = await StatsPage();
      render(page);

      expect(screen.getByText('Total Errors')).toBeTruthy();
      expect(screen.getByText('150')).toBeTruthy();
    });

    it('should display error rate', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(
        mockCategoryPerformance
      );

      const page = await StatsPage();
      render(page);

      expect(screen.getByText('Error Rate')).toBeTruthy();
      // 150 errors / 5000 keystrokes * 100 = 3.0%
      expect(screen.getByText('3.0%')).toBeTruthy();
    });
  });

  describe('category performance', () => {
    it('should display category performance section', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(
        mockCategoryPerformance
      );

      const page = await StatsPage();
      render(page);

      expect(screen.getByText('Category Performance')).toBeTruthy();
    });

    it('should display category names', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(
        mockCategoryPerformance
      );

      const page = await StatsPage();
      render(page);

      // Note: Git Basics appears in both category performance and recent sessions
      const gitBasicsElements = screen.getAllByText('Git Basics');
      expect(gitBasicsElements.length).toBeGreaterThan(0);
    });

    it('should display session counts', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(
        mockCategoryPerformance
      );

      const page = await StatsPage();
      render(page);

      // Session counts appear in both Category Performance and Category Breakdown sections
      const sessions15 = screen.getAllByText('15 sessions');
      const sessions10 = screen.getAllByText('10 sessions');
      expect(sessions15.length).toBeGreaterThan(0);
      expect(sessions10.length).toBeGreaterThan(0);
    });

    it('should not show category section when empty', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue([]);

      const page = await StatsPage();
      render(page);

      expect(screen.queryByText('Category Performance')).toBeNull();
    });
  });

  describe('recent sessions', () => {
    it('should display recent sessions section', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(
        mockCategoryPerformance
      );

      const page = await StatsPage();
      render(page);

      expect(screen.getByText('Recent Sessions')).toBeTruthy();
    });

    it('should display session WPM', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(
        mockCategoryPerformance
      );

      const page = await StatsPage();
      render(page);

      // Session 1 has 70 WPM, Session 2 has 55 WPM
      // These also appear in category performance, so use getAllByText
      const wpm70 = screen.getAllByText('70');
      const wpm55 = screen.getAllByText('55');
      expect(wpm70.length).toBeGreaterThan(0);
      expect(wpm55.length).toBeGreaterThan(0);
    });

    it('should display session accuracy', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(
        mockCategoryPerformance
      );

      const page = await StatsPage();
      render(page);

      // Session 1 has 95% accuracy, Session 2 has 90% accuracy
      // These also appear in category performance, so use getAllByText
      const accuracy95 = screen.getAllByText('95%');
      const accuracy90 = screen.getAllByText('90%');
      expect(accuracy95.length).toBeGreaterThan(0);
      expect(accuracy90.length).toBeGreaterThan(0);
    });

    it('should display relative time for sessions', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(
        mockCategoryPerformance
      );

      const page = await StatsPage();
      render(page);

      expect(screen.getByText('5 minutes ago')).toBeTruthy();
      expect(screen.getByText('1 hours ago')).toBeTruthy();
    });

    it('should not show recent sessions when empty', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue([]);
      vi.mocked(getCategoryPerformance).mockResolvedValue(
        mockCategoryPerformance
      );

      const page = await StatsPage();
      render(page);

      expect(screen.queryByText('Recent Sessions')).toBeNull();
    });
  });

  describe('formatting', () => {
    it('should format short practice time correctly', async () => {
      const shortTimeStats = { ...mockStatsOverview, totalPracticeTimeMs: 300000 }; // 5 minutes
      vi.mocked(getUserStatsOverview).mockResolvedValue(shortTimeStats);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(
        mockCategoryPerformance
      );

      const page = await StatsPage();
      render(page);

      expect(screen.getByText('5m')).toBeTruthy();
    });

    it('should handle singular session text', async () => {
      const singleSessionCategory = [
        {
          categoryId: 1,
          categoryName: 'Git Basics',
          categorySlug: 'git-basics',
          sessions: 1,
          avgWpm: 70,
          avgAccuracy: 95,
        },
      ];
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(
        singleSessionCategory
      );

      const page = await StatsPage();
      render(page);

      expect(screen.getByText('1 session')).toBeTruthy();
    });
  });

  describe('category breakdown', () => {
    it('should display best categories section', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(mockCategoryPerformance);
      vi.mocked(getCategoryBreakdown).mockResolvedValue(mockCategoryBreakdown);

      const page = await StatsPage();
      render(page);

      expect(screen.getByText('Best Categories')).toBeTruthy();
    });

    it('should display fastest category by WPM', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(mockCategoryPerformance);
      vi.mocked(getCategoryBreakdown).mockResolvedValue(mockCategoryBreakdown);

      const page = await StatsPage();
      render(page);

      expect(screen.getByText('Fastest (WPM)')).toBeTruthy();
      expect(screen.getByText('70 WPM')).toBeTruthy();
    });

    it('should display most accurate category', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(mockCategoryPerformance);
      vi.mocked(getCategoryBreakdown).mockResolvedValue(mockCategoryBreakdown);

      const page = await StatsPage();
      render(page);

      expect(screen.getByText('Most Accurate')).toBeTruthy();
    });

    it('should display needs improvement section with multiple categories', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(mockCategoryPerformance);
      vi.mocked(getCategoryBreakdown).mockResolvedValue(mockCategoryBreakdown);

      const page = await StatsPage();
      render(page);

      expect(screen.getByText('Needs Improvement')).toBeTruthy();
    });

    it('should display slowest category by WPM', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(mockCategoryPerformance);
      vi.mocked(getCategoryBreakdown).mockResolvedValue(mockCategoryBreakdown);

      const page = await StatsPage();
      render(page);

      expect(screen.getByText('Slowest (WPM)')).toBeTruthy();
      expect(screen.getByText('55 WPM')).toBeTruthy();
    });

    it('should display least accurate category', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(mockCategoryPerformance);
      vi.mocked(getCategoryBreakdown).mockResolvedValue(mockCategoryBreakdown);

      const page = await StatsPage();
      render(page);

      expect(screen.getByText('Least Accurate')).toBeTruthy();
    });

    it('should not show category breakdown when no data', async () => {
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue([]);
      vi.mocked(getCategoryBreakdown).mockResolvedValue(mockEmptyCategoryBreakdown);

      const page = await StatsPage();
      render(page);

      expect(screen.queryByText('Best Categories')).toBeNull();
      expect(screen.queryByText('Needs Improvement')).toBeNull();
    });

    it('should not show needs improvement with only one category', async () => {
      const singleCategoryBreakdown = {
        best: {
          byWpm: { categoryId: 1, categoryName: 'Git Basics', avgWpm: 70, sessions: 15 },
          byAccuracy: { categoryId: 1, categoryName: 'Git Basics', avgAccuracy: 95, sessions: 15 },
        },
        worst: { byWpm: null, byAccuracy: null },
      };
      vi.mocked(getUserStatsOverview).mockResolvedValue(mockStatsOverview);
      vi.mocked(getRecentTypingSessions).mockResolvedValue(mockRecentSessions);
      vi.mocked(getCategoryPerformance).mockResolvedValue(mockCategoryPerformance);
      vi.mocked(getCategoryBreakdown).mockResolvedValue(singleCategoryBreakdown);

      const page = await StatsPage();
      render(page);

      expect(screen.getByText('Best Categories')).toBeTruthy();
      expect(screen.queryByText('Needs Improvement')).toBeNull();
    });
  });
});
