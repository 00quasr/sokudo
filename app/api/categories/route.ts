import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, sql, asc, and, or } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { categories, challenges, typingSessions, userProfiles } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';
import { canAccessPremiumCategories } from '@/lib/limits/constants';

const getCategoriesQuerySchema = z.object({
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  isPremium: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  includeProgress: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
});

export type GetCategoriesQuery = z.infer<typeof getCategoriesQuerySchema>;

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'categories' });
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const queryResult = getCategoriesQuerySchema.safeParse({
      difficulty: searchParams.get('difficulty') ?? undefined,
      isPremium: searchParams.get('isPremium') ?? undefined,
      includeProgress: searchParams.get('includeProgress') ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.errors },
        { status: 400 }
      );
    }

    const { difficulty, isPremium, includeProgress } = queryResult.data;

    // Get authenticated user (optional - progress stats require auth)
    const user = await getUser();

    // Check if user can access premium categories
    let canAccessPremium = false;
    if (user) {
      const userProfile = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, user.id))
        .limit(1);

      if (userProfile.length > 0) {
        canAccessPremium = canAccessPremiumCategories(userProfile[0].subscriptionTier);
      }
    }

    // Build where conditions for categories
    const conditions = [];
    if (difficulty) {
      conditions.push(eq(categories.difficulty, difficulty));
    }
    if (isPremium !== undefined) {
      conditions.push(eq(categories.isPremium, isPremium));
    }

    // Filter out premium categories for free users unless explicitly requested
    if (!canAccessPremium && isPremium === undefined) {
      conditions.push(eq(categories.isPremium, false));
    }

    // Get all categories with challenge counts
    const categoriesWithCounts = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        icon: categories.icon,
        difficulty: categories.difficulty,
        isPremium: categories.isPremium,
        displayOrder: categories.displayOrder,
        createdAt: categories.createdAt,
        challengeCount: sql<number>`count(${challenges.id})::int`,
      })
      .from(categories)
      .leftJoin(challenges, eq(categories.id, challenges.categoryId))
      .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)
      .groupBy(categories.id)
      .orderBy(asc(categories.displayOrder), asc(categories.name));

    // If user is authenticated and progress is requested, get progress stats
    let progressMap: Map<number, {
      completedChallenges: number;
      totalSessions: number;
      avgWpm: number;
      avgAccuracy: number;
      bestWpm: number;
    }> | null = null;

    if (user && includeProgress) {
      // Get user's session data grouped by category
      const sessionStats = await db
        .select({
          categoryId: challenges.categoryId,
          completedChallenges: sql<number>`count(distinct ${typingSessions.challengeId})::int`,
          totalSessions: sql<number>`count(${typingSessions.id})::int`,
          avgWpm: sql<number>`coalesce(round(avg(${typingSessions.wpm}))::int, 0)`,
          avgAccuracy: sql<number>`coalesce(round(avg(${typingSessions.accuracy}))::int, 0)`,
          bestWpm: sql<number>`coalesce(max(${typingSessions.wpm})::int, 0)`,
        })
        .from(typingSessions)
        .innerJoin(challenges, eq(typingSessions.challengeId, challenges.id))
        .where(eq(typingSessions.userId, user.id))
        .groupBy(challenges.categoryId);

      progressMap = new Map(
        sessionStats.map((stat) => [
          stat.categoryId,
          {
            completedChallenges: stat.completedChallenges,
            totalSessions: stat.totalSessions,
            avgWpm: stat.avgWpm,
            avgAccuracy: stat.avgAccuracy,
            bestWpm: stat.bestWpm,
          },
        ])
      );
    }

    // Build response with progress stats
    const categoriesResponse = categoriesWithCounts.map((category) => {
      const progress = progressMap?.get(category.id);
      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        difficulty: category.difficulty,
        isPremium: category.isPremium,
        displayOrder: category.displayOrder,
        createdAt: category.createdAt,
        challengeCount: category.challengeCount,
        ...(includeProgress && {
          progress: progress
            ? {
                completedChallenges: progress.completedChallenges,
                totalSessions: progress.totalSessions,
                avgWpm: progress.avgWpm,
                avgAccuracy: progress.avgAccuracy,
                bestWpm: progress.bestWpm,
                completionPercent:
                  category.challengeCount > 0
                    ? Math.round((progress.completedChallenges / category.challengeCount) * 100)
                    : 0,
              }
            : {
                completedChallenges: 0,
                totalSessions: 0,
                avgWpm: 0,
                avgAccuracy: 0,
                bestWpm: 0,
                completionPercent: 0,
              },
        }),
      };
    });

    return NextResponse.json({
      categories: categoriesResponse,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
