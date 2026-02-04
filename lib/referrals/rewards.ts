import { eq, and, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { referrals, userProfiles } from '@/lib/db/schema';

const REFERRALS_REQUIRED_FOR_REWARD = 3;

/**
 * Checks how many completed, unrewarded referrals a user has.
 * If they have >= 3, grants 1 month of Pro by:
 *   - Updating their userProfile subscriptionTier to 'pro'
 *   - Marking those referrals as rewardGiven = true
 * Returns the number of newly rewarded referrals (0 if threshold not met).
 */
export async function checkAndGrantReferralReward(
  userId: number
): Promise<{ rewarded: boolean; rewardedCount: number }> {
  const completedUnrewarded = await db
    .select({ id: referrals.id })
    .from(referrals)
    .where(
      and(
        eq(referrals.referrerId, userId),
        eq(referrals.status, 'completed'),
        eq(referrals.rewardGiven, false)
      )
    );

  if (completedUnrewarded.length < REFERRALS_REQUIRED_FOR_REWARD) {
    return { rewarded: false, rewardedCount: 0 };
  }

  // Take the first batch of 3 to reward
  const toReward = completedUnrewarded
    .slice(0, REFERRALS_REQUIRED_FOR_REWARD)
    .map((r) => r.id);

  // Upgrade user to Pro and mark referrals as rewarded in a transaction-like flow
  await db
    .update(userProfiles)
    .set({
      subscriptionTier: 'pro',
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.userId, userId));

  await db
    .update(referrals)
    .set({
      rewardGiven: true,
      updatedAt: new Date(),
    })
    .where(
      sql`${referrals.id} IN (${sql.join(
        toReward.map((id) => sql`${id}`),
        sql`, `
      )})`
    );

  return { rewarded: true, rewardedCount: toReward.length };
}

/**
 * Marks a referral as completed (e.g., when the referred user completes
 * a qualifying action like their first practice session) and checks
 * if the referrer has earned a reward.
 */
export async function completeReferralAndCheckReward(
  referralId: number,
  referrerId: number
): Promise<{ rewarded: boolean; rewardedCount: number }> {
  await db
    .update(referrals)
    .set({
      status: 'completed',
      updatedAt: new Date(),
    })
    .where(eq(referrals.id, referralId));

  return checkAndGrantReferralReward(referrerId);
}
