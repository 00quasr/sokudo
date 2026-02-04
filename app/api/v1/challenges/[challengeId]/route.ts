import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { challenges, categories } from '@/lib/db/schema';
import { authenticateApiKey } from '@/lib/auth/api-key';
import { apiRateLimit } from '@/lib/rate-limit';

const paramsSchema = z.object({
  challengeId: z.coerce.number().int().positive(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'v1:challenges:detail', limit: 60, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await authenticateApiKey(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const parseResult = paramsSchema.safeParse(resolvedParams);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid challenge ID' },
        { status: 400 }
      );
    }

    const { challengeId } = parseResult.data;

    const [challenge] = await db
      .select({
        id: challenges.id,
        content: challenges.content,
        difficulty: challenges.difficulty,
        syntaxType: challenges.syntaxType,
        hint: challenges.hint,
        avgWpm: challenges.avgWpm,
        timesCompleted: challenges.timesCompleted,
        createdAt: challenges.createdAt,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          icon: categories.icon,
        },
      })
      .from(challenges)
      .innerJoin(categories, eq(challenges.categoryId, categories.id))
      .where(eq(challenges.id, challengeId))
      .limit(1);

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ challenge });
  } catch (error) {
    console.error('Error in GET /api/v1/challenges/[challengeId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
