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
};

const mockGetUser = getUser as ReturnType<typeof vi.fn>;

function createMockRequest(
  url: string,
  options?: { method?: string; body?: Record<string, unknown> }
): NextRequest {
  return {
    url,
    method: options?.method || 'GET',
    json: vi.fn().mockResolvedValue(options?.body || {}),
  } as unknown as NextRequest;
}

function createRouteParams(raceId: string) {
  return { params: Promise.resolve({ raceId }) };
}

describe('GET /api/races/[raceId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 for invalid race ID', async () => {
    const request = createMockRequest('http://localhost:3000/api/races/abc');
    const response = await GET(request, createRouteParams('abc'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid race ID');
  });

  it('should return 404 when race does not exist', async () => {
    const mockLimitFn = vi.fn().mockResolvedValue([]);
    const mockInnerJoinFn2 = vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: mockLimitFn }) });
    const mockInnerJoinFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn2 });
    const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
    mockDb.select.mockReturnValue({ from: mockFromFn });

    const request = createMockRequest('http://localhost:3000/api/races/999');
    const response = await GET(request, createRouteParams('999'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Race not found');
  });

  it('should return race details with participants', async () => {
    const mockRace = {
      id: 1,
      status: 'waiting',
      maxPlayers: 4,
      createdAt: new Date().toISOString(),
      startedAt: null,
      updatedAt: new Date().toISOString(),
      challenge: {
        id: 1,
        content: 'git status',
        difficulty: 'beginner',
        syntaxType: 'git',
      },
      category: {
        id: 1,
        name: 'Git Basics',
        slug: 'git-basics',
        icon: 'git-branch',
      },
    };

    const mockParticipants = [
      {
        id: 1,
        userId: 1,
        wpm: null,
        accuracy: null,
        finishedAt: null,
        rank: null,
        userName: 'Test User',
        userEmail: 'test@test.com',
      },
    ];

    // First select: race details
    const mockLimitFn = vi.fn().mockResolvedValue([mockRace]);
    const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
    const mockInnerJoinFn2 = vi.fn().mockReturnValue({ where: mockWhereFn });
    const mockInnerJoinFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn2 });
    const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });

    // Second select: participants
    const mockParticipantWhere = vi.fn().mockResolvedValue(mockParticipants);
    const mockParticipantInnerJoin = vi.fn().mockReturnValue({ where: mockParticipantWhere });
    const mockParticipantFrom = vi.fn().mockReturnValue({ innerJoin: mockParticipantInnerJoin });

    mockDb.select
      .mockReturnValueOnce({ from: mockFromFn })
      .mockReturnValueOnce({ from: mockParticipantFrom });

    const request = createMockRequest('http://localhost:3000/api/races/1');
    const response = await GET(request, createRouteParams('1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe(1);
    expect(data.participants).toHaveLength(1);
    expect(data.participants[0].userName).toBe('Test User');
  });
});

describe('PATCH /api/races/[raceId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const request = createMockRequest('http://localhost:3000/api/races/1', {
      method: 'PATCH',
      body: { action: 'join' },
    });
    const response = await PATCH(request, createRouteParams('1'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid race ID', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = createMockRequest('http://localhost:3000/api/races/abc', {
      method: 'PATCH',
      body: { action: 'join' },
    });
    const response = await PATCH(request, createRouteParams('abc'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid race ID');
  });

  it('should return 400 for invalid action', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = createMockRequest('http://localhost:3000/api/races/1', {
      method: 'PATCH',
      body: { action: 'invalid' },
    });
    const response = await PATCH(request, createRouteParams('1'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should return 404 when race does not exist for join', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const mockLimitFn = vi.fn().mockResolvedValue([]);
    const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
    const mockFromFn = vi.fn().mockReturnValue({ where: mockWhereFn });
    mockDb.select.mockReturnValue({ from: mockFromFn });

    const request = createMockRequest('http://localhost:3000/api/races/999', {
      method: 'PATCH',
      body: { action: 'join' },
    });
    const response = await PATCH(request, createRouteParams('999'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Race not found');
  });

  it('should reject join if race is not in waiting status', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const mockRace = { id: 1, status: 'in_progress', maxPlayers: 4 };
    const mockLimitFn = vi.fn().mockResolvedValue([mockRace]);
    const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
    const mockFromFn = vi.fn().mockReturnValue({ where: mockWhereFn });
    mockDb.select.mockReturnValue({ from: mockFromFn });

    const request = createMockRequest('http://localhost:3000/api/races/1', {
      method: 'PATCH',
      body: { action: 'join' },
    });
    const response = await PATCH(request, createRouteParams('1'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Race is not accepting participants');
  });

  it('should reject start if race is not in waiting status', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const mockRace = { id: 1, status: 'finished', maxPlayers: 4 };
    const mockLimitFn = vi.fn().mockResolvedValue([mockRace]);
    const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
    const mockFromFn = vi.fn().mockReturnValue({ where: mockWhereFn });
    mockDb.select.mockReturnValue({ from: mockFromFn });

    const request = createMockRequest('http://localhost:3000/api/races/1', {
      method: 'PATCH',
      body: { action: 'start' },
    });
    const response = await PATCH(request, createRouteParams('1'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Race has already started or finished');
  });

  it('should reject finish if race is not in progress', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const mockRace = { id: 1, status: 'waiting', maxPlayers: 4 };
    const mockLimitFn = vi.fn().mockResolvedValue([mockRace]);
    const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
    const mockFromFn = vi.fn().mockReturnValue({ where: mockWhereFn });
    mockDb.select.mockReturnValue({ from: mockFromFn });

    const request = createMockRequest('http://localhost:3000/api/races/1', {
      method: 'PATCH',
      body: { action: 'finish', wpm: 65, accuracy: 95 },
    });
    const response = await PATCH(request, createRouteParams('1'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Race is not in progress');
  });

  it('should reject finish without wpm and accuracy', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const mockRace = { id: 1, status: 'in_progress', maxPlayers: 4 };
    const mockLimitFn = vi.fn().mockResolvedValue([mockRace]);
    const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
    const mockFromFn = vi.fn().mockReturnValue({ where: mockWhereFn });
    mockDb.select.mockReturnValue({ from: mockFromFn });

    const request = createMockRequest('http://localhost:3000/api/races/1', {
      method: 'PATCH',
      body: { action: 'finish' },
    });
    const response = await PATCH(request, createRouteParams('1'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('wpm and accuracy are required for finish action');
  });
});
