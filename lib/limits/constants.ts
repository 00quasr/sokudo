/**
 * Free tier limits for Sokudo
 */

/**
 * Daily practice time limit for free users in milliseconds (15 minutes)
 */
export const FREE_TIER_DAILY_LIMIT_MS = 15 * 60 * 1000;

/**
 * Subscription tiers
 */
export const SubscriptionTier = {
  FREE: 'free',
  PRO: 'pro',
  TEAM: 'team',
} as const;

export type SubscriptionTier = (typeof SubscriptionTier)[keyof typeof SubscriptionTier];

/**
 * Check if a subscription tier has unlimited practice time
 */
export function hasUnlimitedPractice(tier: string): boolean {
  return tier === SubscriptionTier.PRO || tier === SubscriptionTier.TEAM;
}

/**
 * Check if a subscription tier can access premium categories
 */
export function canAccessPremiumCategories(tier: string): boolean {
  return tier === SubscriptionTier.PRO || tier === SubscriptionTier.TEAM;
}
