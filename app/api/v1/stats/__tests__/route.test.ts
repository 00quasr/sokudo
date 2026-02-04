import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock the database
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  },
}));

// Mock the auth module
vi.mock('@/lib/auth/api-key', () => ({
  authenticateApiKey: vi.fn(),
}));

import { authenticateApiKey } from '@/lib/auth/api-key';
import { db } from '@/lib/db/drizzle';

const mockAuth = authenticateApiKey as ReturnType<typeof vi.fn>;
const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  innerJoin: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  groupBy: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
};

const mockUser = { id: 1, email: 'test@test.com', name: 'Test', apiKeyId: 1, scopes: ['read'] };

function createRequest(url: string): NextRequest {
  return new NextRequest(new Request(url, {
    headers: { authorization: 'Bearer sk_testkey' },
  }));
}

describe('GET /api/v1/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return 401 if API key is invalid', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createRequest('http://localhost:3000/api/v1/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid or missing API key');
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockUser);
    });

    it('should return 400 for invalid trendDays (zero)', async () => {
      const request = createRequest('http://localhost:3000/api/v1/stats?trendDays=0');
      const response = await GET(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 for trendDays exceeding max', async () => {
      const request = createRequest('http://localhost:3000/api/v1/stats?trendDays=366');
      const response = await GET(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 for non-numeric trendDays', async () => {
      const request = createRequest('http://localhost:3000/api/v1/stats?trendDays=abc');
      const response = await GET(request);
      expect(response.status).toBe(400);
    });
  });

  describe('successful retrieval', () => {
    const mockOverview = {
      totalSessions: 50,
      avgWpm: 65,
      avgAccuracy: 94,
      totalKeystrokes: 10000,
      totalErrors: 600,
      bestWpm: 95,
      bestAccuracy: 100,
      totalPracticeTimeMs: 3600000,
    };

    const mockProfile = {
      currentStreak: 5,
      longestStreak: 10,
    };

    const mockCategoryPerf = [
      {
        categoryId: 1,
        categoryName: 'Git Basics',
        categorySlug: 'git-basics',
        sessions: 30,
        avgWpm: 70,
        avgAccuracy: 95,
      },
    ];

    const mockWpmTrend = [
      { date: '2025-01-20', avgWpm: 70, sessions: 6 },
    ];

    it('should return stats with default trendDays', async () => {
      mockAuth.mockResolvedValue(mockUser);

      // Mock overview query (first select)
      // Mock profile query (second select)
      // Mock category perf query (third select)
      // Mock wpm trend query (fourth select)
      let callCount = 0;
      mockDb.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Overview query
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([mockOverview]),
            }),
          };
        } else if (callCount === 2) {
          // Profile query
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockProfile]),
              }),
            }),
          };
        } else if (callCount === 3) {
          // Category performance query
          return {
            from: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                innerJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    groupBy: vi.fn().mockReturnValue({
                      orderBy: vi.fn().mockResolvedValue(mockCategoryPerf),
                    }),
                  }),
                }),
              }),
            }),
          };
        } else {
          // WPM trend query
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                groupBy: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue(mockWpmTrend),
                }),
              }),
            }),
          };
        }
      });

      const request = createRequest('http://localhost:3000/api/v1/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.overview).toBeDefined();
      expect(data.overview.totalSessions).toBe(50);
      expect(data.overview.currentStreak).toBe(5);
      expect(data.categoryPerformance).toBeDefined();
      expect(data.wpmTrend).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should return 500 on database error', async () => {
      mockAuth.mockResolvedValue(mockUser);

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      const request = createRequest('http://localhost:3000/api/v1/stats');
      const response = await GET(request);
      expect(response.status).toBe(500);
    });
  });
});
