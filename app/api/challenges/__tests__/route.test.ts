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

// Mock getUser
vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
}));

// Import mocked modules
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  innerJoin: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  offset: ReturnType<typeof vi.fn>;
};

function createMockGetRequest(url: string): NextRequest {
  return {
    url,
  } as unknown as NextRequest;
}

describe('GET /api/challenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validation', () => {
    it('should return 400 for invalid page parameter', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/challenges?page=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });

    it('should return 400 for negative page parameter', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/challenges?page=-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });

    it('should return 400 for invalid limit parameter', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/challenges?limit=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });

    it('should return 400 for limit exceeding maximum', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/challenges?limit=101');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });

    it('should return 400 for invalid categoryId parameter', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/challenges?categoryId=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });

    it('should return 400 for invalid difficulty parameter', async () => {
      const request = createMockGetRequest(
        'http://localhost:3000/api/challenges?difficulty=invalid'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });

    it('should return 400 for invalid sortBy parameter', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/challenges?sortBy=invalid');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });

    it('should return 400 for invalid sortOrder parameter', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/challenges?sortOrder=invalid');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });
  });

  describe('successful challenge retrieval', () => {
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
        category: {
          id: 1,
          name: 'Git Basics',
          slug: 'git-basics',
          icon: 'git',
        },
      },
      {
        id: 2,
        content: 'git push origin main',
        difficulty: 'beginner',
        syntaxType: 'bash',
        hint: 'Push to remote',
        avgWpm: 50,
        timesCompleted: 80,
        createdAt: new Date('2025-01-19T10:00:00Z'),
        category: {
          id: 1,
          name: 'Git Basics',
          slug: 'git-basics',
          icon: 'git',
        },
      },
    ];

    it('should return paginated challenges with default parameters', async () => {
      const mockOffsetFn = vi.fn().mockResolvedValue(mockChallenges);
      const mockLimitFn = vi.fn().mockReturnValue({ offset: mockOffsetFn });
      const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockWhereFn = vi
        .fn()
        .mockResolvedValueOnce([{ count: 2 }])
        .mockReturnValueOnce({ orderBy: mockOrderByFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

      mockDb.select.mockImplementation(mockSelectFn);

      const request = createMockGetRequest('http://localhost:3000/api/challenges');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.challenges).toBeDefined();
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(20);
    });

    it('should return paginated challenges with custom page and limit', async () => {
      const mockOffsetFn = vi.fn().mockResolvedValue([mockChallenges[1]]);
      const mockLimitFn = vi.fn().mockReturnValue({ offset: mockOffsetFn });
      const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockWhereFn = vi
        .fn()
        .mockResolvedValueOnce([{ count: 2 }])
        .mockReturnValueOnce({ orderBy: mockOrderByFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

      mockDb.select.mockImplementation(mockSelectFn);

      const request = createMockGetRequest('http://localhost:3000/api/challenges?page=2&limit=1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(1);
    });

    it('should filter challenges by categoryId', async () => {
      const mockOffsetFn = vi.fn().mockResolvedValue(mockChallenges);
      const mockLimitFn = vi.fn().mockReturnValue({ offset: mockOffsetFn });
      const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockWhereFn = vi
        .fn()
        .mockResolvedValueOnce([{ count: 2 }])
        .mockReturnValueOnce({ orderBy: mockOrderByFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

      mockDb.select.mockImplementation(mockSelectFn);

      const request = createMockGetRequest('http://localhost:3000/api/challenges?categoryId=1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.challenges).toBeDefined();
    });

    it('should filter challenges by categorySlug', async () => {
      const mockOffsetFn = vi.fn().mockResolvedValue(mockChallenges);
      const mockLimitFn = vi.fn().mockReturnValue({ offset: mockOffsetFn });
      const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockWhereFn = vi
        .fn()
        .mockResolvedValueOnce([{ count: 2 }])
        .mockReturnValueOnce({ orderBy: mockOrderByFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

      mockDb.select.mockImplementation(mockSelectFn);

      const request = createMockGetRequest(
        'http://localhost:3000/api/challenges?categorySlug=git-basics'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.challenges).toBeDefined();
    });

    it('should filter challenges by difficulty', async () => {
      const mockOffsetFn = vi.fn().mockResolvedValue(mockChallenges);
      const mockLimitFn = vi.fn().mockReturnValue({ offset: mockOffsetFn });
      const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockWhereFn = vi
        .fn()
        .mockResolvedValueOnce([{ count: 2 }])
        .mockReturnValueOnce({ orderBy: mockOrderByFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

      mockDb.select.mockImplementation(mockSelectFn);

      const request = createMockGetRequest(
        'http://localhost:3000/api/challenges?difficulty=beginner'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.challenges).toBeDefined();
    });

    it('should filter challenges by syntaxType', async () => {
      const mockOffsetFn = vi.fn().mockResolvedValue(mockChallenges);
      const mockLimitFn = vi.fn().mockReturnValue({ offset: mockOffsetFn });
      const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockWhereFn = vi
        .fn()
        .mockResolvedValueOnce([{ count: 2 }])
        .mockReturnValueOnce({ orderBy: mockOrderByFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

      mockDb.select.mockImplementation(mockSelectFn);

      const request = createMockGetRequest('http://localhost:3000/api/challenges?syntaxType=bash');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.challenges).toBeDefined();
    });

    it('should sort challenges by avgWpm in descending order', async () => {
      const mockOffsetFn = vi.fn().mockResolvedValue(mockChallenges);
      const mockLimitFn = vi.fn().mockReturnValue({ offset: mockOffsetFn });
      const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockWhereFn = vi
        .fn()
        .mockResolvedValueOnce([{ count: 2 }])
        .mockReturnValueOnce({ orderBy: mockOrderByFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

      mockDb.select.mockImplementation(mockSelectFn);

      const request = createMockGetRequest(
        'http://localhost:3000/api/challenges?sortBy=avgWpm&sortOrder=desc'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.challenges).toBeDefined();
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

      const request = createMockGetRequest(
        'http://localhost:3000/api/challenges?page=2&limit=10'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.total).toBe(25);
      expect(data.pagination.totalPages).toBe(3);
      expect(data.pagination.hasNextPage).toBe(true);
      expect(data.pagination.hasPrevPage).toBe(true);
    });

    it('should return empty challenges array when no challenges exist', async () => {
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

      const request = createMockGetRequest('http://localhost:3000/api/challenges');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.challenges).toEqual([]);
      expect(data.pagination.total).toBe(0);
      expect(data.pagination.totalPages).toBe(0);
      expect(data.pagination.hasNextPage).toBe(false);
      expect(data.pagination.hasPrevPage).toBe(false);
    });

    it('should accept valid difficulty values', async () => {
      const difficulties = ['beginner', 'intermediate', 'advanced'];
      for (const difficulty of difficulties) {
        const mockOffsetFn = vi.fn().mockResolvedValue(mockChallenges);
        const mockLimitFn = vi.fn().mockReturnValue({ offset: mockOffsetFn });
        const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
        const mockWhereFn = vi
          .fn()
          .mockResolvedValueOnce([{ count: 2 }])
          .mockReturnValueOnce({ orderBy: mockOrderByFn });
        const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
        const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
        const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

        mockDb.select.mockImplementation(mockSelectFn);

        const request = createMockGetRequest(
          `http://localhost:3000/api/challenges?difficulty=${difficulty}`
        );
        const response = await GET(request);

        expect(response.status).toBe(200);
      }
    });

    it('should accept valid sortBy values', async () => {
      const sortByOptions = ['id', 'difficulty', 'avgWpm', 'timesCompleted', 'createdAt'];
      for (const sortBy of sortByOptions) {
        const mockOffsetFn = vi.fn().mockResolvedValue(mockChallenges);
        const mockLimitFn = vi.fn().mockReturnValue({ offset: mockOffsetFn });
        const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
        const mockWhereFn = vi
          .fn()
          .mockResolvedValueOnce([{ count: 2 }])
          .mockReturnValueOnce({ orderBy: mockOrderByFn });
        const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
        const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
        const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

        mockDb.select.mockImplementation(mockSelectFn);

        const request = createMockGetRequest(
          `http://localhost:3000/api/challenges?sortBy=${sortBy}`
        );
        const response = await GET(request);

        expect(response.status).toBe(200);
      }
    });

    it('should combine multiple filters', async () => {
      const mockOffsetFn = vi.fn().mockResolvedValue(mockChallenges);
      const mockLimitFn = vi.fn().mockReturnValue({ offset: mockOffsetFn });
      const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockWhereFn = vi
        .fn()
        .mockResolvedValueOnce([{ count: 2 }])
        .mockReturnValueOnce({ orderBy: mockOrderByFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

      mockDb.select.mockImplementation(mockSelectFn);

      const request = createMockGetRequest(
        'http://localhost:3000/api/challenges?categoryId=1&difficulty=beginner&syntaxType=bash&sortBy=avgWpm&sortOrder=desc'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.challenges).toBeDefined();
    });
  });

  describe('premium access control', () => {
    const testMockChallenges = [
      {
        id: 1,
        content: 'git init',
        difficulty: 'beginner',
        syntaxType: 'bash',
        hint: 'Initialize a repository',
        avgWpm: 45,
        timesCompleted: 100,
        createdAt: new Date('2025-01-20T10:00:00Z'),
        category: {
          id: 1,
          name: 'Git Basics',
          slug: 'git-basics',
          icon: 'git',
        },
      },
      {
        id: 2,
        content: 'docker run',
        difficulty: 'intermediate',
        syntaxType: 'bash',
        hint: 'Run a container',
        avgWpm: 40,
        timesCompleted: 50,
        createdAt: new Date('2025-01-21T10:00:00Z'),
        category: {
          id: 2,
          name: 'Docker Commands',
          slug: 'docker-commands',
          icon: 'docker',
        },
      },
    ];

    it('should filter out challenges from premium categories for free users', async () => {
      // Mock getUser
      vi.mocked(getUser).mockResolvedValue({ id: 1, email: 'test@test.com' } as any);

      // Mock user profile query
      const mockProfileQuery = vi.fn().mockResolvedValue([{ subscriptionTier: 'free' }]);
      const mockProfileWhere = vi.fn().mockReturnValue({ limit: mockProfileQuery });
      const mockProfileFrom = vi.fn().mockReturnValue({ where: mockProfileWhere });

      // Mock challenges query
      const freeChallenges = [testMockChallenges[0]]; // Only free category challenges
      const mockOffsetFn = vi.fn().mockResolvedValue(freeChallenges);
      const mockLimitFn = vi.fn().mockReturnValue({ offset: mockOffsetFn });
      const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockWhereFn = vi
        .fn()
        .mockResolvedValueOnce([{ count: 1 }])
        .mockReturnValueOnce({ orderBy: mockOrderByFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });

      mockDb.select
        .mockReturnValueOnce({ from: mockProfileFrom })
        .mockReturnValueOnce({ from: mockFromFn })
        .mockReturnValueOnce({ from: mockFromFn });

      const request = createMockGetRequest('http://localhost:3000/api/challenges');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.challenges).toBeDefined();
    });

    it('should include challenges from premium categories for pro users', async () => {
      // Mock getUser
      vi.mocked(getUser).mockResolvedValue({ id: 1, email: 'test@test.com' } as any);

      // Mock user profile query
      const mockProfileQuery = vi.fn().mockResolvedValue([{ subscriptionTier: 'pro' }]);
      const mockProfileWhere = vi.fn().mockReturnValue({ limit: mockProfileQuery });
      const mockProfileFrom = vi.fn().mockReturnValue({ where: mockProfileWhere });

      // Mock challenges query
      const mockOffsetFn = vi.fn().mockResolvedValue(mockChallenges);
      const mockLimitFn = vi.fn().mockReturnValue({ offset: mockOffsetFn });
      const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockWhereFn = vi
        .fn()
        .mockResolvedValueOnce([{ count: 2 }])
        .mockReturnValueOnce({ orderBy: mockOrderByFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });

      mockDb.select
        .mockReturnValueOnce({ from: mockProfileFrom })
        .mockReturnValueOnce({ from: mockFromFn })
        .mockReturnValueOnce({ from: mockFromFn });

      const request = createMockGetRequest('http://localhost:3000/api/challenges');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.challenges).toBeDefined();
    });

    it('should filter out challenges from premium categories for unauthenticated users', async () => {
      // Mock getUser
      vi.mocked(getUser).mockResolvedValue(null);

      // Mock challenges query
      const freeChallenges = [testMockChallenges[0]]; // Only free category challenges
      const mockOffsetFn = vi.fn().mockResolvedValue(freeChallenges);
      const mockLimitFn = vi.fn().mockReturnValue({ offset: mockOffsetFn });
      const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockWhereFn = vi
        .fn()
        .mockResolvedValueOnce([{ count: 1 }])
        .mockReturnValueOnce({ orderBy: mockOrderByFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });

      mockDb.select
        .mockReturnValueOnce({ from: mockFromFn })
        .mockReturnValueOnce({ from: mockFromFn });

      const request = createMockGetRequest('http://localhost:3000/api/challenges');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.challenges).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should return 500 on database error', async () => {
      const mockFromFn = vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error('Database error')),
        }),
      });
      mockDb.select.mockReturnValue({ from: mockFromFn });

      const request = createMockGetRequest('http://localhost:3000/api/challenges');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
