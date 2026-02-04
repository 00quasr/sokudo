import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the database - flat chain pattern where every method returns `this`
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  },
}));

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
}));

import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { PATCH } from '../route';

const mockDb = db as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockGetUser = getUser as ReturnType<typeof vi.fn>;

function createMockRequest(body: Record<string, unknown>): NextRequest {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
}

function createParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('PATCH /api/friend-challenges/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-setup the chain so every method returns the db mock itself
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.update.mockReturnThis();
    mockDb.set.mockReturnThis();
    mockDb.insert.mockReturnThis();
    mockDb.values.mockReturnThis();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const response = await PATCH(
      createMockRequest({ action: 'accept' }),
      createParams('1')
    );
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid ID', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const response = await PATCH(
      createMockRequest({ action: 'accept' }),
      createParams('abc')
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid challenge ID');
  });

  it('should return 400 for invalid action', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const response = await PATCH(
      createMockRequest({ action: 'invalid' }),
      createParams('1')
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should return 404 if challenge not found', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockDb.limit.mockResolvedValueOnce([]);

    const response = await PATCH(
      createMockRequest({ action: 'accept' }),
      createParams('999')
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Challenge not found');
  });

  it('should return 400 if challenge is not pending', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockDb.limit.mockResolvedValueOnce([{
      id: 1,
      challengerId: 2,
      challengedId: 1,
      status: 'accepted',
      expiresAt: new Date(Date.now() + 86400000),
    }]);

    const response = await PATCH(
      createMockRequest({ action: 'accept' }),
      createParams('1')
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Challenge is no longer pending');
  });

  it('should return 400 if challenge has expired', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockDb.limit.mockResolvedValueOnce([{
      id: 1,
      challengerId: 2,
      challengedId: 1,
      status: 'pending',
      expiresAt: new Date(Date.now() - 1000),
    }]);

    const response = await PATCH(
      createMockRequest({ action: 'accept' }),
      createParams('1')
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Challenge has expired');
  });

  it('should return 403 if non-challenger tries to cancel', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockDb.limit.mockResolvedValueOnce([{
      id: 1,
      challengerId: 2, // not user 1
      challengedId: 1,
      status: 'pending',
      expiresAt: new Date(Date.now() + 86400000),
    }]);

    const response = await PATCH(
      createMockRequest({ action: 'cancel' }),
      createParams('1')
    );
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Only the challenger can cancel');
  });

  it('should return 403 if non-challenged user tries to accept', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockDb.limit.mockResolvedValueOnce([{
      id: 1,
      challengerId: 1,
      challengedId: 2, // not user 1
      status: 'pending',
      expiresAt: new Date(Date.now() + 86400000),
    }]);

    const response = await PATCH(
      createMockRequest({ action: 'accept' }),
      createParams('1')
    );
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Only the challenged user can accept');
  });

  it('should decline challenge successfully', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockDb.limit.mockResolvedValueOnce([{
      id: 1,
      challengerId: 2,
      challengedId: 1,
      status: 'pending',
      expiresAt: new Date(Date.now() + 86400000),
    }]);

    const response = await PATCH(
      createMockRequest({ action: 'decline' }),
      createParams('1')
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Challenge declined');
  });

  it('should accept challenge and create race', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockDb.limit.mockResolvedValueOnce([{
      id: 1,
      challengerId: 2,
      challengedId: 1,
      challengeId: 5,
      status: 'pending',
      expiresAt: new Date(Date.now() + 86400000),
    }]);
    // insert(races).values().returning()
    mockDb.returning.mockResolvedValueOnce([{ id: 42 }]);

    const response = await PATCH(
      createMockRequest({ action: 'accept' }),
      createParams('1')
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Challenge accepted');
    expect(data.raceId).toBe(42);
  });
});
