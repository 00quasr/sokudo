import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

// Mock the queries
vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  getUserStatsOverview: vi.fn(),
  getCategoryPerformance: vi.fn(),
  getWpmTrend: vi.fn(),
  getCategoryBreakdown: vi.fn(),
}));

import {
  getUser,
  getUserStatsOverview,
  getCategoryPerformance,
  getWpmTrend,
  getCategoryBreakdown,
} from '@/lib/db/queries';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockGetUserStatsOverview = getUserStatsOverview as ReturnType<typeof vi.fn>;
const mockGetCategoryPerformance = getCategoryPerformance as ReturnType<typeof vi.fn>;
const mockGetWpmTrend = getWpmTrend as ReturnType<typeof vi.fn>;
const mockGetCategoryBreakdown = getCategoryBreakdown as ReturnType<typeof vi.fn>;

function createMockGetRequest(url: string): Request {
  return {
    url,
  } as unknown as Request;
}

describe('GET /api/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetUser.mockResolvedValue(null);

      const request = createMockGetRequest('http://localhost:3000/api/stats');
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

    it('should return 400 for invalid trendDays parameter (negative)', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/stats?trendDays=-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });

    it('should return 400 for invalid trendDays parameter (zero)', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/stats?trendDays=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });

    it('should return 400 for invalid trendDays parameter (exceeds max)', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/stats?trendDays=366');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });

    it('should return 400 for invalid trendDays parameter (non-numeric)', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/stats?trendDays=abc');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });
  });

  describe('successful stats retrieval', () => {
    const mockUser = { id: 1, email: 'test@test.com' };
    const mockOverview = {
      totalSessions: 50,
      avgWpm: 65,
      avgAccuracy: 94,
      totalPracticeTimeMs: 3600000,
      totalKeystrokes: 10000,
      totalErrors: 600,
      currentStreak: 5,
      longestStreak: 10,
      bestWpm: 95,
      bestAccuracy: 100,
    };
    const mockCategoryPerformance = [
      {
        categoryId: 1,
        categoryName: 'Git Basics',
        categorySlug: 'git-basics',
        sessions: 30,
        avgWpm: 70,
        avgAccuracy: 95,
      },
      {
        categoryId: 2,
        categoryName: 'Docker Commands',
        categorySlug: 'docker-commands',
        sessions: 20,
        avgWpm: 60,
        avgAccuracy: 92,
      },
    ];
    const mockWpmTrendData = [
      { date: '2025-01-18', avgWpm: 60, sessions: 5 },
      { date: '2025-01-19', avgWpm: 65, sessions: 8 },
      { date: '2025-01-20', avgWpm: 70, sessions: 6 },
    ];
    const mockCategoryBreakdownData = {
      best: {
        byWpm: { categoryId: 1, categoryName: 'Git Basics', avgWpm: 70, sessions: 30 },
        byAccuracy: { categoryId: 1, categoryName: 'Git Basics', avgAccuracy: 95, sessions: 30 },
      },
      worst: {
        byWpm: { categoryId: 2, categoryName: 'Docker Commands', avgWpm: 60, sessions: 20 },
        byAccuracy: { categoryId: 2, categoryName: 'Docker Commands', avgAccuracy: 92, sessions: 20 },
      },
    };

    beforeEach(() => {
      mockGetUser.mockResolvedValue(mockUser);
      mockGetUserStatsOverview.mockResolvedValue(mockOverview);
      mockGetCategoryPerformance.mockResolvedValue(mockCategoryPerformance);
      mockGetWpmTrend.mockResolvedValue(mockWpmTrendData);
      mockGetCategoryBreakdown.mockResolvedValue(mockCategoryBreakdownData);
    });

    it('should return all stats with default trendDays', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.overview).toEqual(mockOverview);
      expect(data.categoryPerformance).toEqual(mockCategoryPerformance);
      expect(data.wpmTrend).toEqual(mockWpmTrendData);
      expect(data.categoryBreakdown).toEqual(mockCategoryBreakdownData);
      expect(mockGetWpmTrend).toHaveBeenCalledWith(30); // default trendDays
    });

    it('should return stats with custom trendDays', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/stats?trendDays=7');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.overview).toBeDefined();
      expect(mockGetWpmTrend).toHaveBeenCalledWith(7);
    });

    it('should return stats with max trendDays', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/stats?trendDays=365');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockGetWpmTrend).toHaveBeenCalledWith(365);
    });

    it('should return empty arrays when user has no sessions', async () => {
      const emptyOverview = {
        totalSessions: 0,
        avgWpm: 0,
        avgAccuracy: 0,
        totalPracticeTimeMs: 0,
        totalKeystrokes: 0,
        totalErrors: 0,
        currentStreak: 0,
        longestStreak: 0,
        bestWpm: 0,
        bestAccuracy: 0,
      };
      const emptyBreakdown = {
        best: { byWpm: null, byAccuracy: null },
        worst: { byWpm: null, byAccuracy: null },
      };

      mockGetUserStatsOverview.mockResolvedValue(emptyOverview);
      mockGetCategoryPerformance.mockResolvedValue([]);
      mockGetWpmTrend.mockResolvedValue([]);
      mockGetCategoryBreakdown.mockResolvedValue(emptyBreakdown);

      const request = createMockGetRequest('http://localhost:3000/api/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.overview.totalSessions).toBe(0);
      expect(data.categoryPerformance).toEqual([]);
      expect(data.wpmTrend).toEqual([]);
      expect(data.categoryBreakdown.best.byWpm).toBeNull();
    });

    it('should include all overview fields', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.overview).toHaveProperty('totalSessions');
      expect(data.overview).toHaveProperty('avgWpm');
      expect(data.overview).toHaveProperty('avgAccuracy');
      expect(data.overview).toHaveProperty('totalPracticeTimeMs');
      expect(data.overview).toHaveProperty('totalKeystrokes');
      expect(data.overview).toHaveProperty('totalErrors');
      expect(data.overview).toHaveProperty('currentStreak');
      expect(data.overview).toHaveProperty('longestStreak');
      expect(data.overview).toHaveProperty('bestWpm');
      expect(data.overview).toHaveProperty('bestAccuracy');
    });

    it('should include all category performance fields', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categoryPerformance[0]).toHaveProperty('categoryId');
      expect(data.categoryPerformance[0]).toHaveProperty('categoryName');
      expect(data.categoryPerformance[0]).toHaveProperty('categorySlug');
      expect(data.categoryPerformance[0]).toHaveProperty('sessions');
      expect(data.categoryPerformance[0]).toHaveProperty('avgWpm');
      expect(data.categoryPerformance[0]).toHaveProperty('avgAccuracy');
    });

    it('should include all wpm trend fields', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.wpmTrend[0]).toHaveProperty('date');
      expect(data.wpmTrend[0]).toHaveProperty('avgWpm');
      expect(data.wpmTrend[0]).toHaveProperty('sessions');
    });

    it('should include all category breakdown fields', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categoryBreakdown).toHaveProperty('best');
      expect(data.categoryBreakdown).toHaveProperty('worst');
      expect(data.categoryBreakdown.best).toHaveProperty('byWpm');
      expect(data.categoryBreakdown.best).toHaveProperty('byAccuracy');
      expect(data.categoryBreakdown.worst).toHaveProperty('byWpm');
      expect(data.categoryBreakdown.worst).toHaveProperty('byAccuracy');
    });
  });

  describe('error handling', () => {
    it('should return 500 on getUserStatsOverview error', async () => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
      mockGetUserStatsOverview.mockRejectedValue(new Error('Database error'));
      mockGetCategoryPerformance.mockResolvedValue([]);
      mockGetWpmTrend.mockResolvedValue([]);
      mockGetCategoryBreakdown.mockResolvedValue({ best: { byWpm: null, byAccuracy: null }, worst: { byWpm: null, byAccuracy: null } });

      const request = createMockGetRequest('http://localhost:3000/api/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should return 500 on getCategoryPerformance error', async () => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
      mockGetUserStatsOverview.mockResolvedValue({});
      mockGetCategoryPerformance.mockRejectedValue(new Error('Database error'));
      mockGetWpmTrend.mockResolvedValue([]);
      mockGetCategoryBreakdown.mockResolvedValue({ best: { byWpm: null, byAccuracy: null }, worst: { byWpm: null, byAccuracy: null } });

      const request = createMockGetRequest('http://localhost:3000/api/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should return 500 on getWpmTrend error', async () => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
      mockGetUserStatsOverview.mockResolvedValue({});
      mockGetCategoryPerformance.mockResolvedValue([]);
      mockGetWpmTrend.mockRejectedValue(new Error('Database error'));
      mockGetCategoryBreakdown.mockResolvedValue({ best: { byWpm: null, byAccuracy: null }, worst: { byWpm: null, byAccuracy: null } });

      const request = createMockGetRequest('http://localhost:3000/api/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should return 500 on getCategoryBreakdown error', async () => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
      mockGetUserStatsOverview.mockResolvedValue({});
      mockGetCategoryPerformance.mockResolvedValue([]);
      mockGetWpmTrend.mockResolvedValue([]);
      mockGetCategoryBreakdown.mockRejectedValue(new Error('Database error'));

      const request = createMockGetRequest('http://localhost:3000/api/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should return 500 on getUser error', async () => {
      mockGetUser.mockRejectedValue(new Error('Auth error'));

      const request = createMockGetRequest('http://localhost:3000/api/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
