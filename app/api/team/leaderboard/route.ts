import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamLeaderboard } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';

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

    const leaderboard = await getTeamLeaderboard();

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
