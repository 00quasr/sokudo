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
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
  },
}));

// Mock the auth module
vi.mock('@/lib/auth/api-key', () => ({
  authenticateApiKey: vi.fn(),
  hasScope: vi.fn(),
}));

import { authenticateApiKey } from '@/lib/auth/api-key';
import { db } from '@/lib/db/drizzle';

const mockAuth = authenticateApiKey as ReturnType<typeof vi.fn>;
const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  innerJoin: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  offset: ReturnType<typeof vi.fn>;
};

const mockUser = { id: 1, email: 'test@test.com', name: 'Test', apiKeyId: 1, scopes: ['read'] };

function createRequest(url: string): NextRequest {
  return new NextRequest(new Request(url, {
    headers: { authorization: 'Bearer sk_testkey' },
  }));
}

describe('GET /api/v1/challenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return 401 if API key is invalid', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createRequest('http://localhost:3000/api/v1/challenges');
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

    it('should return 400 for invalid page parameter', async () => {
      const request = createRequest('http://localhost:3000/api/v1/challenges?page=0');
      const response = await GET(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 for limit exceeding maximum', async () => {
      const request = createRequest('http://localhost:3000/api/v1/challenges?limit=101');
      const response = await GET(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid difficulty', async () => {
      const request = createRequest('http://localhost:3000/api/v1/challenges?difficulty=invalid');
      const response = await GET(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid sortBy', async () => {
      const request = createRequest('http://localhost:3000/api/v1/challenges?sortBy=invalid');
      const response = await GET(request);
      expect(response.status).toBe(400);
    });
  });

  describe('successful retrieval', () => {
    const mockChallenges = [
      {
        id: 1,
        content: 'git commit -m "test"',
        difficulty: 'beginner',
        syntaxType: 'bash',
        hint: 'Use the commit command',
        avgWpm: 45,
        timesCompleted: 100,
        createdAt: new Date('2025-01-20T10:00:00Z'),
        category: { id: 1, name: 'Git Basics', slug: 'git-basics', icon: 'git' },
      },
    ];

    beforeEach(() => {
      mockAuth.mockResolvedValue(mockUser);
    });

    it('should return paginated challenges with default parameters', async () => {
      const mockOffsetFn = vi.fn().mockResolvedValue(mockChallenges);
      const mockLimitFn = vi.fn().mockReturnValue({ offset: mockOffsetFn });
      const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockWhereFn = vi
        .fn()
        .mockResolvedValueOnce([{ count: 1 }])
        .mockReturnValueOnce({ orderBy: mockOrderByFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      const request = createRequest('http://localhost:3000/api/v1/challenges');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.challenges).toBeDefined();
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(20);
    });

    it('should return correct pagination metadata', async () => {
      const mockOffsetFn = vi.fn().mockResolvedValue(mockChallenges);
      const mockLimitFn = vi.fn().mockReturnValue({ offset: mockOffsetFn });
      const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockWhereFn = vi
        .fn()
        .mockResolvedValueOnce([{ count: 25 }])
        .mockReturnValueOnce({ orderBy: mockOrderByFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      const request = createRequest('http://localhost:3000/api/v1/challenges?page=2&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.total).toBe(25);
      expect(data.pagination.totalPages).toBe(3);
      expect(data.pagination.hasNextPage).toBe(true);
      expect(data.pagination.hasPrevPage).toBe(true);
    });

    it('should return empty array when no challenges exist', async () => {
      const mockOffsetFn = vi.fn().mockResolvedValue([]);
      const mockLimitFn = vi.fn().mockReturnValue({ offset: mockOffsetFn });
      const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockWhereFn = vi
        .fn()
        .mockResolvedValueOnce([{ count: 0 }])
        .mockReturnValueOnce({ orderBy: mockOrderByFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      const request = createRequest('http://localhost:3000/api/v1/challenges');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.challenges).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should return 500 on database error', async () => {
      mockAuth.mockResolvedValue(mockUser);

      const mockFromFn = vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error('Database error')),
        }),
      });
      mockDb.select.mockReturnValue({ from: mockFromFn });

      const request = createRequest('http://localhost:3000/api/v1/challenges');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
