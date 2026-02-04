import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getPracticeLimitStatus, checkSessionAllowed } from '../practice-limit';
import { FREE_TIER_DAILY_LIMIT_MS } from '../constants';

// Mock the queries module
vi.mock('@/lib/db/queries', () => ({
  getUserProfile: vi.fn(),
  getDailyPracticeForUser: vi.fn(),
}));

import { getUserProfile, getDailyPracticeForUser } from '@/lib/db/queries';

const mockGetUserProfile = getUserProfile as ReturnType<typeof vi.fn>;
const mockGetDailyPracticeForUser = getDailyPracticeForUser as ReturnType<typeof vi.fn>;

describe('getPracticeLimitStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('for free tier users', () => {
    beforeEach(() => {
      mockGetUserProfile.mockResolvedValue({
        userId: 1,
        subscriptionTier: 'free',
        currentStreak: 0,
        longestStreak: 0,
        totalPracticeTimeMs: 0,
      });
    });

    it('should allow practice when no practice done today', async () => {
      mockGetDailyPracticeForUser.mockResolvedValue(null);

      const status = await getPracticeLimitStatus(1);

      expect(status.canPractice).toBe(true);
      expect(status.isFreeTier).toBe(true);
      expect(status.remainingMs).toBe(FREE_TIER_DAILY_LIMIT_MS);
      expect(status.dailyLimitMs).toBe(FREE_TIER_DAILY_LIMIT_MS);
      expect(status.usedTodayMs).toBe(0);
      expect(status.subscriptionTier).toBe('free');
    });

    it('should allow practice when some time used', async () => {
      const usedTime = 5 * 60 * 1000; // 5 minutes
      mockGetDailyPracticeForUser.mockResolvedValue({
        practiceTimeMs: usedTime,
        sessionsCompleted: 3,
      });

      const status = await getPracticeLimitStatus(1);

      expect(status.canPractice).toBe(true);
      expect(status.remainingMs).toBe(FREE_TIER_DAILY_LIMIT_MS - usedTime);
      expect(status.usedTodayMs).toBe(usedTime);
    });

    it('should not allow practice when limit reached', async () => {
      mockGetDailyPracticeForUser.mockResolvedValue({
        practiceTimeMs: FREE_TIER_DAILY_LIMIT_MS,
        sessionsCompleted: 10,
      });

      const status = await getPracticeLimitStatus(1);

      expect(status.canPractice).toBe(false);
      expect(status.remainingMs).toBe(0);
      expect(status.usedTodayMs).toBe(FREE_TIER_DAILY_LIMIT_MS);
    });

    it('should not allow practice when limit exceeded', async () => {
      const usedTime = FREE_TIER_DAILY_LIMIT_MS + 60000; // 16 minutes
      mockGetDailyPracticeForUser.mockResolvedValue({
        practiceTimeMs: usedTime,
        sessionsCompleted: 12,
      });

      const status = await getPracticeLimitStatus(1);

      expect(status.canPractice).toBe(false);
      expect(status.remainingMs).toBe(0);
    });
  });

  describe('for pro tier users', () => {
    beforeEach(() => {
      mockGetUserProfile.mockResolvedValue({
        userId: 1,
        subscriptionTier: 'pro',
        currentStreak: 5,
        longestStreak: 10,
        totalPracticeTimeMs: 3600000,
      });
    });

    it('should have unlimited practice', async () => {
      mockGetDailyPracticeForUser.mockResolvedValue({
        practiceTimeMs: 3600000, // 1 hour
        sessionsCompleted: 30,
      });

      const status = await getPracticeLimitStatus(1);

      expect(status.canPractice).toBe(true);
      expect(status.isFreeTier).toBe(false);
      expect(status.remainingMs).toBeNull();
      expect(status.dailyLimitMs).toBeNull();
      expect(status.subscriptionTier).toBe('pro');
    });
  });

  describe('for team tier users', () => {
    beforeEach(() => {
      mockGetUserProfile.mockResolvedValue({
        userId: 1,
        subscriptionTier: 'team',
        currentStreak: 0,
        longestStreak: 0,
        totalPracticeTimeMs: 0,
      });
    });

    it('should have unlimited practice', async () => {
      mockGetDailyPracticeForUser.mockResolvedValue(null);

      const status = await getPracticeLimitStatus(1);

      expect(status.canPractice).toBe(true);
      expect(status.isFreeTier).toBe(false);
      expect(status.remainingMs).toBeNull();
      expect(status.dailyLimitMs).toBeNull();
      expect(status.subscriptionTier).toBe('team');
    });
  });

  describe('for users without a profile', () => {
    it('should default to free tier', async () => {
      mockGetUserProfile.mockResolvedValue(null);
      mockGetDailyPracticeForUser.mockResolvedValue(null);

      const status = await getPracticeLimitStatus(1);

      expect(status.isFreeTier).toBe(true);
      expect(status.subscriptionTier).toBe('free');
      expect(status.dailyLimitMs).toBe(FREE_TIER_DAILY_LIMIT_MS);
    });
  });
});

