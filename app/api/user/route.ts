import { NextRequest } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'user' });
  if (rateLimitResponse) return rateLimitResponse;

  const user = await getUser();
  return Response.json(user);
}
