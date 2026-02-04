import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH } from '../route';

// Mock the database
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    execute: vi.fn(),
  },
}));

// Mock getUser
vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
}));

import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  innerJoin: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  returning: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  execute: ReturnType<typeof vi.fn>;
};

const mockGetUser = getUser as ReturnType<typeof vi.fn>;

function createMockRequest(
  url: string,
  options?: { method?: string; body?: Record<string, unknown> }
): NextRequest {
  const req = {
    url,
    method: options?.method || 'GET',
    json: vi.fn().mockResolvedValue(options?.body || {}),
  } as unknown as NextRequest;
  return req;
}

function createParams(tournamentId: string) {
  return Promise.resolve({ tournamentId });
}

describe('GET /api/tournaments/[tournamentId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 for invalid tournament ID', async () => {
    const request = createMockRequest(
      'http://localhost:3000/api/tournaments/abc'
    );
    const response = await GET(request, { params: createParams('abc') });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid tournament ID');
  });

  it('should return 404 when tournament does not exist', async () => {
    // Mock auto-transition updates
    const mockUpdateWhere = vi.fn().mockResolvedValue([]);
    const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
    mockDb.update.mockReturnValue({ set: mockUpdateSet });

    // Mock tournament select - returns empty
    const mockLimitFn = vi.fn().mockResolvedValue([]);
    const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
    const mockInnerJoinFn3 = vi.fn().mockReturnValue({ where: mockWhereFn });
    const mockInnerJoinFn2 = vi
      .fn()
      .mockReturnValue({ innerJoin: mockInnerJoinFn3 });
    const mockInnerJoinFn = vi
      .fn()
      .mockReturnValue({ innerJoin: mockInnerJoinFn2 });
    const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
    const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

    mockDb.select.mockImplementation(mockSelectFn);

    const request = createMockRequest(
      'http://localhost:3000/api/tournaments/999'
    );
    const response = await GET(request, { params: createParams('999') });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Tournament not found');
  });

  it('should return tournament with leaderboard', async () => {
    const mockTournament = {
      id: 1,
      name: 'Weekly Git Tournament',
      description: 'Test your git skills',
      status: 'active',
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      challenge: {
        id: 1,
        content: 'git status',
        difficulty: 'beginner',
        syntaxType: 'git',
      },
      category: { id: 1, name: 'Git Basics', slug: 'git-basics', icon: null },
      creator: { id: 1, name: 'Test User', username: 'testuser' },
    };

    const mockLeaderboard = [
      {
        id: 1,
        userId: 2,
        wpm: 85,
        rawWpm: 90,
        accuracy: 95,
        completedAt: new Date().toISOString(),
        rank: 1,
        user: { id: 2, name: 'Top Player', username: 'topplayer' },
      },
    ];

    // Mock auto-transition updates
    const mockUpdateWhere = vi.fn().mockResolvedValue([]);
    const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
    mockDb.update.mockReturnValue({ set: mockUpdateSet });

    // First select: tournament lookup
    const mockLimitFn1 = vi.fn().mockResolvedValue([mockTournament]);
    const mockWhereFn1 = vi.fn().mockReturnValue({ limit: mockLimitFn1 });
    const mockInnerJoinFn3_1 = vi.fn().mockReturnValue({ where: mockWhereFn1 });
    const mockInnerJoinFn2_1 = vi
      .fn()
      .mockReturnValue({ innerJoin: mockInnerJoinFn3_1 });
    const mockInnerJoinFn_1 = vi
      .fn()
      .mockReturnValue({ innerJoin: mockInnerJoinFn2_1 });
    const mockFromFn1 = vi
      .fn()
      .mockReturnValue({ innerJoin: mockInnerJoinFn_1 });
    const mockSelectFn1 = vi.fn().mockReturnValue({ from: mockFromFn1 });

    // Second select: leaderboard
    const mockOrderByFn2 = vi.fn().mockResolvedValue(mockLeaderboard);
    const mockWhereFn2 = vi.fn().mockReturnValue({ orderBy: mockOrderByFn2 });
    const mockInnerJoinFn_2 = vi
      .fn()
      .mockReturnValue({ where: mockWhereFn2 });
    const mockFromFn2 = vi
      .fn()
      .mockReturnValue({ innerJoin: mockInnerJoinFn_2 });
    const mockSelectFn2 = vi.fn().mockReturnValue({ from: mockFromFn2 });

    mockDb.select
      .mockImplementationOnce(mockSelectFn1)
      .mockImplementationOnce(mockSelectFn2);

    const request = createMockRequest(
      'http://localhost:3000/api/tournaments/1'
    );
    const response = await GET(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tournament).toBeDefined();
    expect(data.tournament.name).toBe('Weekly Git Tournament');
    expect(data.leaderboard).toBeDefined();
    expect(data.leaderboard).toHaveLength(1);
    expect(data.leaderboard[0].wpm).toBe(85);
  });
});

