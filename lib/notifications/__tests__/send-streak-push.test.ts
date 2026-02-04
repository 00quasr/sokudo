import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/notifications/push', () => ({
  sendPushNotification: vi.fn(),
}));

vi.mock('@/lib/reports/streak-reminder', () => ({
  getStreakReminderData: vi.fn(),
  getUsersForPushStreakReminder: vi.fn(),
}));

describe('sendStreakPushToUser', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.BASE_URL = 'https://sokudo.dev';
  });

  it('should return error when user is not found', async () => {
    const { getStreakReminderData } = await import(
      '@/lib/reports/streak-reminder'
    );
    vi.mocked(getStreakReminderData).mockResolvedValue(null);

    const { sendStreakPushToUser } = await import('../send-streak-push');
    const result = await sendStreakPushToUser(1, '2025-01-01');

    expect(result).toEqual({ success: false, error: 'User not found' });
  });

  it('should send push notification with streak data', async () => {
    const { getStreakReminderData } = await import(
      '@/lib/reports/streak-reminder'
    );
    const { sendPushNotification } = await import('@/lib/notifications/push');

    vi.mocked(getStreakReminderData).mockResolvedValue({
      userId: 1,
      userEmail: 'test@example.com',
      userName: 'Test',
      currentStreak: 5,
      longestStreak: 10,
      lastPracticeDate: '2025-01-01',
    });
    vi.mocked(sendPushNotification).mockResolvedValue({ sent: 1, failed: 0 });

    const { sendStreakPushToUser } = await import('../send-streak-push');
    const result = await sendStreakPushToUser(1, '2025-01-02');

    expect(result).toEqual({ success: true });
    expect(sendPushNotification).toHaveBeenCalledWith(1, {
      title: 'Your 5-day streak is at risk!',
      body: 'Keep your 5-day streak alive! A quick practice session is all it takes.',
      tag: 'streak-reminder',
      url: 'https://sokudo.dev',
    });
  });

  it('should use different message for long streaks', async () => {
    const { getStreakReminderData } = await import(
      '@/lib/reports/streak-reminder'
    );
    const { sendPushNotification } = await import('@/lib/notifications/push');

    vi.mocked(getStreakReminderData).mockResolvedValue({
      userId: 1,
      userEmail: 'test@example.com',
      userName: 'Test',
      currentStreak: 14,
      longestStreak: 14,
      lastPracticeDate: '2025-01-01',
    });
    vi.mocked(sendPushNotification).mockResolvedValue({ sent: 1, failed: 0 });

    const { sendStreakPushToUser } = await import('../send-streak-push');
    await sendStreakPushToUser(1, '2025-01-02');

    expect(sendPushNotification).toHaveBeenCalledWith(1, {
      title: 'Your 14-day streak is at risk!',
      body: "Don't lose your amazing 14-day streak! Practice now to keep it going.",
      tag: 'streak-reminder',
      url: 'https://sokudo.dev',
    });
  });

  it('should return error when no push subscriptions exist', async () => {
    const { getStreakReminderData } = await import(
      '@/lib/reports/streak-reminder'
    );
    const { sendPushNotification } = await import('@/lib/notifications/push');

    vi.mocked(getStreakReminderData).mockResolvedValue({
      userId: 1,
      userEmail: 'test@example.com',
      userName: 'Test',
      currentStreak: 3,
      longestStreak: 5,
      lastPracticeDate: '2025-01-01',
    });
    vi.mocked(sendPushNotification).mockResolvedValue({ sent: 0, failed: 0 });

    const { sendStreakPushToUser } = await import('../send-streak-push');
    const result = await sendStreakPushToUser(1, '2025-01-02');

    expect(result).toEqual({ success: false, error: 'No push subscriptions' });
  });
});

describe('sendAllStreakPushNotifications', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.BASE_URL = 'https://sokudo.dev';
  });

  it('should send push notifications to all eligible users', async () => {
    const { getUsersForPushStreakReminder, getStreakReminderData } =
      await import('@/lib/reports/streak-reminder');
    const { sendPushNotification } = await import('@/lib/notifications/push');

    vi.mocked(getUsersForPushStreakReminder).mockResolvedValue([1, 2]);
    vi.mocked(getStreakReminderData)
      .mockResolvedValueOnce({
        userId: 1,
        userEmail: 'user1@example.com',
        userName: 'User 1',
        currentStreak: 5,
        longestStreak: 10,
        lastPracticeDate: '2025-01-01',
      })
      .mockResolvedValueOnce({
        userId: 2,
        userEmail: 'user2@example.com',
        userName: 'User 2',
        currentStreak: 3,
        longestStreak: 7,
        lastPracticeDate: '2025-01-01',
      });
    vi.mocked(sendPushNotification).mockResolvedValue({ sent: 1, failed: 0 });

    const { sendAllStreakPushNotifications } = await import(
      '../send-streak-push'
    );
    const result = await sendAllStreakPushNotifications('2025-01-02');

    expect(result.sent).toBe(2);
    expect(result.failed).toBe(0);
  });

  it('should track failed notifications', async () => {
    const { getUsersForPushStreakReminder, getStreakReminderData } =
      await import('@/lib/reports/streak-reminder');
    const { sendPushNotification } = await import('@/lib/notifications/push');

    vi.mocked(getUsersForPushStreakReminder).mockResolvedValue([1]);
    vi.mocked(getStreakReminderData).mockResolvedValue({
      userId: 1,
      userEmail: 'test@example.com',
      userName: 'Test',
      currentStreak: 3,
      longestStreak: 5,
      lastPracticeDate: '2025-01-01',
    });
    vi.mocked(sendPushNotification).mockResolvedValue({ sent: 0, failed: 0 });

    const { sendAllStreakPushNotifications } = await import(
      '../send-streak-push'
    );
    const result = await sendAllStreakPushNotifications('2025-01-02');

    expect(result.sent).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toBe('No push subscriptions');
  });
});
