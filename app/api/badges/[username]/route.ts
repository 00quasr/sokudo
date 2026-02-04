import { NextRequest } from 'next/server';
import { getUserByUsername, getPublicProfileStats } from '@/lib/db/queries';
import {
  generateBadgeSvg,
  badgeTypeSchema,
  badgeStyleSchema,
  type BadgeStats,
} from '@/lib/badges/svg';
import { apiRateLimit } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'badges' });
  if (rateLimitResponse) return rateLimitResponse;

  const { username } = await params;
  const { searchParams } = request.nextUrl;

  const typeResult = badgeTypeSchema.safeParse(searchParams.get('type') ?? 'wpm');
  if (!typeResult.success) {
    return new Response('Invalid badge type', { status: 400 });
  }

  const styleResult = badgeStyleSchema.safeParse(
    searchParams.get('style') ?? 'flat'
  );
  if (!styleResult.success) {
    return new Response('Invalid badge style', { status: 400 });
  }

  const user = await getUserByUsername(username);
  if (!user) {
    return new Response('User not found', { status: 404 });
  }

  const stats = await getPublicProfileStats(user.id);

  const badgeStats: BadgeStats = {
    avgWpm: stats.avgWpm,
    avgAccuracy: stats.avgAccuracy,
    bestWpm: stats.bestWpm,
    totalSessions: stats.totalSessions,
    currentStreak: stats.currentStreak,
  };

  const svg = generateBadgeSvg(typeResult.data, badgeStats, styleResult.data);

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
