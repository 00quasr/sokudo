import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  getReferralStats: vi.fn(),
  getReferrals: vi.fn(),
}));

vi.mock('@/lib/referrals/rewards', () => ({
  checkAndGrantReferralReward: vi.fn(),
}));

import { getUser } from '@/lib/db/queries';
import { checkAndGrantReferralReward } from '@/lib/referrals/rewards';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockCheckAndGrant = checkAndGrantReferralReward as ReturnType<typeof vi.fn>;

describe('POST /api/referrals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should check and grant referral reward for authenticated user', async () => {
    const mockUser = { id: 1, email: 'test@test.com' };
    mockGetUser.mockResolvedValue(mockUser);
    mockCheckAndGrant.mockResolvedValue({ rewarded: true, rewardedCount: 3 });

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.rewarded).toBe(true);
    expect(data.rewardedCount).toBe(3);
    expect(mockCheckAndGrant).toHaveBeenCalledWith(1);
  });

  it('should return rewarded: false when threshold not met', async () => {
    const mockUser = { id: 2, email: 'user@test.com' };
    mockGetUser.mockResolvedValue(mockUser);
    mockCheckAndGrant.mockResolvedValue({ rewarded: false, rewardedCount: 0 });

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.rewarded).toBe(false);
    expect(data.rewardedCount).toBe(0);
    expect(mockCheckAndGrant).toHaveBeenCalledWith(2);
  });
});
