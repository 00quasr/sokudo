import { NextRequest, NextResponse } from 'next/server';
import { asc } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { categories } from '@/lib/db/schema';
import { authenticateApiKey } from '@/lib/auth/api-key';
import { apiRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'v1:categories', limit: 60, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await authenticateApiKey(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    const categoryList = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        icon: categories.icon,
        difficulty: categories.difficulty,
        isPremium: categories.isPremium,
        displayOrder: categories.displayOrder,
      })
      .from(categories)
      .orderBy(asc(categories.displayOrder));

    return NextResponse.json({ categories: categoryList });
  } catch (error) {
    console.error('Error in GET /api/v1/categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
