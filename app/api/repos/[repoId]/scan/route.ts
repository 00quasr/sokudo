import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { connectedRepos } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit/middleware';
import { scanRepo } from '@/lib/repo-scanner';

interface RouteParams {
  params: Promise<{ repoId: string }>;
}

/**
 * POST /api/repos/[repoId]/scan - Trigger a scan of the repository
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const rateLimitResponse = apiRateLimit(request, {
      prefix: 'repos-scan',
      limit: 5, // 5 scans per hour
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

    // TODO: Get GitHub access token if available
    const result = await scanRepo(repoIdNum);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      commandCount: result.commandCount,
    });
  } catch (error) {
    console.error('Error scanning repo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/repos/[repoId]/scan - Get scan status
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

    return NextResponse.json({
      status: repo.scanStatus,
      lastScannedAt: repo.lastScannedAt,
      error: repo.errorMessage,
    });
  } catch (error) {
    console.error('Error fetching scan status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
