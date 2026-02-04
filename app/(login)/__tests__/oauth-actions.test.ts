import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock NextAuth signIn function
vi.mock('@/lib/auth/auth', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  auth: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
}));

// Mock all other dependencies
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  users: { id: 'id', email: 'email' },
  teams: { id: 'id' },
  teamMembers: {},
  activityLogs: {},
  referrals: {},
  invitations: {},
  ActivityType: {
    SIGN_UP: 'SIGN_UP',
    CREATE_TEAM: 'CREATE_TEAM',
    SIGN_IN: 'SIGN_IN',
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

import { signInWithGoogle, signInWithGitHub } from '../actions';
import { signIn as nextAuthSignIn } from '@/lib/auth/auth';

describe('OAuth sign-in actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signInWithGoogle', () => {
    it('should call NextAuth signIn with google provider and dashboard redirect', async () => {
      const formData = new FormData();

      await signInWithGoogle(formData);

      expect(nextAuthSignIn).toHaveBeenCalledWith('google', {
        redirectTo: '/dashboard',
      });
    });

    it('should handle checkout redirect with priceId', async () => {
      const formData = new FormData();
      formData.set('redirect', 'checkout');
      formData.set('priceId', 'price_123');

      await signInWithGoogle(formData);

      expect(nextAuthSignIn).toHaveBeenCalledWith('google', {
        redirectTo: '/dashboard?checkout=true&priceId=price_123',
      });
    });

    it('should handle checkout redirect without priceId', async () => {
      const formData = new FormData();
      formData.set('redirect', 'checkout');

      await signInWithGoogle(formData);

      expect(nextAuthSignIn).toHaveBeenCalledWith('google', {
        redirectTo: '/dashboard',
      });
    });

    it('should handle redirect parameter that is not checkout', async () => {
      const formData = new FormData();
      formData.set('redirect', 'profile');

      await signInWithGoogle(formData);

      expect(nextAuthSignIn).toHaveBeenCalledWith('google', {
        redirectTo: '/dashboard',
      });
    });

    it('should handle null redirect and priceId', async () => {
      const formData = new FormData();
      formData.set('redirect', '');
      formData.set('priceId', '');

      await signInWithGoogle(formData);

      expect(nextAuthSignIn).toHaveBeenCalledWith('google', {
        redirectTo: '/dashboard',
      });
    });
  });

  describe('signInWithGitHub', () => {
    it('should call NextAuth signIn with github provider and dashboard redirect', async () => {
      const formData = new FormData();

      await signInWithGitHub(formData);

      expect(nextAuthSignIn).toHaveBeenCalledWith('github', {
        redirectTo: '/dashboard',
      });
    });

    it('should handle checkout redirect with priceId', async () => {
      const formData = new FormData();
      formData.set('redirect', 'checkout');
      formData.set('priceId', 'price_456');

      await signInWithGitHub(formData);

      expect(nextAuthSignIn).toHaveBeenCalledWith('github', {
        redirectTo: '/dashboard?checkout=true&priceId=price_456',
      });
    });

    it('should handle checkout redirect without priceId', async () => {
      const formData = new FormData();
      formData.set('redirect', 'checkout');

      await signInWithGitHub(formData);

      expect(nextAuthSignIn).toHaveBeenCalledWith('github', {
        redirectTo: '/dashboard',
      });
    });

    it('should handle redirect parameter that is not checkout', async () => {
      const formData = new FormData();
      formData.set('redirect', 'settings');

      await signInWithGitHub(formData);

      expect(nextAuthSignIn).toHaveBeenCalledWith('github', {
        redirectTo: '/dashboard',
      });
    });

    it('should handle null redirect and priceId', async () => {
      const formData = new FormData();
      formData.set('redirect', '');
      formData.set('priceId', '');

      await signInWithGitHub(formData);

      expect(nextAuthSignIn).toHaveBeenCalledWith('github', {
        redirectTo: '/dashboard',
      });
    });
  });

  describe('OAuth provider comparison', () => {
    it('should call different providers for Google and GitHub', async () => {
      const formData = new FormData();

      await signInWithGoogle(formData);
      expect(nextAuthSignIn).toHaveBeenLastCalledWith('google', expect.any(Object));

      await signInWithGitHub(formData);
      expect(nextAuthSignIn).toHaveBeenLastCalledWith('github', expect.any(Object));
    });
  });
});
