import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
const mockUpsertChallengeVote = vi.fn();
const mockGetVoteCountsForChallenge = vi.fn();
const mockGetUserVoteForChallenge = vi.fn();

vi.mock('@/lib/db/queries', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
  upsertChallengeVote: (...args: unknown[]) => mockUpsertChallengeVote(...args),
  getVoteCountsForChallenge: (...args: unknown[]) => mockGetVoteCountsForChallenge(...args),
  getUserVoteForChallenge: (...args: unknown[]) => mockGetUserVoteForChallenge(...args),
}));

const mockDbSelect = vi.fn();
const mockDbFrom = vi.fn();
const mockDbWhere = vi.fn();

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: (...args: unknown[]) => {
      mockDbSelect(...args);
      return {
        from: (...fromArgs: unknown[]) => {
          mockDbFrom(...fromArgs);
          return {
            where: (...whereArgs: unknown[]) => mockDbWhere(...whereArgs),
          };
        },
      };
    },
  },
}));

vi.mock('@/lib/db/schema', () => ({
  customChallenges: {
    id: 'id',
    userId: 'user_id',
    isPublic: 'is_public',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', a, b })),
  and: vi.fn((...args: unknown[]) => ({ type: 'and', args })),
}));

import { POST, GET } from '../route';

function createPostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/community-challenges/1/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function createGetRequest(): NextRequest {
  return new NextRequest('http://localhost:3000/api/community-challenges/1/vote');
}

const mockParams = Promise.resolve({ id: '1' });

describe('POST /api/community-challenges/[id]/vote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const response = await POST(createPostRequest({ value: 1 }), { params: mockParams });
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid challenge ID', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const response = await POST(
      createPostRequest({ value: 1 }),
      { params: Promise.resolve({ id: 'abc' }) }
    );
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe('Invalid challenge ID');
  });

  it('should return 404 when challenge does not exist', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockDbWhere.mockResolvedValue([]);

    const response = await POST(createPostRequest({ value: 1 }), { params: mockParams });
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.error).toBe('Challenge not found');
  });

  it('should return 400 for invalid vote value', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockDbWhere.mockResolvedValue([{ id: 1, userId: 2 }]);

    const response = await POST(createPostRequest({ value: 0 }), { params: mockParams });
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe('Invalid vote value');
  });

  it('should return 400 for value of 2', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockDbWhere.mockResolvedValue([{ id: 1, userId: 2 }]);

    const response = await POST(createPostRequest({ value: 2 }), { params: mockParams });
    expect(response.status).toBe(400);
  });

  it('should create upvote and return updated counts', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockDbWhere.mockResolvedValue([{ id: 1, userId: 2 }]);
    mockUpsertChallengeVote.mockResolvedValue({ id: 1, userId: 1, challengeId: 1, value: 1 });
    mockGetVoteCountsForChallenge.mockResolvedValue({ upvotes: 1, downvotes: 0, score: 1 });
    mockGetUserVoteForChallenge.mockResolvedValue({ value: 1 });

    const response = await POST(createPostRequest({ value: 1 }), { params: mockParams });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.votes.upvotes).toBe(1);
    expect(body.votes.downvotes).toBe(0);
    expect(body.votes.score).toBe(1);
    expect(body.userVote).toBe(1);
    expect(mockUpsertChallengeVote).toHaveBeenCalledWith(1, 1, 1);
  });

  it('should create downvote and return updated counts', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockDbWhere.mockResolvedValue([{ id: 1, userId: 2 }]);
    mockUpsertChallengeVote.mockResolvedValue({ id: 1, userId: 1, challengeId: 1, value: -1 });
    mockGetVoteCountsForChallenge.mockResolvedValue({ upvotes: 0, downvotes: 1, score: -1 });
    mockGetUserVoteForChallenge.mockResolvedValue({ value: -1 });

    const response = await POST(createPostRequest({ value: -1 }), { params: mockParams });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.votes.downvotes).toBe(1);
    expect(body.userVote).toBe(-1);
    expect(mockUpsertChallengeVote).toHaveBeenCalledWith(1, 1, -1);
  });

  it('should return 500 on internal error', async () => {
    mockGetUser.mockRejectedValue(new Error('DB error'));

    const response = await POST(createPostRequest({ value: 1 }), { params: mockParams });
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.error).toBe('Internal server error');
  });
});

describe('GET /api/community-challenges/[id]/vote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return vote counts for unauthenticated user', async () => {
    mockGetVoteCountsForChallenge.mockResolvedValue({ upvotes: 3, downvotes: 1, score: 2 });
    mockGetUser.mockResolvedValue(null);

    const response = await GET(createGetRequest(), { params: mockParams });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.votes.upvotes).toBe(3);
    expect(body.votes.downvotes).toBe(1);
    expect(body.votes.score).toBe(2);
    expect(body.userVote).toBe(0);
  });

  it('should return vote counts with user vote for authenticated user', async () => {
    mockGetVoteCountsForChallenge.mockResolvedValue({ upvotes: 5, downvotes: 2, score: 3 });
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetUserVoteForChallenge.mockResolvedValue({ value: 1 });

    const response = await GET(createGetRequest(), { params: mockParams });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.votes.score).toBe(3);
    expect(body.userVote).toBe(1);
  });

  it('should return 400 for invalid challenge ID', async () => {
    const response = await GET(
      createGetRequest(),
      { params: Promise.resolve({ id: 'invalid' }) }
    );
    expect(response.status).toBe(400);
  });

  it('should return 500 on internal error', async () => {
    mockGetVoteCountsForChallenge.mockRejectedValue(new Error('DB error'));

    const response = await GET(createGetRequest(), { params: mockParams });
    expect(response.status).toBe(500);
  });
});
