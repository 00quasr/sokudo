import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  generateChallenges,
  generateChallengesInputSchema,
} from '@/lib/ai/generate-challenges';
import { apiRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'challenges:generate', limit: 10, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = generateChallengesInputSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.errors },
        { status: 400 }
      );
    }

    const challenges = await generateChallenges(parseResult.data);

    return NextResponse.json({ challenges });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('No AI provider configured')
    ) {
      return NextResponse.json(
        { error: 'AI generation is not configured on this server' },
        { status: 503 }
      );
    }

    console.error('Error generating challenges:', error);
    return NextResponse.json(
      { error: 'Failed to generate challenges' },
      { status: 500 }
    );
  }
}
