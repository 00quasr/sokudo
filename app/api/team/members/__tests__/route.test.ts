import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  getTeamMembersWithStats: vi.fn(),
  createTeamInvitation: vi.fn(),
}));

vi.mock('@/lib/auth/permissions', () => ({
  requireTeamAdmin: vi.fn(),
}));

import { getUser, getTeamMembersWithStats, createTeamInvitation } from '@/lib/db/queries';
import { GET, POST } from '../route';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockGetTeamMembersWithStats = getTeamMembersWithStats as ReturnType<typeof vi.fn>;
const mockCreateTeamInvitation = createTeamInvitation as ReturnType<typeof vi.fn>;

function createPostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/team/members', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GET /api/team/members', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 when user is not admin', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetTeamMembersWithStats.mockRejectedValue(
      new Error('Insufficient permissions: admin role required')
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden: admin role required');
  });

  it('should return members when user is admin', async () => {
    const mockMembers = [
      {
        id: 1,
        userId: 1,
        role: 'owner',
        joinedAt: new Date(),
        userName: 'Owner',
        userEmail: 'owner@test.com',
        stats: { userId: 1, totalSessions: 10, avgWpm: 80, avgAccuracy: 95, totalPracticeMs: 60000 },
      },
      {
        id: 2,
        userId: 2,
        role: 'member',
        joinedAt: new Date(),
        userName: 'Member',
        userEmail: 'member@test.com',
        stats: { userId: 2, totalSessions: 5, avgWpm: 60, avgAccuracy: 90, totalPracticeMs: 30000 },
      },
    ];

    mockGetUser.mockResolvedValue({ id: 1, email: 'owner@test.com' });
    mockGetTeamMembersWithStats.mockResolvedValue(mockMembers);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.members).toHaveLength(2);
    expect(data.members[0].role).toBe('owner');
    expect(data.members[1].role).toBe('member');
  });
});

describe('POST /api/team/members', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);
    const request = createPostRequest({ email: 'new@test.com', role: 'member' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid email', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'admin@test.com' });
    const request = createPostRequest({ email: 'not-an-email', role: 'member' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should return 400 for invalid role', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'admin@test.com' });
    const request = createPostRequest({ email: 'new@test.com', role: 'owner' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should return 409 when invitation already exists', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'admin@test.com' });
    mockCreateTeamInvitation.mockRejectedValue(
      new Error('A pending invitation already exists for this email')
    );
    const request = createPostRequest({ email: 'existing@test.com', role: 'member' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain('already exists');
  });

  it('should return 409 when user is already a team member', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'admin@test.com' });
    mockCreateTeamInvitation.mockRejectedValue(
      new Error('User is already a member of this team')
    );
    const request = createPostRequest({ email: 'member@test.com', role: 'member' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain('already a member');
  });

  it('should create invitation successfully', async () => {
    const mockInvitation = {
      id: 1,
      teamId: 1,
      email: 'new@test.com',
      role: 'member',
      invitedBy: 1,
      invitedAt: new Date(),
      status: 'pending',
    };

    mockGetUser.mockResolvedValue({ id: 1, email: 'admin@test.com' });
    mockCreateTeamInvitation.mockResolvedValue(mockInvitation);
    const request = createPostRequest({ email: 'new@test.com', role: 'member' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.email).toBe('new@test.com');
    expect(data.role).toBe('member');
  });
});
