import { NextRequest, NextResponse } from 'next/server';
import {
  getUserByUsername,
  getUserProfile,
  getPublicProfileStats,
  getPublicCategoryPerformance,
  getPublicRecentSessions,
  getPublicUserAchievements,
} from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'profile' });
  if (rateLimitResponse) return rateLimitResponse;

  const { username } = await params;

  const user = await getUserByUsername(username);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const [profile, stats, categoryPerformance, recentSessions, achievements] =
    await Promise.all([
      getUserProfile(user.id),
      getPublicProfileStats(user.id),
      getPublicCategoryPerformance(user.id),
      getPublicRecentSessions(user.id, 10),
      getPublicUserAchievements(user.id),
    ]);

  return NextResponse.json({
    user: {
      name: user.name,
      username: user.username,
      createdAt: user.createdAt,
      avatarUrl: profile?.avatarUrl ?? null,
      bio: profile?.bio ?? null,
      preferredCategoryIds:
        (profile?.preferredCategoryIds as number[]) ?? [],
    },
    stats,
    categoryPerformance,
    recentSessions,
    achievements,
  });
}
