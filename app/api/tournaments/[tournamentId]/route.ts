import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import { eq, and, desc, sql, lte } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  tournaments,
  tournamentParticipants,
  challenges,
  categories,
  users,
} from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'tournaments:detail' });
    if (rateLimitResponse) return rateLimitResponse;

    const { tournamentId: tournamentIdStr } = await params;
    const tournamentId = parseInt(tournamentIdStr, 10);
    if (isNaN(tournamentId)) {
      return NextResponse.json(
        { error: 'Invalid tournament ID' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Auto-transition statuses
    await db
      .update(tournaments)
      .set({ status: 'active', updatedAt: now })
      .where(
        and(
          eq(tournaments.id, tournamentId),
          eq(tournaments.status, 'upcoming'),
          lte(tournaments.startsAt, now)
        )
      );
    await db
      .update(tournaments)
      .set({ status: 'completed', updatedAt: now })
      .where(
        and(
          eq(tournaments.id, tournamentId),
          eq(tournaments.status, 'active'),
          lte(tournaments.endsAt, now)
        )
      );

    const [tournament] = await db
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
      .where(eq(tournaments.id, tournamentId))
      .limit(1);

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Get leaderboard
    const leaderboard = await db
      .select({
        id: tournamentParticipants.id,
        userId: tournamentParticipants.userId,
        wpm: tournamentParticipants.wpm,
        rawWpm: tournamentParticipants.rawWpm,
        accuracy: tournamentParticipants.accuracy,
        completedAt: tournamentParticipants.completedAt,
        rank: tournamentParticipants.rank,
        user: {
          id: users.id,
          name: users.name,
          username: users.username,
        },
      })
      .from(tournamentParticipants)
      .innerJoin(users, eq(tournamentParticipants.userId, users.id))
      .where(eq(tournamentParticipants.tournamentId, tournamentId))
      .orderBy(desc(tournamentParticipants.wpm));

    return NextResponse.json({ tournament, leaderboard });
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('join') }),
  z.object({ action: z.literal('leave') }),
  z.object({
    action: z.literal('submit'),
    wpm: z.number().int().min(0),
    rawWpm: z.number().int().min(0),
    accuracy: z.number().int().min(0).max(100),
  }),
]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'tournaments:detail', limit: 30 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tournamentId: tournamentIdStr } = await params;
    const tournamentId = parseInt(tournamentIdStr, 10);
    if (isNaN(tournamentId)) {
      return NextResponse.json(
        { error: 'Invalid tournament ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = actionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.errors },
        { status: 400 }
      );
    }

    const [tournament] = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))
      .limit(1);

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    // Auto-transition statuses inline
    let currentStatus = tournament.status;
    if (currentStatus === 'upcoming' && tournament.startsAt <= now) {
      currentStatus = 'active';
      await db
        .update(tournaments)
        .set({ status: 'active', updatedAt: now })
        .where(eq(tournaments.id, tournamentId));
    }
    if (currentStatus === 'active' && tournament.endsAt <= now) {
      currentStatus = 'completed';
      await db
        .update(tournaments)
        .set({ status: 'completed', updatedAt: now })
        .where(eq(tournaments.id, tournamentId));
    }

    const { action } = result.data;

    if (action === 'join') {
      if (currentStatus === 'completed') {
        return NextResponse.json(
          { error: 'Tournament has ended' },
          { status: 400 }
        );
      }

      // Check if already joined
      const [existing] = await db
        .select()
        .from(tournamentParticipants)
        .where(
          and(
            eq(tournamentParticipants.tournamentId, tournamentId),
            eq(tournamentParticipants.userId, user.id)
          )
        )
        .limit(1);

      if (existing) {
        return NextResponse.json(
          { error: 'Already joined this tournament' },
          { status: 400 }
        );
      }

      const [participant] = await db
        .insert(tournamentParticipants)
        .values({
          tournamentId,
          userId: user.id,
        })
        .returning();

      return NextResponse.json(participant, { status: 201 });
    }

    if (action === 'leave') {
      const [existing] = await db
        .select()
        .from(tournamentParticipants)
        .where(
          and(
            eq(tournamentParticipants.tournamentId, tournamentId),
            eq(tournamentParticipants.userId, user.id)
          )
        )
        .limit(1);

      if (!existing) {
        return NextResponse.json(
          { error: 'Not a participant' },
          { status: 400 }
        );
      }

      if (existing.completedAt) {
        return NextResponse.json(
          { error: 'Cannot leave after submitting a result' },
          { status: 400 }
        );
      }

      await db
        .delete(tournamentParticipants)
        .where(eq(tournamentParticipants.id, existing.id));

      return NextResponse.json({ success: true });
    }

    if (action === 'submit') {
      if (currentStatus !== 'active') {
        return NextResponse.json(
          {
            error:
              currentStatus === 'upcoming'
                ? 'Tournament has not started yet'
                : 'Tournament has ended',
          },
          { status: 400 }
        );
      }

      const { wpm, rawWpm, accuracy } = result.data;

      // Check if participant exists
      const [existing] = await db
        .select()
        .from(tournamentParticipants)
        .where(
          and(
            eq(tournamentParticipants.tournamentId, tournamentId),
            eq(tournamentParticipants.userId, user.id)
          )
        )
        .limit(1);

      if (!existing) {
        return NextResponse.json(
          { error: 'You must join the tournament first' },
          { status: 400 }
        );
      }

      // Update with the best WPM (allow resubmission with higher score)
      if (existing.wpm !== null && wpm <= existing.wpm) {
        return NextResponse.json({
          message: 'Previous score was higher or equal',
          participant: existing,
        });
      }

      const [updated] = await db
        .update(tournamentParticipants)
        .set({
          wpm,
          rawWpm,
          accuracy,
          completedAt: now,
        })
        .where(eq(tournamentParticipants.id, existing.id))
        .returning();

      // Recalculate ranks for all participants in this tournament
      await db.execute(sql`
        UPDATE tournament_participants tp
        SET rank = ranked.new_rank
        FROM (
          SELECT id, ROW_NUMBER() OVER (ORDER BY wpm DESC NULLS LAST) as new_rank
          FROM tournament_participants
          WHERE tournament_id = ${tournamentId}
          AND completed_at IS NOT NULL
        ) ranked
        WHERE tp.id = ranked.id
      `);

      // Fetch updated participant with rank
      const [withRank] = await db
        .select()
        .from(tournamentParticipants)
        .where(eq(tournamentParticipants.id, updated.id))
        .limit(1);

      return NextResponse.json(withRank);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating tournament:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
