import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, userProfiles } from '@/lib/db/schema';
import { authenticateApiKey } from '@/lib/auth/api-key';
import { apiRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'v1:user', limit: 60, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await authenticateApiKey(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    const [userData] = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [profile] = await db
      .select({
        avatarUrl: userProfiles.avatarUrl,
        bio: userProfiles.bio,
        subscriptionTier: userProfiles.subscriptionTier,
        currentStreak: userProfiles.currentStreak,
        longestStreak: userProfiles.longestStreak,
        totalPracticeTimeMs: userProfiles.totalPracticeTimeMs,
      })
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1);

    return NextResponse.json({
      user: {
        ...userData,
        profile: profile ?? null,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/v1/user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
