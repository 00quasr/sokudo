import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionWithKeystrokeLogs } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';

const paramsSchema = z.object({
  sessionId: z.coerce.number().int().positive(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'sessions:detail' });
    if (rateLimitResponse) return rateLimitResponse;

    const resolvedParams = await params;
    const parseResult = paramsSchema.safeParse(resolvedParams);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    const { sessionId } = parseResult.data;

    const session = await getSessionWithKeystrokeLogs(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    if (error instanceof Error && error.message === 'User not authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
