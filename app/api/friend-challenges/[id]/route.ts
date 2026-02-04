import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  friendChallenges,
  races,
  raceParticipants,
} from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';

type RouteParams = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  action: z.enum(['accept', 'decline', 'cancel']),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'friend-challenges:update', limit: 30, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid challenge ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = updateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.errors },
        { status: 400 }
      );
    }

    const { action } = result.data;

    // Get the friend challenge
    const [fc] = await db
      .select()
      .from(friendChallenges)
      .where(eq(friendChallenges.id, id))
      .limit(1);

    if (!fc) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    if (fc.status !== 'pending') {
      return NextResponse.json(
        { error: 'Challenge is no longer pending' },
        { status: 400 }
      );
    }

    // Check expiry
    if (new Date() > fc.expiresAt) {
      await db
        .update(friendChallenges)
        .set({ status: 'expired', updatedAt: new Date() })
        .where(eq(friendChallenges.id, id));

      return NextResponse.json(
        { error: 'Challenge has expired' },
        { status: 400 }
      );
    }

    if (action === 'cancel') {
      // Only the challenger can cancel
      if (fc.challengerId !== user.id) {
        return NextResponse.json(
          { error: 'Only the challenger can cancel' },
          { status: 403 }
        );
      }

      await db
        .update(friendChallenges)
        .set({
          status: 'cancelled',
          respondedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(friendChallenges.id, id));

      return NextResponse.json({ message: 'Challenge cancelled' });
    }

    if (action === 'decline') {
      // Only the challenged user can decline
      if (fc.challengedId !== user.id) {
        return NextResponse.json(
          { error: 'Only the challenged user can decline' },
          { status: 403 }
        );
      }

      await db
        .update(friendChallenges)
        .set({
          status: 'declined',
          respondedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(friendChallenges.id, id));

      return NextResponse.json({ message: 'Challenge declined' });
    }

    if (action === 'accept') {
      // Only the challenged user can accept
      if (fc.challengedId !== user.id) {
        return NextResponse.json(
          { error: 'Only the challenged user can accept' },
          { status: 403 }
        );
      }

      // Create a race for the two players
      const [race] = await db
        .insert(races)
        .values({
          challengeId: fc.challengeId,
          maxPlayers: 2,
          status: 'waiting',
        })
        .returning();

      // Add both users as participants
      await db.insert(raceParticipants).values([
        { raceId: race.id, userId: fc.challengerId },
        { raceId: race.id, userId: fc.challengedId },
      ]);

      // Update the friend challenge with the race ID
      await db
        .update(friendChallenges)
        .set({
          status: 'accepted',
          raceId: race.id,
          respondedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(friendChallenges.id, id));

      return NextResponse.json({
        message: 'Challenge accepted',
        raceId: race.id,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating friend challenge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