describe('timezone-aware daily limits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should use UTC date when no timezone preference set', async () => {
    // Set time to 11 PM UTC on June 15
    vi.setSystemTime(new Date('2024-06-15T23:00:00Z'));

    mockGetUserProfile.mockResolvedValue({
      userId: 1,
      subscriptionTier: 'free',
      preferences: {}, // No timezone set
    });
    mockGetDailyPracticeForUser.mockResolvedValue(null);

    await getPracticeLimitStatus(1);

    // Should query with UTC date (2024-06-15)
    expect(mockGetDailyPracticeForUser).toHaveBeenCalledWith(1, '2024-06-15');
  });

  it('should use user timezone for date calculation', async () => {
    // Set time to 11 PM UTC on June 15
    // In Tokyo (UTC+9), this is 8 AM on June 16
    vi.setSystemTime(new Date('2024-06-15T23:00:00Z'));

    mockGetUserProfile.mockResolvedValue({
      userId: 1,
      subscriptionTier: 'free',
      preferences: { timezone: 'Asia/Tokyo' },
    });
    mockGetDailyPracticeForUser.mockResolvedValue(null);

    await getPracticeLimitStatus(1);

    // Should query with Tokyo date (2024-06-16)
    expect(mockGetDailyPracticeForUser).toHaveBeenCalledWith(1, '2024-06-16');
  });

  it('should reset limits at midnight in user timezone', async () => {
    // User in New York timezone

    // First: 11:59 PM in New York (3:59 AM UTC June 16)
    vi.setSystemTime(new Date('2024-06-16T03:59:00Z'));

    mockGetUserProfile.mockResolvedValue({
      userId: 1,
      subscriptionTier: 'free',
      preferences: { timezone: 'America/New_York' },
    });

    // User has used all their time on June 15
    mockGetDailyPracticeForUser.mockImplementation((_userId, date) => {
      if (date === '2024-06-15') {
        return Promise.resolve({ practiceTimeMs: FREE_TIER_DAILY_LIMIT_MS });
      }
      return Promise.resolve(null);
    });

    let status = await getPracticeLimitStatus(1);
    expect(status.canPractice).toBe(false);
    expect(status.usedTodayMs).toBe(FREE_TIER_DAILY_LIMIT_MS);

    // Now: 12:01 AM in New York (4:01 AM UTC June 16)
    vi.setSystemTime(new Date('2024-06-16T04:01:00Z'));

    // Clear the mock to reset call history
    mockGetDailyPracticeForUser.mockClear();

    status = await getPracticeLimitStatus(1);

    // Should query for June 16 now (new day in NY)
    expect(mockGetDailyPracticeForUser).toHaveBeenCalledWith(1, '2024-06-16');
    expect(status.canPractice).toBe(true);
    expect(status.usedTodayMs).toBe(0);
  });

  it('should handle invalid timezone gracefully', async () => {
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));

    mockGetUserProfile.mockResolvedValue({
      userId: 1,
      subscriptionTier: 'free',
      preferences: { timezone: 'Invalid/Timezone' },
    });
    mockGetDailyPracticeForUser.mockResolvedValue(null);

    await getPracticeLimitStatus(1);

    // Should fall back to UTC date
    expect(mockGetDailyPracticeForUser).toHaveBeenCalledWith(1, '2024-06-15');
  });

  it('should handle null preferences', async () => {
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));

    mockGetUserProfile.mockResolvedValue({
      userId: 1,
      subscriptionTier: 'free',
      preferences: null,
    });
    mockGetDailyPracticeForUser.mockResolvedValue(null);

    await getPracticeLimitStatus(1);

    // Should use UTC date
    expect(mockGetDailyPracticeForUser).toHaveBeenCalledWith(1, '2024-06-15');
  });
});

