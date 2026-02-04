import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getUser,
  getTeamCustomChallengeById,
  updateTeamCustomChallenge,
  deleteTeamCustomChallenge,
} from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  syntaxType: z
    .enum([
      'plain',
      'bash',
      'git',
      'shell',
      'react',
      'typescript',
      'docker',
      'sql',
      'npm',
      'yarn',
      'pnpm',
    ])
    .optional(),
  hint: z.string().nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'team:custom-challenges:detail' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const challengeId = parseInt(id, 10);
    if (isNaN(challengeId)) {
      return NextResponse.json(
        { error: 'Invalid challenge ID' },
        { status: 400 }
      );
    }

    const challenge = await getTeamCustomChallengeById(challengeId);
    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(challenge);
  } catch (error) {
    console.error('Error fetching team custom challenge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'team:custom-challenges:detail', limit: 30, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const challengeId = parseInt(id, 10);
    if (isNaN(challengeId)) {
      return NextResponse.json(
        { error: 'Invalid challenge ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateTeamCustomChallenge(challengeId, parsed.data);
    return NextResponse.json(updated);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Team custom challenge not found or not authorized'
    ) {
      return NextResponse.json(
        { error: 'Challenge not found or not authorized' },
        { status: 404 }
      );
    }
    if (
      error instanceof Error &&
      error.message === 'User is not a member of any team'
    ) {
      return NextResponse.json(
        { error: 'No team found' },
        { status: 404 }
      );
    }
    console.error('Error updating team custom challenge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'team:custom-challenges:delete', limit: 30, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const challengeId = parseInt(id, 10);
    if (isNaN(challengeId)) {
      return NextResponse.json(
        { error: 'Invalid challenge ID' },
        { status: 400 }
      );
    }

    await deleteTeamCustomChallenge(challengeId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Team custom challenge not found'
    ) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }
    if (
      error instanceof Error &&
      error.message === 'Not authorized to delete this challenge'
    ) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }
    if (
      error instanceof Error &&
      error.message === 'User is not a member of any team'
    ) {
      return NextResponse.json(
        { error: 'No team found' },
        { status: 404 }
      );
    }
    console.error('Error deleting team custom challenge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
