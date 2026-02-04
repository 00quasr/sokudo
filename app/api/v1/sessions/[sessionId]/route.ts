import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, and, asc } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { typingSessions, challenges, categories, keystrokeLogs } from '@/lib/db/schema';
import { authenticateApiKey } from '@/lib/auth/api-key';
import { apiRateLimit } from '@/lib/rate-limit';

const paramsSchema = z.object({
  sessionId: z.coerce.number().int().positive(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'v1:sessions:detail', limit: 60, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await authenticateApiKey(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const parseResult = paramsSchema.safeParse(resolvedParams);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    const { sessionId } = parseResult.data;

    const [session] = await db
      .select({
        id: typingSessions.id,
        wpm: typingSessions.wpm,
        rawWpm: typingSessions.rawWpm,
        accuracy: typingSessions.accuracy,
        keystrokes: typingSessions.keystrokes,
        errors: typingSessions.errors,
        durationMs: typingSessions.durationMs,
        completedAt: typingSessions.completedAt,
        challenge: {
          id: challenges.id,
          content: challenges.content,
          difficulty: challenges.difficulty,
          syntaxType: challenges.syntaxType,
        },
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        },
      })
      .from(typingSessions)
      .innerJoin(challenges, eq(typingSessions.challengeId, challenges.id))
      .innerJoin(categories, eq(challenges.categoryId, categories.id))
      .where(
        and(
          eq(typingSessions.id, sessionId),
          eq(typingSessions.userId, user.id)
        )
      )
      .limit(1);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Fetch keystroke logs for this session
    const keystrokes = await db
      .select({
        id: keystrokeLogs.id,
        timestamp: keystrokeLogs.timestamp,
        expected: keystrokeLogs.expected,
        actual: keystrokeLogs.actual,
        isCorrect: keystrokeLogs.isCorrect,
        latencyMs: keystrokeLogs.latencyMs,
      })
      .from(keystrokeLogs)
      .where(eq(keystrokeLogs.sessionId, sessionId))
      .orderBy(asc(keystrokeLogs.timestamp));

    return NextResponse.json({
      session: {
        ...session,
        keystrokeLogs: keystrokes,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/v1/sessions/[sessionId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
