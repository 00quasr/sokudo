import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  getTeamInvitations: vi.fn(),
}));

import { getUser, getTeamInvitations } from '@/lib/db/queries';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockGetTeamInvitations = getTeamInvitations as ReturnType<typeof vi.fn>;

describe('GET /api/team/invitations', () => {
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
    const mockInvitations = [
      {
        id: 1,
        email: 'alice@test.com',
        role: 'member',
        status: 'pending',
        invitedAt: '2025-01-15T10:00:00.000Z',
        invitedByName: 'Test User',
        invitedByEmail: 'test@test.com',
      },
      {
        id: 2,
        email: 'bob@test.com',
        role: 'owner',
        status: 'accepted',
        invitedAt: '2025-01-14T10:00:00.000Z',
        invitedByName: 'Test User',
        invitedByEmail: 'test@test.com',
      },
    ];

    beforeEach(() => {
      mockGetUser.mockResolvedValue(mockUser);
      mockGetTeamInvitations.mockResolvedValue(mockInvitations);
    });

    it('should return invitations data', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.invitations).toEqual(mockInvitations);
      expect(data.invitations).toHaveLength(2);
    });

    it('should include all required fields for each invitation', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      const invitation = data.invitations[0];
      expect(invitation).toHaveProperty('id');
      expect(invitation).toHaveProperty('email');
      expect(invitation).toHaveProperty('role');
      expect(invitation).toHaveProperty('status');
      expect(invitation).toHaveProperty('invitedAt');
      expect(invitation).toHaveProperty('invitedByName');
      expect(invitation).toHaveProperty('invitedByEmail');
    });

    it('should return empty array when no invitations exist', async () => {
      mockGetTeamInvitations.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.invitations).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should return 500 on getTeamInvitations error', async () => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
      mockGetTeamInvitations.mockRejectedValue(new Error('Database error'));

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
