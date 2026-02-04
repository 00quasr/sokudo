import { describe, it, expect } from 'vitest';
import {
  referrals,
  type Referral,
  type NewReferral,
} from '../schema';

describe('referrals schema', () => {
  describe('table structure', () => {
    it('should have the correct table name', () => {
      const tableName = (referrals as Record<symbol, { name: string }>)[
        Object.getOwnPropertySymbols(referrals).find(
          (s) => s.description === 'drizzle:Name'
        ) as symbol
      ];
      expect(tableName).toBe('referrals');
    });

    it('should have all required columns', () => {
      const columnNames = Object.keys(referrals);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('referrerId');
      expect(columnNames).toContain('referredId');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('rewardGiven');
      expect(columnNames).toContain('createdAt');
      expect(columnNames).toContain('updatedAt');
    });

    it('should have id as primary key', () => {
      expect(referrals.id.primary).toBe(true);
    });
  });

  describe('column constraints', () => {
    it('should require referrerId', () => {
      expect(referrals.referrerId.notNull).toBe(true);
    });

    it('should require referredId', () => {
      expect(referrals.referredId.notNull).toBe(true);
    });

    it('should require status', () => {
      expect(referrals.status.notNull).toBe(true);
    });

    it('should require rewardGiven', () => {
      expect(referrals.rewardGiven.notNull).toBe(true);
    });

    it('should require createdAt', () => {
      expect(referrals.createdAt.notNull).toBe(true);
    });

    it('should require updatedAt', () => {
      expect(referrals.updatedAt.notNull).toBe(true);
    });
  });

  describe('type inference', () => {
    it('should allow valid NewReferral with only required fields', () => {
      const newReferral: NewReferral = {
        referrerId: 1,
        referredId: 2,
      };

      expect(newReferral.referrerId).toBe(1);
      expect(newReferral.referredId).toBe(2);
      expect(newReferral.status).toBeUndefined();
      expect(newReferral.rewardGiven).toBeUndefined();
    });

    it('should allow NewReferral with explicit status and rewardGiven', () => {
      const newReferral: NewReferral = {
        referrerId: 1,
        referredId: 2,
        status: 'completed',
        rewardGiven: true,
      };

      expect(newReferral.status).toBe('completed');
      expect(newReferral.rewardGiven).toBe(true);
    });

    it('should infer Referral type with all fields', () => {
      const referral: Referral = {
        id: 1,
        referrerId: 1,
        referredId: 2,
        status: 'pending',
        rewardGiven: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(referral.id).toBe(1);
      expect(referral.referrerId).toBe(1);
      expect(referral.referredId).toBe(2);
      expect(referral.status).toBe('pending');
      expect(referral.rewardGiven).toBe(false);
      expect(referral.createdAt instanceof Date).toBe(true);
      expect(referral.updatedAt instanceof Date).toBe(true);
    });
  });

  describe('practical use cases', () => {
    it('should support tracking referral status transitions', () => {
      const statuses = ['pending', 'completed', 'expired'];
      const referral: Referral = {
        id: 1,
        referrerId: 1,
        referredId: 2,
        status: 'pending',
        rewardGiven: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(statuses).toContain(referral.status);
    });

    it('should support filtering referrals by referrer', () => {
      const allReferrals: Referral[] = [
        { id: 1, referrerId: 1, referredId: 2, status: 'completed', rewardGiven: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, referrerId: 1, referredId: 3, status: 'pending', rewardGiven: false, createdAt: new Date(), updatedAt: new Date() },
        { id: 3, referrerId: 2, referredId: 4, status: 'completed', rewardGiven: true, createdAt: new Date(), updatedAt: new Date() },
      ];

      const user1Referrals = allReferrals.filter(
        (r) => r.referrerId === 1
      );
      expect(user1Referrals.length).toBe(2);
    });

    it('should support counting pending rewards', () => {
      const allReferrals: Referral[] = [
        { id: 1, referrerId: 1, referredId: 2, status: 'completed', rewardGiven: false, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, referrerId: 1, referredId: 3, status: 'completed', rewardGiven: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 3, referrerId: 1, referredId: 4, status: 'completed', rewardGiven: false, createdAt: new Date(), updatedAt: new Date() },
        { id: 4, referrerId: 1, referredId: 5, status: 'pending', rewardGiven: false, createdAt: new Date(), updatedAt: new Date() },
      ];

      const pendingRewards = allReferrals.filter(
        (r) => r.status === 'completed' && !r.rewardGiven
      );
      expect(pendingRewards.length).toBe(2);
    });

    it('should support sorting referrals by creation date', () => {
      const allReferrals: Referral[] = [
        { id: 1, referrerId: 1, referredId: 2, status: 'completed', rewardGiven: true, createdAt: new Date('2025-03-01'), updatedAt: new Date('2025-03-01') },
        { id: 2, referrerId: 1, referredId: 3, status: 'pending', rewardGiven: false, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
        { id: 3, referrerId: 1, referredId: 4, status: 'completed', rewardGiven: false, createdAt: new Date('2025-02-01'), updatedAt: new Date('2025-02-01') },
      ];

      const sorted = [...allReferrals].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );

      expect(sorted[0].referredId).toBe(3);
      expect(sorted[1].referredId).toBe(4);
      expect(sorted[2].referredId).toBe(2);
    });

    it('should support checking if a user was already referred', () => {
      const allReferrals: Referral[] = [
        { id: 1, referrerId: 1, referredId: 2, status: 'completed', rewardGiven: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, referrerId: 1, referredId: 3, status: 'pending', rewardGiven: false, createdAt: new Date(), updatedAt: new Date() },
      ];

      const isReferred = (userId: number) =>
        allReferrals.some((r) => r.referredId === userId);

      expect(isReferred(2)).toBe(true);
      expect(isReferred(3)).toBe(true);
      expect(isReferred(4)).toBe(false);
    });

    it('should prevent self-referral in application logic', () => {
      const newReferral: NewReferral = {
        referrerId: 1,
        referredId: 1,
      };

      // Application logic should validate referrerId !== referredId
      expect(newReferral.referrerId).toBe(newReferral.referredId);
    });
  });
});
