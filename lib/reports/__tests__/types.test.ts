import { describe, it, expect } from 'vitest';
import type { WeeklyReportData, EmailPreferences, StreakReminderData } from '../types';

describe('WeeklyReportData type', () => {
  it('should have required fields for user info', () => {
    const data: WeeklyReportData = {
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

    expect(data.userId).toBe(1);
    expect(data.userEmail).toBe('test@example.com');
    expect(data.userName).toBe('John Doe');
  });

  it('should allow null userName', () => {
    const data: WeeklyReportData = {
      userId: 1,
      userEmail: 'test@example.com',
      userName: null,
      weekStartDate: '2024-01-01',
      weekEndDate: '2024-01-07',
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
      comparison: {
        wpmChange: 0,
        accuracyChange: 0,
        sessionsChange: 0,
        practiceTimeChange: 0,
      },
      topCategories: [],
      weakestKeys: [],
      streakInfo: {
        currentStreak: 0,
        longestStreak: 0,
      },
    };

    expect(data.userName).toBeNull();
  });

  it('should handle negative comparison values for declines', () => {
    const data: WeeklyReportData = {
      userId: 1,
      userEmail: 'test@example.com',
      userName: 'Test User',
      weekStartDate: '2024-01-01',
      weekEndDate: '2024-01-07',
      stats: {
        totalSessions: 5,
        totalPracticeTimeMs: 1800000,
        avgWpm: 55,
        avgAccuracy: 90,
        bestWpm: 60,
        bestAccuracy: 95,
        totalKeystrokes: 2000,
        totalErrors: 200,
      },
      comparison: {
        wpmChange: -10,
        accuracyChange: -5,
        sessionsChange: -3,
        practiceTimeChange: -600000,
      },
      topCategories: [],
      weakestKeys: [],
      streakInfo: {
        currentStreak: 0,
        longestStreak: 10,
      },
    };

    expect(data.comparison.wpmChange).toBe(-10);
    expect(data.comparison.accuracyChange).toBe(-5);
    expect(data.comparison.sessionsChange).toBe(-3);
    expect(data.comparison.practiceTimeChange).toBe(-600000);
  });

  it('should support multiple top categories', () => {
    const data: WeeklyReportData = {
      userId: 1,
      userEmail: 'test@example.com',
      userName: 'Test User',
      weekStartDate: '2024-01-01',
      weekEndDate: '2024-01-07',
      stats: {
        totalSessions: 15,
        totalPracticeTimeMs: 5400000,
        avgWpm: 70,
        avgAccuracy: 95,
        bestWpm: 85,
        bestAccuracy: 100,
        totalKeystrokes: 8000,
        totalErrors: 400,
      },
      comparison: {
        wpmChange: 5,
        accuracyChange: 2,
        sessionsChange: 5,
        practiceTimeChange: 1800000,
      },
      topCategories: [
        { categoryName: 'Git Basics', sessions: 6, avgWpm: 75, avgAccuracy: 96 },
        { categoryName: 'Docker', sessions: 5, avgWpm: 68, avgAccuracy: 94 },
        { categoryName: 'React', sessions: 4, avgWpm: 65, avgAccuracy: 92 },
      ],
      weakestKeys: [
        { key: 'z', accuracy: 80, totalPresses: 30 },
        { key: 'x', accuracy: 82, totalPresses: 40 },
        { key: 'q', accuracy: 85, totalPresses: 25 },
      ],
      streakInfo: {
        currentStreak: 14,
        longestStreak: 14,
      },
    };

    expect(data.topCategories).toHaveLength(3);
    expect(data.topCategories[0].categoryName).toBe('Git Basics');
    expect(data.weakestKeys).toHaveLength(3);
  });
});

describe('EmailPreferences type', () => {
  it('should have weeklyReportEnabled field', () => {
    const prefs: EmailPreferences = {
      weeklyReportEnabled: true,
      streakReminderEnabled: true,
    };

    expect(prefs.weeklyReportEnabled).toBe(true);
  });

  it('should allow disabling weekly reports', () => {
    const prefs: EmailPreferences = {
      weeklyReportEnabled: false,
      streakReminderEnabled: true,
    };

    expect(prefs.weeklyReportEnabled).toBe(false);
  });

  it('should have streakReminderEnabled field', () => {
    const prefs: EmailPreferences = {
      weeklyReportEnabled: true,
      streakReminderEnabled: true,
    };

    expect(prefs.streakReminderEnabled).toBe(true);
  });

  it('should allow disabling streak reminders', () => {
    const prefs: EmailPreferences = {
      weeklyReportEnabled: true,
      streakReminderEnabled: false,
    };

    expect(prefs.streakReminderEnabled).toBe(false);
  });
});

describe('StreakReminderData type', () => {
  it('should have required fields', () => {
    const data: StreakReminderData = {
      userId: 1,
      userEmail: 'test@example.com',
      userName: 'John Doe',
      currentStreak: 5,
      longestStreak: 10,
      lastPracticeDate: '2024-01-06',
    };

    expect(data.userId).toBe(1);
    expect(data.userEmail).toBe('test@example.com');
    expect(data.userName).toBe('John Doe');
    expect(data.currentStreak).toBe(5);
    expect(data.longestStreak).toBe(10);
    expect(data.lastPracticeDate).toBe('2024-01-06');
  });

  it('should allow null userName', () => {
    const data: StreakReminderData = {
      userId: 1,
      userEmail: 'test@example.com',
      userName: null,
      currentStreak: 3,
      longestStreak: 7,
      lastPracticeDate: null,
    };

    expect(data.userName).toBeNull();
  });

  it('should allow null lastPracticeDate', () => {
    const data: StreakReminderData = {
      userId: 1,
      userEmail: 'test@example.com',
      userName: 'Test',
      currentStreak: 1,
      longestStreak: 1,
      lastPracticeDate: null,
    };

    expect(data.lastPracticeDate).toBeNull();
  });

  it('should represent a user with an at-risk streak', () => {
    const data: StreakReminderData = {
      userId: 42,
      userEmail: 'dev@example.com',
      userName: 'Active Dev',
      currentStreak: 30,
      longestStreak: 30,
      lastPracticeDate: '2024-02-14',
    };

    expect(data.currentStreak).toBe(30);
    expect(data.longestStreak).toBe(data.currentStreak);
  });
});
