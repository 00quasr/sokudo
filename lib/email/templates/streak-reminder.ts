import type { StreakReminderData } from '@/lib/reports/types';

export function generateStreakReminderEmail(data: StreakReminderData): {
  subject: string;
  html: string;
} {
  const userName = data.userName || 'there';
  const isLongStreak = data.currentStreak >= 7;

  const subject = `Your ${data.currentStreak}-day streak is at risk!`;

  const motivationalMessage = isLongStreak
    ? `You've built an impressive ${data.currentStreak}-day streak. Don't let it slip away — one quick session keeps it alive.`
    : `You're on a ${data.currentStreak}-day streak. Keep the momentum going with a quick practice session today.`;

  const longestStreakSection =
    data.longestStreak > data.currentStreak
      ? `<p style="margin: 8px 0 0; color: #71717a; font-size: 14px;">
          Your longest streak was <span style="color: #fafafa; font-weight: 600;">${data.longestStreak} days</span> — you can beat it!
        </p>`
      : `<p style="margin: 8px 0 0; color: #71717a; font-size: 14px;">
          This is your longest streak ever. Keep going!
        </p>`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Streak Reminder</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0b;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #18181b; border-radius: 12px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; border-bottom: 1px solid #27272a;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #fafafa; font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;">
                Sokudo<span style="color: #a1a1aa; font-weight: 400;"> Streak Alert</span>
              </h1>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 24px 32px 0;">
              <p style="margin: 0; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
                Hey ${userName},
              </p>
              <p style="margin: 12px 0 0; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
                ${motivationalMessage}
              </p>
            </td>
          </tr>

          <!-- Streak Display -->
          <tr>
            <td style="padding: 24px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #27272a; border-radius: 8px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="margin: 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Current Streak</p>
                    <p style="margin: 12px 0 0; color: #fafafa; font-size: 48px; font-weight: 700; font-family: 'SF Mono', Monaco, monospace;">
                      ${data.currentStreak}
                    </p>
                    <p style="margin: 4px 0 0; color: #a1a1aa; font-size: 16px;">
                      days
                    </p>
                    ${longestStreakSection}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${process.env.BASE_URL || 'https://sokudo.dev'}"
                       style="display: inline-block; padding: 12px 32px; background-color: #fafafa; color: #0a0a0b; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">
                      Practice Now
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #27272a;">
              <p style="margin: 0; color: #52525b; font-size: 12px; text-align: center;">
                You're receiving this because you have streak reminders enabled.
                <br>
                <a href="${process.env.BASE_URL || 'https://sokudo.dev'}/dashboard/settings" style="color: #71717a; text-decoration: underline;">
                  Manage email preferences
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject, html };
}
