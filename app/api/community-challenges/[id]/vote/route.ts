import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser, upsertChallengeVote, getVoteCountsForChallenge, getUserVoteForChallenge } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { customChallenges } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { apiRateLimit } from '@/lib/rate-limit';

const voteSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1)]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'community-challenges:vote', limit: 30, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const challengeId = parseInt(id, 10);
    if (isNaN(challengeId)) {
      return NextResponse.json({ error: 'Invalid challenge ID' }, { status: 400 });
    }

    // Verify the challenge exists and is public
    const [challenge] = await db
      .select({ id: customChallenges.id, userId: customChallenges.userId })
      .from(customChallenges)
      .where(
        and(
          eq(customChallenges.id, challengeId),
          eq(customChallenges.isPublic, true)
        )
      );

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const body = await request.json();
    const parseResult = voteSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid vote value', details: parseResult.error.errors },
        { status: 400 }
      );
    }

    await upsertChallengeVote(user.id, challengeId, parseResult.data.value);

    // Return updated vote counts and user's current vote
    const votes = await getVoteCountsForChallenge(challengeId);
    const userVote = await getUserVoteForChallenge(user.id, challengeId);

    return NextResponse.json({
      votes,
      userVote: userVote?.value ?? 0,
    });
  } catch (error) {
    console.error('Error voting on challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'community-challenges:vote' });
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const challengeId = parseInt(id, 10);
    if (isNaN(challengeId)) {
      return NextResponse.json({ error: 'Invalid challenge ID' }, { status: 400 });
    }

    const votes = await getVoteCountsForChallenge(challengeId);

    // If user is logged in, include their vote
    const user = await getUser();
    let userVote = 0;
    if (user) {
      const vote = await getUserVoteForChallenge(user.id, challengeId);
      userVote = vote?.value ?? 0;
    }

    return NextResponse.json({ votes, userVote });
  } catch (error) {
    console.error('Error getting vote info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
