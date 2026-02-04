import { sendPushNotification } from './push';
import {
  getStreakReminderData,
  getUsersForPushStreakReminder,
} from '@/lib/reports/streak-reminder';

export async function sendStreakPushToUser(
  userId: number,
  today: string
): Promise<{ success: boolean; error?: string }> {
  const data = await getStreakReminderData(userId, today);
  if (!data) {
    return { success: false, error: 'User not found' };
  }

  const baseUrl = process.env.BASE_URL || 'https://sokudo.dev';

  const result = await sendPushNotification(userId, {
    title: `Your ${data.currentStreak}-day streak is at risk!`,
    body:
      data.currentStreak >= 7
        ? `Don't lose your amazing ${data.currentStreak}-day streak! Practice now to keep it going.`
        : `Keep your ${data.currentStreak}-day streak alive! A quick practice session is all it takes.`,
    tag: 'streak-reminder',
    url: baseUrl,
  });

  if (result.sent === 0 && result.failed === 0) {
    return { success: false, error: 'No push subscriptions' };
  }

  return { success: result.sent > 0 };
}

export async function sendAllStreakPushNotifications(today?: string): Promise<{
  sent: number;
  failed: number;
  errors: Array<{ userId: number; error: string }>;
}> {
  const todayStr = today ?? new Date().toISOString().split('T')[0];
  const userIds = await getUsersForPushStreakReminder(todayStr);
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as Array<{ userId: number; error: string }>,
  };

  for (const userId of userIds) {
    const result = await sendStreakPushToUser(userId, todayStr);
    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push({ userId, error: result.error || 'Unknown error' });
    }
  }

  return results;
}
