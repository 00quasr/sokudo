import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

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
import { POST, GET } from '../route';

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
    method: options?.method ?? 'GET',
    json: vi.fn().mockResolvedValue(options?.body ?? {}),
  } as unknown as NextRequest;
  return req;
}

describe('POST /api/friend-challenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);
    const request = createMockRequest('http://localhost:3000/api/friend-challenges', {
      method: 'POST',
      body: {
        challengedUsername: 'someuser',
        challengeId: 1,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid request body', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    const request = createMockRequest('http://localhost:3000/api/friend-challenges', {
      method: 'POST',
      body: {
        // Missing required fields
        challengeId: -1,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should return 404 if challenged user not found', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    // Mock: user lookup returns empty
    mockDb.limit.mockResolvedValueOnce([]);

    const request = createMockRequest('http://localhost:3000/api/friend-challenges', {
      method: 'POST',
      body: {
        challengedUsername: 'nonexistent',
        challengeId: 1,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('should return 400 if user tries to challenge themselves', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    // Mock: user lookup returns the same user
    mockDb.limit.mockResolvedValueOnce([{ id: 1, username: 'myself' }]);

    const request = createMockRequest('http://localhost:3000/api/friend-challenges', {
      method: 'POST',
      body: {
        challengedUsername: 'myself',
        challengeId: 1,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Cannot challenge yourself');
  });

  it('should return 404 if challenge content not found', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    // Mock: user found
    mockDb.limit.mockResolvedValueOnce([{ id: 2, username: 'opponent' }]);
    // Mock: challenge not found
    mockDb.limit.mockResolvedValueOnce([]);

    const request = createMockRequest('http://localhost:3000/api/friend-challenges', {
      method: 'POST',
      body: {
        challengedUsername: 'opponent',
        challengeId: 999,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Challenge not found');
  });

  it('should return 409 if duplicate pending challenge exists', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    // Mock: user found
    mockDb.limit.mockResolvedValueOnce([{ id: 2, username: 'opponent' }]);
    // Mock: challenge found
    mockDb.limit.mockResolvedValueOnce([{ id: 1, content: 'test' }]);
    // Mock: existing pending challenge found
    mockDb.limit.mockResolvedValueOnce([{ id: 5, status: 'pending' }]);

    const request = createMockRequest('http://localhost:3000/api/friend-challenges', {
      method: 'POST',
      body: {
        challengedUsername: 'opponent',
        challengeId: 1,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain('already have a pending challenge');
  });

  it('should create friend challenge successfully', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const mockChallenge = {
      id: 10,
      challengerId: 1,
      challengedId: 2,
      challengeId: 1,
      status: 'pending',
    };

    // Mock: user found
    mockDb.limit.mockResolvedValueOnce([{ id: 2, username: 'opponent' }]);
    // Mock: challenge found
    mockDb.limit.mockResolvedValueOnce([{ id: 1, content: 'test' }]);
    // Mock: no existing pending challenge
    mockDb.limit.mockResolvedValueOnce([]);
    // Mock: insert returning
    mockDb.returning.mockResolvedValueOnce([mockChallenge]);

    const request = createMockRequest('http://localhost:3000/api/friend-challenges', {
      method: 'POST',
      body: {
        challengedUsername: 'opponent',
        challengeId: 1,
        message: 'Race me!',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe(10);
    expect(data.status).toBe('pending');
  });
});

describe('GET /api/friend-challenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);
    const request = createMockRequest(
      'http://localhost:3000/api/friend-challenges?filter=received'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return challenges for authenticated user', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const mockChallenges = [
      {
        id: 1,
        status: 'pending',
        message: 'Let us race!',
        raceId: null,
        expiresAt: new Date().toISOString(),
        respondedAt: null,
        createdAt: new Date().toISOString(),
        challenger: { id: 2, username: 'alice', name: 'Alice' },
        challenged: { id: 1, username: 'test', name: 'Test' },
        challenge: { id: 1, content: 'git commit', difficulty: 'beginner', syntaxType: 'shell' },
        category: { id: 1, name: 'Git', slug: 'git', icon: 'git' },
      },
    ];

    mockDb.limit.mockResolvedValueOnce(mockChallenges);

    const request = createMockRequest(
      'http://localhost:3000/api/friend-challenges?filter=received'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.challenges).toHaveLength(1);
    expect(data.challenges[0].challenger.username).toBe('alice');
  });
});
