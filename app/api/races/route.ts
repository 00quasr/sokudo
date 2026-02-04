import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  races,
  raceParticipants,
  challenges,
  categories,
  users,
} from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';

const createRaceSchema = z.object({
  challengeId: z.number().int().positive(),
  maxPlayers: z.number().int().min(2).max(8).default(4),
});

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'races', limit: 30 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createRaceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.errors },
        { status: 400 }
      );
    }

    const { challengeId, maxPlayers } = result.data;

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

    // Create the race
    const [race] = await db
      .insert(races)
      .values({
        challengeId,
        maxPlayers,
        status: 'waiting',
      })
      .returning();

    // Add the creator as the first participant
    await db.insert(raceParticipants).values({
      raceId: race.id,
      userId: user.id,
    });

    return NextResponse.json(race, { status: 201 });
  } catch (error) {
    console.error('Error creating race:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'races' });
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'waiting';

    // Support comma-separated statuses (e.g., "in_progress,countdown" for spectatable races)
    const statuses = status.split(',').map((s) => s.trim()).filter(Boolean);

    const activeRaces = await db
      .select({
        id: races.id,
        status: races.status,
        maxPlayers: races.maxPlayers,
        createdAt: races.createdAt,
        startedAt: races.startedAt,
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
          sql<number>`(SELECT count(*) FROM race_participants WHERE race_id = ${races.id})::int`,
      })
      .from(races)
      .innerJoin(challenges, eq(races.challengeId, challenges.id))
      .innerJoin(categories, eq(challenges.categoryId, categories.id))
      .where(
        statuses.length === 1
          ? eq(races.status, statuses[0])
          : inArray(races.status, statuses)
      )
      .orderBy(desc(races.createdAt))
      .limit(20);

    return NextResponse.json({ races: activeRaces });
  } catch (error) {
    console.error('Error fetching races:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
