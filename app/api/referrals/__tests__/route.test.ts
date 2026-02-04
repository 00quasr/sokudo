import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  getReferralStats: vi.fn(),
  getReferrals: vi.fn(),
}));

import { getUser, getReferralStats, getReferrals } from '@/lib/db/queries';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockGetReferralStats = getReferralStats as ReturnType<typeof vi.fn>;
const mockGetReferrals = getReferrals as ReturnType<typeof vi.fn>;

describe('GET /api/referrals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return referral stats and list for authenticated user', async () => {
    const mockUser = { id: 1, email: 'test@test.com' };
    const mockStats = {
      totalReferrals: 3,
      pendingReferrals: 1,
      completedReferrals: 2,
      rewardsEarned: 2,
    };
    const mockReferralList = [
      {
        id: 1,
        referredName: 'Alice',
        referredEmail: 'alice@test.com',
        status: 'completed',
        rewardGiven: true,
        createdAt: new Date('2025-06-01T00:00:00Z'),
      },
      {
        id: 2,
        referredName: 'Bob',
        referredEmail: 'bob@test.com',
        status: 'pending',
        rewardGiven: false,
        createdAt: new Date('2025-06-15T00:00:00Z'),
      },
    ];

    mockGetUser.mockResolvedValue(mockUser);
    mockGetReferralStats.mockResolvedValue(mockStats);
    mockGetReferrals.mockResolvedValue(mockReferralList);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats).toEqual(mockStats);
    expect(data.referrals).toHaveLength(2);
    expect(mockGetReferralStats).toHaveBeenCalledWith(1);
    expect(mockGetReferrals).toHaveBeenCalledWith(1);
  });

  it('should return empty data when user has no referrals', async () => {
    const mockUser = { id: 1, email: 'test@test.com' };
    const mockStats = {
      totalReferrals: 0,
      pendingReferrals: 0,
      completedReferrals: 0,
      rewardsEarned: 0,
    };

    mockGetUser.mockResolvedValue(mockUser);
    mockGetReferralStats.mockResolvedValue(mockStats);
    mockGetReferrals.mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats.totalReferrals).toBe(0);
    expect(data.referrals).toEqual([]);
  });

  it('should include all stat fields in response', async () => {
    const mockUser = { id: 1, email: 'test@test.com' };
    mockGetUser.mockResolvedValue(mockUser);
    mockGetReferralStats.mockResolvedValue({
      totalReferrals: 5,
      pendingReferrals: 2,
      completedReferrals: 3,
      rewardsEarned: 3,
    });
    mockGetReferrals.mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats).toHaveProperty('totalReferrals');
    expect(data.stats).toHaveProperty('pendingReferrals');
    expect(data.stats).toHaveProperty('completedReferrals');
    expect(data.stats).toHaveProperty('rewardsEarned');
  });

  it('should include all referral entry fields', async () => {
    const mockUser = { id: 1, email: 'test@test.com' };
    const mockReferral = {
      id: 1,
      referredName: 'Alice',
      referredEmail: 'alice@test.com',
      status: 'completed',
      rewardGiven: true,
      createdAt: new Date('2025-06-01T00:00:00Z'),
    };

    mockGetUser.mockResolvedValue(mockUser);
    mockGetReferralStats.mockResolvedValue({
      totalReferrals: 1,
      pendingReferrals: 0,
      completedReferrals: 1,
      rewardsEarned: 1,
    });
    mockGetReferrals.mockResolvedValue([mockReferral]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    const entry = data.referrals[0];
    expect(entry).toHaveProperty('id');
    expect(entry).toHaveProperty('referredName');
    expect(entry).toHaveProperty('referredEmail');
    expect(entry).toHaveProperty('status');
    expect(entry).toHaveProperty('rewardGiven');
    expect(entry).toHaveProperty('createdAt');
  });
});
