import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq, asc, desc, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { challenges, categories } from '@/lib/db/schema';
import { authenticateApiKey } from '@/lib/auth/api-key';
import { apiRateLimit } from '@/lib/rate-limit';

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  categoryId: z.coerce.number().int().positive().optional(),
  categorySlug: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  syntaxType: z.string().optional(),
  sortBy: z
    .enum(['id', 'difficulty', 'avgWpm', 'timesCompleted', 'createdAt'])
    .default('id'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export async function GET(request: NextRequest) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'v1:challenges', limit: 60, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await authenticateApiKey(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      categoryId: searchParams.get('categoryId') ?? undefined,
      categorySlug: searchParams.get('categorySlug') ?? undefined,
      difficulty: searchParams.get('difficulty') ?? undefined,
      syntaxType: searchParams.get('syntaxType') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.errors },
        { status: 400 }
      );
    }

    const { page, limit, categoryId, categorySlug, difficulty, syntaxType, sortBy, sortOrder } =
      queryResult.data;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (categoryId) conditions.push(eq(challenges.categoryId, categoryId));
    if (categorySlug) conditions.push(eq(categories.slug, categorySlug));
    if (difficulty) conditions.push(eq(challenges.difficulty, difficulty));
    if (syntaxType) conditions.push(eq(challenges.syntaxType, syntaxType));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(challenges)
      .innerJoin(categories, eq(challenges.categoryId, categories.id))
      .where(whereClause);

    const total = countResult?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    const sortColumn = {
      id: challenges.id,
      difficulty: challenges.difficulty,
      avgWpm: challenges.avgWpm,
      timesCompleted: challenges.timesCompleted,
      createdAt: challenges.createdAt,
    }[sortBy];

    const orderBy = sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn);

    const challengesList = await db
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
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      challenges: challengesList,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/v1/challenges:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
