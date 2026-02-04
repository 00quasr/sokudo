import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

// Mock the rate limiter
vi.mock('@/lib/rate-limit', () => ({
  apiRateLimit: vi.fn(() => null),
}));

// Mock the queries
vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  getCategoryAggregateStats: vi.fn(),
}));

import { getUser, getCategoryAggregateStats } from '@/lib/db/queries';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockGetCategoryAggregateStats = getCategoryAggregateStats as ReturnType<typeof vi.fn>;

function createMockGetRequest(url: string): Request {
  return {
    url,
    headers: new Map(),
  } as unknown as Request;
}

describe('GET /api/category-stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetUser.mockResolvedValue(null);

      const request = createMockGetRequest('http://localhost:3000/api/category-stats?categoryId=1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    });

    it('should return 400 if categoryId is missing', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/category-stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });

    it('should return 400 if categoryId is not a positive integer', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/category-stats?categoryId=-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });

    it('should return 400 if categoryId is not a number', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/category-stats?categoryId=abc');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });
  });

  describe('successful responses', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    });

    it('should return 404 if no sessions found for category', async () => {
      mockGetCategoryAggregateStats.mockResolvedValue(null);

      const request = createMockGetRequest('http://localhost:3000/api/category-stats?categoryId=1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('No sessions found for this category');
    });

    it('should return category aggregate stats', async () => {
      const mockStats = {
        totalSessions: 10,
        uniqueChallenges: 5,
        avgWpm: 45,
        avgAccuracy: 95,
        totalTimeMs: 300000,
        totalErrors: 25,
        bestWpm: 60,
      };

      mockGetCategoryAggregateStats.mockResolvedValue(mockStats);

      const request = createMockGetRequest('http://localhost:3000/api/category-stats?categoryId=1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockStats);
      expect(mockGetCategoryAggregateStats).toHaveBeenCalledWith(1);
    });

    it('should handle multiple categoryIds correctly', async () => {
      const mockStats1 = {
        totalSessions: 10,
        uniqueChallenges: 5,
        avgWpm: 45,
        avgAccuracy: 95,
        totalTimeMs: 300000,
        totalErrors: 25,
        bestWpm: 60,
      };

      const mockStats2 = {
        totalSessions: 20,
        uniqueChallenges: 10,
        avgWpm: 50,
        avgAccuracy: 98,
        totalTimeMs: 600000,
        totalErrors: 15,
        bestWpm: 70,
      };

      mockGetCategoryAggregateStats.mockResolvedValueOnce(mockStats1);
      const request1 = createMockGetRequest('http://localhost:3000/api/category-stats?categoryId=1');
      const response1 = await GET(request1);
      const data1 = await response1.json();

      expect(response1.status).toBe(200);
      expect(data1).toEqual(mockStats1);

      mockGetCategoryAggregateStats.mockResolvedValueOnce(mockStats2);
      const request2 = createMockGetRequest('http://localhost:3000/api/category-stats?categoryId=2');
      const response2 = await GET(request2);
      const data2 = await response2.json();

      expect(response2.status).toBe(200);
      expect(data2).toEqual(mockStats2);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    });

    it('should return 500 if database query fails', async () => {
      mockGetCategoryAggregateStats.mockRejectedValue(new Error('Database error'));

      const request = createMockGetRequest('http://localhost:3000/api/category-stats?categoryId=1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
