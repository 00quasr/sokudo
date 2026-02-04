import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPublicChallenges } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  search: z.string().max(200).optional(),
  sortBy: z.enum(['createdAt', 'timesCompleted', 'name', 'score']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  minPracticed: z.coerce.number().int().nonnegative().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'community-challenges' });
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
      minPracticed: searchParams.get('minPracticed') ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.errors },
        { status: 400 }
      );
    }

    const result = await getPublicChallenges(queryResult.data);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching community challenges:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
