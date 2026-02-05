import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { typingSessions, challenges, categories } from '@/lib/db/schema';
import { apiRateLimit } from '@/lib/rate-limit';
import { authenticateApiKey, hasScope } from '@/lib/auth/api-key';

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(10),
});

/**
 * GET /api/v1/sessions/recent
 * Get recent typing sessions for the authenticated user (for Zapier actions).
 * Requires API key with 'read' or '*' scope via Bearer authentication.
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'v1:sessions:recent', limit: 60, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await authenticateApiKey(request);
    if (!user) {
      return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
    }

    if (!hasScope(user, 'read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      limit: searchParams.get('limit') ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.errors },
        { status: 400 }
      );
    }

    const { limit } = queryResult.data;

    // Get recent sessions with challenge and category info
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
      .where(eq(typingSessions.userId, user.id))
      .orderBy(desc(typingSessions.completedAt))
      .limit(limit);

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error in GET /api/v1/sessions/recent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
