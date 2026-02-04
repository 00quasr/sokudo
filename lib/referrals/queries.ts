import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { generateReferralCode } from './generate-code';

const MAX_RETRIES = 5;

/**
 * Gets or generates a unique referral code for a user.
 * If the user already has a code, returns it.
 * Otherwise generates a new one and persists it.
 */
export async function getOrCreateReferralCode(userId: number): Promise<string> {
  const [user] = await db
    .select({ referralCode: users.referralCode })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error('User not found');
  }

  if (user.referralCode) {
    return user.referralCode;
  }

  // Generate a unique code with retry on collision
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const code = generateReferralCode();
    try {
      const [updated] = await db
        .update(users)
        .set({ referralCode: code, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning({ referralCode: users.referralCode });

      if (updated?.referralCode) {
        return updated.referralCode;
      }
    } catch (error: unknown) {
      // Unique constraint violation - retry with a new code
      if (
        error instanceof Error &&
        error.message.includes('unique')
      ) {
        continue;
      }
      throw error;
    }
  }

  throw new Error('Failed to generate unique referral code after retries');
}

/**
 * Looks up a user by their referral code.
 * Returns the user ID if found, null otherwise.
 */
export async function getUserByReferralCode(
  code: string
): Promise<{ id: number; name: string | null; username: string | null } | null> {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
    })
    .from(users)
    .where(eq(users.referralCode, code.toUpperCase()))
    .limit(1);

  return user ?? null;
}
