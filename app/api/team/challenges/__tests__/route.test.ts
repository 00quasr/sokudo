import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  getTeamChallenges: vi.fn(),
  createTeamChallenge: vi.fn(),
  getChallengeById: vi.fn(),
}));

import {
  getUser,
  getTeamChallenges,
  createTeamChallenge,
  getChallengeById,
} from '@/lib/db/queries';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockGetTeamChallenges = getTeamChallenges as ReturnType<typeof vi.fn>;
const mockCreateTeamChallenge = createTeamChallenge as ReturnType<typeof vi.fn>;
const mockGetChallengeById = getChallengeById as ReturnType<typeof vi.fn>;

const mockChallenges = [
  {
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
    challengeHint: 'Use the -m flag for message',
    categoryName: 'Git Basics',
    categorySlug: 'git-basics',
    participantCount: 2,
  },
  {
    id: 2,
    teamId: 1,
    challengeId: 15,
    status: 'completed',
    expiresAt: new Date('2026-01-29T10:00:00Z'),
    createdAt: new Date('2026-01-28T10:00:00Z'),
    creatorName: 'Bob',
    creatorEmail: 'bob@test.com',
    challengeContent: 'docker compose up -d',
    challengeDifficulty: 'intermediate',
    challengeSyntaxType: 'bash',
    challengeHint: null,
    categoryName: 'Docker',
    categorySlug: 'docker',
    participantCount: 3,
  },
];

describe('GET /api/team/challenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return team challenges', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetTeamChallenges.mockResolvedValue(mockChallenges);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.challenges).toHaveLength(2);
  });

  it('should include all required fields', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetTeamChallenges.mockResolvedValue(mockChallenges);

    const response = await GET();
    const data = await response.json();

    const challenge = data.challenges[0];
    expect(challenge).toHaveProperty('id');
    expect(challenge).toHaveProperty('teamId');
    expect(challenge).toHaveProperty('challengeId');
    expect(challenge).toHaveProperty('status');
    expect(challenge).toHaveProperty('creatorName');
    expect(challenge).toHaveProperty('challengeContent');
    expect(challenge).toHaveProperty('categoryName');
    expect(challenge).toHaveProperty('participantCount');
  });

  it('should return empty array when no team challenges', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetTeamChallenges.mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.challenges).toHaveLength(0);
  });

  it('should return 500 on error', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetTeamChallenges.mockRejectedValue(new Error('Database error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});

describe('POST /api/team/challenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/team/challenges', {
      method: 'POST',
      body: JSON.stringify({ challengeId: 10 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid body', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = new NextRequest('http://localhost:3000/api/team/challenges', {
      method: 'POST',
      body: JSON.stringify({ challengeId: 'not-a-number' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should return 404 if challenge does not exist', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetChallengeById.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/team/challenges', {
      method: 'POST',
      body: JSON.stringify({ challengeId: 999 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Challenge not found');
  });

  it('should create a team challenge', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetChallengeById.mockResolvedValue({
      id: 10,
      content: 'git commit -m "test"',
      category: { name: 'Git Basics' },
    });
    mockCreateTeamChallenge.mockResolvedValue({
      id: 1,
      teamId: 1,
      challengeId: 10,
      createdBy: 1,
      status: 'active',
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost:3000/api/team/challenges', {
      method: 'POST',
      body: JSON.stringify({ challengeId: 10 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.challengeId).toBe(10);
    expect(data.status).toBe('active');
  });

  it('should support optional expiresAt', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetChallengeById.mockResolvedValue({
      id: 10,
      content: 'git commit -m "test"',
    });
    mockCreateTeamChallenge.mockResolvedValue({
      id: 1,
      teamId: 1,
      challengeId: 10,
      createdBy: 1,
      status: 'active',
      expiresAt: new Date('2026-02-15T00:00:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost:3000/api/team/challenges', {
      method: 'POST',
      body: JSON.stringify({
        challengeId: 10,
        expiresAt: '2026-02-15T00:00:00Z',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(mockCreateTeamChallenge).toHaveBeenCalledWith(
      10,
      new Date('2026-02-15T00:00:00Z')
    );
  });

  it('should return 404 if user has no team', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetChallengeById.mockResolvedValue({
      id: 10,
      content: 'git commit',
    });
    mockCreateTeamChallenge.mockRejectedValue(
      new Error('User is not a member of any team')
    );

    const request = new NextRequest('http://localhost:3000/api/team/challenges', {
      method: 'POST',
      body: JSON.stringify({ challengeId: 10 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('No team found');
  });

  it('should return 500 on unexpected error', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetChallengeById.mockResolvedValue({ id: 10, content: 'test' });
    mockCreateTeamChallenge.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/team/challenges', {
      method: 'POST',
      body: JSON.stringify({ challengeId: 10 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
