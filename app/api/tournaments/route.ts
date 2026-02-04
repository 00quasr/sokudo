import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import { eq, desc, gte, lte, and, sql, or } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  tournaments,
  tournamentParticipants,
  challenges,
  categories,
  users,
} from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';

const createTournamentSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  challengeId: z.number().int().positive(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'tournaments', limit: 10, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createTournamentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.errors },
        { status: 400 }
      );
    }

    const { name, description, challengeId, startsAt, endsAt } = result.data;

    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Verify the challenge exists
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

    const status = startDate <= new Date() ? 'active' : 'upcoming';

    const [tournament] = await db
      .insert(tournaments)
      .values({
        name,
        description: description ?? null,
        challengeId,
        status,
        startsAt: startDate,
        endsAt: endDate,
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json(tournament, { status: 201 });
  } catch (error) {
    console.error('Error creating tournament:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'tournaments' });
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    const conditions = [];

    if (status) {
      conditions.push(eq(tournaments.status, status));
    }

    const now = new Date();

    // Auto-transition: upcoming tournaments whose start time has passed become active
    await db
      .update(tournaments)
      .set({ status: 'active', updatedAt: now })
      .where(
        and(
          eq(tournaments.status, 'upcoming'),
          lte(tournaments.startsAt, now)
        )
      );

    // Auto-transition: active tournaments whose end time has passed become completed
    await db
      .update(tournaments)
      .set({ status: 'completed', updatedAt: now })
      .where(
        and(eq(tournaments.status, 'active'), lte(tournaments.endsAt, now))
      );

    const tournamentList = await db
      .select({
        id: tournaments.id,
        name: tournaments.name,
        description: tournaments.description,
        status: tournaments.status,
        startsAt: tournaments.startsAt,
        endsAt: tournaments.endsAt,
        createdAt: tournaments.createdAt,
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
        participantCount:
          sql<number>`(SELECT count(*) FROM tournament_participants WHERE tournament_id = ${tournaments.id})::int`,
        creator: {
          id: users.id,
          name: users.name,
          username: users.username,
        },
      })
      .from(tournaments)
      .innerJoin(challenges, eq(tournaments.challengeId, challenges.id))
      .innerJoin(categories, eq(challenges.categoryId, categories.id))
      .innerJoin(users, eq(tournaments.createdBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(tournaments.startsAt))
      .limit(limit);

    return NextResponse.json({ tournaments: tournamentList });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
