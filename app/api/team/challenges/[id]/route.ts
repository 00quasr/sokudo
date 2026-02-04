import { NextRequest, NextResponse } from 'next/server';
import {
  getUser,
  getTeamChallengeById,
  getTeamChallengeResults,
} from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';
import type {
  TeamChallengeWithDetails,
  TeamChallengeResult,
} from '@/lib/db/queries';

export interface TeamChallengeDetailResponse {
  challenge: TeamChallengeWithDetails;
  results: TeamChallengeResult[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'team:challenges:detail' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const teamChallengeId = parseInt(id, 10);
    if (isNaN(teamChallengeId)) {
      return NextResponse.json(
        { error: 'Invalid team challenge ID' },
        { status: 400 }
      );
    }

    const [challenge, results] = await Promise.all([
      getTeamChallengeById(teamChallengeId),
      getTeamChallengeResults(teamChallengeId),
    ]);

    if (!challenge) {
      return NextResponse.json(
        { error: 'Team challenge not found' },
        { status: 404 }
      );
    }

    const response: TeamChallengeDetailResponse = { challenge, results };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching team challenge details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
