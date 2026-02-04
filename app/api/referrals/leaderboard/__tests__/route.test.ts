import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  getReferralLeaderboard: vi.fn(),
}));

import { getUser, getReferralLeaderboard } from '@/lib/db/queries';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockGetReferralLeaderboard = getReferralLeaderboard as ReturnType<
  typeof vi.fn
>;

describe('GET /api/referrals/leaderboard', () => {
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
        rank: 1,
        userId: 10,
        userName: 'Alice',
        username: 'alice',
        completedReferrals: 8,
      },
      {
        rank: 2,
        userId: 20,
        userName: 'Bob',
        username: 'bob',
        completedReferrals: 5,
      },
      {
        rank: 3,
        userId: 1,
        userName: 'Test User',
        username: 'testuser',
        completedReferrals: 3,
      },
    ];

    beforeEach(() => {
      mockGetUser.mockResolvedValue(mockUser);
      mockGetReferralLeaderboard.mockResolvedValue(mockLeaderboardData);
    });

    it('should return leaderboard data', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leaderboard).toEqual(mockLeaderboardData);
      expect(data.leaderboard).toHaveLength(3);
    });

    it('should include all required fields for each entry', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      const entry = data.leaderboard[0];
      expect(entry).toHaveProperty('rank');
      expect(entry).toHaveProperty('userId');
      expect(entry).toHaveProperty('userName');
      expect(entry).toHaveProperty('username');
      expect(entry).toHaveProperty('completedReferrals');
    });

    it('should return entries ordered by rank', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.leaderboard[0].rank).toBe(1);
      expect(data.leaderboard[1].rank).toBe(2);
      expect(data.leaderboard[2].rank).toBe(3);
    });

    it('should return empty leaderboard when no referrals exist', async () => {
      mockGetReferralLeaderboard.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leaderboard).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should return 500 on getReferralLeaderboard error', async () => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
      mockGetReferralLeaderboard.mockRejectedValue(
        new Error('Database error')
      );

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
