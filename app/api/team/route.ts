import { NextRequest } from 'next/server';
import { getTeamForUser } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'team' });
  if (rateLimitResponse) return rateLimitResponse;

  const team = await getTeamForUser();
  return Response.json(team);
}
