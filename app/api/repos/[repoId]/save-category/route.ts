import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { connectedRepos } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit/middleware';
import { saveAsCategory } from '@/lib/repo-scanner';

interface RouteParams {
  params: Promise<{ repoId: string }>;
}

const saveCategorySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
});

/**
 * POST /api/repos/[repoId]/save-category - Save generated challenges as a category
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json();
    const parsed = saveCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.errors },
        { status: 400 }
      );
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

    const result = await saveAsCategory(
      repoIdNum,
      user.id,
      parsed.data.name,
      parsed.data.description,
      parsed.data.icon
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      categoryId: result.categoryId,
    });
  } catch (error) {
    console.error('Error saving category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
