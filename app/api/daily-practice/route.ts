import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser, getDailyPractice, getDailyPracticeHistory } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';

const getQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  days: z.coerce.number().int().positive().max(365).optional(),
});

export type GetDailyPracticeQuery = z.infer<typeof getQuerySchema>;

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'daily-practice' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryResult = getQuerySchema.safeParse({
      date: searchParams.get('date') ?? undefined,
      days: searchParams.get('days') ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.errors },
        { status: 400 }
      );
    }

    const { date, days } = queryResult.data;

    if (days) {
      const history = await getDailyPracticeHistory(days);
      return NextResponse.json({ history });
    }

    const targetDate = date ?? new Date().toISOString().split('T')[0];
    const practice = await getDailyPractice(targetDate);

    return NextResponse.json({
      date: targetDate,
      practiceTimeMs: practice?.practiceTimeMs ?? 0,
      sessionsCompleted: practice?.sessionsCompleted ?? 0,
    });
  } catch (error) {
    console.error('Error fetching daily practice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
