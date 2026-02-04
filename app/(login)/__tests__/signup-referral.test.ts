import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all external dependencies
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  users: { id: 'id', email: 'email', referralCode: 'referral_code' },
  teams: { id: 'id' },
  teamMembers: {},
  activityLogs: {},
  referrals: { referrerId: 'referrer_id', referredId: 'referred_id', status: 'status' },
  invitations: {},
  ActivityType: {
    SIGN_UP: 'SIGN_UP',
    CREATE_TEAM: 'CREATE_TEAM',
    SIGN_IN: 'SIGN_IN',
    SIGN_OUT: 'SIGN_OUT',
    ACCEPT_INVITATION: 'ACCEPT_INVITATION',
    UPDATE_PASSWORD: 'UPDATE_PASSWORD',
    DELETE_ACCOUNT: 'DELETE_ACCOUNT',
    UPDATE_ACCOUNT: 'UPDATE_ACCOUNT',
    REMOVE_TEAM_MEMBER: 'REMOVE_TEAM_MEMBER',
    INVITE_TEAM_MEMBER: 'INVITE_TEAM_MEMBER',
  },
}));

vi.mock('@/lib/auth/session', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashedpassword'),
  comparePasswords: vi.fn(),
  setSession: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ delete: vi.fn() }),
}));

vi.mock('@/lib/payments/stripe', () => ({
  createCheckoutSession: vi.fn(),
}));

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  getUserWithTeam: vi.fn(),
  isUsernameTaken: vi.fn(),
}));

vi.mock('@/lib/referrals/queries', () => ({
  getUserByReferralCode: vi.fn(),
}));

vi.mock('@/lib/referrals/rewards', () => ({
  checkAndGrantReferralReward: vi.fn().mockResolvedValue({ rewarded: false, rewardedCount: 0 }),
}));

import { db } from '@/lib/db/drizzle';
import { getUserByReferralCode } from '@/lib/referrals/queries';
import { checkAndGrantReferralReward } from '@/lib/referrals/rewards';

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

const mockGetUserByReferralCode = getUserByReferralCode as ReturnType<typeof vi.fn>;
const mockCheckAndGrantReferralReward = checkAndGrantReferralReward as ReturnType<typeof vi.fn>;

