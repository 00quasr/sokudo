import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import {
  getUser,
  upsertKeyAccuracy,
  batchUpsertCharErrorPatterns,
  batchUpsertSequenceErrorPatterns,
  upsertDailyPractice,
  updateUserTotalPracticeTime,
  updateUserStreak,
} from '@/lib/db/queries';
import { checkSessionAllowed, FREE_TIER_DAILY_LIMIT_MS } from '@/lib/limits';
import { extractSequences } from '@/lib/practice/extract-sequences';

const keystrokeLogSchema = z.object({
  timestamp: z.number().int().nonnegative(),
  expected: z.string().max(10),
  actual: z.string().max(10),
  isCorrect: z.boolean(),
  latencyMs: z.number().int().nonnegative(),
});

const sessionSchema = z.object({
  wpm: z.number().int().nonnegative(),
  rawWpm: z.number().int().nonnegative(),
  accuracy: z.number().int().min(0).max(100),
  keystrokes: z.number().int().nonnegative(),
  errors: z.number().int().nonnegative(),
  durationMs: z.number().int().positive(),
  focusArea: z.enum(['weak-keys', 'common-typos', 'slow-keys', 'problem-sequences', 'mixed']),
  keystrokeLogs: z.array(keystrokeLogSchema).optional(),
});

/**
 * POST /api/practice/personalized/sessions
 *
 * Saves results from a personalized practice session. Unlike regular sessions,
 * personalized challenges don't have a challengeId in the database, so this
 * endpoint only updates error tracking data (key_accuracy, char_error_patterns,
 * sequence_error_patterns) and daily practice tracking.
 *
 * This enables the feedback loop: practice errors are recorded, weakness
 * analysis improves, and future personalized content better targets weaknesses.
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'practice:personalized:sessions', limit: 30 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = sessionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.errors },
        { status: 400 }
      );
    }

    const { keystrokeLogs: logs, ...sessionData } = result.data;

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

    const effectiveDurationMs = limitCheck.allowedDurationMs;

    // Update error tracking from keystroke logs
    if (logs && logs.length > 0) {
      // Update per-key accuracy
      for (const log of logs) {
        await upsertKeyAccuracy(user.id, log.expected, log.isCorrect, log.latencyMs);
      }

      // Aggregate and upsert character error patterns
      const errorMap = new Map<string, number>();
      for (const log of logs) {
        if (!log.isCorrect && log.expected !== log.actual) {
          const key = `${log.expected}:${log.actual}`;
          errorMap.set(key, (errorMap.get(key) || 0) + 1);
        }
      }

      if (errorMap.size > 0) {
        const errors = Array.from(errorMap.entries()).map(([key, count]) => {
          const [expectedChar, actualChar] = key.split(':');
          return { expectedChar, actualChar, count };
        });
        await batchUpsertCharErrorPatterns(user.id, errors);
      }

      // Extract and update sequence error patterns
      const sequences = extractSequences(logs);
      if (sequences.length > 0) {
        await batchUpsertSequenceErrorPatterns(user.id, sequences);
      }
    }

    // Update daily practice tracking
    const today = new Date().toISOString().split('T')[0];
    await upsertDailyPractice(user.id, today, effectiveDurationMs, 1);

    // Update total practice time and streak
    await updateUserTotalPracticeTime(user.id, sessionData.durationMs);
    await updateUserStreak(user.id);

    return NextResponse.json(
      {
        saved: true,
        focusArea: sessionData.focusArea,
        practiceLimit: limitCheck.limitExceeded
          ? {
              limitReached: true,
              effectiveDurationMs,
              message: 'You have reached your daily practice limit. Upgrade to Pro for unlimited practice.',
            }
          : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving personalized practice session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
