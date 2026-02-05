import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamLeaderboard } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';
import {
  getOrSetLeaderboard,
  getTeamLeaderboardCacheKey,
} from '@/lib/cache/leaderboard-cache';

export interface TeamLeaderboardResponse {
  leaderboard: Array<{
    userId: number;
    userName: string | null;
    userEmail: string;
    role: string;
    totalSessions: number;
    avgWpm: number;
    bestWpm: number;
    avgAccuracy: number;
    totalPracticeTimeMs: number;
    currentStreak: number;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'team:leaderboard' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // We need to get the team ID first to generate the cache key
    // We'll use a wrapper function that handles this
    const leaderboard = await getOrSetLeaderboard(
      {
        key: `leaderboard:team:user:${user.id}`, // Cache by user since team membership can change
        ttl: 300, // 5 minutes
      },
      async () => {
        return await getTeamLeaderboard();
      }
    );

    const response: TeamLeaderboardResponse = { leaderboard };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching team leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
