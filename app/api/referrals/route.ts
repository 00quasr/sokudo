import { NextRequest, NextResponse } from 'next/server';
import { getUser, getReferralStats, getReferrals } from '@/lib/db/queries';
import { checkAndGrantReferralReward } from '@/lib/referrals/rewards';
import { apiRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'referrals' });
  if (rateLimitResponse) return rateLimitResponse;

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [stats, referralList] = await Promise.all([
    getReferralStats(user.id),
    getReferrals(user.id),
  ]);

  return NextResponse.json({ stats, referrals: referralList });
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'referrals', limit: 30, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await checkAndGrantReferralReward(user.id);

  return NextResponse.json(result);
}
