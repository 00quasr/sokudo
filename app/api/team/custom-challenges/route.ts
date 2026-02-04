import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getUser,
  getTeamCustomChallenges,
  createTeamCustomChallenge,
} from '@/lib/db/queries';
import { requireTeamAdmin } from '@/lib/auth/permissions';
import { apiRateLimit } from '@/lib/rate-limit';
import type { TeamCustomChallengeWithCreator } from '@/lib/db/queries';

export interface TeamCustomChallengesResponse {
  challenges: TeamCustomChallengeWithCreator[];
}

const createSchema = z.object({
  name: z.string().min(1).max(255),
  content: z.string().min(1),
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
  hint: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'team:custom-challenges' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const challenges = await getTeamCustomChallenges();

    const response: TeamCustomChallengesResponse = { challenges };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching team custom challenges:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'team:custom-challenges', limit: 30, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Creating team custom challenges requires admin role
    await requireTeamAdmin(user.id);

    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const created = await createTeamCustomChallenge(parsed.data);

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
    console.error('Error creating team custom challenge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
