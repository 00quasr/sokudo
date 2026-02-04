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

describe('GET /api/v1/leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return 401 if API key is invalid', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createRequest('http://localhost:3000/api/v1/leaderboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid or missing API key');
    });
  });

  describe('validation', () => {
    it('should return 400 for limit exceeding maximum', async () => {
      mockAuth.mockResolvedValue(mockUser);

      const request = createRequest('http://localhost:3000/api/v1/leaderboard?limit=101');
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid timeframe', async () => {
      mockAuth.mockResolvedValue(mockUser);

      const request = createRequest('http://localhost:3000/api/v1/leaderboard?timeframe=year');
      const response = await GET(request);

      expect(response.status).toBe(400);
    });
  });

  describe('successful retrieval', () => {
    const mockLeaderboard = [
      {
        userId: 1,
        username: 'speedster',
        name: 'Speed User',
        bestWpm: 120,
        avgWpm: 100,
        avgAccuracy: 97,
        totalSessions: 50,
      },
      {
        userId: 2,
        username: 'typist',
        name: 'Typist User',
        bestWpm: 95,
        avgWpm: 80,
        avgAccuracy: 94,
        totalSessions: 30,
      },
    ];

    it('should return ranked leaderboard with default parameters', async () => {
      mockAuth.mockResolvedValue(mockUser);

      const mockLimitFn = vi.fn().mockResolvedValue(mockLeaderboard);
      const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockGroupByFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
      const mockWhereFn = vi.fn().mockReturnValue({ groupBy: mockGroupByFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      const request = createRequest('http://localhost:3000/api/v1/leaderboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leaderboard).toHaveLength(2);
      expect(data.leaderboard[0].rank).toBe(1);
      expect(data.leaderboard[0].bestWpm).toBe(120);
      expect(data.leaderboard[1].rank).toBe(2);
      expect(data.timeframe).toBe('all');
      expect(data.categorySlug).toBeNull();
    });

    it('should return leaderboard with category filter', async () => {
      mockAuth.mockResolvedValue(mockUser);

      const mockLimitFn = vi.fn().mockResolvedValue([mockLeaderboard[0]]);
      const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockGroupByFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
      const mockWhereFn = vi.fn().mockReturnValue({ groupBy: mockGroupByFn });
      const mockInnerJoinFn3 = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockInnerJoinFn2 = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn3 });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn2 });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      const request = createRequest('http://localhost:3000/api/v1/leaderboard?categorySlug=git-basics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leaderboard).toHaveLength(1);
      expect(data.categorySlug).toBe('git-basics');
    });

    it('should return empty leaderboard', async () => {
      mockAuth.mockResolvedValue(mockUser);

      const mockLimitFn = vi.fn().mockResolvedValue([]);
      const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockGroupByFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
      const mockWhereFn = vi.fn().mockReturnValue({ groupBy: mockGroupByFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      const request = createRequest('http://localhost:3000/api/v1/leaderboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leaderboard).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should return 500 on database error', async () => {
      mockAuth.mockResolvedValue(mockUser);

      const mockFromFn = vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockRejectedValue(new Error('Database error')),
              }),
            }),
          }),
        }),
      });
      mockDb.select.mockReturnValue({ from: mockFromFn });

      const request = createRequest('http://localhost:3000/api/v1/leaderboard');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });
});
