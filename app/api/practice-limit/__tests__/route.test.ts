import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

// Mock the queries module
vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
}));

// Mock the limits module
vi.mock('@/lib/limits', () => ({
  getPracticeLimitStatus: vi.fn(),
}));

import { getUser } from '@/lib/db/queries';
import { getPracticeLimitStatus } from '@/lib/limits';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockGetPracticeLimitStatus = getPracticeLimitStatus as ReturnType<typeof vi.fn>;

describe('GET /api/practice-limit', () => {
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

  describe('successful responses', () => {
    const mockUser = { id: 1, email: 'test@test.com' };

    beforeEach(() => {
      mockGetUser.mockResolvedValue(mockUser);
    });

    it('should return practice limit status for free tier user', async () => {
      mockGetPracticeLimitStatus.mockResolvedValue({
        canPractice: true,
        isFreeTier: true,
        remainingMs: 600000, // 10 minutes
        dailyLimitMs: 900000, // 15 minutes
        usedTodayMs: 300000, // 5 minutes
        subscriptionTier: 'free',
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.canPractice).toBe(true);
      expect(data.isFreeTier).toBe(true);
      expect(data.remainingMs).toBe(600000);
      expect(data.dailyLimitMs).toBe(900000);
      expect(data.usedTodayMs).toBe(300000);
      expect(data.subscriptionTier).toBe('free');
    });

    it('should return status when free tier limit reached', async () => {
      mockGetPracticeLimitStatus.mockResolvedValue({
        canPractice: false,
        isFreeTier: true,
        remainingMs: 0,
        dailyLimitMs: 900000,
        usedTodayMs: 900000,
        subscriptionTier: 'free',
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.canPractice).toBe(false);
      expect(data.remainingMs).toBe(0);
    });

    it('should return unlimited status for pro tier user', async () => {
      mockGetPracticeLimitStatus.mockResolvedValue({
        canPractice: true,
        isFreeTier: false,
        remainingMs: null,
        dailyLimitMs: null,
        usedTodayMs: 3600000, // 1 hour
        subscriptionTier: 'pro',
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.canPractice).toBe(true);
      expect(data.isFreeTier).toBe(false);
      expect(data.remainingMs).toBeNull();
      expect(data.dailyLimitMs).toBeNull();
      expect(data.subscriptionTier).toBe('pro');
    });
  });

  describe('error handling', () => {
    it('should return 500 on internal error', async () => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
      mockGetPracticeLimitStatus.mockRejectedValue(new Error('Database error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
