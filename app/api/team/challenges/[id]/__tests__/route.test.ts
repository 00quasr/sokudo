import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  getTeamChallengeById: vi.fn(),
  getTeamChallengeResults: vi.fn(),
}));

import {
  getUser,
  getTeamChallengeById,
  getTeamChallengeResults,
} from '@/lib/db/queries';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockGetTeamChallengeById = getTeamChallengeById as ReturnType<typeof vi.fn>;
const mockGetTeamChallengeResults = getTeamChallengeResults as ReturnType<typeof vi.fn>;

const mockChallenge = {
  id: 1,
  teamId: 1,
  challengeId: 10,
  status: 'active',
  expiresAt: null,
  createdAt: new Date('2026-01-30T10:00:00Z'),
  creatorName: 'Alice',
  creatorEmail: 'alice@test.com',
  challengeContent: 'git commit -m "fix: resolve merge conflict"',
  challengeDifficulty: 'beginner',
  challengeSyntaxType: 'bash',
  challengeHint: 'Use the -m flag',
  categoryName: 'Git Basics',
  categorySlug: 'git-basics',
  participantCount: 2,
};

const mockResults = [
  {
    userId: 1,
    userName: 'Alice',
    userEmail: 'alice@test.com',
    wpm: 85,
    rawWpm: 90,
    accuracy: 97,
    errors: 2,
    durationMs: 30000,
    completedAt: new Date('2026-01-30T10:05:00Z'),
  },
  {
    userId: 2,
    userName: 'Bob',
    userEmail: 'bob@test.com',
    wpm: 72,
    rawWpm: 78,
    accuracy: 94,
    errors: 5,
    durationMs: 35000,
    completedAt: new Date('2026-01-30T11:00:00Z'),
  },
];

function createRequest(id: string) {
  return new NextRequest(`http://localhost:3000/api/team/challenges/${id}`);
}

function createParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('GET /api/team/challenges/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const response = await GET(createRequest('1'), createParams('1'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid ID', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const response = await GET(createRequest('abc'), createParams('abc'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid team challenge ID');
  });

  it('should return 404 if team challenge not found', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetTeamChallengeById.mockResolvedValue(null);
    mockGetTeamChallengeResults.mockResolvedValue([]);

    const response = await GET(createRequest('999'), createParams('999'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Team challenge not found');
  });

  it('should return challenge with results', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetTeamChallengeById.mockResolvedValue(mockChallenge);
    mockGetTeamChallengeResults.mockResolvedValue(mockResults);

    const response = await GET(createRequest('1'), createParams('1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.challenge).toEqual(expect.objectContaining({
      id: 1,
      challengeContent: 'git commit -m "fix: resolve merge conflict"',
    }));
    expect(data.results).toHaveLength(2);
  });

  it('should include all required result fields', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetTeamChallengeById.mockResolvedValue(mockChallenge);
    mockGetTeamChallengeResults.mockResolvedValue(mockResults);

    const response = await GET(createRequest('1'), createParams('1'));
    const data = await response.json();

    const result = data.results[0];
    expect(result).toHaveProperty('userId');
    expect(result).toHaveProperty('userName');
    expect(result).toHaveProperty('wpm');
    expect(result).toHaveProperty('rawWpm');
    expect(result).toHaveProperty('accuracy');
    expect(result).toHaveProperty('errors');
    expect(result).toHaveProperty('durationMs');
    expect(result).toHaveProperty('completedAt');
  });

  it('should return results sorted by WPM descending', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetTeamChallengeById.mockResolvedValue(mockChallenge);
    mockGetTeamChallengeResults.mockResolvedValue(mockResults);

    const response = await GET(createRequest('1'), createParams('1'));
    const data = await response.json();

    expect(data.results[0].wpm).toBeGreaterThanOrEqual(data.results[1].wpm);
  });

  it('should return empty results when no sessions', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetTeamChallengeById.mockResolvedValue(mockChallenge);
    mockGetTeamChallengeResults.mockResolvedValue([]);

    const response = await GET(createRequest('1'), createParams('1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(0);
  });

  it('should call queries with correct team challenge ID', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetTeamChallengeById.mockResolvedValue(mockChallenge);
    mockGetTeamChallengeResults.mockResolvedValue(mockResults);

    await GET(createRequest('5'), createParams('5'));

    expect(mockGetTeamChallengeById).toHaveBeenCalledWith(5);
    expect(mockGetTeamChallengeResults).toHaveBeenCalledWith(5);
  });

  it('should return 500 on error', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetTeamChallengeById.mockRejectedValue(new Error('Database error'));
    mockGetTeamChallengeResults.mockResolvedValue([]);

    const response = await GET(createRequest('1'), createParams('1'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
