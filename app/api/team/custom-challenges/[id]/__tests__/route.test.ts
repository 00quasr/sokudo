import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from '../route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  getTeamCustomChallengeById: vi.fn(),
  updateTeamCustomChallenge: vi.fn(),
  deleteTeamCustomChallenge: vi.fn(),
}));

import {
  getUser,
  getTeamCustomChallengeById,
  updateTeamCustomChallenge,
  deleteTeamCustomChallenge,
} from '@/lib/db/queries';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockGetTeamCustomChallengeById = getTeamCustomChallengeById as ReturnType<typeof vi.fn>;
const mockUpdateTeamCustomChallenge = updateTeamCustomChallenge as ReturnType<typeof vi.fn>;
const mockDeleteTeamCustomChallenge = deleteTeamCustomChallenge as ReturnType<typeof vi.fn>;

const mockChallenge = {
  id: 1,
  teamId: 1,
  createdBy: 1,
  name: 'Docker Challenge',
  content: 'docker compose up -d',
  difficulty: 'intermediate',
  syntaxType: 'bash',
  hint: 'Use -d for detached mode',
  createdAt: new Date('2026-01-30T10:00:00Z'),
  updatedAt: new Date('2026-01-30T10:00:00Z'),
  creatorName: 'Alice',
  creatorEmail: 'alice@test.com',
};

function createParams(id: string): Promise<{ id: string }> {
  return Promise.resolve({ id });
}

describe('GET /api/team/custom-challenges/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges/1');
    const response = await GET(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid id', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges/abc');
    const response = await GET(request, { params: createParams('abc') });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid challenge ID');
  });

  it('should return 404 if challenge not found', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetTeamCustomChallengeById.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges/999');
    const response = await GET(request, { params: createParams('999') });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Challenge not found');
  });

  it('should return the challenge', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetTeamCustomChallengeById.mockResolvedValue(mockChallenge);

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges/1');
    const response = await GET(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe('Docker Challenge');
    expect(data.content).toBe('docker compose up -d');
  });

  it('should return 500 on error', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetTeamCustomChallengeById.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges/1');
    const response = await GET(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});

describe('PUT /api/team/custom-challenges/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges/1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' }),
    });
    const response = await PUT(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid id', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges/abc', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' }),
    });
    const response = await PUT(request, { params: createParams('abc') });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid challenge ID');
  });

  it('should return 400 for invalid body', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges/1', {
      method: 'PUT',
      body: JSON.stringify({ difficulty: 'impossible' }),
    });
    const response = await PUT(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should update the challenge', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockUpdateTeamCustomChallenge.mockResolvedValue({
      ...mockChallenge,
      name: 'Updated Challenge',
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges/1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Challenge' }),
    });
    const response = await PUT(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe('Updated Challenge');
    expect(mockUpdateTeamCustomChallenge).toHaveBeenCalledWith(1, {
      name: 'Updated Challenge',
    });
  });

  it('should return 404 if challenge not found or not authorized', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockUpdateTeamCustomChallenge.mockRejectedValue(
      new Error('Team custom challenge not found or not authorized')
    );

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges/999', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' }),
    });
    const response = await PUT(request, { params: createParams('999') });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Challenge not found or not authorized');
  });

  it('should return 404 if user has no team', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockUpdateTeamCustomChallenge.mockRejectedValue(
      new Error('User is not a member of any team')
    );

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges/1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' }),
    });
    const response = await PUT(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('No team found');
  });
});

describe('DELETE /api/team/custom-challenges/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges/1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid id', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges/abc', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: createParams('abc') });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid challenge ID');
  });

  it('should delete the challenge', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockDeleteTeamCustomChallenge.mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges/1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockDeleteTeamCustomChallenge).toHaveBeenCalledWith(1);
  });

  it('should return 404 if challenge not found', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockDeleteTeamCustomChallenge.mockRejectedValue(
      new Error('Team custom challenge not found')
    );

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges/999', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: createParams('999') });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Challenge not found');
  });

  it('should return 403 if not authorized to delete', async () => {
    mockGetUser.mockResolvedValue({ id: 2, email: 'other@test.com' });
    mockDeleteTeamCustomChallenge.mockRejectedValue(
      new Error('Not authorized to delete this challenge')
    );

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges/1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Not authorized');
  });

  it('should return 404 if user has no team', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockDeleteTeamCustomChallenge.mockRejectedValue(
      new Error('User is not a member of any team')
    );

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges/1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('No team found');
  });

  it('should return 500 on unexpected error', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockDeleteTeamCustomChallenge.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/team/custom-challenges/1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
