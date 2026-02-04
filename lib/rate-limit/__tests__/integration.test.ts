import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { apiRateLimit, authRateLimit, webhookRateLimit } from '../middleware';
import { resetRateLimitState } from '../rate-limit';

/**
 * Integration tests for rate limiting across API routes.
 * These tests verify the rate limiting middleware works correctly
 * with realistic configurations used throughout the API.
 */

function createRequest(
  ip: string = '192.168.1.1',
  url: string = 'http://localhost:3000/api/test'
): NextRequest {
  return new NextRequest(url, {
    headers: { 'x-forwarded-for': ip },
  });
}

describe('API rate limiting integration', () => {
  beforeEach(() => {
    resetRateLimitState();
  });

  afterEach(() => {
    resetRateLimitState();
  });

  describe('standard GET endpoints (60 req/min)', () => {
    const prefixes = [
      'user',
      'team',
      'challenges',
      'categories',
      'stats',
      'achievements',
      'daily-practice',
      'practice-limit',
      'challenges:search',
      'sessions:detail',
      'adaptive-difficulty',
      'community-challenges',
      'collections',
      'collections:detail',
      'friend-challenges',
      'profile',
      'badges',
      'referral-code',
      'referrals',
      'referrals:leaderboard',
      'team:leaderboard',
      'team:compare',
      'team:activity',
      'team:achievements',
      'team:challenges',
      'team:challenges:detail',
      'team:custom-challenges',
      'team:custom-challenges:detail',
      'team:members',
      'team:stats',
      'team:onboarding-courses',
      'team:onboarding-courses:detail',
      'team:invitations',
      'practice:personalized',
      'practice:adaptive',
      'practice:smart',
      'practice:recommendations',
      'practice:review',
      'races',
      'races:detail',
      'matchmaking',
      'push-subscription',
      'tournaments',
      'tournaments:detail',
    ];

    it.each(prefixes)('prefix "%s" allows 60 requests then blocks', (prefix) => {
      for (let i = 0; i < 60; i++) {
        const result = apiRateLimit(createRequest(), { prefix });
        expect(result).toBeNull();
      }

      const blocked = apiRateLimit(createRequest(), { prefix });
      expect(blocked).not.toBeNull();
      expect(blocked!.status).toBe(429);
    });
  });

  describe('write endpoints (30 req/min)', () => {
    const configs = [
      { prefix: 'user:timezone', limit: 30, windowMs: 60_000 },
      { prefix: 'user:preferences', limit: 30, windowMs: 60_000 },
      { prefix: 'user:profile', limit: 30, windowMs: 60_000 },
      { prefix: 'user:weekly-report', limit: 30, windowMs: 60_000 },
      { prefix: 'keystroke-log', limit: 30, windowMs: 60_000 },
      { prefix: 'community-challenges:vote', limit: 30, windowMs: 60_000 },
      { prefix: 'friend-challenges', limit: 30, windowMs: 60_000 },
      { prefix: 'friend-challenges:update', limit: 30, windowMs: 60_000 },
      { prefix: 'referrals', limit: 30, windowMs: 60_000 },
      { prefix: 'team:challenges', limit: 30, windowMs: 60_000 },
      { prefix: 'team:custom-challenges', limit: 30, windowMs: 60_000 },
      { prefix: 'team:custom-challenges:detail', limit: 30, windowMs: 60_000 },
      { prefix: 'team:custom-challenges:delete', limit: 30, windowMs: 60_000 },
      { prefix: 'team:members', limit: 30, windowMs: 60_000 },
      { prefix: 'team:members:update', limit: 30, windowMs: 60_000 },
      { prefix: 'team:members:delete', limit: 30, windowMs: 60_000 },
      { prefix: 'team:onboarding-courses', limit: 30, windowMs: 60_000 },
      { prefix: 'team:onboarding-courses:detail', limit: 30, windowMs: 60_000 },
      { prefix: 'team:onboarding-courses:delete', limit: 30, windowMs: 60_000 },
      { prefix: 'team:onboarding-courses:progress', limit: 30, windowMs: 60_000 },
      { prefix: 'team:invitations', limit: 30, windowMs: 60_000 },
      { prefix: 'team:invitations:delete', limit: 30, windowMs: 60_000 },
      { prefix: 'practice:personalized:sessions', limit: 30, windowMs: 60_000 },
      { prefix: 'practice:hints', limit: 30, windowMs: 60_000 },
      { prefix: 'practice:review', limit: 30, windowMs: 60_000 },
      { prefix: 'races', limit: 30, windowMs: 60_000 },
      { prefix: 'races:detail', limit: 30, windowMs: 60_000 },
      { prefix: 'matchmaking', limit: 30, windowMs: 60_000 },
      { prefix: 'tournaments:detail', limit: 30, windowMs: 60_000 },
      { prefix: 'push-subscription', limit: 30, windowMs: 60_000 },
    ];

    it.each(configs)(
      'prefix "$prefix" allows $limit requests then blocks',
      ({ prefix, limit, windowMs }) => {
        for (let i = 0; i < limit; i++) {
          const result = apiRateLimit(createRequest(), { prefix, limit, windowMs });
          expect(result).toBeNull();
        }

        const blocked = apiRateLimit(createRequest(), { prefix, limit, windowMs });
        expect(blocked).not.toBeNull();
        expect(blocked!.status).toBe(429);
      }
    );
  });

  describe('strict endpoints (10 req/min)', () => {
    const configs = [
      { prefix: 'user:export', limit: 10, windowMs: 60_000 },
      { prefix: 'keys', limit: 10, windowMs: 60_000 },
      { prefix: 'keys:delete', limit: 10, windowMs: 60_000 },
      { prefix: 'challenges:generate', limit: 10, windowMs: 60_000 },
      { prefix: 'sessions:export', limit: 10, windowMs: 60_000 },
      { prefix: 'referral-code', limit: 10, windowMs: 60_000 },
      { prefix: 'tournaments', limit: 10, windowMs: 60_000 },
      { prefix: 'stripe:checkout', limit: 10, windowMs: 60_000 },
      { prefix: 'practice:personalized:generate', limit: 10, windowMs: 60_000 },
      { prefix: 'cron:weekly-reports', limit: 10, windowMs: 60_000 },
      { prefix: 'cron:streak-reminders', limit: 10, windowMs: 60_000 },
    ];

    it.each(configs)(
      'prefix "$prefix" allows $limit requests then blocks',
      ({ prefix, limit, windowMs }) => {
        for (let i = 0; i < limit; i++) {
          const result = apiRateLimit(createRequest(), { prefix, limit, windowMs });
          expect(result).toBeNull();
        }

        const blocked = apiRateLimit(createRequest(), { prefix, limit, windowMs });
        expect(blocked).not.toBeNull();
        expect(blocked!.status).toBe(429);
      }
    );
  });

  describe('cross-prefix isolation', () => {
    it('rate limits are independent between different prefixes', () => {
      const config1 = { prefix: 'user', limit: 1, windowMs: 60_000 };
      const config2 = { prefix: 'team', limit: 1, windowMs: 60_000 };

      const r1 = apiRateLimit(createRequest(), config1);
      expect(r1).toBeNull();

      // Different prefix should not be affected
      const r2 = apiRateLimit(createRequest(), config2);
      expect(r2).toBeNull();

      // Same prefix should be blocked
      const r3 = apiRateLimit(createRequest(), config1);
      expect(r3).not.toBeNull();
    });
  });

  describe('IP isolation', () => {
    it('different IPs have separate rate limits', () => {
      const config = { prefix: 'test-ip', limit: 1, windowMs: 60_000 };

      const r1 = apiRateLimit(createRequest('10.0.0.1'), config);
      expect(r1).toBeNull();

      const r2 = apiRateLimit(createRequest('10.0.0.2'), config);
      expect(r2).toBeNull();

      // Same IP should be blocked
      const r3 = apiRateLimit(createRequest('10.0.0.1'), config);
      expect(r3).not.toBeNull();

      // Different IP still allowed
      const r4 = apiRateLimit(createRequest('10.0.0.3'), config);
      expect(r4).toBeNull();
    });
  });

  describe('429 response format', () => {
    it('returns correct headers and body', async () => {
      const config = { prefix: 'format-test', limit: 1, windowMs: 60_000 };

      apiRateLimit(createRequest(), config);
      const response = apiRateLimit(createRequest(), config);

      expect(response).not.toBeNull();
      expect(response!.status).toBe(429);

      // Check headers
      expect(response!.headers.get('X-RateLimit-Limit')).toBe('1');
      expect(response!.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(response!.headers.get('X-RateLimit-Reset')).toBeTruthy();
      expect(response!.headers.get('Retry-After')).toBeTruthy();

      // Check body
      const body = await response!.json();
      expect(body.error).toBe('Too many requests');
      expect(typeof body.retryAfter).toBe('number');
      expect(body.retryAfter).toBeGreaterThan(0);
    });
  });

  describe('auth rate limiting', () => {
    it('uses stricter 10 req/min default', () => {
      for (let i = 0; i < 10; i++) {
        const result = authRateLimit(createRequest());
        expect(result).toBeNull();
      }

      const blocked = authRateLimit(createRequest());
      expect(blocked).not.toBeNull();
      expect(blocked!.status).toBe(429);
    });
  });

  describe('webhook rate limiting', () => {
    it('uses higher 100 req/min default', () => {
      for (let i = 0; i < 100; i++) {
        const result = webhookRateLimit(createRequest());
        expect(result).toBeNull();
      }

      const blocked = webhookRateLimit(createRequest());
      expect(blocked).not.toBeNull();
      expect(blocked!.status).toBe(429);
    });
  });
});
