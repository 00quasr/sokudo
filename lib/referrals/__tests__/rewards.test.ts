import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  referrals: {
    id: 'id',
    referrerId: 'referrer_id',
    status: 'status',
    rewardGiven: 'reward_given',
    updatedAt: 'updated_at',
  },
  userProfiles: {
    userId: 'user_id',
    subscriptionTier: 'subscription_tier',
    updatedAt: 'updated_at',
  },
}));

import { db } from '@/lib/db/drizzle';
import {
  checkAndGrantReferralReward,
  completeReferralAndCheckReward,
} from '../rewards';

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

function setupSelectChain(result: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(result),
  };
  mockDb.select.mockReturnValue(chain);
  return chain;
}

function setupUpdateChain() {
  const chain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
  };
  mockDb.update.mockReturnValue(chain);
  return chain;
}

describe('checkAndGrantReferralReward', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return rewarded: false when user has fewer than 3 completed referrals', async () => {
    setupSelectChain([{ id: 1 }, { id: 2 }]);

    const result = await checkAndGrantReferralReward(1);

    expect(result).toEqual({ rewarded: false, rewardedCount: 0 });
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it('should return rewarded: false when user has no completed referrals', async () => {
    setupSelectChain([]);

    const result = await checkAndGrantReferralReward(1);

    expect(result).toEqual({ rewarded: false, rewardedCount: 0 });
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it('should grant reward when user has exactly 3 completed referrals', async () => {
    setupSelectChain([{ id: 10 }, { id: 11 }, { id: 12 }]);
    setupUpdateChain();

    const result = await checkAndGrantReferralReward(1);

    expect(result).toEqual({ rewarded: true, rewardedCount: 3 });
    // Should call update twice: once for userProfiles, once for referrals
    expect(mockDb.update).toHaveBeenCalledTimes(2);
  });

  it('should grant reward when user has more than 3 completed referrals (rewards only 3)', async () => {
    setupSelectChain([{ id: 10 }, { id: 11 }, { id: 12 }, { id: 13 }, { id: 14 }]);
    setupUpdateChain();

    const result = await checkAndGrantReferralReward(1);

    expect(result).toEqual({ rewarded: true, rewardedCount: 3 });
    expect(mockDb.update).toHaveBeenCalledTimes(2);
  });

  it('should upgrade user profile to pro tier', async () => {
    setupSelectChain([{ id: 10 }, { id: 11 }, { id: 12 }]);
    const updateChain = setupUpdateChain();

    await checkAndGrantReferralReward(42);

    // First update call should be for userProfiles
    expect(mockDb.update).toHaveBeenCalled();
    const firstSetCall = updateChain.set.mock.calls[0][0];
    expect(firstSetCall.subscriptionTier).toBe('pro');
  });
});

describe('completeReferralAndCheckReward', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mark referral as completed and check for rewards', async () => {
    const updateChain = setupUpdateChain();
    // After the first update (marking completed), select returns fewer than 3
    setupSelectChain([{ id: 10 }]);

    const result = await completeReferralAndCheckReward(5, 1);

    // First update should set status to 'completed'
    expect(mockDb.update).toHaveBeenCalled();
    const firstSetCall = updateChain.set.mock.calls[0][0];
    expect(firstSetCall.status).toBe('completed');

    expect(result).toEqual({ rewarded: false, rewardedCount: 0 });
  });

  it('should trigger reward when completing the 3rd referral', async () => {
    setupUpdateChain();
    // After marking completed, select returns 3 unrewarded completed referrals
    setupSelectChain([{ id: 10 }, { id: 11 }, { id: 12 }]);

    const result = await completeReferralAndCheckReward(12, 1);

    expect(result).toEqual({ rewarded: true, rewardedCount: 3 });
  });
});
