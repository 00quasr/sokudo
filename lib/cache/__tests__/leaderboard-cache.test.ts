import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCachedLeaderboard,
  setCachedLeaderboard,
  invalidateLeaderboardCache,
  getOrSetLeaderboard,
  getV1LeaderboardCacheKey,
  getTeamLeaderboardCacheKey,
  getReferralLeaderboardCacheKey,
  invalidateAllLeaderboards,
} from '../leaderboard-cache';
import { getRedisClient } from '../redis';
import type Redis from 'ioredis';

// Mock the Redis client
vi.mock('../redis', () => ({
  getRedisClient: vi.fn(),
}));

const mockGetRedisClient = getRedisClient as ReturnType<typeof vi.fn>;

describe('leaderboard-cache', () => {
  let mockRedis: Partial<Redis>;

  beforeEach(() => {
    // Create a mock Redis client
    mockRedis = {
      get: vi.fn(),
      setex: vi.fn(),
      del: vi.fn(),
      scanStream: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getCachedLeaderboard', () => {
    it('should return null when Redis is not available', async () => {
      mockGetRedisClient.mockReturnValue(null);

      const result = await getCachedLeaderboard('test-key');

      expect(result).toBeNull();
    });

    it('should return null when cache key does not exist', async () => {
      mockGetRedisClient.mockReturnValue(mockRedis as Redis);
      (mockRedis.get as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await getCachedLeaderboard('test-key');

      expect(result).toBeNull();
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    });

    it('should return parsed data when cache hit', async () => {
      const cachedData = { leaderboard: [{ rank: 1, wpm: 100 }] };
      mockGetRedisClient.mockReturnValue(mockRedis as Redis);
      (mockRedis.get as ReturnType<typeof vi.fn>).mockResolvedValue(JSON.stringify(cachedData));

      const result = await getCachedLeaderboard('test-key');

      expect(result).toEqual(cachedData);
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null and log error on JSON parse failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetRedisClient.mockReturnValue(mockRedis as Redis);
      (mockRedis.get as ReturnType<typeof vi.fn>).mockResolvedValue('invalid-json');

      const result = await getCachedLeaderboard('test-key');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should return null and log error on Redis error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetRedisClient.mockReturnValue(mockRedis as Redis);
      (mockRedis.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Redis error'));

      const result = await getCachedLeaderboard('test-key');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('setCachedLeaderboard', () => {
    it('should do nothing when Redis is not available', async () => {
      mockGetRedisClient.mockReturnValue(null);

      await setCachedLeaderboard('test-key', { data: 'test' }, 300);

      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it('should set data with default TTL', async () => {
      const data = { leaderboard: [{ rank: 1, wpm: 100 }] };
      mockGetRedisClient.mockReturnValue(mockRedis as Redis);
      (mockRedis.setex as ReturnType<typeof vi.fn>).mockResolvedValue('OK');

      await setCachedLeaderboard('test-key', data);

      expect(mockRedis.setex).toHaveBeenCalledWith('test-key', 300, JSON.stringify(data));
    });

    it('should set data with custom TTL', async () => {
      const data = { leaderboard: [{ rank: 1, wpm: 100 }] };
      mockGetRedisClient.mockReturnValue(mockRedis as Redis);
      (mockRedis.setex as ReturnType<typeof vi.fn>).mockResolvedValue('OK');

      await setCachedLeaderboard('test-key', data, 600);

      expect(mockRedis.setex).toHaveBeenCalledWith('test-key', 600, JSON.stringify(data));
    });

    it('should log error on Redis error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetRedisClient.mockReturnValue(mockRedis as Redis);
      (mockRedis.setex as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Redis error'));

      await setCachedLeaderboard('test-key', { data: 'test' });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('invalidateLeaderboardCache', () => {
    it('should do nothing when Redis is not available', async () => {
      mockGetRedisClient.mockReturnValue(null);

      await invalidateLeaderboardCache('test-key');

      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should delete single key when no wildcard', async () => {
      mockGetRedisClient.mockReturnValue(mockRedis as Redis);
      (mockRedis.del as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      await invalidateLeaderboardCache('test-key');

      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });

    it('should scan and delete keys with wildcard pattern', async () => {
      const mockKeys = ['leaderboard:v1:all:git:20', 'leaderboard:v1:week:git:20'];
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield mockKeys;
        },
      };

      mockGetRedisClient.mockReturnValue(mockRedis as Redis);
      (mockRedis.scanStream as ReturnType<typeof vi.fn>).mockReturnValue(mockStream);
      (mockRedis.del as ReturnType<typeof vi.fn>).mockResolvedValue(2);

      await invalidateLeaderboardCache('leaderboard:*');

      expect(mockRedis.scanStream).toHaveBeenCalledWith({
        match: 'leaderboard:*',
        count: 100,
      });
      expect(mockRedis.del).toHaveBeenCalledWith(...mockKeys);
    });

    it('should handle empty scan results with wildcard', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield [];
        },
      };

      mockGetRedisClient.mockReturnValue(mockRedis as Redis);
      (mockRedis.scanStream as ReturnType<typeof vi.fn>).mockReturnValue(mockStream);

      await invalidateLeaderboardCache('leaderboard:*');

      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should log error on Redis error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetRedisClient.mockReturnValue(mockRedis as Redis);
      (mockRedis.del as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Redis error'));

      await invalidateLeaderboardCache('test-key');

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getOrSetLeaderboard', () => {
    it('should return cached data on cache hit', async () => {
      const cachedData = { leaderboard: [{ rank: 1, wpm: 100 }] };
      mockGetRedisClient.mockReturnValue(mockRedis as Redis);
      (mockRedis.get as ReturnType<typeof vi.fn>).mockResolvedValue(JSON.stringify(cachedData));

      const fetchFn = vi.fn();
      const result = await getOrSetLeaderboard({ key: 'test-key', ttl: 300 }, fetchFn);

      expect(result).toEqual(cachedData);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should fetch and cache data on cache miss', async () => {
      const freshData = { leaderboard: [{ rank: 1, wpm: 100 }] };
      mockGetRedisClient.mockReturnValue(mockRedis as Redis);
      (mockRedis.get as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (mockRedis.setex as ReturnType<typeof vi.fn>).mockResolvedValue('OK');

      const fetchFn = vi.fn().mockResolvedValue(freshData);
      const result = await getOrSetLeaderboard({ key: 'test-key', ttl: 300 }, fetchFn);

      expect(result).toEqual(freshData);
      expect(fetchFn).toHaveBeenCalled();
      // Allow time for async cache set
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(mockRedis.setex).toHaveBeenCalledWith('test-key', 300, JSON.stringify(freshData));
    });

    it('should return data even if cache set fails', async () => {
      const freshData = { leaderboard: [{ rank: 1, wpm: 100 }] };
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetRedisClient.mockReturnValue(mockRedis as Redis);
      (mockRedis.get as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (mockRedis.setex as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Redis error'));

      const fetchFn = vi.fn().mockResolvedValue(freshData);
      const result = await getOrSetLeaderboard({ key: 'test-key', ttl: 300 }, fetchFn);

      expect(result).toEqual(freshData);
      expect(fetchFn).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('cache key generators', () => {
    it('should generate v1 leaderboard cache key', () => {
      const key1 = getV1LeaderboardCacheKey({
        limit: 20,
        categorySlug: 'git-basics',
        timeframe: 'week',
      });
      expect(key1).toBe('leaderboard:v1:week:git-basics:20');

      const key2 = getV1LeaderboardCacheKey({
        limit: 50,
        timeframe: 'all',
      });
      expect(key2).toBe('leaderboard:v1:all:all:50');
    });

    it('should generate team leaderboard cache key', () => {
      const key = getTeamLeaderboardCacheKey(42);
      expect(key).toBe('leaderboard:team:42');
    });

    it('should generate referral leaderboard cache key', () => {
      const key = getReferralLeaderboardCacheKey(10);
      expect(key).toBe('leaderboard:referral:10');
    });
  });

  describe('invalidateAllLeaderboards', () => {
    it('should invalidate all leaderboard caches', async () => {
      const mockKeys = ['leaderboard:v1:all:git:20', 'leaderboard:team:1'];
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield mockKeys;
        },
      };

      mockGetRedisClient.mockReturnValue(mockRedis as Redis);
      (mockRedis.scanStream as ReturnType<typeof vi.fn>).mockReturnValue(mockStream);
      (mockRedis.del as ReturnType<typeof vi.fn>).mockResolvedValue(2);

      await invalidateAllLeaderboards();

      expect(mockRedis.scanStream).toHaveBeenCalledWith({
        match: 'leaderboard:*',
        count: 100,
      });
      expect(mockRedis.del).toHaveBeenCalledWith(...mockKeys);
    });
  });
});
