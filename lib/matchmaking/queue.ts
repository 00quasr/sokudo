import { db } from '@/lib/db/drizzle';
import { typingSessions, challenges, races, raceParticipants } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

// --- Types ---

export interface QueueEntry {
  userId: number;
  userName: string;
  averageWpm: number;
  joinedAt: number; // Date.now()
}

export interface MatchResult {
  raceId: number;
  players: QueueEntry[];
}

export interface MatchmakingConfig {
  /** WPM range for matching players (e.g., 15 means +/- 15 WPM) */
  wpmRange: number;
  /** Minimum players to start a match */
  minPlayers: number;
  /** Maximum players per match */
  maxPlayers: number;
  /** How long to wait before expanding the range (ms) */
  expandAfterMs: number;
  /** How much to expand the range each interval */
  expandStep: number;
  /** Maximum expanded WPM range */
  maxWpmRange: number;
}

const DEFAULT_CONFIG: MatchmakingConfig = {
  wpmRange: 15,
  minPlayers: 2,
  maxPlayers: 4,
  expandAfterMs: 10000,
  expandStep: 10,
  maxWpmRange: 50,
};

// --- Matchmaking Queue ---

export class MatchmakingQueue {
  private queue: Map<number, QueueEntry> = new Map(); // userId -> entry
  private config: MatchmakingConfig;
  private onMatch: ((result: MatchResult) => void) | null = null;
  private matchCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<MatchmakingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  setOnMatch(callback: (result: MatchResult) => void): void {
    this.onMatch = callback;
  }

  async addPlayer(userId: number, userName: string): Promise<QueueEntry> {
    // Calculate average WPM from recent sessions
    const averageWpm = await getPlayerAverageWpm(userId);

    const entry: QueueEntry = {
      userId,
      userName,
      averageWpm,
      joinedAt: Date.now(),
    };

    this.queue.set(userId, entry);

    return entry;
  }

  addPlayerWithWpm(userId: number, userName: string, averageWpm: number): QueueEntry {
    const entry: QueueEntry = {
      userId,
      userName,
      averageWpm,
      joinedAt: Date.now(),
    };

    this.queue.set(userId, entry);

    return entry;
  }

  removePlayer(userId: number): boolean {
    return this.queue.delete(userId);
  }

  isInQueue(userId: number): boolean {
    return this.queue.has(userId);
  }

  getEntry(userId: number): QueueEntry | undefined {
    return this.queue.get(userId);
  }

  getQueueSize(): number {
    return this.queue.size;
  }

  getQueueSnapshot(): QueueEntry[] {
    return Array.from(this.queue.values());
  }

  /** Try to find a match among queued players */
  tryMatch(): MatchResult | null {
    if (this.queue.size < this.config.minPlayers) {
      return null;
    }

    const players = Array.from(this.queue.values());

    // Sort by WPM for easier range matching
    players.sort((a, b) => a.averageWpm - b.averageWpm);

    // Find the best group of players within WPM range
    const match = this.findBestGroup(players);

    if (match && match.length >= this.config.minPlayers) {
      // Remove matched players from queue
      for (const player of match) {
        this.queue.delete(player.userId);
      }

      // Create match result (race creation happens via callback)
      const result: MatchResult = {
        raceId: 0, // Will be set after race creation
        players: match,
      };

      return result;
    }

    return null;
  }

