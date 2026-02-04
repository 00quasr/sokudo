import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock the database
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
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
  leftJoin: ReturnType<typeof vi.fn>;
  innerJoin: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  groupBy: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
};

const mockGetUser = getUser as ReturnType<typeof vi.fn>;

function createMockGetRequest(url: string): NextRequest {
  return {
    url,
  } as unknown as NextRequest;
}

describe('GET /api/categories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validation', () => {
    it('should return 400 for invalid difficulty parameter', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/categories?difficulty=invalid');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });
  });

  describe('successful category retrieval', () => {
    const mockCategories = [
      {
        id: 1,
        name: 'Git Basics',
        slug: 'git-basics',
        description: 'Learn basic git commands',
        icon: 'git',
        difficulty: 'beginner',
        isPremium: false,
        displayOrder: 1,
        createdAt: new Date('2025-01-20T10:00:00Z'),
        challengeCount: 10,
      },
      {
        id: 2,
        name: 'Docker Commands',
        slug: 'docker-commands',
        description: 'Master docker CLI',
        icon: 'docker',
        difficulty: 'intermediate',
        isPremium: true,
        displayOrder: 2,
        createdAt: new Date('2025-01-21T10:00:00Z'),
        challengeCount: 15,
      },
    ];

    it('should return categories without progress when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue(null);

      const mockOrderByFn = vi.fn().mockResolvedValue(mockCategories);
      const mockGroupByFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
      const mockWhereFn = vi.fn().mockReturnValue({ groupBy: mockGroupByFn });
      const mockLeftJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ leftJoin: mockLeftJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

      mockDb.select.mockImplementation(mockSelectFn);

      const request = createMockGetRequest('http://localhost:3000/api/categories');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories).toBeDefined();
      expect(data.categories).toHaveLength(2);
      expect(data.categories[0].progress).toBeDefined();
      expect(data.categories[0].progress.completedChallenges).toBe(0);
    });

    it('should return categories with progress stats for authenticated user', async () => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

      const mockProgressStats = [
        {
          categoryId: 1,
          completedChallenges: 5,
          totalSessions: 20,
          avgWpm: 65,
          avgAccuracy: 92,
          bestWpm: 85,
        },
      ];

      // First call for categories
      const mockOrderByFn = vi.fn().mockResolvedValue(mockCategories);
      const mockGroupByFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
      const mockWhereFn = vi.fn().mockReturnValue({ groupBy: mockGroupByFn });
      const mockLeftJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ leftJoin: mockLeftJoinFn });

      // Second call for progress stats
      const mockGroupByFn2 = vi.fn().mockResolvedValue(mockProgressStats);
      const mockWhereFn2 = vi.fn().mockReturnValue({ groupBy: mockGroupByFn2 });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn2 });
      const mockFromFn2 = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });

      mockDb.select
        .mockReturnValueOnce({ from: mockFromFn })
        .mockReturnValueOnce({ from: mockFromFn2 });

      const request = createMockGetRequest('http://localhost:3000/api/categories');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories).toBeDefined();
      expect(data.categories).toHaveLength(2);
      expect(data.categories[0].progress).toBeDefined();
      expect(data.categories[0].progress.completedChallenges).toBe(5);
      expect(data.categories[0].progress.totalSessions).toBe(20);
      expect(data.categories[0].progress.avgWpm).toBe(65);
      expect(data.categories[0].progress.avgAccuracy).toBe(92);
      expect(data.categories[0].progress.bestWpm).toBe(85);
      expect(data.categories[0].progress.completionPercent).toBe(50); // 5/10 * 100
    });

    it('should return categories without progress when includeProgress is false', async () => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

      const mockOrderByFn = vi.fn().mockResolvedValue(mockCategories);
      const mockGroupByFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
      const mockWhereFn = vi.fn().mockReturnValue({ groupBy: mockGroupByFn });
      const mockLeftJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ leftJoin: mockLeftJoinFn });

      mockDb.select.mockReturnValue({ from: mockFromFn });

      const request = createMockGetRequest('http://localhost:3000/api/categories?includeProgress=false');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories).toBeDefined();
      expect(data.categories[0].progress).toBeUndefined();
    });

    it('should filter categories by difficulty', async () => {
      mockGetUser.mockResolvedValue(null);

      const beginnerCategories = [mockCategories[0]];
      const mockOrderByFn = vi.fn().mockResolvedValue(beginnerCategories);
      const mockGroupByFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
      const mockWhereFn = vi.fn().mockReturnValue({ groupBy: mockGroupByFn });
      const mockLeftJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ leftJoin: mockLeftJoinFn });

      mockDb.select.mockReturnValue({ from: mockFromFn });

      const request = createMockGetRequest('http://localhost:3000/api/categories?difficulty=beginner');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories).toBeDefined();
    });

    it('should filter categories by isPremium', async () => {
      mockGetUser.mockResolvedValue(null);

      const freeCategories = [mockCategories[0]];
      const mockOrderByFn = vi.fn().mockResolvedValue(freeCategories);
      const mockGroupByFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
      const mockWhereFn = vi.fn().mockReturnValue({ groupBy: mockGroupByFn });
      const mockLeftJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ leftJoin: mockLeftJoinFn });

      mockDb.select.mockReturnValue({ from: mockFromFn });

      const request = createMockGetRequest('http://localhost:3000/api/categories?isPremium=false');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories).toBeDefined();
    });

    it('should return empty categories array when no categories exist', async () => {
      mockGetUser.mockResolvedValue(null);

      const mockOrderByFn = vi.fn().mockResolvedValue([]);
      const mockGroupByFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
      const mockWhereFn = vi.fn().mockReturnValue({ groupBy: mockGroupByFn });
      const mockLeftJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ leftJoin: mockLeftJoinFn });

      mockDb.select.mockReturnValue({ from: mockFromFn });

      const request = createMockGetRequest('http://localhost:3000/api/categories');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories).toEqual([]);
    });

    it('should accept valid difficulty values', async () => {
      const difficulties = ['beginner', 'intermediate', 'advanced'];

      for (const difficulty of difficulties) {
        mockGetUser.mockResolvedValue(null);

        const mockOrderByFn = vi.fn().mockResolvedValue(mockCategories);
        const mockGroupByFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
        const mockWhereFn = vi.fn().mockReturnValue({ groupBy: mockGroupByFn });
        const mockLeftJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
        const mockFromFn = vi.fn().mockReturnValue({ leftJoin: mockLeftJoinFn });

        mockDb.select.mockReturnValue({ from: mockFromFn });

        const request = createMockGetRequest(
          `http://localhost:3000/api/categories?difficulty=${difficulty}`
        );
        const response = await GET(request);

        expect(response.status).toBe(200);
      }
    });

    it('should combine multiple filters', async () => {
      mockGetUser.mockResolvedValue(null);

      const mockOrderByFn = vi.fn().mockResolvedValue([mockCategories[0]]);
      const mockGroupByFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
      const mockWhereFn = vi.fn().mockReturnValue({ groupBy: mockGroupByFn });
      const mockLeftJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ leftJoin: mockLeftJoinFn });

      mockDb.select.mockReturnValue({ from: mockFromFn });

      const request = createMockGetRequest(
        'http://localhost:3000/api/categories?difficulty=beginner&isPremium=false'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories).toBeDefined();
    });

    it('should include challengeCount in response', async () => {
      mockGetUser.mockResolvedValue(null);

      const mockOrderByFn = vi.fn().mockResolvedValue(mockCategories);
      const mockGroupByFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
      const mockWhereFn = vi.fn().mockReturnValue({ groupBy: mockGroupByFn });
      const mockLeftJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ leftJoin: mockLeftJoinFn });

      mockDb.select.mockReturnValue({ from: mockFromFn });

      const request = createMockGetRequest('http://localhost:3000/api/categories');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories[0].challengeCount).toBe(10);
      expect(data.categories[1].challengeCount).toBe(15);
    });
  });

  describe('premium access control', () => {
    const testMockCategories = [
      {
        id: 1,
        name: 'Git Basics',
        slug: 'git-basics',
        description: 'Learn basic git commands',
        icon: 'git',
        difficulty: 'beginner',
        isPremium: false,
        displayOrder: 1,
        createdAt: new Date('2025-01-20T10:00:00Z'),
        challengeCount: 10,
      },
      {
        id: 2,
        name: 'Docker Commands',
        slug: 'docker-commands',
        description: 'Master docker CLI',
        icon: 'docker',
        difficulty: 'intermediate',
        isPremium: true,
        displayOrder: 2,
        createdAt: new Date('2025-01-21T10:00:00Z'),
        challengeCount: 15,
      },
    ];

    it('should filter out premium categories for free users', async () => {
      const mockUser = { id: 1, email: 'test@test.com' };
      const mockFreeProfile = { subscriptionTier: 'free' };

      mockGetUser.mockResolvedValue(mockUser);

      // First db call for user profile
      const mockProfileQuery = vi.fn().mockResolvedValue([mockFreeProfile]);
      const mockProfileWhere = vi.fn().mockReturnValue({ limit: mockProfileQuery });
      const mockProfileFrom = vi.fn().mockReturnValue({ where: mockProfileWhere });

      // Second db call for categories (should only return free categories)
      const freeCategories = [testMockCategories[0]];
      const mockOrderByFn = vi.fn().mockResolvedValue(freeCategories);
      const mockGroupByFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
      const mockWhereFn = vi.fn().mockReturnValue({ groupBy: mockGroupByFn });
      const mockLeftJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ leftJoin: mockLeftJoinFn });

      mockDb.select
        .mockReturnValueOnce({ from: mockProfileFrom })
        .mockReturnValueOnce({ from: mockFromFn });

      const request = createMockGetRequest('http://localhost:3000/api/categories');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories).toBeDefined();
    });

    it('should include premium categories for pro users', async () => {
      const mockUser = { id: 1, email: 'test@test.com' };
      const mockProProfile = { subscriptionTier: 'pro' };

      mockGetUser.mockResolvedValue(mockUser);

      // First db call for user profile
      const mockProfileQuery = vi.fn().mockResolvedValue([mockProProfile]);
      const mockProfileWhere = vi.fn().mockReturnValue({ limit: mockProfileQuery });
      const mockProfileFrom = vi.fn().mockReturnValue({ where: mockProfileWhere });

      // Second db call for categories (should return all categories)
      const mockOrderByFn = vi.fn().mockResolvedValue(testMockCategories);
      const mockGroupByFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
      const mockWhereFn = vi.fn().mockReturnValue({ groupBy: mockGroupByFn });
      const mockLeftJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ leftJoin: mockLeftJoinFn });

      mockDb.select
        .mockReturnValueOnce({ from: mockProfileFrom })
        .mockReturnValueOnce({ from: mockFromFn });

      const request = createMockGetRequest('http://localhost:3000/api/categories');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories).toBeDefined();
    });

    it('should filter out premium categories for unauthenticated users', async () => {
      mockGetUser.mockResolvedValue(null);

      // Only one db call for categories (should only return free categories)
      const freeCategories = [testMockCategories[0]];
      const mockOrderByFn = vi.fn().mockResolvedValue(freeCategories);
      const mockGroupByFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
      const mockWhereFn = vi.fn().mockReturnValue({ groupBy: mockGroupByFn });
      const mockLeftJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ leftJoin: mockLeftJoinFn });

      mockDb.select.mockReturnValue({ from: mockFromFn });

      const request = createMockGetRequest('http://localhost:3000/api/categories');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should return 500 on database error', async () => {
      mockGetUser.mockResolvedValue(null);

      const mockFromFn = vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockRejectedValue(new Error('Database error')),
            }),
          }),
        }),
      });
      mockDb.select.mockReturnValue({ from: mockFromFn });

      const request = createMockGetRequest('http://localhost:3000/api/categories');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should return 500 on getUser error', async () => {
      mockGetUser.mockRejectedValue(new Error('Auth error'));

      const request = createMockGetRequest('http://localhost:3000/api/categories');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
