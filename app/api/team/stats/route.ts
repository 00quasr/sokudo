import { NextRequest, NextResponse } from 'next/server';
import {
  getUser,
  getTeamStatsOverview,
  getTeamWpmTrend,
  getTeamCategoryPerformance,
  getTeamRecentActivity,
} from '@/lib/db/queries';
import { requireTeamAdmin } from '@/lib/auth/permissions';
import { apiRateLimit } from '@/lib/rate-limit';
import type {
  TeamStatsOverview,
  TeamWpmTrendDataPoint,
  TeamCategoryPerformance,
  TeamMemberActivity,
} from '@/lib/db/queries';

export interface TeamStatsResponse {
  overview: TeamStatsOverview;
  wpmTrend7Days: TeamWpmTrendDataPoint[];
  wpmTrend30Days: TeamWpmTrendDataPoint[];
  categoryPerformance: TeamCategoryPerformance[];
  recentActivity: TeamMemberActivity[];
}

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'team:stats' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Team stats overview requires admin role
    await requireTeamAdmin(user.id);

    const [overview, wpmTrend7Days, wpmTrend30Days, categoryPerformance, recentActivity] =
      await Promise.all([
        getTeamStatsOverview(),
        getTeamWpmTrend(7),
        getTeamWpmTrend(30),
        getTeamCategoryPerformance(),
        getTeamRecentActivity(10),
      ]);

    if (!overview) {
      return NextResponse.json(
        { error: 'No team found' },
        { status: 404 }
      );
    }

    const response: TeamStatsResponse = {
      overview,
      wpmTrend7Days,
      wpmTrend30Days,
      categoryPerformance,
      recentActivity,
    };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error && error.message.includes('admin role required')) {
      return NextResponse.json(
        { error: 'Forbidden: admin role required' },
        { status: 403 }
      );
    }
    console.error('Error fetching team stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
