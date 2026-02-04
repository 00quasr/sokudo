import { NextRequest } from 'next/server';
import { getUserAchievements } from '@/lib/db/queries';
import { getUser } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'achievements' });
  if (rateLimitResponse) return rateLimitResponse;

  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const achievements = await getUserAchievements();
  return Response.json(achievements);
}
