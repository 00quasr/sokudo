import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/auth/session', () => ({
  setSession: vi.fn(),
}));

vi.mock('@/lib/payments/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        retrieve: vi.fn(),
      },
    },
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  apiRateLimit: vi.fn(() => null),
}));

import { db } from '@/lib/db/drizzle';
import { setSession } from '@/lib/auth/session';
import { stripe } from '@/lib/payments/stripe';

const mockDb = db as any;
const mockSetSession = setSession as ReturnType<typeof vi.fn>;
const mockStripe = stripe as any;

function createMockRequest(url: string): NextRequest {
  const parsedUrl = new URL(url);
  return {
    nextUrl: parsedUrl,
    url: parsedUrl.href,
  } as NextRequest;
}

describe('GET /api/stripe/checkout', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('missing session_id', () => {
    it('should redirect to /pricing when session_id is missing', async () => {
      const request = createMockRequest('http://localhost:3000/api/stripe/checkout');
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/pricing');
    });
  });

  describe('successful checkout', () => {
    const mockUser = { id: 1, email: 'test@test.com' };
    const mockCustomer = { id: 'cus_123' };
    const mockSubscription = {
      id: 'sub_123',
      status: 'active',
      items: {
        data: [
          {
            price: {
              product: {
                id: 'prod_123',
                name: 'Pro Plan',
              },
            },
          },
        ],
      },
    };
    const mockSession = {
      customer: mockCustomer,
      subscription: 'sub_123',
      client_reference_id: '1',
    };

    beforeEach(() => {
      mockStripe.checkout.sessions.retrieve.mockResolvedValue(mockSession);
      mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription);

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });
    });

    it('should redirect to /dashboard using BASE_URL when set', async () => {
      process.env.BASE_URL = 'https://sokudo.dev';

      const request = createMockRequest('http://localhost:3000/api/stripe/checkout?session_id=cs_test_123');
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('https://sokudo.dev/dashboard');
      expect(mockSetSession).toHaveBeenCalledWith(mockUser);
    });

    it('should redirect to /dashboard using request URL when BASE_URL not set', async () => {
      delete process.env.BASE_URL;

      const request = createMockRequest('http://localhost:3000/api/stripe/checkout?session_id=cs_test_123');
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard');
      expect(mockSetSession).toHaveBeenCalledWith(mockUser);
    });

    it('should not use hardcoded IP addresses', async () => {
      process.env.BASE_URL = 'https://sokudo.dev';

      const request = createMockRequest('http://localhost:3000/api/stripe/checkout?session_id=cs_test_123');
      const response = await GET(request);

      const location = response.headers.get('location');
      expect(location).not.toMatch(/\d+\.\d+\.\d+\.\d+/);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockStripe.checkout.sessions.retrieve.mockRejectedValue(new Error('Stripe error'));
    });

    it('should redirect to /error using BASE_URL when set', async () => {
      process.env.BASE_URL = 'https://sokudo.dev';

      const request = createMockRequest('http://localhost:3000/api/stripe/checkout?session_id=cs_test_123');
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('https://sokudo.dev/error');
    });

    it('should redirect to /error using request URL when BASE_URL not set', async () => {
      delete process.env.BASE_URL;

      const request = createMockRequest('http://localhost:3000/api/stripe/checkout?session_id=cs_test_123');
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/error');
    });

    it('should not use hardcoded IP addresses in error redirects', async () => {
      process.env.BASE_URL = 'https://sokudo.dev';

      const request = createMockRequest('http://localhost:3000/api/stripe/checkout?session_id=cs_test_123');
      const response = await GET(request);

      const location = response.headers.get('location');
      expect(location).not.toMatch(/\d+\.\d+\.\d+\.\d+/);
    });
  });

  describe('various BASE_URL formats', () => {
    const mockUser = { id: 1, email: 'test@test.com' };
    const mockCustomer = { id: 'cus_123' };
    const mockSubscription = {
      id: 'sub_123',
      status: 'active',
      items: {
        data: [
          {
            price: {
              product: {
                id: 'prod_123',
                name: 'Pro Plan',
              },
            },
          },
        ],
      },
    };
    const mockSession = {
      customer: mockCustomer,
      subscription: 'sub_123',
      client_reference_id: '1',
    };

    beforeEach(() => {
      mockStripe.checkout.sessions.retrieve.mockResolvedValue(mockSession);
      mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription);

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });
    });

    it('should work with production HTTPS URL', async () => {
      process.env.BASE_URL = 'https://sokudo.dev';

      const request = createMockRequest('http://localhost:3000/api/stripe/checkout?session_id=cs_test_123');
      const response = await GET(request);

      expect(response.headers.get('location')).toBe('https://sokudo.dev/dashboard');
    });

    it('should work with remote IP access URL', async () => {
      process.env.BASE_URL = 'http://49.13.168.33:3000';

      const request = createMockRequest('http://localhost:3000/api/stripe/checkout?session_id=cs_test_123');
      const response = await GET(request);

      expect(response.headers.get('location')).toBe('http://49.13.168.33:3000/dashboard');
    });

    it('should work with custom port', async () => {
      process.env.BASE_URL = 'http://localhost:4000';

      const request = createMockRequest('http://localhost:3000/api/stripe/checkout?session_id=cs_test_123');
      const response = await GET(request);

      expect(response.headers.get('location')).toBe('http://localhost:4000/dashboard');
    });
  });
});
