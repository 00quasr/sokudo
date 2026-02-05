import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimit } from '@/lib/rate-limit';
import { authenticateApiKey, hasScope } from '@/lib/auth/api-key';
import { getUserStatsOverview } from '@/lib/db/queries';

/**
 * GET /api/v1/user/stats
 * Get comprehensive user statistics (for Zapier actions).
 * Requires API key with 'read' or '*' scope via Bearer authentication.
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'v1:user:stats', limit: 60, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await authenticateApiKey(request);
    if (!user) {
      return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
    }

    if (!hasScope(user, 'read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const stats = await getUserStatsOverview();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      stats,
    });
  } catch (error) {
    console.error('Error in GET /api/v1/user/stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
