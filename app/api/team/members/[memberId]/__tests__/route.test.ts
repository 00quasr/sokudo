import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  removeTeamMember: vi.fn(),
  updateTeamMemberRole: vi.fn(),
}));

vi.mock('@/lib/auth/permissions', () => ({
  requireTeamAdmin: vi.fn(),
  requireTeamOwner: vi.fn(),
}));

import { getUser, removeTeamMember, updateTeamMemberRole } from '@/lib/db/queries';
import { PATCH, DELETE } from '../route';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockRemoveTeamMember = removeTeamMember as ReturnType<typeof vi.fn>;
const mockUpdateTeamMemberRole = updateTeamMemberRole as ReturnType<typeof vi.fn>;

function createPatchRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/team/members/2', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createDeleteRequest(): NextRequest {
  return new NextRequest('http://localhost:3000/api/team/members/2', {
    method: 'DELETE',
  });
}

function createParams(memberId: string) {
  return { params: Promise.resolve({ memberId }) };
}

describe('PATCH /api/team/members/[memberId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);
    const request = createPatchRequest({ role: 'admin' });

    const response = await PATCH(request, createParams('2'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid member ID', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'owner@test.com' });
    const request = createPatchRequest({ role: 'admin' });

    const response = await PATCH(request, createParams('abc'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid member ID');
  });

  it('should return 400 for invalid role value', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'owner@test.com' });
    const request = createPatchRequest({ role: 'owner' });

    const response = await PATCH(request, createParams('2'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should return 403 when user is not owner', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'admin@test.com' });
    mockUpdateTeamMemberRole.mockRejectedValue(
      new Error('Insufficient permissions: owner role required')
    );
    const request = createPatchRequest({ role: 'admin' });

    const response = await PATCH(request, createParams('2'));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('owner');
  });

  it('should return 404 when target is not a member', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'owner@test.com' });
    mockUpdateTeamMemberRole.mockRejectedValue(
      new Error('Target user is not a member of this team')
    );
    const request = createPatchRequest({ role: 'admin' });

    const response = await PATCH(request, createParams('99'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('not a member');
  });

  it('should update role successfully', async () => {
    const mockUpdated = {
      id: 2,
      userId: 2,
      teamId: 1,
      role: 'admin',
      joinedAt: new Date(),
    };
    mockGetUser.mockResolvedValue({ id: 1, email: 'owner@test.com' });
    mockUpdateTeamMemberRole.mockResolvedValue(mockUpdated);
    const request = createPatchRequest({ role: 'admin' });

    const response = await PATCH(request, createParams('2'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.role).toBe('admin');
  });
});

describe('DELETE /api/team/members/[memberId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);
    const request = createDeleteRequest();

    const response = await DELETE(request, createParams('2'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid member ID', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'admin@test.com' });
    const request = createDeleteRequest();

    const response = await DELETE(request, createParams('abc'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid member ID');
  });

  it('should return 403 when user is not admin', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'member@test.com' });
    mockRemoveTeamMember.mockRejectedValue(
      new Error('Insufficient permissions: admin role required')
    );
    const request = createDeleteRequest();

    const response = await DELETE(request, createParams('2'));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('admin role required');
  });

  it('should return 403 when trying to remove someone not allowed', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'admin@test.com' });
    mockRemoveTeamMember.mockRejectedValue(
      new Error('Not authorized to remove this team member')
    );
    const request = createDeleteRequest();

    const response = await DELETE(request, createParams('3'));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Not authorized');
  });

  it('should return 404 when target is not a member', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'admin@test.com' });
    mockRemoveTeamMember.mockRejectedValue(
      new Error('Target user is not a member of this team')
    );
    const request = createDeleteRequest();

    const response = await DELETE(request, createParams('99'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('not a member');
  });

  it('should remove member successfully', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'admin@test.com' });
    mockRemoveTeamMember.mockResolvedValue({ success: true });
    const request = createDeleteRequest();

    const response = await DELETE(request, createParams('2'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
