import type { WeeklyReportData } from '@/lib/reports/types';

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m`;
}

function formatChange(value: number, suffix = ''): string {
  if (value === 0) return `0${suffix}`;
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}${suffix}`;
}

function formatKey(key: string): string {
  if (key === ' ') return 'Space';
  if (key === '\t') return 'Tab';
  if (key === '\n') return 'Enter';
  return key;
}

export function generateWeeklyReportEmail(data: WeeklyReportData): {
  subject: string;
  html: string;
} {
  const userName = data.userName || 'there';
  const hasActivity = data.stats.totalSessions > 0;

  const subject = hasActivity
    ? `Your Weekly Sokudo Report: ${data.stats.avgWpm} WPM avg`
    : 'Your Weekly Sokudo Report - Time to Practice!';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Performance Report</title>
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
                Sokudo<span style="color: #a1a1aa; font-weight: 400;"> Weekly Report</span>
              </h1>
              <p style="margin: 8px 0 0; color: #71717a; font-size: 14px;">
                ${data.weekStartDate} to ${data.weekEndDate}
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 24px 32px 0;">
              <p style="margin: 0; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
                Hey ${userName},
              </p>
              ${
                hasActivity
                  ? `<p style="margin: 12px 0 0; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
                      Here's your typing performance for the past week.
                    </p>`
                  : `<p style="margin: 12px 0 0; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
                      You didn't practice this week. Let's get back on track!
                    </p>`
              }
            </td>
          </tr>

          ${
            hasActivity
              ? `
          <!-- Stats Grid -->
          <tr>
            <td style="padding: 24px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <!-- WPM -->
                  <td width="50%" style="padding: 16px; background-color: #27272a; border-radius: 8px; vertical-align: top;">
                    <p style="margin: 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Avg WPM</p>
                    <p style="margin: 8px 0 0; color: #fafafa; font-size: 32px; font-weight: 700; font-family: 'SF Mono', Monaco, monospace;">
                      ${data.stats.avgWpm}
                    </p>
                    <p style="margin: 4px 0 0; color: ${data.comparison.wpmChange >= 0 ? '#22c55e' : '#ef4444'}; font-size: 14px; font-family: 'SF Mono', Monaco, monospace;">
                      ${formatChange(data.comparison.wpmChange)} from last week
                    </p>
                  </td>
                  <td width="8"></td>
                  <!-- Accuracy -->
                  <td width="50%" style="padding: 16px; background-color: #27272a; border-radius: 8px; vertical-align: top;">
                    <p style="margin: 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Accuracy</p>
                    <p style="margin: 8px 0 0; color: #fafafa; font-size: 32px; font-weight: 700; font-family: 'SF Mono', Monaco, monospace;">
                      ${data.stats.avgAccuracy}%
                    </p>
                    <p style="margin: 4px 0 0; color: ${data.comparison.accuracyChange >= 0 ? '#22c55e' : '#ef4444'}; font-size: 14px; font-family: 'SF Mono', Monaco, monospace;">
                      ${formatChange(data.comparison.accuracyChange, '%')} from last week
                    </p>
                  </td>
                </tr>
                <tr><td colspan="3" height="8"></td></tr>
                <tr>
                  <!-- Sessions -->
                  <td width="50%" style="padding: 16px; background-color: #27272a; border-radius: 8px; vertical-align: top;">
                    <p style="margin: 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Sessions</p>
                    <p style="margin: 8px 0 0; color: #fafafa; font-size: 32px; font-weight: 700; font-family: 'SF Mono', Monaco, monospace;">
                      ${data.stats.totalSessions}
                    </p>
                    <p style="margin: 4px 0 0; color: ${data.comparison.sessionsChange >= 0 ? '#22c55e' : '#ef4444'}; font-size: 14px; font-family: 'SF Mono', Monaco, monospace;">
                      ${formatChange(data.comparison.sessionsChange)} from last week
                    </p>
                  </td>
                  <td width="8"></td>
                  <!-- Practice Time -->
                  <td width="50%" style="padding: 16px; background-color: #27272a; border-radius: 8px; vertical-align: top;">
                    <p style="margin: 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Practice Time</p>
                    <p style="margin: 8px 0 0; color: #fafafa; font-size: 32px; font-weight: 700; font-family: 'SF Mono', Monaco, monospace;">
                      ${formatDuration(data.stats.totalPracticeTimeMs)}
                    </p>
                    <p style="margin: 4px 0 0; color: #71717a; font-size: 14px;">
                      ${data.stats.totalKeystrokes.toLocaleString()} keystrokes
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Best Scores -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #27272a; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Best This Week</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 12px;">
                      <tr>
                        <td>
                          <span style="color: #a1a1aa; font-size: 14px;">Peak WPM:</span>
                          <span style="color: #22c55e; font-size: 14px; font-weight: 600; font-family: 'SF Mono', Monaco, monospace;"> ${data.stats.bestWpm}</span>
                        </td>
                        <td align="right">
                          <span style="color: #a1a1aa; font-size: 14px;">Best Accuracy:</span>
                          <span style="color: #22c55e; font-size: 14px; font-weight: 600; font-family: 'SF Mono', Monaco, monospace;"> ${data.stats.bestAccuracy}%</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${
            data.topCategories.length > 0
              ? `
          <!-- Top Categories -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <h2 style="margin: 0 0 12px; color: #fafafa; font-size: 16px; font-weight: 600;">Top Categories</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #27272a; border-radius: 8px;">
                ${data.topCategories
                  .map(
                    (cat, i) => `
                  <tr>
                    <td style="padding: 12px 16px; ${i < data.topCategories.length - 1 ? 'border-bottom: 1px solid #3f3f46;' : ''}">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td>
                            <p style="margin: 0; color: #fafafa; font-size: 14px; font-weight: 500;">${cat.categoryName}</p>
                            <p style="margin: 4px 0 0; color: #71717a; font-size: 12px;">${cat.sessions} sessions</p>
                          </td>
                          <td align="right">
                            <p style="margin: 0; color: #fafafa; font-size: 14px; font-family: 'SF Mono', Monaco, monospace;">${cat.avgWpm} WPM</p>
                            <p style="margin: 4px 0 0; color: #71717a; font-size: 12px;">${cat.avgAccuracy}% accuracy</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                `
                  )
                  .join('')}
              </table>
            </td>
          </tr>
          `
              : ''
          }

          ${
            data.weakestKeys.length > 0
              ? `
          <!-- Keys to Practice -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <h2 style="margin: 0 0 12px; color: #fafafa; font-size: 16px; font-weight: 600;">Keys to Practice</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #27272a; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; color: #a1a1aa; font-size: 14px; line-height: 1.8;">
                      ${data.weakestKeys
                        .map(
                          (k) =>
                            `<span style="display: inline-block; margin: 2px 4px; padding: 4px 12px; background-color: #3f3f46; border-radius: 4px; font-family: 'SF Mono', Monaco, monospace;"><span style="color: #fafafa;">${formatKey(k.key)}</span> <span style="color: #ef4444;">${k.accuracy}%</span></span>`
                        )
                        .join(' ')}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `
              : ''
          }

          <!-- Streak -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #27272a; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <p style="margin: 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Current Streak</p>
                          <p style="margin: 8px 0 0; color: #fafafa; font-size: 24px; font-weight: 700; font-family: 'SF Mono', Monaco, monospace;">
                            ${data.streakInfo.currentStreak} days
                          </p>
                        </td>
                        <td align="right">
                          <p style="margin: 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Longest Streak</p>
                          <p style="margin: 8px 0 0; color: #a1a1aa; font-size: 24px; font-weight: 700; font-family: 'SF Mono', Monaco, monospace;">
                            ${data.streakInfo.longestStreak} days
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `
              : `
          <!-- No Activity Message -->
          <tr>
            <td style="padding: 24px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #27272a; border-radius: 8px;">
                <tr>
                  <td style="padding: 32px; text-align: center;">
                    <p style="margin: 0; color: #71717a; font-size: 48px;">
                      :(
                    </p>
                    <p style="margin: 16px 0 0; color: #a1a1aa; font-size: 16px;">
                      No practice sessions this week
                    </p>
                    <p style="margin: 8px 0 0; color: #71717a; font-size: 14px;">
                      Even 5 minutes a day makes a difference
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `
          }

          <!-- CTA -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${process.env.BASE_URL || 'https://sokudo.dev'}"
                       style="display: inline-block; padding: 12px 32px; background-color: #fafafa; color: #0a0a0b; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">
                      Start Practicing
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
                You're receiving this because you have weekly reports enabled.
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
