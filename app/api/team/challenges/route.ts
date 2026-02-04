import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getUser,
  getTeamChallenges,
  createTeamChallenge,
  getChallengeById,
} from '@/lib/db/queries';
import { requireTeamAdmin } from '@/lib/auth/permissions';
import { apiRateLimit } from '@/lib/rate-limit';
import type { TeamChallengeWithDetails } from '@/lib/db/queries';

export interface TeamChallengesResponse {
  challenges: TeamChallengeWithDetails[];
}

const createTeamChallengeSchema = z.object({
  challengeId: z.number().int().positive(),
  expiresAt: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'team:challenges' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const challenges = await getTeamChallenges();

    const response: TeamChallengesResponse = { challenges };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching team challenges:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'team:challenges', limit: 30, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Creating team challenges requires admin role
    await requireTeamAdmin(user.id);

    const body = await request.json();
    const parsed = createTeamChallengeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify the challenge exists
    const challenge = await getChallengeById(parsed.data.challengeId);
    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    const expiresAt = parsed.data.expiresAt
      ? new Date(parsed.data.expiresAt)
      : undefined;

    const created = await createTeamChallenge(
      parsed.data.challengeId,
      expiresAt
    );

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('admin role required')) {
        return NextResponse.json(
          { error: 'Forbidden: admin role required' },
          { status: 403 }
        );
      }
      if (error.message === 'User is not a member of any team') {
        return NextResponse.json(
          { error: 'No team found' },
          { status: 404 }
        );
      }
    }
    console.error('Error creating team challenge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
