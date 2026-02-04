import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  races,
  raceParticipants,
  challenges,
  categories,
  users,
} from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';

type RouteParams = { params: Promise<{ raceId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'races:detail' });
    if (rateLimitResponse) return rateLimitResponse;

    const { raceId: raceIdStr } = await params;
    const raceId = parseInt(raceIdStr, 10);

    if (isNaN(raceId)) {
      return NextResponse.json(
        { error: 'Invalid race ID' },
        { status: 400 }
      );
    }

    const [race] = await db
      .select({
        id: races.id,
        status: races.status,
        maxPlayers: races.maxPlayers,
        createdAt: races.createdAt,
        startedAt: races.startedAt,
        updatedAt: races.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          icon: categories.icon,
          difficulty: categories.difficulty,
        },
      })
      .from(races)
      .innerJoin(categories, eq(races.categoryId, categories.id))
      .where(eq(races.id, raceId))
      .limit(1);

    if (!race) {
      return NextResponse.json({ error: 'Race not found' }, { status: 404 });
    }

    // Get all challenges for this category
    const categoryChallenges = await db
      .select({
        id: challenges.id,
        content: challenges.content,
        difficulty: challenges.difficulty,
        syntaxType: challenges.syntaxType,
      })
      .from(challenges)
      .where(eq(challenges.categoryId, race.category.id))
      .orderBy(challenges.id);

    // Get participants with their current challenge index
    const participants = await db
      .select({
        id: raceParticipants.id,
        userId: raceParticipants.userId,
        currentChallengeIndex: raceParticipants.currentChallengeIndex,
        wpm: raceParticipants.wpm,
        accuracy: raceParticipants.accuracy,
        finishedAt: raceParticipants.finishedAt,
        rank: raceParticipants.rank,
        userName: users.name,
        userEmail: users.email,
      })
      .from(raceParticipants)
      .innerJoin(users, eq(raceParticipants.userId, users.id))
      .where(eq(raceParticipants.raceId, raceId));

    return NextResponse.json({ ...race, challenges: categoryChallenges, participants });
  } catch (error) {
    console.error('Error fetching race:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

const joinRaceSchema = z.object({
  action: z.enum(['join', 'leave', 'start', 'finish', 'advanceChallenge']),
  wpm: z.number().int().nonnegative().optional(),
  accuracy: z.number().int().min(0).max(100).optional(),
  challengeWpm: z.number().int().nonnegative().optional(),
  challengeAccuracy: z.number().int().min(0).max(100).optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'races:detail', limit: 30 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { raceId: raceIdStr } = await params;
    const raceId = parseInt(raceIdStr, 10);

    if (isNaN(raceId)) {
      return NextResponse.json(
        { error: 'Invalid race ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = joinRaceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.errors },
        { status: 400 }
      );
    }

    const { action, wpm, accuracy, challengeWpm, challengeAccuracy } = result.data;

    // Get the race
    const [race] = await db
      .select()
      .from(races)
      .where(eq(races.id, raceId))
      .limit(1);

    if (!race) {
      return NextResponse.json({ error: 'Race not found' }, { status: 404 });
    }

    if (action === 'join') {
      if (race.status !== 'waiting') {
        return NextResponse.json(
          { error: 'Race is not accepting participants' },
          { status: 400 }
        );
      }

      // Check participant count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(raceParticipants)
        .where(eq(raceParticipants.raceId, raceId));

      if (count >= race.maxPlayers) {
        return NextResponse.json({ error: 'Race is full' }, { status: 400 });
      }

      // Check if user is already in the race
      const [existing] = await db
        .select()
        .from(raceParticipants)
        .where(
          and(
            eq(raceParticipants.raceId, raceId),
            eq(raceParticipants.userId, user.id)
          )
        )
        .limit(1);

      if (existing) {
        return NextResponse.json(
          { error: 'Already in this race' },
          { status: 400 }
        );
      }

      await db.insert(raceParticipants).values({
        raceId,
        userId: user.id,
      });

      return NextResponse.json({ message: 'Joined race' });
    }

    if (action === 'leave') {
      if (race.status !== 'waiting') {
        return NextResponse.json(
          { error: 'Cannot leave a race that has started' },
          { status: 400 }
        );
      }

      await db
        .delete(raceParticipants)
        .where(
          and(
            eq(raceParticipants.raceId, raceId),
            eq(raceParticipants.userId, user.id)
          )
        );

      return NextResponse.json({ message: 'Left race' });
    }

    if (action === 'start') {
      if (race.status !== 'waiting') {
        return NextResponse.json(
          { error: 'Race has already started or finished' },
          { status: 400 }
        );
      }

      // Transition through countdown to in_progress with a scheduled start time
      const startTime = new Date(Date.now() + 4000); // 3s countdown + 1s buffer
      await db
        .update(races)
        .set({ status: 'countdown', startedAt: startTime, updatedAt: new Date() })
        .where(eq(races.id, raceId));

      return NextResponse.json({ message: 'Race countdown started', startTime: startTime.toISOString() });
    }

    if (action === 'advanceChallenge') {
      if (race.status !== 'in_progress') {
        return NextResponse.json(
          { error: 'Race is not in progress' },
          { status: 400 }
        );
      }

      // Get participant's current challenge index
      const [participant] = await db
        .select()
        .from(raceParticipants)
        .where(
          and(
            eq(raceParticipants.raceId, raceId),
            eq(raceParticipants.userId, user.id)
          )
        )
        .limit(1);

      if (!participant) {
        return NextResponse.json(
          { error: 'Not a participant in this race' },
          { status: 400 }
        );
      }

      // Get total challenges count for this category
      const [{ challengeCount }] = await db
        .select({
          challengeCount: sql<number>`count(*)::int`,
        })
        .from(challenges)
        .where(eq(challenges.categoryId, race.categoryId));

      const nextIndex = participant.currentChallengeIndex + 1;

      // If this was the last challenge, finish the race for this participant
      if (nextIndex >= challengeCount) {
        return NextResponse.json({
          message: 'Completed all challenges',
          isLastChallenge: true,
          currentChallengeIndex: nextIndex,
        });
      }

      // Advance to next challenge
      await db
        .update(raceParticipants)
        .set({
          currentChallengeIndex: nextIndex,
        })
        .where(
          and(
            eq(raceParticipants.raceId, raceId),
            eq(raceParticipants.userId, user.id)
          )
        );

      return NextResponse.json({
        message: 'Advanced to next challenge',
        currentChallengeIndex: nextIndex,
        isLastChallenge: false,
      });
    }

    if (action === 'finish') {
      if (race.status !== 'in_progress') {
        return NextResponse.json(
          { error: 'Race is not in progress' },
          { status: 400 }
        );
      }

      if (wpm === undefined || accuracy === undefined) {
        return NextResponse.json(
          { error: 'wpm and accuracy are required for finish action' },
          { status: 400 }
        );
      }

      // Determine rank based on existing finishers
      const [{ finishedCount }] = await db
        .select({
          finishedCount: sql<number>`count(*)::int`,
        })
        .from(raceParticipants)
        .where(
          and(
            eq(raceParticipants.raceId, raceId),
            sql`${raceParticipants.finishedAt} IS NOT NULL`
          )
        );

      const rank = finishedCount + 1;

      await db
        .update(raceParticipants)
        .set({
          wpm,
          accuracy,
          finishedAt: new Date(),
          rank,
        })
        .where(
          and(
            eq(raceParticipants.raceId, raceId),
            eq(raceParticipants.userId, user.id)
          )
        );

      // Check if all participants have finished
      const [{ totalCount }] = await db
        .select({ totalCount: sql<number>`count(*)::int` })
        .from(raceParticipants)
        .where(eq(raceParticipants.raceId, raceId));

      const [{ newFinishedCount }] = await db
        .select({
          newFinishedCount: sql<number>`count(*)::int`,
        })
        .from(raceParticipants)
        .where(
          and(
            eq(raceParticipants.raceId, raceId),
            sql`${raceParticipants.finishedAt} IS NOT NULL`
          )
        );

      if (newFinishedCount >= totalCount) {
        await db
          .update(races)
          .set({ status: 'finished', updatedAt: new Date() })
          .where(eq(races.id, raceId));
      }

      return NextResponse.json({ message: 'Finished race', rank });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating race:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
