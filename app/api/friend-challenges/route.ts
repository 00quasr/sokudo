import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  friendChallenges,
  users,
  challenges,
  categories,
  races,
  raceParticipants,
} from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';

const createFriendChallengeSchema = z.object({
  challengedUsername: z.string().min(1).max(39),
  challengeId: z.number().int().positive(),
  message: z.string().max(255).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'friend-challenges', limit: 30, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createFriendChallengeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.errors },
        { status: 400 }
      );
    }

    const { challengedUsername, challengeId, message } = result.data;

    // Look up the challenged user by username
    const [challengedUser] = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(
        and(
          eq(users.username, challengedUsername),
          sql`${users.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (!challengedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (challengedUser.id === user.id) {
      return NextResponse.json(
        { error: 'Cannot challenge yourself' },
        { status: 400 }
      );
    }

    // Verify the challenge (typing content) exists
    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, challengeId))
      .limit(1);

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Check for existing pending challenge between these users for the same content
    const [existing] = await db
      .select()
      .from(friendChallenges)
      .where(
        and(
          eq(friendChallenges.challengerId, user.id),
          eq(friendChallenges.challengedId, challengedUser.id),
          eq(friendChallenges.challengeId, challengeId),
          eq(friendChallenges.status, 'pending')
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: 'You already have a pending challenge for this user and content' },
        { status: 409 }
      );
    }

    // Create the friend challenge with 24h expiry
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const [friendChallenge] = await db
      .insert(friendChallenges)
      .values({
        challengerId: user.id,
        challengedId: challengedUser.id,
        challengeId,
        message: message ?? null,
        expiresAt,
      })
      .returning();

    return NextResponse.json(friendChallenge, { status: 201 });
  } catch (error) {
    console.error('Error creating friend challenge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'friend-challenges' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'received';

    let condition;
    if (filter === 'sent') {
      condition = eq(friendChallenges.challengerId, user.id);
    } else if (filter === 'all') {
      condition = or(
        eq(friendChallenges.challengerId, user.id),
        eq(friendChallenges.challengedId, user.id)
      );
    } else {
      // 'received' - default
      condition = eq(friendChallenges.challengedId, user.id);
    }

    const result = await db
      .select({
        id: friendChallenges.id,
        status: friendChallenges.status,
        message: friendChallenges.message,
        raceId: friendChallenges.raceId,
        expiresAt: friendChallenges.expiresAt,
        respondedAt: friendChallenges.respondedAt,
        createdAt: friendChallenges.createdAt,
        challenger: {
          id: sql<number>`challenger.id`,
          username: sql<string>`challenger.username`,
          name: sql<string>`challenger.name`,
        },
        challenged: {
          id: sql<number>`challenged.id`,
          username: sql<string>`challenged.username`,
          name: sql<string>`challenged.name`,
        },
        challenge: {
          id: challenges.id,
          content: challenges.content,
          difficulty: challenges.difficulty,
          syntaxType: challenges.syntaxType,
        },
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          icon: categories.icon,
        },
      })
      .from(friendChallenges)
      .innerJoin(
        sql`users as challenger`,
        sql`challenger.id = ${friendChallenges.challengerId}`
      )
      .innerJoin(
        sql`users as challenged`,
        sql`challenged.id = ${friendChallenges.challengedId}`
      )
      .innerJoin(challenges, eq(friendChallenges.challengeId, challenges.id))
      .innerJoin(categories, eq(challenges.categoryId, categories.id))
      .where(condition!)
      .orderBy(desc(friendChallenges.createdAt))
      .limit(50);

    return NextResponse.json({ challenges: result });
  } catch (error) {
    console.error('Error fetching friend challenges:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
