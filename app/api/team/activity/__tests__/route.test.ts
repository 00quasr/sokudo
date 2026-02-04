import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  getTeamActivityFeed: vi.fn(),
}));

import { getUser, getTeamActivityFeed } from '@/lib/db/queries';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockGetTeamActivityFeed = getTeamActivityFeed as ReturnType<typeof vi.fn>;

const mockFeed = [
  {
    type: 'practice' as const,
    userId: 1,
    userName: 'Alice',
    userEmail: 'alice@test.com',
    timestamp: new Date('2026-01-30T10:00:00Z'),
    wpm: 82,
    accuracy: 97,
    categoryName: 'Git Basics',
    durationMs: 45000,
  },
  {
    type: 'action' as const,
    userId: 2,
    userName: 'Bob',
    userEmail: 'bob@test.com',
    timestamp: new Date('2026-01-30T09:00:00Z'),
    action: 'INVITE_TEAM_MEMBER',
  },
  {
    type: 'practice' as const,
    userId: 2,
    userName: 'Bob',
    userEmail: 'bob@test.com',
    timestamp: new Date('2026-01-30T08:30:00Z'),
    wpm: 65,
    accuracy: 91,
    categoryName: 'Docker',
    durationMs: 60000,
  },
];

describe('GET /api/team/activity', () => {
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
      mockGetTeamActivityFeed.mockResolvedValue(mockFeed);
    });

    it('should return the activity feed', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.feed).toHaveLength(3);
    });

    it('should include practice items with correct fields', async () => {
      const response = await GET();
      const data = await response.json();

      const practiceItem = data.feed[0];
      expect(practiceItem.type).toBe('practice');
      expect(practiceItem).toHaveProperty('userId');
      expect(practiceItem).toHaveProperty('userName');
      expect(practiceItem).toHaveProperty('wpm');
      expect(practiceItem).toHaveProperty('accuracy');
      expect(practiceItem).toHaveProperty('categoryName');
      expect(practiceItem).toHaveProperty('durationMs');
    });

    it('should include action items with correct fields', async () => {
      const response = await GET();
      const data = await response.json();

      const actionItem = data.feed[1];
      expect(actionItem.type).toBe('action');
      expect(actionItem).toHaveProperty('userId');
      expect(actionItem).toHaveProperty('userName');
      expect(actionItem).toHaveProperty('action');
    });

    it('should call getTeamActivityFeed with limit of 30', async () => {
      await GET();

      expect(mockGetTeamActivityFeed).toHaveBeenCalledWith(30);
    });

    it('should return empty feed when no activity', async () => {
      mockGetTeamActivityFeed.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.feed).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should return 500 on getTeamActivityFeed error', async () => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
      mockGetTeamActivityFeed.mockRejectedValue(new Error('Database error'));

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
