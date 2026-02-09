import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit/middleware';
import { getUserRepos, connectRepo, parseGitHubUrl } from '@/lib/repo-scanner';

const connectRepoSchema = z.object({
  url: z.string().url('Invalid URL format'),
});

/**
 * GET /api/repos - List user's connected repositories
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'repos' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const repos = await getUserRepos(user.id);

    return NextResponse.json({ repos });
  } catch (error) {
    console.error('Error fetching repos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/repos - Connect a new GitHub repository
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, {
      prefix: 'repos-connect',
      limit: 10, // 10 connects per hour
      windowMs: 60 * 60 * 1000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = connectRepoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.errors },
        { status: 400 }
      );
    }

    // Validate GitHub URL
    const repoInfo = parseGitHubUrl(parsed.data.url);
    if (!repoInfo) {
      return NextResponse.json(
        { error: 'Invalid GitHub URL. Expected format: https://github.com/owner/repo' },
        { status: 400 }
      );
    }

    // TODO: Get GitHub access token from user's OAuth connection if available
    // For now, only support public repos
    const result = await connectRepo(user.id, parsed.data.url);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ repo: result.repo }, { status: 201 });
  } catch (error) {
    console.error('Error connecting repo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
