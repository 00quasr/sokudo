import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { connectedRepos } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit/middleware';
import { deleteRepo } from '@/lib/repo-scanner';

interface RouteParams {
  params: Promise<{ repoId: string }>;
}

/**
 * GET /api/repos/[repoId] - Get repository details
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

    return NextResponse.json({ repo });
  } catch (error) {
    console.error('Error fetching repo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/repos/[repoId] - Delete a connected repository
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const deleted = await deleteRepo(repoIdNum, user.id);

    if (!deleted) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting repo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
