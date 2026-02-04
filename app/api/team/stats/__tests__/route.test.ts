import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  getTeamStatsOverview: vi.fn(),
  getTeamWpmTrend: vi.fn(),
  getTeamCategoryPerformance: vi.fn(),
  getTeamRecentActivity: vi.fn(),
}));

import {
  getUser,
  getTeamStatsOverview,
  getTeamWpmTrend,
  getTeamCategoryPerformance,
  getTeamRecentActivity,
} from '@/lib/db/queries';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockGetTeamStatsOverview = getTeamStatsOverview as ReturnType<typeof vi.fn>;
const mockGetTeamWpmTrend = getTeamWpmTrend as ReturnType<typeof vi.fn>;
const mockGetTeamCategoryPerformance = getTeamCategoryPerformance as ReturnType<typeof vi.fn>;
const mockGetTeamRecentActivity = getTeamRecentActivity as ReturnType<typeof vi.fn>;

const mockOverview = {
  totalMembers: 4,
  activeMembers: 3,
  teamAvgWpm: 72,
  teamBestWpm: 120,
  teamAvgAccuracy: 94,
  totalSessions: 85,
  totalPracticeTimeMs: 7200000,
  avgStreak: 4,
};

const mockWpmTrend = [
  { date: '2026-01-28', avgWpm: 68, sessions: 5 },
  { date: '2026-01-29', avgWpm: 70, sessions: 8 },
  { date: '2026-01-30', avgWpm: 74, sessions: 6 },
];

const mockCategoryPerformance = [
  {
    categoryId: 1,
    categoryName: 'Git Basics',
    categorySlug: 'git-basics',
    sessions: 30,
    avgWpm: 75,
    avgAccuracy: 95,
  },
  {
    categoryId: 2,
    categoryName: 'Docker',
    categorySlug: 'docker',
    sessions: 20,
    avgWpm: 68,
    avgAccuracy: 92,
  },
];

const mockRecentActivity = [
  {
    userId: 1,
    userName: 'Alice',
    userEmail: 'alice@test.com',
    wpm: 82,
    accuracy: 97,
    categoryName: 'Git Basics',
    completedAt: new Date('2026-01-30T10:00:00Z'),
  },
];

describe('GET /api/team/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetUser.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('no team', () => {
    it('should return 404 if user has no team', async () => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
      mockGetTeamStatsOverview.mockResolvedValue(null);
      mockGetTeamWpmTrend.mockResolvedValue([]);
      mockGetTeamCategoryPerformance.mockResolvedValue([]);
      mockGetTeamRecentActivity.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('No team found');
    });
  });

  describe('successful retrieval', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
      mockGetTeamStatsOverview.mockResolvedValue(mockOverview);
      mockGetTeamWpmTrend.mockResolvedValue(mockWpmTrend);
      mockGetTeamCategoryPerformance.mockResolvedValue(mockCategoryPerformance);
      mockGetTeamRecentActivity.mockResolvedValue(mockRecentActivity);
    });

    it('should return team stats data', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.overview).toEqual(mockOverview);
      expect(data.categoryPerformance).toEqual(mockCategoryPerformance);
    });

    it('should include all required overview fields', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.overview).toHaveProperty('totalMembers');
      expect(data.overview).toHaveProperty('activeMembers');
      expect(data.overview).toHaveProperty('teamAvgWpm');
      expect(data.overview).toHaveProperty('teamBestWpm');
      expect(data.overview).toHaveProperty('teamAvgAccuracy');
      expect(data.overview).toHaveProperty('totalSessions');
      expect(data.overview).toHaveProperty('totalPracticeTimeMs');
      expect(data.overview).toHaveProperty('avgStreak');
    });

    it('should include WPM trend data for both periods', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.wpmTrend7Days).toEqual(mockWpmTrend);
      expect(data.wpmTrend30Days).toEqual(mockWpmTrend);
    });

    it('should include recent activity', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.recentActivity).toHaveLength(1);
      expect(data.recentActivity[0]).toHaveProperty('userId');
      expect(data.recentActivity[0]).toHaveProperty('wpm');
      expect(data.recentActivity[0]).toHaveProperty('categoryName');
    });

    it('should call getTeamWpmTrend with correct day parameters', async () => {
      await GET();

      expect(mockGetTeamWpmTrend).toHaveBeenCalledWith(7);
      expect(mockGetTeamWpmTrend).toHaveBeenCalledWith(30);
    });

    it('should call getTeamRecentActivity with limit of 10', async () => {
      await GET();

      expect(mockGetTeamRecentActivity).toHaveBeenCalledWith(10);
    });
  });

  describe('error handling', () => {
    it('should return 500 on getTeamStatsOverview error', async () => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
      mockGetTeamStatsOverview.mockRejectedValue(new Error('Database error'));
      mockGetTeamWpmTrend.mockResolvedValue([]);
      mockGetTeamCategoryPerformance.mockResolvedValue([]);
      mockGetTeamRecentActivity.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should return 500 on getUser error', async () => {
      mockGetUser.mockRejectedValue(new Error('Auth error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
