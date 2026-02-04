import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { keystrokeLogs, typingSessions } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';

const keystrokeLogSchema = z.object({
  timestamp: z.number().int().nonnegative(),
  expected: z.string().max(10),
  actual: z.string().max(10),
  isCorrect: z.boolean(),
  latencyMs: z.number().int().nonnegative(),
});

const batchKeystrokeLogSchema = z.object({
  sessionId: z.number().int().positive(),
  logs: z.array(keystrokeLogSchema).min(1).max(10000),
});

export type BatchKeystrokeLogInput = z.infer<typeof batchKeystrokeLogSchema>;
export type KeystrokeLogInput = z.infer<typeof keystrokeLogSchema>;

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'keystroke-log', limit: 30, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = batchKeystrokeLogSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.errors },
        { status: 400 }
      );
    }

    const { sessionId, logs } = result.data;

    // Verify the session exists and belongs to the user
    const [session] = await db
      .select({ id: typingSessions.id, userId: typingSessions.userId })
      .from(typingSessions)
      .where(eq(typingSessions.id, sessionId))
      .limit(1);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Batch insert the keystroke logs
    const insertedLogs = await db
      .insert(keystrokeLogs)
      .values(
        logs.map((log) => ({
          sessionId,
          timestamp: log.timestamp,
          expected: log.expected,
          actual: log.actual,
          isCorrect: log.isCorrect,
          latencyMs: log.latencyMs,
        }))
      )
      .returning({ id: keystrokeLogs.id });

    return NextResponse.json(
      {
        message: 'Keystroke logs created successfully',
        count: insertedLogs.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating keystroke logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
