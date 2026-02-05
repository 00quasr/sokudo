import Redis from 'ioredis';

// Redis client singleton
let redis: Redis | null = null;

export function getRedisClient(): Redis | null {
  // If Redis URL is not configured, return null (caching disabled)
  if (!process.env.REDIS_URL) {
    return null;
  }

  // Create singleton instance
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          return null; // Stop retrying
        }
        return Math.min(times * 200, 1000); // Exponential backoff
      },
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.error('Redis client error:', err);
    });

    redis.on('connect', () => {
      console.log('Redis client connected');
    });
  }

  return redis;
}

export async function closeRedisClient(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
