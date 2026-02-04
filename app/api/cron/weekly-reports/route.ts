import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimit } from '@/lib/rate-limit';
import { sendAllWeeklyReports } from '@/lib/email/send-weekly-report';

export async function POST(request: NextRequest) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'cron:weekly-reports', limit: 10 });
  if (rateLimitResponse) return rateLimitResponse;

  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await sendAllWeeklyReports();

    return NextResponse.json({
      success: true,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors,
    });
  } catch (error) {
    console.error('Weekly reports cron error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send weekly reports',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'cron:weekly-reports', limit: 10 });
  if (rateLimitResponse) return rateLimitResponse;

  return POST(request);
}
