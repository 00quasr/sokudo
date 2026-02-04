import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimit } from '@/lib/rate-limit';
import { sendAllStreakReminders } from '@/lib/email/send-streak-reminder';
import { sendAllStreakPushNotifications } from '@/lib/notifications/send-streak-push';

export async function POST(request: NextRequest) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'cron:streak-reminders', limit: 10 });
  if (rateLimitResponse) return rateLimitResponse;

  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [emailResults, pushResults] = await Promise.all([
      sendAllStreakReminders(),
      sendAllStreakPushNotifications(),
    ]);

    return NextResponse.json({
      success: true,
      email: {
        sent: emailResults.sent,
        failed: emailResults.failed,
        errors: emailResults.errors,
      },
      push: {
        sent: pushResults.sent,
        failed: pushResults.failed,
        errors: pushResults.errors,
      },
    });
  } catch (error) {
    console.error('Streak reminders cron error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send streak reminders',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'cron:streak-reminders', limit: 10 });
  if (rateLimitResponse) return rateLimitResponse;

  return POST(request);
}