describe('PATCH /api/tournaments/[tournamentId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const request = createMockRequest(
      'http://localhost:3000/api/tournaments/1',
      {
        method: 'PATCH',
        body: { action: 'join' },
      }
    );

    const response = await PATCH(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid tournament ID', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = createMockRequest(
      'http://localhost:3000/api/tournaments/abc',
      {
        method: 'PATCH',
        body: { action: 'join' },
      }
    );

    const response = await PATCH(request, { params: createParams('abc') });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid tournament ID');
  });

  it('should return 400 for invalid action', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = createMockRequest(
      'http://localhost:3000/api/tournaments/1',
      {
        method: 'PATCH',
        body: { action: 'invalid' },
      }
    );

    const response = await PATCH(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should return 404 when tournament does not exist', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const mockLimitFn = vi.fn().mockResolvedValue([]);
    const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
    const mockFromFn = vi.fn().mockReturnValue({ where: mockWhereFn });
    const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

    mockDb.select.mockImplementation(mockSelectFn);

    const request = createMockRequest(
      'http://localhost:3000/api/tournaments/999',
      {
        method: 'PATCH',
        body: { action: 'join' },
      }
    );

    const response = await PATCH(request, { params: createParams('999') });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Tournament not found');
  });

  it('should not allow joining a completed tournament', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const completedTournament = {
      id: 1,
      status: 'completed',
      startsAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    };

    const mockLimitFn = vi.fn().mockResolvedValue([completedTournament]);
    const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
    const mockFromFn = vi.fn().mockReturnValue({ where: mockWhereFn });
    const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

    mockDb.select.mockImplementation(mockSelectFn);

    const request = createMockRequest(
      'http://localhost:3000/api/tournaments/1',
      {
        method: 'PATCH',
        body: { action: 'join' },
      }
    );

    const response = await PATCH(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Tournament has ended');
  });

  it('should not allow duplicate joins', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const activeTournament = {
      id: 1,
      status: 'active',
      startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    };

    const existingParticipant = {
      id: 1,
      tournamentId: 1,
      userId: 1,
      wpm: null,
      completedAt: null,
    };

    // First select: tournament lookup
    const mockLimitFn1 = vi.fn().mockResolvedValue([activeTournament]);
    const mockWhereFn1 = vi.fn().mockReturnValue({ limit: mockLimitFn1 });
    const mockFromFn1 = vi.fn().mockReturnValue({ where: mockWhereFn1 });
    const mockSelectFn1 = vi.fn().mockReturnValue({ from: mockFromFn1 });

    // Second select: participant check
    const mockLimitFn2 = vi.fn().mockResolvedValue([existingParticipant]);
    const mockWhereFn2 = vi.fn().mockReturnValue({ limit: mockLimitFn2 });
    const mockFromFn2 = vi.fn().mockReturnValue({ where: mockWhereFn2 });
    const mockSelectFn2 = vi.fn().mockReturnValue({ from: mockFromFn2 });

    mockDb.select
      .mockImplementationOnce(mockSelectFn1)
      .mockImplementationOnce(mockSelectFn2);

    const request = createMockRequest(
      'http://localhost:3000/api/tournaments/1',
      {
        method: 'PATCH',
        body: { action: 'join' },
      }
    );

    const response = await PATCH(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Already joined this tournament');
  });

  it('should successfully join an active tournament', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const activeTournament = {
      id: 1,
      status: 'active',
      startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    };

    const newParticipant = {
      id: 1,
      tournamentId: 1,
      userId: 1,
      wpm: null,
      completedAt: null,
    };

    // First select: tournament
    const mockLimitFn1 = vi.fn().mockResolvedValue([activeTournament]);
    const mockWhereFn1 = vi.fn().mockReturnValue({ limit: mockLimitFn1 });
    const mockFromFn1 = vi.fn().mockReturnValue({ where: mockWhereFn1 });
    const mockSelectFn1 = vi.fn().mockReturnValue({ from: mockFromFn1 });

    // Second select: participant check - empty (not joined yet)
    const mockLimitFn2 = vi.fn().mockResolvedValue([]);
    const mockWhereFn2 = vi.fn().mockReturnValue({ limit: mockLimitFn2 });
    const mockFromFn2 = vi.fn().mockReturnValue({ where: mockWhereFn2 });
    const mockSelectFn2 = vi.fn().mockReturnValue({ from: mockFromFn2 });

    mockDb.select
      .mockImplementationOnce(mockSelectFn1)
      .mockImplementationOnce(mockSelectFn2);

    // Insert participant
    const mockReturningFn = vi.fn().mockResolvedValue([newParticipant]);
    const mockValuesFn = vi
      .fn()
      .mockReturnValue({ returning: mockReturningFn });
    mockDb.insert.mockReturnValue({ values: mockValuesFn });

    const request = createMockRequest(
      'http://localhost:3000/api/tournaments/1',
      {
        method: 'PATCH',
        body: { action: 'join' },
      }
    );

    const response = await PATCH(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.tournamentId).toBe(1);
    expect(data.userId).toBe(1);
  });

  it('should require valid wpm/accuracy for submit action', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = createMockRequest(
      'http://localhost:3000/api/tournaments/1',
      {
        method: 'PATCH',
        body: { action: 'submit', wpm: -5, rawWpm: 50, accuracy: 95 },
      }
    );

    const response = await PATCH(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should not allow submit on upcoming tournament', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const upcomingTournament = {
      id: 1,
      status: 'upcoming',
      startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    };

    const mockLimitFn = vi.fn().mockResolvedValue([upcomingTournament]);
    const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
    const mockFromFn = vi.fn().mockReturnValue({ where: mockWhereFn });
    const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

    mockDb.select.mockImplementation(mockSelectFn);

    const request = createMockRequest(
      'http://localhost:3000/api/tournaments/1',
      {
        method: 'PATCH',
        body: { action: 'submit', wpm: 75, rawWpm: 80, accuracy: 95 },
      }
    );

    const response = await PATCH(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Tournament has not started yet');
  });
});
