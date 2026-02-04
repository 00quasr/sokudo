import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  getTeamLeaderboard: vi.fn(),
}));

import { getUser, getTeamLeaderboard } from '@/lib/db/queries';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockGetTeamLeaderboard = getTeamLeaderboard as ReturnType<typeof vi.fn>;

describe('GET /api/team/leaderboard', () => {
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

  describe('successful retrieval', () => {
    const mockUser = { id: 1, email: 'test@test.com' };
    const mockLeaderboardData = [
      {
        userId: 1,
        userName: 'Alice',
        userEmail: 'alice@test.com',
        role: 'owner',
        totalSessions: 50,
        avgWpm: 80,
        bestWpm: 120,
        avgAccuracy: 96,
        totalPracticeTimeMs: 3600000,
        currentStreak: 5,
      },
      {
        userId: 2,
        userName: 'Bob',
        userEmail: 'bob@test.com',
        role: 'member',
        totalSessions: 30,
        avgWpm: 65,
        bestWpm: 95,
        avgAccuracy: 92,
        totalPracticeTimeMs: 1800000,
        currentStreak: 3,
      },
    ];

    beforeEach(() => {
      mockGetUser.mockResolvedValue(mockUser);
      mockGetTeamLeaderboard.mockResolvedValue(mockLeaderboardData);
    });

    it('should return leaderboard data', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leaderboard).toEqual(mockLeaderboardData);
      expect(data.leaderboard).toHaveLength(2);
    });

    it('should include all required fields for each entry', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      const entry = data.leaderboard[0];
      expect(entry).toHaveProperty('userId');
      expect(entry).toHaveProperty('userName');
      expect(entry).toHaveProperty('userEmail');
      expect(entry).toHaveProperty('role');
      expect(entry).toHaveProperty('totalSessions');
      expect(entry).toHaveProperty('avgWpm');
      expect(entry).toHaveProperty('bestWpm');
      expect(entry).toHaveProperty('avgAccuracy');
      expect(entry).toHaveProperty('totalPracticeTimeMs');
      expect(entry).toHaveProperty('currentStreak');
    });

    it('should return empty leaderboard when user has no team', async () => {
      mockGetTeamLeaderboard.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leaderboard).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should return 500 on getTeamLeaderboard error', async () => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
      mockGetTeamLeaderboard.mockRejectedValue(new Error('Database error'));

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
