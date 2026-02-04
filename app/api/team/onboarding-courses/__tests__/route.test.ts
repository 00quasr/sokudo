import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  getTeamOnboardingCourses: vi.fn(),
  createTeamOnboardingCourse: vi.fn(),
}));

import {
  getUser,
  getTeamOnboardingCourses,
  createTeamOnboardingCourse,
} from '@/lib/db/queries';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockGetTeamOnboardingCourses = getTeamOnboardingCourses as ReturnType<typeof vi.fn>;
const mockCreateTeamOnboardingCourse = createTeamOnboardingCourse as ReturnType<typeof vi.fn>;

const mockCourses = [
  {
    id: 1,
    teamId: 1,
    createdBy: 1,
    name: 'Git Basics Onboarding',
    description: 'Learn essential git commands',
    status: 'active',
    createdAt: new Date('2026-01-30T10:00:00Z'),
    updatedAt: new Date('2026-01-30T10:00:00Z'),
    creatorName: 'Alice',
    creatorEmail: 'alice@test.com',
    stepCount: 5,
  },
  {
    id: 2,
    teamId: 1,
    createdBy: 1,
    name: 'Docker Fundamentals',
    description: null,
    status: 'archived',
    createdAt: new Date('2026-01-29T10:00:00Z'),
    updatedAt: new Date('2026-01-29T10:00:00Z'),
    creatorName: 'Alice',
    creatorEmail: 'alice@test.com',
    stepCount: 3,
  },
];

describe('GET /api/team/onboarding-courses', () => {
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

  it('should return onboarding courses', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetTeamOnboardingCourses.mockResolvedValue(mockCourses);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.courses).toHaveLength(2);
  });

  it('should include all required fields', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetTeamOnboardingCourses.mockResolvedValue(mockCourses);

    const response = await GET();
    const data = await response.json();

    const course = data.courses[0];
    expect(course).toHaveProperty('id');
    expect(course).toHaveProperty('teamId');
    expect(course).toHaveProperty('name');
    expect(course).toHaveProperty('description');
    expect(course).toHaveProperty('status');
    expect(course).toHaveProperty('stepCount');
    expect(course).toHaveProperty('creatorName');
    expect(course).toHaveProperty('creatorEmail');
  });

  it('should return empty array when no courses', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetTeamOnboardingCourses.mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.courses).toHaveLength(0);
  });

  it('should return 500 on error', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetTeamOnboardingCourses.mockRejectedValue(new Error('Database error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});

describe('POST /api/team/onboarding-courses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/team/onboarding-courses', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Course',
        challengeIds: [1, 2, 3],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for missing name', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = new NextRequest('http://localhost:3000/api/team/onboarding-courses', {
      method: 'POST',
      body: JSON.stringify({ challengeIds: [1, 2] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should return 400 for missing challengeIds', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = new NextRequest('http://localhost:3000/api/team/onboarding-courses', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Course' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should return 400 for empty challengeIds array', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = new NextRequest('http://localhost:3000/api/team/onboarding-courses', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', challengeIds: [] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should create an onboarding course', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockCreateTeamOnboardingCourse.mockResolvedValue({
      id: 1,
      teamId: 1,
      createdBy: 1,
      name: 'Git Basics',
      description: 'Learn git',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost:3000/api/team/onboarding-courses', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Git Basics',
        description: 'Learn git',
        challengeIds: [1, 2, 3],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.name).toBe('Git Basics');
  });

  it('should return 404 if user has no team', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockCreateTeamOnboardingCourse.mockRejectedValue(
      new Error('User is not a member of any team')
    );

    const request = new NextRequest('http://localhost:3000/api/team/onboarding-courses', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test',
        challengeIds: [1],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('No team found');
  });

  it('should return 403 if user is not admin', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockCreateTeamOnboardingCourse.mockRejectedValue(
      new Error('Only team admins can create onboarding courses')
    );

    const request = new NextRequest('http://localhost:3000/api/team/onboarding-courses', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test',
        challengeIds: [1],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('should return 500 on unexpected error', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockCreateTeamOnboardingCourse.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/team/onboarding-courses', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test',
        challengeIds: [1],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