  private findBestGroup(sortedPlayers: QueueEntry[]): QueueEntry[] | null {
    const now = Date.now();
    let bestGroup: QueueEntry[] | null = null;

    for (let i = 0; i < sortedPlayers.length; i++) {
      const anchor = sortedPlayers[i];
      // Calculate effective range based on wait time
      const waitTimeMs = now - anchor.joinedAt;
      const expansions = Math.floor(waitTimeMs / this.config.expandAfterMs);
      const effectiveRange = Math.min(
        this.config.wpmRange + expansions * this.config.expandStep,
        this.config.maxWpmRange
      );

      const group: QueueEntry[] = [anchor];

      for (let j = i + 1; j < sortedPlayers.length; j++) {
        const candidate = sortedPlayers[j];
        const wpmDiff = Math.abs(candidate.averageWpm - anchor.averageWpm);

        // Check effective range for both players (use the wider one)
        const candidateWaitMs = now - candidate.joinedAt;
        const candidateExpansions = Math.floor(candidateWaitMs / this.config.expandAfterMs);
        const candidateRange = Math.min(
          this.config.wpmRange + candidateExpansions * this.config.expandStep,
          this.config.maxWpmRange
        );

        const maxRange = Math.max(effectiveRange, candidateRange);

        if (wpmDiff <= maxRange) {
          group.push(candidate);
          if (group.length >= this.config.maxPlayers) break;
        }
      }

      if (
        group.length >= this.config.minPlayers &&
        (!bestGroup || group.length > bestGroup.length)
      ) {
        bestGroup = group;
      }
    }

    return bestGroup;
  }

  startPeriodicMatching(intervalMs: number = 3000): void {
    if (this.matchCheckInterval) return;
    this.matchCheckInterval = setInterval(() => {
      const result = this.tryMatch();
      if (result && this.onMatch) {
        this.onMatch(result);
      }
    }, intervalMs);
  }

  stopPeriodicMatching(): void {
    if (this.matchCheckInterval) {
      clearInterval(this.matchCheckInterval);
      this.matchCheckInterval = null;
    }
  }

  clear(): void {
    this.queue.clear();
  }
}

// --- WPM calculation helpers ---

/** Get a player's average WPM from their recent typing sessions */
export async function getPlayerAverageWpm(
  userId: number,
  recentCount: number = 10
): Promise<number> {
  const sessions = await db
    .select({ wpm: typingSessions.wpm })
    .from(typingSessions)
    .where(eq(typingSessions.userId, userId))
    .orderBy(desc(typingSessions.completedAt))
    .limit(recentCount);

  if (sessions.length === 0) {
    return 40; // Default WPM for new players
  }

  const total = sessions.reduce((sum, s) => sum + s.wpm, 0);
  return Math.round(total / sessions.length);
}

/** Pick a random challenge appropriate for the matched players' skill level */
export async function pickMatchChallenge(
  averageWpm: number
): Promise<number | null> {
  // Map WPM to difficulty
  let difficulty: string;
  if (averageWpm < 30) {
    difficulty = 'beginner';
  } else if (averageWpm < 60) {
    difficulty = 'intermediate';
  } else {
    difficulty = 'advanced';
  }

  const matchingChallenges = await db
    .select({ id: challenges.id })
    .from(challenges)
    .where(eq(challenges.difficulty, difficulty))
    .orderBy(sql`RANDOM()`)
    .limit(1);

  if (matchingChallenges.length > 0) {
    return matchingChallenges[0].id;
  }

  // Fallback: any challenge
  const fallback = await db
    .select({ id: challenges.id })
    .from(challenges)
    .orderBy(sql`RANDOM()`)
    .limit(1);

  return fallback.length > 0 ? fallback[0].id : null;
}

/** Create a race from a matchmaking result */
export async function createMatchedRace(
  players: QueueEntry[],
  challengeId: number
): Promise<number> {
  const [race] = await db
    .insert(races)
    .values({
      challengeId,
      maxPlayers: players.length,
      status: 'waiting',
    })
    .returning();

  // Add all matched players as participants
  await db.insert(raceParticipants).values(
    players.map((p) => ({
      raceId: race.id,
      userId: p.userId,
    }))
  );

  return race.id;
}

// --- Singleton ---

let globalQueue: MatchmakingQueue | null = null;

export function getMatchmakingQueue(): MatchmakingQueue {
  if (!globalQueue) {
    globalQueue = new MatchmakingQueue();
    globalQueue.startPeriodicMatching();
  }
  return globalQueue;
}
