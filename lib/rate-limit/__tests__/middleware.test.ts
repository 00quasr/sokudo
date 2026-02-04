import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { apiRateLimit, authRateLimit, webhookRateLimit, withRateLimit } from '../middleware';
import { resetRateLimitState } from '../rate-limit';
import { NextResponse } from 'next/server';

function createMockRequest(
  url = 'http://localhost:3000/api/test',
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest(url, {
    headers: {
      'x-forwarded-for': '192.168.1.1',
      ...headers,
    },
  });
}

describe('apiRateLimit', () => {
  beforeEach(() => {
    resetRateLimitState();
  });

  afterEach(() => {
    resetRateLimitState();
  });

  it('returns null when under the limit', () => {
    const request = createMockRequest();
    const result = apiRateLimit(request, { limit: 5, windowMs: 60_000 });

    expect(result).toBeNull();
  });

  it('returns a 429 response when limit is exceeded', () => {
    const config = { limit: 2, windowMs: 60_000, prefix: 'test-api' };

    const req1 = createMockRequest();
    const req2 = createMockRequest();
    const req3 = createMockRequest();

    apiRateLimit(req1, config);
    apiRateLimit(req2, config);
    const result = apiRateLimit(req3, config);

    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);
  });

  it('includes rate limit headers in 429 response', async () => {
    const config = { limit: 1, windowMs: 60_000, prefix: 'header-test' };

    const req1 = createMockRequest();
    const req2 = createMockRequest();

    apiRateLimit(req1, config);
    const result = apiRateLimit(req2, config);

    expect(result).not.toBeNull();
    expect(result!.headers.get('X-RateLimit-Limit')).toBe('1');
    expect(result!.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(result!.headers.get('X-RateLimit-Reset')).toBeTruthy();
    expect(result!.headers.get('Retry-After')).toBeTruthy();
  });

  it('returns error body in 429 response', async () => {
    const config = { limit: 1, windowMs: 60_000, prefix: 'body-test' };

    const req1 = createMockRequest();
    const req2 = createMockRequest();

    apiRateLimit(req1, config);
    const result = apiRateLimit(req2, config);

    const body = await result!.json();
    expect(body.error).toBe('Too many requests');
    expect(body.retryAfter).toBeGreaterThan(0);
  });

  it('uses default limits when no config provided', () => {
    const request = createMockRequest();
    const result = apiRateLimit(request);

    expect(result).toBeNull();
  });

  it('tracks different IPs separately', () => {
    const config = { limit: 1, windowMs: 60_000, prefix: 'ip-test' };

    const req1 = createMockRequest('http://localhost:3000/api/test', { 'x-forwarded-for': '10.0.0.1' });
    const req2 = createMockRequest('http://localhost:3000/api/test', { 'x-forwarded-for': '10.0.0.2' });

    const r1 = apiRateLimit(req1, config);
    expect(r1).toBeNull();

    const r2 = apiRateLimit(req2, config);
    expect(r2).toBeNull();

    // Same IP again - should be blocked
    const req3 = createMockRequest('http://localhost:3000/api/test', { 'x-forwarded-for': '10.0.0.1' });
    const r3 = apiRateLimit(req3, config);
    expect(r3).not.toBeNull();
    expect(r3!.status).toBe(429);
  });

  it('uses x-real-ip when x-forwarded-for is absent', () => {
    const config = { limit: 1, windowMs: 60_000, prefix: 'realip-test' };

    const req1 = new NextRequest('http://localhost:3000/api/test', {
      headers: { 'x-real-ip': '10.0.0.5' },
    });
    const r1 = apiRateLimit(req1, config);
    expect(r1).toBeNull();

    const req2 = new NextRequest('http://localhost:3000/api/test', {
      headers: { 'x-real-ip': '10.0.0.5' },
    });
    const r2 = apiRateLimit(req2, config);
    expect(r2).not.toBeNull();
  });

  it('supports custom identifier function', () => {
    const config = {
      limit: 1,
      windowMs: 60_000,
      prefix: 'custom-id',
      identifier: () => 'shared-id',
    };

    // Different IPs but same custom identifier
    const req1 = createMockRequest('http://localhost:3000/api/test', { 'x-forwarded-for': '10.0.0.1' });
    const req2 = createMockRequest('http://localhost:3000/api/test', { 'x-forwarded-for': '10.0.0.2' });

    const r1 = apiRateLimit(req1, config);
    expect(r1).toBeNull();

    const r2 = apiRateLimit(req2, config);
    expect(r2).not.toBeNull();
    expect(r2!.status).toBe(429);
  });
});

describe('authRateLimit', () => {
  beforeEach(() => {
    resetRateLimitState();
  });

  afterEach(() => {
    resetRateLimitState();
  });

  it('uses stricter default limits (10 per minute)', () => {
    for (let i = 0; i < 10; i++) {
      const req = createMockRequest();
      const result = authRateLimit(req);
      expect(result).toBeNull();
    }

    const req = createMockRequest();
    const result = authRateLimit(req);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);
  });

  it('accepts custom limits', () => {
    const req1 = createMockRequest();
    const r1 = authRateLimit(req1, { limit: 1 });
    expect(r1).toBeNull();

    const req2 = createMockRequest();
    const r2 = authRateLimit(req2, { limit: 1 });
    expect(r2).not.toBeNull();
  });
});

describe('webhookRateLimit', () => {
  beforeEach(() => {
    resetRateLimitState();
  });

  afterEach(() => {
    resetRateLimitState();
  });

  it('uses higher default limits (100 per minute)', () => {
    for (let i = 0; i < 100; i++) {
      const req = createMockRequest();
      const result = webhookRateLimit(req);
      expect(result).toBeNull();
    }

    const req = createMockRequest();
    const result = webhookRateLimit(req);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);
  });
});

describe('withRateLimit', () => {
  beforeEach(() => {
    resetRateLimitState();
  });

  afterEach(() => {
    resetRateLimitState();
  });

  it('calls the handler when under the limit', async () => {
    const handler = async () => NextResponse.json({ ok: true });
    const wrapped = withRateLimit(handler, { limit: 5, windowMs: 60_000, prefix: 'wrap-test' });

    const request = createMockRequest();
    const response = await wrapped(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
  });

  it('attaches rate limit headers to successful responses', async () => {
    const handler = async () => NextResponse.json({ ok: true });
    const wrapped = withRateLimit(handler, { limit: 5, windowMs: 60_000, prefix: 'header-wrap' });

    const request = createMockRequest();
    const response = await wrapped(request);

    expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('4');
    expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
  });

  it('returns 429 without calling handler when limit exceeded', async () => {
    let handlerCalled = 0;
    const handler = async () => {
      handlerCalled++;
      return NextResponse.json({ ok: true });
    };
    const wrapped = withRateLimit(handler, { limit: 1, windowMs: 60_000, prefix: 'block-wrap' });

    const req1 = createMockRequest();
    await wrapped(req1);
    expect(handlerCalled).toBe(1);

    const req2 = createMockRequest();
    const response = await wrapped(req2);
    expect(response.status).toBe(429);
    expect(handlerCalled).toBe(1); // Handler not called again
  });
});
