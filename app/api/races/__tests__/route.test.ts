import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

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

describe('GET /api/races', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return list of waiting races', async () => {
    const mockRaces = [
      {
        id: 1,
        status: 'waiting',
        maxPlayers: 4,
        createdAt: new Date().toISOString(),
        startedAt: null,
        challenge: {
          id: 1,
          content: 'git commit -m "initial commit"',
          difficulty: 'beginner',
          syntaxType: 'git',
        },
        category: {
          id: 1,
          name: 'Git Basics',
          slug: 'git-basics',
          icon: 'git-branch',
        },
        participantCount: 2,
      },
    ];

    const mockLimitFn = vi.fn().mockResolvedValue(mockRaces);
    const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
    const mockWhereFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
    const mockInnerJoinFn2 = vi.fn().mockReturnValue({ where: mockWhereFn });
    const mockInnerJoinFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn2 });
    const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
    const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

    mockDb.select.mockImplementation(mockSelectFn);

    const request = createMockRequest('http://localhost:3000/api/races?status=waiting');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.races).toBeDefined();
    expect(data.races).toHaveLength(1);
    expect(data.races[0].status).toBe('waiting');
  });

  it('should default to waiting status when no status param', async () => {
    const mockLimitFn = vi.fn().mockResolvedValue([]);
    const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
    const mockWhereFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
    const mockInnerJoinFn2 = vi.fn().mockReturnValue({ where: mockWhereFn });
    const mockInnerJoinFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn2 });
    const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
    const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

    mockDb.select.mockImplementation(mockSelectFn);

    const request = createMockRequest('http://localhost:3000/api/races');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.races).toEqual([]);
  });

  it('should return 500 on database error', async () => {
    const mockFromFn = vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockRejectedValue(new Error('DB error')),
            }),
          }),
        }),
      }),
    });
    mockDb.select.mockReturnValue({ from: mockFromFn });

    const request = createMockRequest('http://localhost:3000/api/races');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});

describe('POST /api/races', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const request = createMockRequest('http://localhost:3000/api/races', {
      method: 'POST',
      body: { challengeId: 1, maxPlayers: 4 },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid request body', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = createMockRequest('http://localhost:3000/api/races', {
      method: 'POST',
      body: { challengeId: 'invalid' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should return 404 when challenge does not exist', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const mockLimitFn = vi.fn().mockResolvedValue([]);
    const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
    const mockFromFn = vi.fn().mockReturnValue({ where: mockWhereFn });
    const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

    mockDb.select.mockImplementation(mockSelectFn);

    const request = createMockRequest('http://localhost:3000/api/races', {
      method: 'POST',
      body: { challengeId: 999, maxPlayers: 4 },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Challenge not found');
  });

  it('should create a race and add creator as participant', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const mockChallenge = { id: 1, content: 'git status', categoryId: 1 };
    const mockRace = {
      id: 1,
      status: 'waiting',
      challengeId: 1,
      maxPlayers: 4,
      createdAt: new Date().toISOString(),
    };

    // First select call - challenge lookup
    const mockLimitFn = vi.fn().mockResolvedValue([mockChallenge]);
    const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
    const mockFromFn = vi.fn().mockReturnValue({ where: mockWhereFn });
    const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

    mockDb.select.mockImplementation(mockSelectFn);

    // First insert call - create race
    const mockReturningFn = vi.fn().mockResolvedValue([mockRace]);
    const mockValuesFn = vi.fn().mockReturnValue({ returning: mockReturningFn });
    const mockInsertFn = vi.fn().mockReturnValue({ values: mockValuesFn });

    // Second insert call - add participant
    const mockValuesFn2 = vi.fn().mockResolvedValue([]);
    const mockInsertFn2 = vi.fn().mockReturnValue({ values: mockValuesFn2 });

    mockDb.insert
      .mockReturnValueOnce({ values: mockValuesFn })
      .mockReturnValueOnce({ values: mockValuesFn2 });

    const request = createMockRequest('http://localhost:3000/api/races', {
      method: 'POST',
      body: { challengeId: 1, maxPlayers: 4 },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe(1);
    expect(data.status).toBe('waiting');
  });

  it('should reject maxPlayers outside valid range', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = createMockRequest('http://localhost:3000/api/races', {
      method: 'POST',
      body: { challengeId: 1, maxPlayers: 20 },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });
});
