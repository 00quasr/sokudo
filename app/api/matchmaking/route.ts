import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimit } from '@/lib/rate-limit';
import { getUser } from '@/lib/db/queries';
import {
  getMatchmakingQueue,
  getPlayerAverageWpm,
  pickMatchCategory,
  createMatchedRace,
} from '@/lib/matchmaking/queue';

/** POST /api/matchmaking - Join the matchmaking queue */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'matchmaking', limit: 30 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const queue = getMatchmakingQueue();

    if (queue.isInQueue(user.id)) {
      return NextResponse.json(
        { error: 'Already in matchmaking queue' },
        { status: 400 }
      );
    }

    const entry = await queue.addPlayer(user.id, user.name || user.email);

    // Try to match immediately
    const match = queue.tryMatch();
    if (match) {
      const groupAvgWpm =
        match.players.reduce((sum, p) => sum + p.averageWpm, 0) /
        match.players.length;
      const categoryId = await pickMatchCategory(groupAvgWpm);

      if (categoryId) {
        const raceId = await createMatchedRace(match.players, categoryId);
        match.raceId = raceId;

        return NextResponse.json({
          status: 'matched',
          raceId,
          players: match.players.map((p) => ({
            userId: p.userId,
            userName: p.userName,
            averageWpm: p.averageWpm,
          })),
        });
      }
    }

    return NextResponse.json({
      status: 'queued',
      position: queue.getQueueSize(),
      averageWpm: entry.averageWpm,
    });
  } catch (error) {
    console.error('Error joining matchmaking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/** GET /api/matchmaking - Get matchmaking status */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'matchmaking' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const queue = getMatchmakingQueue();
    const entry = queue.getEntry(user.id);

    if (!entry) {
      return NextResponse.json({ status: 'not_queued' });
    }

    return NextResponse.json({
      status: 'queued',
      averageWpm: entry.averageWpm,
      waitingSince: entry.joinedAt,
      queueSize: queue.getQueueSize(),
    });
  } catch (error) {
    console.error('Error checking matchmaking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/** DELETE /api/matchmaking - Leave the matchmaking queue */
export async function DELETE(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'matchmaking', limit: 30 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const queue = getMatchmakingQueue();
    const removed = queue.removePlayer(user.id);

    return NextResponse.json({
      status: removed ? 'removed' : 'not_in_queue',
    });
  } catch (error) {
    console.error('Error leaving matchmaking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
