import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamActivityFeed } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';
import type { TeamActivityFeedItem } from '@/lib/db/queries';

export interface TeamActivityFeedResponse {
  feed: TeamActivityFeedItem[];
}

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'team:activity' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const feed = await getTeamActivityFeed(30);

    const response: TeamActivityFeedResponse = { feed };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching team activity feed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
