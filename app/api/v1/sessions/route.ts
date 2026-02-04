import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { typingSessions, challenges, categories } from '@/lib/db/schema';
import { authenticateApiKey, hasScope } from '@/lib/auth/api-key';
import { apiRateLimit } from '@/lib/rate-limit';
import { dispatchWebhookEvent } from '@/lib/webhooks/deliver';

const getSessionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  categoryId: z.coerce.number().int().positive().optional(),
});

const createSessionSchema = z.object({
  challengeId: z.number().int().positive(),
  wpm: z.number().int().nonnegative(),
  rawWpm: z.number().int().nonnegative(),
  accuracy: z.number().int().min(0).max(100),
  keystrokes: z.number().int().nonnegative(),
  errors: z.number().int().nonnegative(),
  durationMs: z.number().int().positive(),
});

export async function GET(request: NextRequest) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'v1:sessions:get', limit: 60, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await authenticateApiKey(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryResult = getSessionsQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      categoryId: searchParams.get('categoryId') ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.errors },
        { status: 400 }
      );
    }

    const { page, limit, categoryId } = queryResult.data;
    const offset = (page - 1) * limit;

    const baseConditions = categoryId
      ? sql`${typingSessions.userId} = ${user.id} AND ${challenges.categoryId} = ${categoryId}`
      : sql`${typingSessions.userId} = ${user.id}`;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(typingSessions)
      .innerJoin(challenges, eq(typingSessions.challengeId, challenges.id))
      .where(baseConditions);

    const total = countResult?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

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
        challenge: {
          id: challenges.id,
          content: challenges.content,
          difficulty: challenges.difficulty,
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
      .where(baseConditions)
      .orderBy(desc(typingSessions.completedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/v1/sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'v1:sessions:post', limit: 20, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await authenticateApiKey(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    if (!hasScope(user, 'write') && !hasScope(user, '*')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Requires "write" scope.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = createSessionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.errors },
        { status: 400 }
      );
    }

    const sessionData = result.data;

    // Verify the challenge exists
    const [challenge] = await db
      .select({ id: challenges.id })
      .from(challenges)
      .where(eq(challenges.id, sessionData.challengeId))
      .limit(1);

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    const [session] = await db
      .insert(typingSessions)
      .values({
        userId: user.id,
        challengeId: sessionData.challengeId,
        wpm: sessionData.wpm,
        rawWpm: sessionData.rawWpm,
        accuracy: sessionData.accuracy,
        keystrokes: sessionData.keystrokes,
        errors: sessionData.errors,
        durationMs: sessionData.durationMs,
      })
      .returning();

    // Dispatch webhook event (fire-and-forget)
    dispatchWebhookEvent(user.id, 'session.completed', {
      sessionId: session.id,
      challengeId: sessionData.challengeId,
      wpm: sessionData.wpm,
      rawWpm: sessionData.rawWpm,
      accuracy: sessionData.accuracy,
      keystrokes: sessionData.keystrokes,
      errors: sessionData.errors,
      durationMs: sessionData.durationMs,
      completedAt: session.completedAt,
    }).catch((err) => console.error('Error dispatching session.completed webhook:', err));

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/v1/sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
