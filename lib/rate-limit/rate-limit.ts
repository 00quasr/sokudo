export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

interface TokenBucket {
  timestamps: number[];
}

const buckets = new Map<string, TokenBucket>();

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup(windowMs: number): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
      if (bucket.timestamps.length === 0) {
        buckets.delete(key);
      }
    }
  }, Math.max(windowMs, 60_000));

  // Allow Node.js to exit even if the timer is running
  if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref();
  }
}

export function rateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const { limit, windowMs } = config;
  const now = Date.now();

  startCleanup(windowMs);

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }

  // Remove expired timestamps (sliding window)
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldestInWindow = bucket.timestamps[0];
    const resetAt = oldestInWindow + windowMs;
    return {
      success: false,
      limit,
      remaining: 0,
      resetAt,
    };
  }

  bucket.timestamps.push(now);

  return {
    success: true,
    limit,
    remaining: limit - bucket.timestamps.length,
    resetAt: now + windowMs,
  };
}

/** Reset all rate limit state. Useful for testing. */
export function resetRateLimitState(): void {
  buckets.clear();
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
