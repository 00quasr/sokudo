import { sendEmail } from './resend';
import { generateWeeklyReportEmail } from './templates/weekly-report';
import { generateWeeklyReport, getUsersForWeeklyReport } from '@/lib/reports/weekly-report';

export async function sendWeeklyReportToUser(userId: number): Promise<{
  success: boolean;
  error?: string;
}> {
  const reportData = await generateWeeklyReport(userId);

  if (!reportData) {
    return { success: false, error: 'User not found' };
  }

  const { subject, html } = generateWeeklyReportEmail(reportData);

  const result = await sendEmail({
    to: reportData.userEmail,
    subject,
    html,
  });

  return result;
}

export async function sendAllWeeklyReports(): Promise<{
  sent: number;
  failed: number;
  errors: Array<{ userId: number; error: string }>;
}> {
  const userIds = await getUsersForWeeklyReport();
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as Array<{ userId: number; error: string }>,
  };

  for (const userId of userIds) {
    const result = await sendWeeklyReportToUser(userId);
    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push({ userId, error: result.error || 'Unknown error' });
    }
  }

  return results;
}
