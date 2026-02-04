import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimit } from '@/lib/rate-limit';
import { getSession } from '@/lib/auth/session';
import { generateHint, generateHintInputSchema } from '@/lib/ai/generate-hints';

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'practice:hints', limit: 30 });
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = generateHintInputSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.errors },
        { status: 400 }
      );
    }

    const hint = await generateHint(parseResult.data);

    return NextResponse.json({ hint });
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

    console.error('Error generating hint:', error);
    return NextResponse.json(
      { error: 'Failed to generate hint' },
      { status: 500 }
    );
  }
}
