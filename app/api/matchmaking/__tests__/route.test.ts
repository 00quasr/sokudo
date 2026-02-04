import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET, DELETE } from '../route';

// Mock dependencies
vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
}));

vi.mock('@/lib/matchmaking/queue', () => {
  const mockQueue = {
    isInQueue: vi.fn(),
    addPlayer: vi.fn(),
    removePlayer: vi.fn(),
    getEntry: vi.fn(),
    getQueueSize: vi.fn(),
    tryMatch: vi.fn(),
  };

  return {
    getMatchmakingQueue: () => mockQueue,
    getPlayerAverageWpm: vi.fn(),
    pickMatchCategory: vi.fn(),
    createMatchedRace: vi.fn(),
    __mockQueue: mockQueue,
  };
});

import { getUser } from '@/lib/db/queries';
import { getMatchmakingQueue, pickMatchCategory, createMatchedRace } from '@/lib/matchmaking/queue';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockPickMatchCategory = pickMatchCategory as ReturnType<typeof vi.fn>;
const mockCreateMatchedRace = createMatchedRace as ReturnType<typeof vi.fn>;

function getMockQueue() {
  return getMatchmakingQueue() as ReturnType<typeof getMatchmakingQueue> & {
    isInQueue: ReturnType<typeof vi.fn>;
    addPlayer: ReturnType<typeof vi.fn>;
    removePlayer: ReturnType<typeof vi.fn>;
    getEntry: ReturnType<typeof vi.fn>;
    getQueueSize: ReturnType<typeof vi.fn>;
    tryMatch: ReturnType<typeof vi.fn>;
  };
}

describe('/api/matchmaking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST - join matchmaking queue', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetUser.mockResolvedValue(null);

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 if user is already in queue', async () => {
      mockGetUser.mockResolvedValue({ id: 1, name: 'Alice', email: 'alice@test.com' });
      const queue = getMockQueue();
      queue.isInQueue.mockReturnValue(true);

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Already in matchmaking queue');
    });

    it('should add player to queue and return queued status', async () => {
      mockGetUser.mockResolvedValue({ id: 1, name: 'Alice', email: 'alice@test.com' });
      const queue = getMockQueue();
      queue.isInQueue.mockReturnValue(false);
      queue.addPlayer.mockResolvedValue({
        userId: 1,
        userName: 'Alice',
        averageWpm: 50,
        joinedAt: Date.now(),
      });
      queue.tryMatch.mockReturnValue(null);
      queue.getQueueSize.mockReturnValue(1);

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('queued');
      expect(data.averageWpm).toBe(50);
      expect(data.position).toBe(1);
    });

    it('should return matched status when instant match found', async () => {
      mockGetUser.mockResolvedValue({ id: 1, name: 'Alice', email: 'alice@test.com' });
      const queue = getMockQueue();
      queue.isInQueue.mockReturnValue(false);
      queue.addPlayer.mockResolvedValue({
        userId: 1,
        userName: 'Alice',
        averageWpm: 50,
        joinedAt: Date.now(),
      });
      queue.tryMatch.mockReturnValue({
        raceId: 0,
        players: [
          { userId: 1, userName: 'Alice', averageWpm: 50, joinedAt: Date.now() },
          { userId: 2, userName: 'Bob', averageWpm: 55, joinedAt: Date.now() },
        ],
      });
      mockPickMatchChallenge.mockResolvedValue(42);
      mockCreateMatchedRace.mockResolvedValue(100);

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('matched');
      expect(data.raceId).toBe(100);
      expect(data.players).toHaveLength(2);
    });

    it('should use email when name is not available', async () => {
      mockGetUser.mockResolvedValue({ id: 1, name: null, email: 'alice@test.com' });
      const queue = getMockQueue();
      queue.isInQueue.mockReturnValue(false);
      queue.addPlayer.mockResolvedValue({
        userId: 1,
        userName: 'alice@test.com',
        averageWpm: 40,
        joinedAt: Date.now(),
      });
      queue.tryMatch.mockReturnValue(null);
      queue.getQueueSize.mockReturnValue(1);

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(queue.addPlayer).toHaveBeenCalledWith(1, 'alice@test.com');
    });
  });

  describe('GET - check matchmaking status', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetUser.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return not_queued when user is not in queue', async () => {
      mockGetUser.mockResolvedValue({ id: 1, name: 'Alice', email: 'alice@test.com' });
      const queue = getMockQueue();
      queue.getEntry.mockReturnValue(undefined);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('not_queued');
    });

    it('should return queued status with details', async () => {
      mockGetUser.mockResolvedValue({ id: 1, name: 'Alice', email: 'alice@test.com' });
      const queue = getMockQueue();
      queue.getEntry.mockReturnValue({
        userId: 1,
        userName: 'Alice',
        averageWpm: 50,
        joinedAt: 1700000000000,
      });
      queue.getQueueSize.mockReturnValue(3);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('queued');
      expect(data.averageWpm).toBe(50);
      expect(data.waitingSince).toBe(1700000000000);
      expect(data.queueSize).toBe(3);
    });
  });

  describe('DELETE - leave matchmaking queue', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetUser.mockResolvedValue(null);

      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should remove player and return removed status', async () => {
      mockGetUser.mockResolvedValue({ id: 1, name: 'Alice', email: 'alice@test.com' });
      const queue = getMockQueue();
      queue.removePlayer.mockReturnValue(true);

      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('removed');
    });

    it('should return not_in_queue when player was not queued', async () => {
      mockGetUser.mockResolvedValue({ id: 1, name: 'Alice', email: 'alice@test.com' });
      const queue = getMockQueue();
      queue.removePlayer.mockReturnValue(false);

      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('not_in_queue');
    });
  });
});
