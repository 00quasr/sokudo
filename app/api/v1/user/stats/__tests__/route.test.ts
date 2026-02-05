import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/auth/api-key', () => ({
  getApiKeyUser: vi.fn(),
  hasScope: vi.fn(),
}));

vi.mock('@/lib/db/queries', () => ({
  getUserStatsOverview: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  apiRateLimit: vi.fn(() => null),
}));

import { getApiKeyUser, hasScope } from '@/lib/auth/api-key';
import { getUserStatsOverview } from '@/lib/db/queries';

const mockGetApiKeyUser = getApiKeyUser as ReturnType<typeof vi.fn>;
const mockHasScope = hasScope as ReturnType<typeof vi.fn>;
const mockGetUserStatsOverview = getUserStatsOverview as ReturnType<typeof vi.fn>;

function createMockGetRequest(apiKey: string | null): NextRequest {
  const headers = new Headers();
  if (apiKey) {
    headers.set('X-API-Key', apiKey);
  }

  return {
    headers,
  } as unknown as NextRequest;
}

describe('GET /api/v1/user/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return 401 if API key is missing', async () => {
      const request = createMockGetRequest(null);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('API key required');
    });

    it('should return 401 if API key is invalid', async () => {
      mockGetApiKeyUser.mockResolvedValue(null);

      const request = createMockGetRequest('invalid_key');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid API key');
    });
  });

  describe('authorization', () => {
    it('should return 403 if user lacks read scope', async () => {
      mockGetApiKeyUser.mockResolvedValue({ id: 1, email: 'test@test.com', scopes: ['write'] });
      mockHasScope.mockReturnValue(false);

      const request = createMockGetRequest('valid_key');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Insufficient permissions');
    });
  });

  describe('successful stats retrieval', () => {
    const mockUser = { id: 1, email: 'test@test.com', name: 'Test User', scopes: ['read'] };
    const mockStats = {
      avgWpm: 85,
      maxWpm: 105,
      totalSessions: 150,
      totalPracticeTimeMs: 450000,
      currentStreak: 7,
      longestStreak: 21,
      accuracy: 94.5,
    };

    beforeEach(() => {
      mockGetApiKeyUser.mockResolvedValue(mockUser);
      mockHasScope.mockReturnValue(true);
      mockGetUserStatsOverview.mockResolvedValue(mockStats);
    });

    it('should return user and stats with valid API key', async () => {
      const request = createMockGetRequest('valid_key');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      });
      expect(data.stats).toEqual(mockStats);
    });

    it('should work with wildcard scope', async () => {
      mockGetApiKeyUser.mockResolvedValue({ ...mockUser, scopes: ['*'] });

      const request = createMockGetRequest('valid_key');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stats).toEqual(mockStats);
    });
  });

  describe('error handling', () => {
    it('should return 500 on getUserStatsOverview error', async () => {
      mockGetApiKeyUser.mockResolvedValue({ id: 1, email: 'test@test.com', scopes: ['read'] });
      mockHasScope.mockReturnValue(true);
      mockGetUserStatsOverview.mockRejectedValue(new Error('Database error'));

      const request = createMockGetRequest('valid_key');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
