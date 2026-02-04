import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getOrCreateReferralCode, getUserByReferralCode } from '@/lib/referrals/queries';
import { z } from 'zod';
import { apiRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'referral-code' });
  if (rateLimitResponse) return rateLimitResponse;

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const referralCode = await getOrCreateReferralCode(user.id);
  return NextResponse.json({ referralCode });
}

const lookupSchema = z.object({
  code: z.string().min(1).max(12),
});

export async function POST(request: NextRequest) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'referral-code', limit: 10, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  const body = await request.json();
  const parsed = lookupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid referral code format' },
      { status: 400 }
    );
  }

  const referrer = await getUserByReferralCode(parsed.data.code);
  if (!referrer) {
    return NextResponse.json(
      { error: 'Referral code not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    valid: true,
    referrer: {
      id: referrer.id,
      name: referrer.name,
      username: referrer.username,
    },
  });
}
