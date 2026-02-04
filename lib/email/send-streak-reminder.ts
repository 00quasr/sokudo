import { sendEmail } from './resend';
import { generateStreakReminderEmail } from './templates/streak-reminder';
import {
  getStreakReminderData,
  getUsersForStreakReminder,
} from '@/lib/reports/streak-reminder';

export async function sendStreakReminderToUser(
  userId: number,
  today: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  const data = await getStreakReminderData(userId, today);

  if (!data) {
    return { success: false, error: 'User not found' };
  }

  const { subject, html } = generateStreakReminderEmail(data);

  const result = await sendEmail({
    to: data.userEmail,
    subject,
    html,
  });

  return result;
}

export async function sendAllStreakReminders(today?: string): Promise<{
  sent: number;
  failed: number;
  errors: Array<{ userId: number; error: string }>;
}> {
  const todayStr = today ?? new Date().toISOString().split('T')[0];
  const userIds = await getUsersForStreakReminder(todayStr);
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as Array<{ userId: number; error: string }>,
  };

  for (const userId of userIds) {
    const result = await sendStreakReminderToUser(userId, todayStr);
    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push({ userId, error: result.error || 'Unknown error' });
    }
  }

  return results;
}
