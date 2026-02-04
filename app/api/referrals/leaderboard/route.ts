import { NextRequest, NextResponse } from 'next/server';
import { getUser, getReferralLeaderboard } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'referrals:leaderboard' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const leaderboard = await getReferralLeaderboard();

    return NextResponse.json({ leaderboard });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
