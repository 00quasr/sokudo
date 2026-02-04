import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  getTeamMemberWpmComparison: vi.fn(),
}));

import { getUser, getTeamMemberWpmComparison } from '@/lib/db/queries';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockGetTeamMemberWpmComparison = getTeamMemberWpmComparison as ReturnType<typeof vi.fn>;

const mockComparison = [
  {
    userId: 1,
    userName: 'Alice',
    userEmail: 'alice@test.com',
    data: [
      { date: '2026-01-28', avgWpm: 72, sessions: 3 },
      { date: '2026-01-29', avgWpm: 75, sessions: 2 },
      { date: '2026-01-30', avgWpm: 78, sessions: 4 },
    ],
  },
  {
    userId: 2,
    userName: 'Bob',
    userEmail: 'bob@test.com',
    data: [
      { date: '2026-01-28', avgWpm: 60, sessions: 2 },
      { date: '2026-01-29', avgWpm: 63, sessions: 1 },
      { date: '2026-01-30', avgWpm: 65, sessions: 3 },
    ],
  },
];

describe('GET /api/team/compare', () => {
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
      mockGetTeamMemberWpmComparison.mockResolvedValue(mockComparison);
    });

    it('should return comparison data for both periods', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.comparison7Days).toEqual(mockComparison);
      expect(data.comparison30Days).toEqual(mockComparison);
    });

    it('should include member userId, userName, userEmail, and data', async () => {
      const response = await GET();
      const data = await response.json();

      const member = data.comparison7Days[0];
      expect(member).toHaveProperty('userId');
      expect(member).toHaveProperty('userName');
      expect(member).toHaveProperty('userEmail');
      expect(member).toHaveProperty('data');
      expect(Array.isArray(member.data)).toBe(true);
    });

    it('should include date, avgWpm, and sessions in each data point', async () => {
      const response = await GET();
      const data = await response.json();

      const point = data.comparison7Days[0].data[0];
      expect(point).toHaveProperty('date');
      expect(point).toHaveProperty('avgWpm');
      expect(point).toHaveProperty('sessions');
    });

    it('should call getTeamMemberWpmComparison with correct day parameters', async () => {
      await GET();

      expect(mockGetTeamMemberWpmComparison).toHaveBeenCalledWith(7);
      expect(mockGetTeamMemberWpmComparison).toHaveBeenCalledWith(30);
    });

    it('should return empty arrays when no team members have data', async () => {
      mockGetTeamMemberWpmComparison.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.comparison7Days).toEqual([]);
      expect(data.comparison30Days).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should return 500 on getTeamMemberWpmComparison error', async () => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
      mockGetTeamMemberWpmComparison.mockRejectedValue(new Error('Database error'));

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
