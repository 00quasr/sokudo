import { describe, it, expect } from 'vitest';
import { generateWeeklyReportEmail } from '../templates/weekly-report';
import type { WeeklyReportData } from '@/lib/reports/types';

describe('generateWeeklyReportEmail', () => {
  const baseReportData: WeeklyReportData = {
    userId: 1,
    userEmail: 'test@example.com',
    userName: 'John Doe',
    weekStartDate: '2024-01-01',
    weekEndDate: '2024-01-07',
    stats: {
      totalSessions: 10,
      totalPracticeTimeMs: 3600000,
      avgWpm: 65,
      avgAccuracy: 95,
      bestWpm: 80,
      bestAccuracy: 100,
      totalKeystrokes: 5000,
      totalErrors: 250,
    },
    comparison: {
      wpmChange: 5,
      accuracyChange: 2,
      sessionsChange: 3,
      practiceTimeChange: 900000,
    },
    topCategories: [
      {
        categoryName: 'Git Basics',
        sessions: 5,
        avgWpm: 70,
        avgAccuracy: 96,
      },
    ],
    weakestKeys: [
      {
        key: 'q',
        accuracy: 85,
        totalPresses: 50,
      },
    ],
    streakInfo: {
      currentStreak: 7,
      longestStreak: 14,
    },
  };

  describe('subject line', () => {
    it('should include average WPM when user has activity', () => {
      const { subject } = generateWeeklyReportEmail(baseReportData);
      expect(subject).toContain('65 WPM');
    });

    it('should show encouragement when user has no activity', () => {
      const noActivityData: WeeklyReportData = {
        ...baseReportData,
        stats: {
          totalSessions: 0,
          totalPracticeTimeMs: 0,
          avgWpm: 0,
          avgAccuracy: 0,
          bestWpm: 0,
          bestAccuracy: 0,
          totalKeystrokes: 0,
          totalErrors: 0,
        },
      };
      const { subject } = generateWeeklyReportEmail(noActivityData);
      expect(subject).toContain('Time to Practice');
    });
  });

  describe('HTML content', () => {
    it('should include user name in greeting', () => {
      const { html } = generateWeeklyReportEmail(baseReportData);
      expect(html).toContain('Hey John Doe');
    });

    it('should show "there" when user name is null', () => {
      const noNameData: WeeklyReportData = {
        ...baseReportData,
        userName: null,
      };
      const { html } = generateWeeklyReportEmail(noNameData);
      expect(html).toContain('Hey there');
    });

    it('should include week date range', () => {
      const { html } = generateWeeklyReportEmail(baseReportData);
      expect(html).toContain('2024-01-01');
      expect(html).toContain('2024-01-07');
    });

    it('should display WPM stats', () => {
      const { html } = generateWeeklyReportEmail(baseReportData);
      expect(html).toContain('65');
      expect(html).toContain('Avg WPM');
    });

    it('should display accuracy stats', () => {
      const { html } = generateWeeklyReportEmail(baseReportData);
      expect(html).toContain('95%');
      expect(html).toContain('Accuracy');
    });

    it('should display session count', () => {
      const { html } = generateWeeklyReportEmail(baseReportData);
      expect(html).toContain('10');
      expect(html).toContain('Sessions');
    });

    it('should format practice time correctly', () => {
      const { html } = generateWeeklyReportEmail(baseReportData);
      expect(html).toContain('1h 0m');
    });

    it('should show hours for long practice times', () => {
      const longPracticeData: WeeklyReportData = {
        ...baseReportData,
        stats: {
          ...baseReportData.stats,
          totalPracticeTimeMs: 7200000, // 2 hours
        },
      };
      const { html } = generateWeeklyReportEmail(longPracticeData);
      expect(html).toContain('2h');
    });

    it('should show positive change with plus sign', () => {
      const { html } = generateWeeklyReportEmail(baseReportData);
      expect(html).toContain('+5');
    });

    it('should show negative change', () => {
      const declineData: WeeklyReportData = {
        ...baseReportData,
        comparison: {
          wpmChange: -10,
          accuracyChange: -5,
          sessionsChange: -3,
          practiceTimeChange: -600000,
        },
      };
      const { html } = generateWeeklyReportEmail(declineData);
      expect(html).toContain('-10');
    });

    it('should include top categories', () => {
      const { html } = generateWeeklyReportEmail(baseReportData);
      expect(html).toContain('Git Basics');
      expect(html).toContain('5 sessions');
    });

    it('should include weakest keys', () => {
      const { html } = generateWeeklyReportEmail(baseReportData);
      expect(html).toContain('q');
      expect(html).toContain('85%');
    });

    it('should format special keys correctly', () => {
      const spaceKeyData: WeeklyReportData = {
        ...baseReportData,
        weakestKeys: [
          { key: ' ', accuracy: 90, totalPresses: 100 },
          { key: '\t', accuracy: 85, totalPresses: 20 },
          { key: '\n', accuracy: 88, totalPresses: 50 },
        ],
      };
      const { html } = generateWeeklyReportEmail(spaceKeyData);
      expect(html).toContain('Space');
      expect(html).toContain('Tab');
      expect(html).toContain('Enter');
    });

    it('should include streak information', () => {
      const { html } = generateWeeklyReportEmail(baseReportData);
      expect(html).toContain('7 days');
      expect(html).toContain('14 days');
      expect(html).toContain('Current Streak');
      expect(html).toContain('Longest Streak');
    });

    it('should include call to action button', () => {
      const { html } = generateWeeklyReportEmail(baseReportData);
      expect(html).toContain('Start Practicing');
    });

    it('should include email preferences link', () => {
      const { html } = generateWeeklyReportEmail(baseReportData);
      expect(html).toContain('Manage email preferences');
    });
  });

  describe('no activity state', () => {
    const noActivityData: WeeklyReportData = {
      ...baseReportData,
      stats: {
        totalSessions: 0,
        totalPracticeTimeMs: 0,
        avgWpm: 0,
        avgAccuracy: 0,
        bestWpm: 0,
        bestAccuracy: 0,
        totalKeystrokes: 0,
        totalErrors: 0,
      },
      topCategories: [],
      weakestKeys: [],
    };

    it('should show no activity message', () => {
      const { html } = generateWeeklyReportEmail(noActivityData);
      expect(html).toContain('No practice sessions this week');
    });

    it('should show encouragement message', () => {
      const { html } = generateWeeklyReportEmail(noActivityData);
      expect(html).toContain('5 minutes a day');
    });
  });
});
