import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  getTeamAchievements: vi.fn(),
}));

import { getUser, getTeamAchievements } from '@/lib/db/queries';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockGetTeamAchievements = getTeamAchievements as ReturnType<typeof vi.fn>;

const mockAchievements = [
  {
    id: 1,
    slug: 'team-sessions-50',
    name: 'First Fifty',
    description: 'Complete 50 sessions as a team',
    icon: 'users',
    earned: true,
    earnedAt: new Date('2026-01-15T10:00:00Z'),
  },
  {
    id: 2,
    slug: 'team-avg-wpm-40',
    name: 'Warming Up Together',
    description: 'Reach a team average of 40 WPM',
    icon: 'gauge',
    earned: false,
    earnedAt: null,
  },
];

describe('GET /api/team/achievements', () => {
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
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
      mockGetTeamAchievements.mockResolvedValue(mockAchievements);
    });

    it('should return team achievements data', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
    });

    it('should include earned and unearned achievements', async () => {
      const response = await GET();
      const data = await response.json();

      const earned = data.filter((a: Record<string, unknown>) => a.earned);
      const unearned = data.filter((a: Record<string, unknown>) => !a.earned);

      expect(earned).toHaveLength(1);
      expect(unearned).toHaveLength(1);
    });

    it('should include all required fields', async () => {
      const response = await GET();
      const data = await response.json();

      for (const achievement of data) {
        expect(achievement).toHaveProperty('id');
        expect(achievement).toHaveProperty('slug');
        expect(achievement).toHaveProperty('name');
        expect(achievement).toHaveProperty('description');
        expect(achievement).toHaveProperty('icon');
        expect(achievement).toHaveProperty('earned');
        expect(achievement).toHaveProperty('earnedAt');
      }
    });
  });

  describe('empty results', () => {
    it('should return empty array if user has no team', async () => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
      mockGetTeamAchievements.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should return 500 on database error', async () => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
      mockGetTeamAchievements.mockRejectedValue(new Error('Database error'));

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
