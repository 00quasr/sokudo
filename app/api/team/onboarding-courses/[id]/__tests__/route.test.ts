import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from '../route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  getTeamOnboardingCourseById: vi.fn(),
  updateTeamOnboardingCourse: vi.fn(),
  deleteTeamOnboardingCourse: vi.fn(),
  getOnboardingCourseProgress: vi.fn(),
}));

import {
  getUser,
  getTeamOnboardingCourseById,
  updateTeamOnboardingCourse,
  deleteTeamOnboardingCourse,
  getOnboardingCourseProgress,
} from '@/lib/db/queries';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockGetCourseById = getTeamOnboardingCourseById as ReturnType<typeof vi.fn>;
const mockUpdateCourse = updateTeamOnboardingCourse as ReturnType<typeof vi.fn>;
const mockDeleteCourse = deleteTeamOnboardingCourse as ReturnType<typeof vi.fn>;
const mockGetProgress = getOnboardingCourseProgress as ReturnType<typeof vi.fn>;

const mockCourse = {
  id: 1,
  teamId: 1,
  createdBy: 1,
  name: 'Git Basics',
  description: 'Learn git',
  status: 'active',
  createdAt: new Date('2026-01-30T10:00:00Z'),
  updatedAt: new Date('2026-01-30T10:00:00Z'),
  creatorName: 'Alice',
  creatorEmail: 'alice@test.com',
  stepCount: 3,
  steps: [
    {
      id: 1,
      courseId: 1,
      challengeId: 10,
      stepOrder: 1,
      createdAt: new Date(),
      challengeContent: 'git init',
      challengeDifficulty: 'beginner',
      challengeSyntaxType: 'git',
      challengeHint: null,
      categoryName: 'Git Basics',
      categorySlug: 'git-basics',
    },
  ],
};

function makeParams(id: string): Promise<{ id: string }> {
  return Promise.resolve({ id });
}

describe('GET /api/team/onboarding-courses/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/team/onboarding-courses/1');
    const response = await GET(request, { params: makeParams('1') });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid course ID', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = new NextRequest('http://localhost:3000/api/team/onboarding-courses/abc');
    const response = await GET(request, { params: makeParams('abc') });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid course ID');
  });

  it('should return 404 if course not found', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetCourseById.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/team/onboarding-courses/999');
    const response = await GET(request, { params: makeParams('999') });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Course not found');
  });

  it('should return course with progress', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetCourseById.mockResolvedValue(mockCourse);
    mockGetProgress.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/team/onboarding-courses/1');
    const response = await GET(request, { params: makeParams('1') });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.course.name).toBe('Git Basics');
    expect(data.course.steps).toHaveLength(1);
    expect(data.progress).toHaveLength(0);
  });

  it('should return 500 on error', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetCourseById.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/team/onboarding-courses/1');
    const response = await GET(request, { params: makeParams('1') });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});

describe('PUT /api/team/onboarding-courses/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/team/onboarding-courses/1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' }),
    });

    const response = await PUT(request, { params: makeParams('1') });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid body', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = new NextRequest('http://localhost:3000/api/team/onboarding-courses/1', {
      method: 'PUT',
      body: JSON.stringify({ status: 'invalid-status' }),
    });

    const response = await PUT(request, { params: makeParams('1') });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should update a course', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockUpdateCourse.mockResolvedValue({
      ...mockCourse,
      name: 'Updated Name',
    });

    const request = new NextRequest('http://localhost:3000/api/team/onboarding-courses/1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Name' }),
    });

    const response = await PUT(request, { params: makeParams('1') });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe('Updated Name');
  });

  it('should return 403 if user is not admin', async () => {
    mockGetUser.mockResolvedValue({ id: 2, email: 'member@test.com' });
    mockUpdateCourse.mockRejectedValue(
      new Error('Only team admins can update onboarding courses')
    );

    const request = new NextRequest('http://localhost:3000/api/team/onboarding-courses/1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' }),
    });

    const response = await PUT(request, { params: makeParams('1') });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('should return 404 if course not found', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockUpdateCourse.mockRejectedValue(new Error('Onboarding course not found'));

    const request = new NextRequest('http://localhost:3000/api/team/onboarding-courses/999', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' }),
    });

    const response = await PUT(request, { params: makeParams('999') });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Course not found');
  });
});

describe('DELETE /api/team/onboarding-courses/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/team/onboarding-courses/1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: makeParams('1') });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should delete a course', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockDeleteCourse.mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost:3000/api/team/onboarding-courses/1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: makeParams('1') });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should return 403 if user is not admin', async () => {
    mockGetUser.mockResolvedValue({ id: 2, email: 'member@test.com' });
    mockDeleteCourse.mockRejectedValue(
      new Error('Only team admins can delete onboarding courses')
    );

    const request = new NextRequest('http://localhost:3000/api/team/onboarding-courses/1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: makeParams('1') });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('should return 404 if course not found', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockDeleteCourse.mockRejectedValue(new Error('Onboarding course not found'));

    const request = new NextRequest('http://localhost:3000/api/team/onboarding-courses/999', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: makeParams('999') });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Course not found');
  });

  it('should return 500 on unexpected error', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockDeleteCourse.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/team/onboarding-courses/1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: makeParams('1') });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
