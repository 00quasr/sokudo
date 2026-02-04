import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { typingSessions, keystrokeLogs, challenges, categories } from '@/lib/db/schema';
import {
  getUser,
  upsertDailyPractice,
  updateUserTotalPracticeTime,
  updateUserStreak,
  upsertKeyAccuracy,
  batchUpsertCharErrorPatterns,
  batchUpsertSequenceErrorPatterns,
  getSpacedRepetitionItem,
  upsertSpacedRepetitionItem,
  getUserStatsOverview,
} from '@/lib/db/queries';
import { extractSequences } from '@/lib/practice/extract-sequences';
import { checkSessionAllowed, FREE_TIER_DAILY_LIMIT_MS } from '@/lib/limits';
import { checkAndUnlockAchievements } from '@/lib/db/check-achievements';
import { detectAntiCheat } from '@/lib/anti-cheat/detect';
import {
  computeNextReview,
  deriveQuality,
  DEFAULT_EASE_FACTOR,
} from '@/lib/practice/spaced-repetition';
import { apiRateLimit } from '@/lib/rate-limit';
import { dispatchWebhookEvent } from '@/lib/webhooks/deliver';

const getSessionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  categoryId: z.coerce.number().int().positive().optional(),
});

export type GetSessionsQuery = z.infer<typeof getSessionsQuerySchema>;

const keystrokeLogSchema = z.object({
  timestamp: z.number().int().nonnegative(),
  expected: z.string().max(10),
  actual: z.string().max(10),
  isCorrect: z.boolean(),
  latencyMs: z.number().int().nonnegative(),
});

const createSessionSchema = z.object({
  challengeId: z.number().int().positive(),
  wpm: z.number().int().nonnegative(),
  rawWpm: z.number().int().nonnegative(),
  accuracy: z.number().int().min(0).max(100),
  keystrokes: z.number().int().nonnegative(),
  errors: z.number().int().nonnegative(),
  durationMs: z.number().int().positive(),
  keystrokeLogs: z.array(keystrokeLogSchema).optional(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export async function GET(request: NextRequest) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'sessions:get', limit: 60, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
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

    // Build base query conditions
    const baseConditions = categoryId
      ? sql`${typingSessions.userId} = ${user.id} AND ${challenges.categoryId} = ${categoryId}`
      : sql`${typingSessions.userId} = ${user.id}`;

    // Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(typingSessions)
      .innerJoin(challenges, eq(typingSessions.challengeId, challenges.id))
      .where(baseConditions);

    const total = countResult?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    // Get paginated sessions with challenge and category info
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
    console.error('Error fetching typing sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'sessions:post', limit: 20, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    const { keystrokeLogs: logs, ...sessionData } = result.data;

    // Anti-cheat detection
    const antiCheatResult = detectAntiCheat({
      ...sessionData,
      keystrokeLogs: logs,
    });

    if (!antiCheatResult.passed) {
      return NextResponse.json(
        {
          error: 'Session rejected by anti-cheat detection',
          code: 'ANTI_CHEAT_VIOLATION',
          violations: antiCheatResult.violations,
        },
        { status: 422 }
      );
    }

    // Check if user is within their practice limit
    const limitCheck = await checkSessionAllowed(user.id, sessionData.durationMs);

    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Daily practice limit exceeded',
          code: 'PRACTICE_LIMIT_EXCEEDED',
          details: {
            dailyLimitMs: FREE_TIER_DAILY_LIMIT_MS,
            message: 'Free tier users are limited to 15 minutes of practice per day. Upgrade to Pro for unlimited practice.',
          },
        },
        { status: 403 }
      );
    }

    // Use the allowed duration (may be less if hitting limit)
    const effectiveDurationMs = limitCheck.allowedDurationMs;

    // Insert the typing session
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

    // Insert keystroke logs if provided
    if (logs && logs.length > 0) {
      await db.insert(keystrokeLogs).values(
        logs.map((log) => ({
          sessionId: session.id,
          timestamp: log.timestamp,
          expected: log.expected,
          actual: log.actual,
          isCorrect: log.isCorrect,
          latencyMs: log.latencyMs,
        }))
      );

      // Update key accuracy and error patterns
      for (const log of logs) {
        await upsertKeyAccuracy(user.id, log.expected, log.isCorrect, log.latencyMs);
      }

      // Aggregate error patterns (expected -> actual substitutions)
      const errorMap = new Map<string, number>();
      for (const log of logs) {
        if (!log.isCorrect && log.expected !== log.actual) {
          const key = `${log.expected}:${log.actual}`;
          errorMap.set(key, (errorMap.get(key) || 0) + 1);
        }
      }

      // Batch upsert error patterns
      if (errorMap.size > 0) {
        const errors = Array.from(errorMap.entries()).map(([key, count]) => {
          const [expectedChar, actualChar] = key.split(':');
          return { expectedChar, actualChar, count };
        });
        await batchUpsertCharErrorPatterns(user.id, errors);
      }

      // Extract and update sequence (bigram) error patterns
      const sequences = extractSequences(logs);
      if (sequences.length > 0) {
        await batchUpsertSequenceErrorPatterns(user.id, sequences);
      }
    }

    // Update daily practice tracking (use effective duration for limit tracking)
    const today = new Date().toISOString().split('T')[0];
    await upsertDailyPractice(user.id, today, effectiveDurationMs, 1);

    // Update user's total practice time (use full duration for total stats)
    await updateUserTotalPracticeTime(user.id, sessionData.durationMs);

    // Update user's streak
    await updateUserStreak(user.id);

    // Check for newly unlocked achievements
    const newAchievements = await checkAndUnlockAchievements(user.id, {
      wpm: sessionData.wpm,
      accuracy: sessionData.accuracy,
      challengeId: sessionData.challengeId,
    });

    // Update spaced repetition schedule for this challenge
    try {
      const userStats = await getUserStatsOverview();
      const quality = deriveQuality({
        wpm: sessionData.wpm,
        accuracy: sessionData.accuracy,
        userAvgWpm: userStats.avgWpm,
      });

      const existing = await getSpacedRepetitionItem(user.id, sessionData.challengeId);
      const card = existing
        ? { easeFactor: existing.easeFactor, interval: existing.interval, repetitions: existing.repetitions }
        : { easeFactor: DEFAULT_EASE_FACTOR, interval: 0, repetitions: 0 };

      const reviewUpdate = computeNextReview(card, quality);

      await upsertSpacedRepetitionItem(user.id, sessionData.challengeId, {
        easeFactor: reviewUpdate.easeFactor,
        interval: reviewUpdate.interval,
        repetitions: reviewUpdate.repetitions,
        nextReviewAt: reviewUpdate.nextReviewAt,
        lastQuality: quality,
      });
    } catch (srError) {
      // Spaced repetition update is non-critical; log and continue
      console.error('Error updating spaced repetition:', srError);
    }

    // Dispatch webhook events (fire-and-forget)
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

    if (newAchievements.length > 0) {
      for (const achievement of newAchievements) {
        dispatchWebhookEvent(user.id, 'achievement.earned', {
          achievementId: achievement.id,
          slug: achievement.slug,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
        }).catch((err) => console.error('Error dispatching achievement.earned webhook:', err));
      }
    }

    // Include limit information in response
    const response = {
      ...session,
      newAchievements: newAchievements.length > 0 ? newAchievements : null,
      practiceLimit: limitCheck.limitExceeded
        ? {
            limitReached: true,
            effectiveDurationMs,
            message: 'You have reached your daily practice limit. Upgrade to Pro for unlimited practice.',
          }
        : null,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating typing session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
