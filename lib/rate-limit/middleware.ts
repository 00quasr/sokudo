import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, type RateLimitConfig, type RateLimitResult } from './rate-limit';

type IdentifierFn = (request: NextRequest) => string;

function defaultIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? '127.0.0.1';
  return ip;
}

function rateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfterSeconds = Math.ceil((result.resetAt - Date.now()) / 1000);
  return NextResponse.json(
    {
      error: 'Too many requests',
      retryAfter: retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(result.resetAt),
        'Retry-After': String(retryAfterSeconds),
      },
    }
  );
}

function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(result.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set('X-RateLimit-Reset', String(result.resetAt));
  return response;
}

/**
 * Wraps a Next.js route handler with rate limiting.
 * Returns 429 if the limit is exceeded, otherwise calls the handler and attaches rate limit headers.
 */
export function withRateLimit(
  handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>,
  config: RateLimitConfig & { prefix?: string; identifier?: IdentifierFn }
) {
  const { prefix = 'api', identifier = defaultIdentifier, ...rateLimitConfig } = config;

  return async (request: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
    const id = identifier(request);
    const key = `${prefix}:${id}`;
    const result = rateLimit(key, rateLimitConfig);

    if (!result.success) {
      return rateLimitResponse(result);
    }

    const response = await handler(request, ...args);
    return addRateLimitHeaders(response, result);
  };
}

/**
 * Check rate limit and return the result. Returns a 429 response if exceeded, or null if allowed.
 * Use this for inline rate limiting in route handlers.
 */
export function apiRateLimit(
  request: NextRequest,
  config?: Partial<RateLimitConfig> & { prefix?: string; identifier?: IdentifierFn }
): NextResponse | null {
  const {
    limit = 60,
    windowMs = 60_000,
    prefix = 'api',
    identifier = defaultIdentifier,
  } = config ?? {};

  const id = identifier(request);
  const key = `${prefix}:${id}`;
  const result = rateLimit(key, { limit, windowMs });

  if (!result.success) {
    return rateLimitResponse(result);
  }

  return null;
}

/**
 * Stricter rate limit for auth endpoints (sign-in, sign-up).
 * Default: 10 requests per minute.
 */
export function authRateLimit(
  request: NextRequest,
  config?: Partial<RateLimitConfig>
): NextResponse | null {
  return apiRateLimit(request, {
    limit: config?.limit ?? 10,
    windowMs: config?.windowMs ?? 60_000,
    prefix: 'auth',
  });
}

/**
 * Rate limit for webhook endpoints.
 * Default: 100 requests per minute.
 */
export function webhookRateLimit(
  request: NextRequest,
  config?: Partial<RateLimitConfig>
): NextResponse | null {
  return apiRateLimit(request, {
    limit: config?.limit ?? 100,
    windowMs: config?.windowMs ?? 60_000,
    prefix: 'webhook',
  });
}
