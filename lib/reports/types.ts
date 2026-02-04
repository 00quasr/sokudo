export interface WeeklyReportData {
  userId: number;
  userEmail: string;
  userName: string | null;
  weekStartDate: string;
  weekEndDate: string;
  stats: {
    totalSessions: number;
    totalPracticeTimeMs: number;
    avgWpm: number;
    avgAccuracy: number;
    bestWpm: number;
    bestAccuracy: number;
    totalKeystrokes: number;
    totalErrors: number;
  };
  comparison: {
    wpmChange: number;
    accuracyChange: number;
    sessionsChange: number;
    practiceTimeChange: number;
  };
  topCategories: Array<{
    categoryName: string;
    sessions: number;
    avgWpm: number;
    avgAccuracy: number;
  }>;
  weakestKeys: Array<{
    key: string;
    accuracy: number;
    totalPresses: number;
  }>;
  streakInfo: {
    currentStreak: number;
    longestStreak: number;
  };
}

export interface EmailPreferences {
  weeklyReportEnabled: boolean;
  streakReminderEnabled: boolean;
  pushNotificationsEnabled: boolean;
}

export interface StreakReminderData {
  userId: number;
  userEmail: string;
  userName: string | null;
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string | null;
}
