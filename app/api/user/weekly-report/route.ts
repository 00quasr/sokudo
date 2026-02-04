import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { generateWeeklyReport } from '@/lib/reports/weekly-report';
import { sendWeeklyReportToUser } from '@/lib/email/send-weekly-report';
import { apiRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'user:weekly-report' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const report = await generateWeeklyReport(user.id);
    if (!report) {
      return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Weekly report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate weekly report' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'user:weekly-report', limit: 30, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await sendWeeklyReportToUser(user.id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Weekly report sent' });
  } catch (error) {
    console.error('Send weekly report error:', error);
    return NextResponse.json(
      { error: 'Failed to send weekly report' },
      { status: 500 }
    );
  }
}
