import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamAchievements } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'team:achievements' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const achievements = await getTeamAchievements();
    return NextResponse.json(achievements);
  } catch (error) {
    console.error('Error fetching team achievements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
