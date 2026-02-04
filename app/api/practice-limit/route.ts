import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getPracticeLimitStatus } from '@/lib/limits';
import { apiRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'practice-limit' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const status = await getPracticeLimitStatus(user.id);

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching practice limit status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
