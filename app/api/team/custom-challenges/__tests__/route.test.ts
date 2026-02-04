import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  getTeamCustomChallenges: vi.fn(),
  createTeamCustomChallenge: vi.fn(),
}));

import {
  getUser,
  getTeamCustomChallenges,
  createTeamCustomChallenge,
} from '@/lib/db/queries';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockGetTeamCustomChallenges = getTeamCustomChallenges as ReturnType<typeof vi.fn>;
const mockCreateTeamCustomChallenge = createTeamCustomChallenge as ReturnType<typeof vi.fn>;

const mockChallenges = [
  {
    id: 1,
    teamId: 1,
    createdBy: 1,
    name: 'Docker Multi-Stage Build',
    content: 'docker build --target production -t myapp:latest .',
    difficulty: 'intermediate',
    syntaxType: 'bash',
    hint: 'Use --target for multi-stage builds',
    createdAt: new Date('2026-01-30T10:00:00Z'),
    updatedAt: new Date('2026-01-30T10:00:00Z'),
    creatorName: 'Alice',
    creatorEmail: 'alice@test.com',
  },
  {
    id: 2,
    teamId: 1,
    createdBy: 2,
    name: 'React Custom Hook',
    content: 'const useDebounce = (value: string, delay: number) => {}',
    difficulty: 'advanced',
    syntaxType: 'typescript',
    hint: null,
    createdAt: new Date('2026-01-29T10:00:00Z'),
    updatedAt: new Date('2026-01-29T10:00:00Z'),
    creatorName: 'Bob',
    creatorEmail: 'bob@test.com',
  },
];

describe('GET /api/team/custom-challenges', () => {
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

  it('should return team custom challenges', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetTeamCustomChallenges.mockResolvedValue(mockChallenges);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.challenges).toHaveLength(2);
  });

  it('should include all required fields', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetTeamCustomChallenges.mockResolvedValue(mockChallenges);

    const response = await GET();
    const data = await response.json();

    const challenge = data.challenges[0];
    expect(challenge).toHaveProperty('id');
    expect(challenge).toHaveProperty('teamId');
    expect(challenge).toHaveProperty('createdBy');
    expect(challenge).toHaveProperty('name');
    expect(challenge).toHaveProperty('content');
    expect(challenge).toHaveProperty('difficulty');
    expect(challenge).toHaveProperty('syntaxType');
    expect(challenge).toHaveProperty('creatorName');
    expect(challenge).toHaveProperty('creatorEmail');
  });

  it('should return empty array when no challenges', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetTeamCustomChallenges.mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.challenges).toHaveLength(0);
  });

  it('should return 500 on error', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetTeamCustomChallenges.mockRejectedValue(new Error('Database error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});

describe('POST /api/team/custom-challenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', content: 'test content' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for missing name', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges', {
      method: 'POST',
      body: JSON.stringify({ content: 'test content' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should return 400 for missing content', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should return 400 for invalid difficulty', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test',
        content: 'test content',
        difficulty: 'impossible',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should return 400 for invalid syntaxType', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test',
        content: 'test content',
        syntaxType: 'invalid-type',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should create a team custom challenge with required fields only', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockCreateTeamCustomChallenge.mockResolvedValue({
      id: 1,
      teamId: 1,
      createdBy: 1,
      name: 'Test Challenge',
      content: 'git rebase -i HEAD~3',
      difficulty: 'beginner',
      syntaxType: 'plain',
      hint: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Challenge',
        content: 'git rebase -i HEAD~3',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.name).toBe('Test Challenge');
    expect(data.content).toBe('git rebase -i HEAD~3');
  });

  it('should create a team custom challenge with all fields', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockCreateTeamCustomChallenge.mockResolvedValue({
      id: 1,
      teamId: 1,
      createdBy: 1,
      name: 'Docker Challenge',
      content: 'docker compose up -d',
      difficulty: 'intermediate',
      syntaxType: 'bash',
      hint: 'Use -d for detached mode',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Docker Challenge',
        content: 'docker compose up -d',
        difficulty: 'intermediate',
        syntaxType: 'bash',
        hint: 'Use -d for detached mode',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.difficulty).toBe('intermediate');
    expect(data.syntaxType).toBe('bash');
    expect(data.hint).toBe('Use -d for detached mode');
  });

  it('should return 404 if user has no team', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockCreateTeamCustomChallenge.mockRejectedValue(
      new Error('User is not a member of any team')
    );

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test',
        content: 'test content',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('No team found');
  });

  it('should return 500 on unexpected error', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockCreateTeamCustomChallenge.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test',
        content: 'test content',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
