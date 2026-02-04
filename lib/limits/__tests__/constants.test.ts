import { describe, it, expect } from 'vitest';
import {
  FREE_TIER_DAILY_LIMIT_MS,
  SubscriptionTier,
  hasUnlimitedPractice,
  canAccessPremiumCategories,
} from '../constants';

describe('FREE_TIER_DAILY_LIMIT_MS', () => {
  it('should be 15 minutes in milliseconds', () => {
    expect(FREE_TIER_DAILY_LIMIT_MS).toBe(15 * 60 * 1000);
    expect(FREE_TIER_DAILY_LIMIT_MS).toBe(900000);
  });
});

describe('SubscriptionTier', () => {
  it('should define FREE tier as "free"', () => {
    expect(SubscriptionTier.FREE).toBe('free');
  });

  it('should define PRO tier as "pro"', () => {
    expect(SubscriptionTier.PRO).toBe('pro');
  });

  it('should define TEAM tier as "team"', () => {
    expect(SubscriptionTier.TEAM).toBe('team');
  });
});

describe('hasUnlimitedPractice', () => {
  it('should return false for free tier', () => {
    expect(hasUnlimitedPractice('free')).toBe(false);
  });

  it('should return true for pro tier', () => {
    expect(hasUnlimitedPractice('pro')).toBe(true);
  });

  it('should return true for team tier', () => {
    expect(hasUnlimitedPractice('team')).toBe(true);
  });

  it('should return false for unknown tier', () => {
    expect(hasUnlimitedPractice('unknown')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(hasUnlimitedPractice('')).toBe(false);
  });

  it('should be case-sensitive', () => {
    expect(hasUnlimitedPractice('FREE')).toBe(false);
    expect(hasUnlimitedPractice('Pro')).toBe(false);
    expect(hasUnlimitedPractice('TEAM')).toBe(false);
  });
});

describe('canAccessPremiumCategories', () => {
  it('should return false for free tier', () => {
    expect(canAccessPremiumCategories('free')).toBe(false);
  });

  it('should return true for pro tier', () => {
    expect(canAccessPremiumCategories('pro')).toBe(true);
  });

  it('should return true for team tier', () => {
    expect(canAccessPremiumCategories('team')).toBe(true);
  });

  it('should return false for unknown tier', () => {
    expect(canAccessPremiumCategories('unknown')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(canAccessPremiumCategories('')).toBe(false);
  });

  it('should be case-sensitive', () => {
    expect(canAccessPremiumCategories('FREE')).toBe(false);
    expect(canAccessPremiumCategories('Pro')).toBe(false);
    expect(canAccessPremiumCategories('TEAM')).toBe(false);
  });
});
