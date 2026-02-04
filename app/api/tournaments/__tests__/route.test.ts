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
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
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

describe('POST /api/tournaments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const request = createMockRequest('http://localhost:3000/api/tournaments', {
      method: 'POST',
      body: {
        name: 'Weekly Git Tournament',
        challengeId: 1,
        startsAt: '2026-02-10T00:00:00.000Z',
        endsAt: '2026-02-17T00:00:00.000Z',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid request body', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = createMockRequest('http://localhost:3000/api/tournaments', {
      method: 'POST',
      body: { challengeId: 'invalid' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should return 400 when end time is before start time', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = createMockRequest('http://localhost:3000/api/tournaments', {
      method: 'POST',
      body: {
        name: 'Invalid Tournament',
        challengeId: 1,
        startsAt: '2026-02-17T00:00:00.000Z',
        endsAt: '2026-02-10T00:00:00.000Z',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('End time must be after start time');
  });

  it('should return 404 when challenge does not exist', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const mockLimitFn = vi.fn().mockResolvedValue([]);
    const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
    const mockFromFn = vi.fn().mockReturnValue({ where: mockWhereFn });
    const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

    mockDb.select.mockImplementation(mockSelectFn);

    const request = createMockRequest('http://localhost:3000/api/tournaments', {
      method: 'POST',
      body: {
        name: 'Weekly Git Tournament',
        challengeId: 999,
        startsAt: '2026-02-10T00:00:00.000Z',
        endsAt: '2026-02-17T00:00:00.000Z',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Challenge not found');
  });

  it('should create a tournament successfully', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const mockChallenge = { id: 1, content: 'git status', categoryId: 1 };
    const mockTournament = {
      id: 1,
      name: 'Weekly Git Tournament',
      status: 'upcoming',
      challengeId: 1,
      startsAt: '2026-02-10T00:00:00.000Z',
      endsAt: '2026-02-17T00:00:00.000Z',
      createdBy: 1,
      createdAt: new Date().toISOString(),
    };

    const mockLimitFn = vi.fn().mockResolvedValue([mockChallenge]);
    const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
    const mockFromFn = vi.fn().mockReturnValue({ where: mockWhereFn });
    const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

    mockDb.select.mockImplementation(mockSelectFn);

    const mockReturningFn = vi.fn().mockResolvedValue([mockTournament]);
    const mockValuesFn = vi.fn().mockReturnValue({ returning: mockReturningFn });
    mockDb.insert.mockReturnValue({ values: mockValuesFn });

    const request = createMockRequest('http://localhost:3000/api/tournaments', {
      method: 'POST',
      body: {
        name: 'Weekly Git Tournament',
        challengeId: 1,
        startsAt: '2026-02-10T00:00:00.000Z',
        endsAt: '2026-02-17T00:00:00.000Z',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe(1);
    expect(data.name).toBe('Weekly Git Tournament');
    expect(data.status).toBe('upcoming');
  });

  it('should reject missing name field', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = createMockRequest('http://localhost:3000/api/tournaments', {
      method: 'POST',
      body: {
        challengeId: 1,
        startsAt: '2026-02-10T00:00:00.000Z',
        endsAt: '2026-02-17T00:00:00.000Z',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });
});

describe('GET /api/tournaments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return list of tournaments', async () => {
    const mockTournaments = [
      {
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
        category: {
          id: 1,
          name: 'Git Basics',
          slug: 'git-basics',
          icon: 'git-branch',
        },
        participantCount: 5,
        creator: {
          id: 1,
          name: 'Test User',
          username: 'testuser',
        },
      },
    ];

    // Mock the auto-transition update calls
    const mockUpdateWhere = vi.fn().mockResolvedValue([]);
    const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
    mockDb.update.mockReturnValue({ set: mockUpdateSet });

    const mockLimitFn = vi.fn().mockResolvedValue(mockTournaments);
    const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
    const mockWhereFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
    const mockInnerJoinFn3 = vi.fn().mockReturnValue({ where: mockWhereFn });
    const mockInnerJoinFn2 = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn3 });
    const mockInnerJoinFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn2 });
    const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
    const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

    mockDb.select.mockImplementation(mockSelectFn);

    const request = createMockRequest('http://localhost:3000/api/tournaments');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tournaments).toBeDefined();
    expect(data.tournaments).toHaveLength(1);
    expect(data.tournaments[0].name).toBe('Weekly Git Tournament');
  });

  it('should filter by status when provided', async () => {
    // Mock the auto-transition update calls
    const mockUpdateWhere = vi.fn().mockResolvedValue([]);
    const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
    mockDb.update.mockReturnValue({ set: mockUpdateSet });

    const mockLimitFn = vi.fn().mockResolvedValue([]);
    const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
    const mockWhereFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
    const mockInnerJoinFn3 = vi.fn().mockReturnValue({ where: mockWhereFn });
    const mockInnerJoinFn2 = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn3 });
    const mockInnerJoinFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn2 });
    const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
    const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

    mockDb.select.mockImplementation(mockSelectFn);

    const request = createMockRequest(
      'http://localhost:3000/api/tournaments?status=upcoming'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tournaments).toEqual([]);
  });

  it('should return 500 on database error', async () => {
    const mockUpdateWhere = vi.fn().mockRejectedValue(new Error('DB error'));
    const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
    mockDb.update.mockReturnValue({ set: mockUpdateSet });

    const request = createMockRequest('http://localhost:3000/api/tournaments');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
