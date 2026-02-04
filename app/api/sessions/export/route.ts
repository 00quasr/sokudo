import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { typingSessions, challenges, categories } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';

function escapeCSVField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'sessions:export', limit: 10, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sessions = await db
      .select({
        id: typingSessions.id,
        wpm: typingSessions.wpm,
        rawWpm: typingSessions.rawWpm,
        accuracy: typingSessions.accuracy,
        keystrokes: typingSessions.keystrokes,
        errors: typingSessions.errors,
        durationMs: typingSessions.durationMs,
        completedAt: typingSessions.completedAt,
        challengeDifficulty: challenges.difficulty,
        categoryName: categories.name,
      })
      .from(typingSessions)
      .innerJoin(challenges, eq(typingSessions.challengeId, challenges.id))
      .innerJoin(categories, eq(challenges.categoryId, categories.id))
      .where(eq(typingSessions.userId, user.id))
      .orderBy(desc(typingSessions.completedAt));

    const headers = [
      'Session ID',
      'Date',
      'Category',
      'Difficulty',
      'WPM',
      'Raw WPM',
      'Accuracy (%)',
      'Keystrokes',
      'Errors',
      'Duration (ms)',
      'Duration',
    ];

    const rows = sessions.map((session) => [
      String(session.id),
      session.completedAt
        ? new Date(session.completedAt).toISOString()
        : '',
      escapeCSVField(session.categoryName),
      session.challengeDifficulty,
      String(session.wpm),
      String(session.rawWpm),
      String(session.accuracy),
      String(session.keystrokes),
      String(session.errors),
      String(session.durationMs),
      formatDuration(session.durationMs),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="sokudo-sessions.csv"',
      },
    });
  } catch (error) {
    console.error('Error exporting sessions to CSV:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
