import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit/middleware';
import { updateChallengeSelection } from '@/lib/repo-scanner';

interface RouteParams {
  params: Promise<{ repoId: string; challengeId: string }>;
}

const updateChallengeSchema = z.object({
  isSelected: z.boolean(),
});

/**
 * PATCH /api/repos/[repoId]/challenges/[challengeId] - Update challenge selection
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'repos' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { challengeId } = await params;
    const challengeIdNum = parseInt(challengeId, 10);

    if (isNaN(challengeIdNum)) {
      return NextResponse.json({ error: 'Invalid challenge ID' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateChallengeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const updated = await updateChallengeSelection(
      challengeIdNum,
      user.id,
      parsed.data.isSelected
    );

    if (!updated) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
