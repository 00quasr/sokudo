import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import {
  getUser,
  getDueReviewItems,
  getUserReviewStats,
  getSpacedRepetitionItem,
  upsertSpacedRepetitionItem,
  getUserAvgWpm,
  getUpcomingReviewItems,
} from '@/lib/db/queries';
import {
  deriveQuality,
  computeNextReview,
  DEFAULT_EASE_FACTOR,
} from '@/lib/practice/spaced-repetition';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  view: z.enum(['due', 'schedule']).default('due'),
});

const recordReviewSchema = z.object({
  challengeId: z.number().int().positive(),
  wpm: z.number().int().nonnegative(),
  accuracy: z.number().int().min(0).max(100),
  sessionId: z.number().int().positive().optional(),
});

/**
 * GET /api/practice/review
 *
 * Query params:
 *   - limit: max items to return (default 10)
 *   - view: "due" (default) or "schedule" (upcoming reviews)
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'practice:review' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      limit: searchParams.get('limit') ?? undefined,
      view: searchParams.get('view') ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.errors },
        { status: 400 }
      );
    }

    const { limit, view } = queryResult.data;

    if (view === 'schedule') {
      const [upcoming, stats] = await Promise.all([
        getUpcomingReviewItems(user.id, limit),
        getUserReviewStats(user.id),
      ]);
      return NextResponse.json({ items: upcoming, stats });
    }

    const [items, stats] = await Promise.all([
      getDueReviewItems(limit),
      getUserReviewStats(user.id),
    ]);

    return NextResponse.json({
      items,
      stats,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'User not authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching review items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/practice/review
 *
 * Record a review result for a challenge, updating the spaced repetition schedule.
 * Can be called manually or automatically after a typing session completes.
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'practice:review', limit: 30 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = recordReviewSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.errors },
        { status: 400 }
      );
    }

    const { challengeId, wpm, accuracy } = result.data;

    // Get user's average WPM for quality derivation
    const userAvgWpm = await getUserAvgWpm(user.id);

    // Derive SM-2 quality from performance
    const quality = deriveQuality({ wpm, accuracy, userAvgWpm });

    // Get current card state or create new one
    const existing = await getSpacedRepetitionItem(user.id, challengeId);
    const card = existing
      ? {
          easeFactor: existing.easeFactor,
          interval: existing.interval,
          repetitions: existing.repetitions,
        }
      : {
          easeFactor: DEFAULT_EASE_FACTOR,
          interval: 0,
          repetitions: 0,
        };

    // Compute next review
    const update = computeNextReview(card, quality);

    // Persist
    await upsertSpacedRepetitionItem(user.id, challengeId, {
      easeFactor: update.easeFactor,
      interval: update.interval,
      repetitions: update.repetitions,
      nextReviewAt: update.nextReviewAt,
      lastQuality: quality,
    });

    return NextResponse.json({
      quality,
      easeFactor: update.easeFactor,
      interval: update.interval,
      repetitions: update.repetitions,
      nextReviewAt: update.nextReviewAt,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'User not authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error recording review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
