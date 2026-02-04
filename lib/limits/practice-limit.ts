import { getDailyPracticeForUser, getUserProfile } from '@/lib/db/queries';
import { FREE_TIER_DAILY_LIMIT_MS, hasUnlimitedPractice } from './constants';
import { getCurrentDateInTimezone, getTimezoneFromPreferences } from './timezone';

export interface PracticeLimitStatus {
  /** Whether the user can practice (not at limit) */
  canPractice: boolean;
  /** Whether the user is on free tier */
  isFreeTier: boolean;
  /** Remaining practice time in ms (null for unlimited) */
  remainingMs: number | null;
  /** Daily limit in ms (null for unlimited) */
  dailyLimitMs: number | null;
  /** Practice time used today in ms */
  usedTodayMs: number;
  /** The user's subscription tier */
  subscriptionTier: string;
}

/**
 * Get the practice limit status for a user
 *
 * Daily limits reset at midnight in the user's configured timezone.
 * If no timezone is set, defaults to UTC.
 */
export async function getPracticeLimitStatus(userId: number): Promise<PracticeLimitStatus> {
  // First get profile to determine the user's timezone
  const profile = await getUserProfile(userId);

  // Get timezone from user preferences (defaults to UTC if not set)
  const preferences = profile?.preferences as Record<string, unknown> | null;
  const timezone = getTimezoneFromPreferences(preferences);

  // Get the current date in the user's timezone for daily limit tracking
  const userLocalDate = getCurrentDateInTimezone(timezone);

  const dailyPractice = await getDailyPracticeForUser(userId, userLocalDate);

  const subscriptionTier = profile?.subscriptionTier ?? 'free';
  const isUnlimited = hasUnlimitedPractice(subscriptionTier);
  const usedTodayMs = dailyPractice?.practiceTimeMs ?? 0;

  if (isUnlimited) {
    return {
      canPractice: true,
      isFreeTier: false,
      remainingMs: null,
      dailyLimitMs: null,
      usedTodayMs,
      subscriptionTier,
    };
  }

  const remainingMs = Math.max(0, FREE_TIER_DAILY_LIMIT_MS - usedTodayMs);
  const canPractice = remainingMs > 0;

  return {
    canPractice,
    isFreeTier: true,
    remainingMs,
    dailyLimitMs: FREE_TIER_DAILY_LIMIT_MS,
    usedTodayMs,
    subscriptionTier,
  };
}

/**
 * Check if a session can be saved (practice time not exceeded)
 * Returns the allowed duration in ms (may be less than requested if limit would be exceeded)
 */
export async function checkSessionAllowed(
  userId: number,
  sessionDurationMs: number
): Promise<{
  allowed: boolean;
  allowedDurationMs: number;
  limitExceeded: boolean;
  remainingBeforeSession: number | null;
}> {
  const status = await getPracticeLimitStatus(userId);

  // Unlimited users can always save sessions
  if (!status.isFreeTier) {
    return {
      allowed: true,
      allowedDurationMs: sessionDurationMs,
      limitExceeded: false,
      remainingBeforeSession: null,
    };
  }

  // For free tier users, check if they've exceeded the limit
  if (!status.canPractice) {
    return {
      allowed: false,
      allowedDurationMs: 0,
      limitExceeded: true,
      remainingBeforeSession: 0,
    };
  }

  // Check if this session would exceed the limit
  const remainingMs = status.remainingMs ?? 0;

  if (sessionDurationMs <= remainingMs) {
    // Session fits within limit
    return {
      allowed: true,
      allowedDurationMs: sessionDurationMs,
      limitExceeded: false,
      remainingBeforeSession: remainingMs,
    };
  }

  // Session would exceed limit - allow partial credit
  // (user still completes the session, but only remaining time counts)
  return {
    allowed: true,
    allowedDurationMs: remainingMs,
    limitExceeded: true,
    remainingBeforeSession: remainingMs,
  };
}
