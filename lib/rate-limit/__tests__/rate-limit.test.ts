import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { rateLimit, resetRateLimitState } from '../rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    resetRateLimitState();
  });

  afterEach(() => {
    resetRateLimitState();
  });

  it('allows requests within the limit', () => {
    const config = { limit: 5, windowMs: 60_000 };
    const result = rateLimit('test-key', config);

    expect(result.success).toBe(true);
    expect(result.limit).toBe(5);
    expect(result.remaining).toBe(4);
  });

  it('decrements remaining count with each request', () => {
    const config = { limit: 3, windowMs: 60_000 };

    const r1 = rateLimit('test-key', config);
    expect(r1.remaining).toBe(2);

    const r2 = rateLimit('test-key', config);
    expect(r2.remaining).toBe(1);

    const r3 = rateLimit('test-key', config);
    expect(r3.remaining).toBe(0);
  });

  it('blocks requests when limit is exceeded', () => {
    const config = { limit: 2, windowMs: 60_000 };

    rateLimit('test-key', config);
    rateLimit('test-key', config);
    const result = rateLimit('test-key', config);

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('returns a valid resetAt timestamp when blocked', () => {
    const config = { limit: 1, windowMs: 60_000 };

    rateLimit('test-key', config);
    const result = rateLimit('test-key', config);

    expect(result.success).toBe(false);
    expect(result.resetAt).toBeGreaterThan(Date.now());
    expect(result.resetAt).toBeLessThanOrEqual(Date.now() + 60_000);
  });

  it('tracks different keys independently', () => {
    const config = { limit: 1, windowMs: 60_000 };

    const r1 = rateLimit('key-a', config);
    expect(r1.success).toBe(true);

    const r2 = rateLimit('key-b', config);
    expect(r2.success).toBe(true);

    const r3 = rateLimit('key-a', config);
    expect(r3.success).toBe(false);

    const r4 = rateLimit('key-b', config);
    expect(r4.success).toBe(false);
  });

  it('resets after the window expires', () => {
    vi.useFakeTimers();
    const config = { limit: 1, windowMs: 1_000 };

    try {
      const r1 = rateLimit('test-key', config);
      expect(r1.success).toBe(true);

      const r2 = rateLimit('test-key', config);
      expect(r2.success).toBe(false);

      // Advance past the window
      vi.advanceTimersByTime(1_001);

      const r3 = rateLimit('test-key', config);
      expect(r3.success).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('supports sliding window behavior', () => {
    vi.useFakeTimers();
    const config = { limit: 2, windowMs: 1_000 };

    try {
      // t=0: first request
      rateLimit('test-key', config);

      // t=500: second request
      vi.advanceTimersByTime(500);
      rateLimit('test-key', config);

      // t=500: third request should be blocked
      const r3 = rateLimit('test-key', config);
      expect(r3.success).toBe(false);

      // t=1001: first request expired, one slot free
      vi.advanceTimersByTime(501);
      const r4 = rateLimit('test-key', config);
      expect(r4.success).toBe(true);

      // t=1001: limit reached again (second request + this new one)
      const r5 = rateLimit('test-key', config);
      expect(r5.success).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('handles a limit of 0 by blocking all requests', () => {
    const config = { limit: 0, windowMs: 60_000 };
    const result = rateLimit('test-key', config);

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('handles high concurrency within a single key', () => {
    const config = { limit: 100, windowMs: 60_000 };

    for (let i = 0; i < 100; i++) {
      const result = rateLimit('high-load', config);
      expect(result.success).toBe(true);
    }

    const blocked = rateLimit('high-load', config);
    expect(blocked.success).toBe(false);
  });
});
