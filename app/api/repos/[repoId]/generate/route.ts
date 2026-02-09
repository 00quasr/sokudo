import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { connectedRepos } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit/middleware';
import { generateChallenges, getRepoChallenges } from '@/lib/repo-scanner';

interface RouteParams {
  params: Promise<{ repoId: string }>;
}

/**
 * POST /api/repos/[repoId]/generate - Generate typing challenges from scanned commands
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const rateLimitResponse = apiRateLimit(request, {
      prefix: 'repos-generate',
      limit: 10, // 10 generations per hour
      windowMs: 60 * 60 * 1000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { repoId } = await params;
    const repoIdNum = parseInt(repoId, 10);

    if (isNaN(repoIdNum)) {
      return NextResponse.json({ error: 'Invalid repo ID' }, { status: 400 });
    }

    // Verify ownership
    const [repo] = await db
      .select()
      .from(connectedRepos)
      .where(
        and(eq(connectedRepos.id, repoIdNum), eq(connectedRepos.userId, user.id))
      )
      .limit(1);

    if (!repo) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    const result = await generateChallenges(repoIdNum, user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      challengeCount: result.challengeCount,
    });
  } catch (error) {
    console.error('Error generating challenges:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/repos/[repoId]/generate - Get generated challenges
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'repos' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { repoId } = await params;
    const repoIdNum = parseInt(repoId, 10);

    if (isNaN(repoIdNum)) {
      return NextResponse.json({ error: 'Invalid repo ID' }, { status: 400 });
    }

    // Verify ownership
    const [repo] = await db
      .select()
      .from(connectedRepos)
      .where(
        and(eq(connectedRepos.id, repoIdNum), eq(connectedRepos.userId, user.id))
      )
      .limit(1);

    if (!repo) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    const challenges = await getRepoChallenges(repoIdNum, user.id);

    return NextResponse.json({ challenges });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