describe('checkSessionAllowed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('for free tier users', () => {
    beforeEach(() => {
      mockGetUserProfile.mockResolvedValue({
        userId: 1,
        subscriptionTier: 'free',
      });
    });

    it('should allow session when under limit', async () => {
      mockGetDailyPracticeForUser.mockResolvedValue({
        practiceTimeMs: 5 * 60 * 1000, // 5 minutes used
      });

      const sessionDuration = 3 * 60 * 1000; // 3 minute session
      const result = await checkSessionAllowed(1, sessionDuration);

      expect(result.allowed).toBe(true);
      expect(result.allowedDurationMs).toBe(sessionDuration);
      expect(result.limitExceeded).toBe(false);
    });

    it('should allow session exactly at limit', async () => {
      mockGetDailyPracticeForUser.mockResolvedValue({
        practiceTimeMs: 14 * 60 * 1000, // 14 minutes used
      });

      const sessionDuration = 1 * 60 * 1000; // 1 minute session
      const result = await checkSessionAllowed(1, sessionDuration);

      expect(result.allowed).toBe(true);
      expect(result.allowedDurationMs).toBe(sessionDuration);
      expect(result.limitExceeded).toBe(false);
    });

    it('should allow partial credit when session would exceed limit', async () => {
      mockGetDailyPracticeForUser.mockResolvedValue({
        practiceTimeMs: 14 * 60 * 1000, // 14 minutes used (1 min remaining)
      });

      const sessionDuration = 3 * 60 * 1000; // 3 minute session
      const result = await checkSessionAllowed(1, sessionDuration);

      expect(result.allowed).toBe(true);
      expect(result.allowedDurationMs).toBe(1 * 60 * 1000); // Only 1 min credited
      expect(result.limitExceeded).toBe(true);
      expect(result.remainingBeforeSession).toBe(1 * 60 * 1000);
    });

    it('should reject when limit already exceeded', async () => {
      mockGetDailyPracticeForUser.mockResolvedValue({
        practiceTimeMs: FREE_TIER_DAILY_LIMIT_MS,
      });

      const sessionDuration = 30000; // 30 seconds
      const result = await checkSessionAllowed(1, sessionDuration);

      expect(result.allowed).toBe(false);
      expect(result.allowedDurationMs).toBe(0);
      expect(result.limitExceeded).toBe(true);
      expect(result.remainingBeforeSession).toBe(0);
    });
  });

  describe('for pro tier users', () => {
    beforeEach(() => {
      mockGetUserProfile.mockResolvedValue({
        userId: 1,
        subscriptionTier: 'pro',
      });
    });

    it('should always allow any session duration', async () => {
      mockGetDailyPracticeForUser.mockResolvedValue({
        practiceTimeMs: 3600000, // 1 hour already used
      });

      const sessionDuration = 1800000; // 30 minute session
      const result = await checkSessionAllowed(1, sessionDuration);

      expect(result.allowed).toBe(true);
      expect(result.allowedDurationMs).toBe(sessionDuration);
      expect(result.limitExceeded).toBe(false);
      expect(result.remainingBeforeSession).toBeNull();
    });
  });
});
