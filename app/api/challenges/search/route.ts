import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { searchChallenges, getCategories } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  search: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  sortBy: z.enum(['timesCompleted', 'avgWpm', 'createdAt', 'difficulty']).default('timesCompleted'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'challenges:search' });
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      difficulty: searchParams.get('difficulty') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.errors },
        { status: 400 }
      );
    }

    const [result, categoriesList] = await Promise.all([
      searchChallenges(queryResult.data),
      getCategories(),
    ]);

    return NextResponse.json({
      ...result,
      categories: categoriesList.map((c) => ({
        slug: c.slug,
        name: c.name,
        icon: c.icon,
      })),
    });
  } catch (error) {
    console.error('Error searching challenges:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
