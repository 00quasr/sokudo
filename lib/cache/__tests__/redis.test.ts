import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock ioredis before importing modules that use it
const mockRedisInstance = {
  on: vi.fn(),
  quit: vi.fn().mockResolvedValue('OK'),
};

const MockRedisConstructor = vi.fn(function (this: typeof mockRedisInstance) {
  Object.assign(this, mockRedisInstance);
  return this;
});

vi.mock('ioredis', () => ({
  default: MockRedisConstructor,
}));

describe('redis client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRedisInstance.on.mockClear();
    mockRedisInstance.quit.mockClear();
    mockRedisInstance.quit.mockResolvedValue('OK');
    MockRedisConstructor.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getRedisClient', () => {
    it('should return null when REDIS_URL is not configured', async () => {
      delete process.env.REDIS_URL;

      const { getRedisClient } = await import('../redis');
      const client = getRedisClient();

      expect(client).toBeNull();
      expect(MockRedisConstructor).not.toHaveBeenCalled();
    });

    it('should create Redis client when REDIS_URL is configured', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379';

      // Need to re-import to get fresh module
      vi.resetModules();
      const { getRedisClient: freshGetRedis } = await import('../redis');
      const client = freshGetRedis();

      expect(client).not.toBeNull();
      expect(MockRedisConstructor).toHaveBeenCalledWith('redis://localhost:6379', {
        maxRetriesPerRequest: 3,
        retryStrategy: expect.any(Function),
        lazyConnect: true,
      });
    });

    it('should return singleton instance on multiple calls', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379';

      vi.resetModules();
      const { getRedisClient: freshGetRedis } = await import('../redis');
      const client1 = freshGetRedis();
      const client2 = freshGetRedis();

      expect(client1).toBe(client2);
      expect(MockRedisConstructor).toHaveBeenCalledTimes(1);
    });

    it('should configure retry strategy correctly', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379';

      vi.resetModules();
      const { getRedisClient: freshGetRedis } = await import('../redis');
      freshGetRedis();

      const callArgs = MockRedisConstructor.mock.calls[0];
      const config = callArgs[1];
      const retryStrategy = config.retryStrategy;

      // Test retry strategy
      expect(retryStrategy(1)).toBe(200);
      expect(retryStrategy(2)).toBe(400);
      expect(retryStrategy(3)).toBe(600);
      expect(retryStrategy(4)).toBeNull(); // Stop retrying after 3 attempts
    });

    it('should register error and connect event handlers', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379';

      vi.resetModules();
      const { getRedisClient: freshGetRedis } = await import('../redis');
      freshGetRedis();

      expect(mockRedisInstance.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockRedisInstance.on).toHaveBeenCalledWith('connect', expect.any(Function));
    });
  });

  describe('closeRedisClient', () => {
    it('should do nothing if client is not initialized', async () => {
      delete process.env.REDIS_URL;

      vi.resetModules();
      const { closeRedisClient: freshClose } = await import('../redis');
      await expect(freshClose()).resolves.not.toThrow();
    });

    it('should quit and reset client', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379';

      vi.resetModules();
      const { getRedisClient: freshGetRedis, closeRedisClient: freshClose } = await import('../redis');

      const client = freshGetRedis();
      expect(client).not.toBeNull();

      await freshClose();

      expect(mockRedisInstance.quit).toHaveBeenCalled();

      // Client should be null after closing
      const clientAfterClose = freshGetRedis();
      expect(MockRedisConstructor).toHaveBeenCalledTimes(2); // New instance created
    });
  });
});
