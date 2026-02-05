import { getRedisClient } from './redis';

export interface LeaderboardCacheOptions {
  /**
   * Cache key for the leaderboard
   */
  key: string;
  /**
   * Time to live in seconds (default: 300 = 5 minutes)
   */
  ttl?: number;
}

/**
 * Gets cached leaderboard data from Redis
 */
export async function getCachedLeaderboard<T>(
  key: string
): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) {
    return null; // Caching disabled
  }

  try {
    const cached = await redis.get(key);
    if (!cached) {
      return null;
    }
    return JSON.parse(cached) as T;
  } catch (error) {
    console.error('Error getting cached leaderboard:', error);
    return null;
  }
}

/**
 * Sets leaderboard data in Redis cache
 */
export async function setCachedLeaderboard<T>(
  key: string,
  data: T,
  ttl = 300 // 5 minutes default
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    return; // Caching disabled
  }

  try {
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.error('Error setting cached leaderboard:', error);
  }
}

/**
 * Invalidates (deletes) cached leaderboard data
 */
export async function invalidateLeaderboardCache(
  pattern: string
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    return; // Caching disabled
  }

  try {
    // If pattern contains wildcards, scan and delete matching keys
    if (pattern.includes('*')) {
      const keys: string[] = [];
      const stream = redis.scanStream({
        match: pattern,
        count: 100,
      });

      for await (const batch of stream) {
        keys.push(...batch);
      }

      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } else {
      // Single key deletion
      await redis.del(pattern);
    }
  } catch (error) {
    console.error('Error invalidating leaderboard cache:', error);
  }
}

/**
 * Gets or sets leaderboard data with caching
 * This is a convenience function that handles cache-aside pattern
 */
export async function getOrSetLeaderboard<T>(
  options: LeaderboardCacheOptions,
  fetchFn: () => Promise<T>
): Promise<T> {
  const { key, ttl = 300 } = options;

  // Try to get from cache first
  const cached = await getCachedLeaderboard<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch from database
  const data = await fetchFn();

  // Store in cache for next time (fire and forget)
  setCachedLeaderboard(key, data, ttl).catch((err) => {
    console.error('Failed to cache leaderboard:', err);
  });

  return data;
}

/**
 * Generates a consistent cache key for v1 leaderboard API
 */
export function getV1LeaderboardCacheKey(params: {
  limit: number;
  categorySlug?: string;
  timeframe: 'all' | 'week' | 'month';
}): string {
  const { limit, categorySlug, timeframe } = params;
  const category = categorySlug || 'all';
  return `leaderboard:v1:${timeframe}:${category}:${limit}`;
}

/**
 * Generates a consistent cache key for team leaderboard
 */
export function getTeamLeaderboardCacheKey(teamId: number): string {
  return `leaderboard:team:${teamId}`;
}

/**
 * Generates a consistent cache key for referral leaderboard
 */
export function getReferralLeaderboardCacheKey(limit: number): string {
  return `leaderboard:referral:${limit}`;
}

/**
 * Invalidates all leaderboard caches
 * Call this when new typing sessions are completed
 */
export async function invalidateAllLeaderboards(): Promise<void> {
  await invalidateLeaderboardCache('leaderboard:*');
}