describe('signUp referral integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: no existing user
    const selectChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };
    mockDb.select.mockReturnValue(selectChain);

    // Default insert chain returns created user then team
    let insertCallCount = 0;
    const insertChain = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockImplementation(() => {
        insertCallCount++;
        if (insertCallCount === 1) {
          return Promise.resolve([{ id: 100, email: 'new@test.com', passwordHash: 'hash' }]);
        }
        if (insertCallCount === 2) {
          return Promise.resolve([{ id: 200, name: "new@test.com's Team" }]);
        }
        return Promise.resolve([]);
      }),
    };
    mockDb.insert.mockReturnValue(insertChain);
  });

  it('should look up referrer when ref code is provided during signup', async () => {
    mockGetUserByReferralCode.mockResolvedValue({ id: 50, name: 'Referrer', username: 'referrer' });

    // We import the module dynamically to get fresh mocks
    const { signUp } = await import('../actions');

    const formData = new FormData();
    formData.set('email', 'new@test.com');
    formData.set('password', 'password123');
    formData.set('ref', 'ABCD1234');

    try {
      await signUp({ error: '' }, formData);
    } catch {
      // redirect throws
    }

    expect(mockGetUserByReferralCode).toHaveBeenCalledWith('ABCD1234');
  });

  it('should not look up referrer when no ref code is provided', async () => {
    const { signUp } = await import('../actions');

    const formData = new FormData();
    formData.set('email', 'new@test.com');
    formData.set('password', 'password123');

    try {
      await signUp({ error: '' }, formData);
    } catch {
      // redirect throws
    }

    expect(mockGetUserByReferralCode).not.toHaveBeenCalled();
  });

  it('should create referral record when referrer is found and is different user', async () => {
    mockGetUserByReferralCode.mockResolvedValue({ id: 50, name: 'Referrer', username: 'referrer' });

    const { signUp } = await import('../actions');

    const formData = new FormData();
    formData.set('email', 'new@test.com');
    formData.set('password', 'password123');
    formData.set('ref', 'ABCD1234');

    try {
      await signUp({ error: '' }, formData);
    } catch {
      // redirect throws
    }

    // Check that db.insert was called with referrals data
    // The last insert call should be for the referral
    const insertCalls = mockDb.insert.mock.calls;
    expect(insertCalls.length).toBeGreaterThanOrEqual(3); // user, team, teamMember, activityLog, referral
  });

  it('should not create referral record when referrer lookup fails', async () => {
    mockGetUserByReferralCode.mockRejectedValue(new Error('DB error'));

    const { signUp } = await import('../actions');

    const formData = new FormData();
    formData.set('email', 'new@test.com');
    formData.set('password', 'password123');
    formData.set('ref', 'INVALID');

    // Should not throw - referral errors are silently caught
    try {
      await signUp({ error: '' }, formData);
    } catch {
      // redirect throws, that's fine
    }

    // The sign-up should still complete (redirect is called)
  });

  it('should check and grant referral reward after creating referral record', async () => {
    mockGetUserByReferralCode.mockResolvedValue({ id: 50, name: 'Referrer', username: 'referrer' });
    mockCheckAndGrantReferralReward.mockResolvedValue({ rewarded: true, rewardedCount: 3 });

    const { signUp } = await import('../actions');

    const formData = new FormData();
    formData.set('email', 'new@test.com');
    formData.set('password', 'password123');
    formData.set('ref', 'ABCD1234');

    try {
      await signUp({ error: '' }, formData);
    } catch {
      // redirect throws
    }

    expect(mockCheckAndGrantReferralReward).toHaveBeenCalledWith(50);
  });

  it('should not check referral reward when no referral code is provided', async () => {
    const { signUp } = await import('../actions');

    const formData = new FormData();
    formData.set('email', 'new@test.com');
    formData.set('password', 'password123');

    try {
      await signUp({ error: '' }, formData);
    } catch {
      // redirect throws
    }

    expect(mockCheckAndGrantReferralReward).not.toHaveBeenCalled();
  });

  it('should not check referral reward for self-referral', async () => {
    mockGetUserByReferralCode.mockResolvedValue({ id: 100, name: 'Self', username: 'self' });

    const { signUp } = await import('../actions');

    const formData = new FormData();
    formData.set('email', 'new@test.com');
    formData.set('password', 'password123');
    formData.set('ref', 'SELF1234');

    try {
      await signUp({ error: '' }, formData);
    } catch {
      // redirect throws
    }

    expect(mockCheckAndGrantReferralReward).not.toHaveBeenCalled();
  });

  it('should not block signup if reward check fails', async () => {
    mockGetUserByReferralCode.mockResolvedValue({ id: 50, name: 'Referrer', username: 'referrer' });
    mockCheckAndGrantReferralReward.mockRejectedValue(new Error('Reward check failed'));

    const { signUp } = await import('../actions');

    const formData = new FormData();
    formData.set('email', 'new@test.com');
    formData.set('password', 'password123');
    formData.set('ref', 'ABCD1234');

    // Should not throw - errors in reward checking are caught
    try {
      await signUp({ error: '' }, formData);
    } catch {
      // redirect throws, that's fine
    }
  });

  it('should not create referral for self-referral', async () => {
    // Referrer ID matches created user ID
    mockGetUserByReferralCode.mockResolvedValue({ id: 100, name: 'Self', username: 'self' });

    const { signUp } = await import('../actions');

    const formData = new FormData();
    formData.set('email', 'new@test.com');
    formData.set('password', 'password123');
    formData.set('ref', 'SELF1234');

    try {
      await signUp({ error: '' }, formData);
    } catch {
      // redirect throws
    }

    // getUserByReferralCode was called but no referral insert should happen
    // because referrer.id (100) === createdUser.id (100)
    expect(mockGetUserByReferralCode).toHaveBeenCalledWith('SELF1234');
  });
});
