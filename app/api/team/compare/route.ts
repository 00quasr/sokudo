import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamMemberWpmComparison } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';
import type { TeamMemberWpmComparison } from '@/lib/db/queries';

export interface TeamWpmComparisonResponse {
  comparison7Days: TeamMemberWpmComparison[];
  comparison30Days: TeamMemberWpmComparison[];
}

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'team:compare' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const [comparison7Days, comparison30Days] = await Promise.all([
      getTeamMemberWpmComparison(7),
      getTeamMemberWpmComparison(30),
    ]);

    const response: TeamWpmComparisonResponse = {
      comparison7Days,
      comparison30Days,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching team WPM comparison:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
