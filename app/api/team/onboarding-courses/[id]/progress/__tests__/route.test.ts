import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  markOnboardingStepComplete: vi.fn(),
}));

import {
  getUser,
  markOnboardingStepComplete,
} from '@/lib/db/queries';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockMarkComplete = markOnboardingStepComplete as ReturnType<typeof vi.fn>;

function makeParams(id: string): Promise<{ id: string }> {
  return Promise.resolve({ id });
}

describe('POST /api/team/onboarding-courses/[id]/progress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3000/api/team/onboarding-courses/1/progress',
      {
        method: 'POST',
        body: JSON.stringify({ stepId: 1 }),
      }
    );

    const response = await POST(request, { params: makeParams('1') });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid course ID', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = new NextRequest(
      'http://localhost:3000/api/team/onboarding-courses/abc/progress',
      {
        method: 'POST',
        body: JSON.stringify({ stepId: 1 }),
      }
    );

    const response = await POST(request, { params: makeParams('abc') });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid course ID');
  });

  it('should return 400 for missing stepId', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = new NextRequest(
      'http://localhost:3000/api/team/onboarding-courses/1/progress',
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );

    const response = await POST(request, { params: makeParams('1') });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should mark a step as complete', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockMarkComplete.mockResolvedValue({
      id: 1,
      courseId: 1,
      userId: 1,
      stepId: 5,
      sessionId: null,
      completedAt: new Date(),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/team/onboarding-courses/1/progress',
      {
        method: 'POST',
        body: JSON.stringify({ stepId: 5 }),
      }
    );

    const response = await POST(request, { params: makeParams('1') });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.stepId).toBe(5);
  });

  it('should mark a step complete with sessionId', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockMarkComplete.mockResolvedValue({
      id: 1,
      courseId: 1,
      userId: 1,
      stepId: 5,
      sessionId: 42,
      completedAt: new Date(),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/team/onboarding-courses/1/progress',
      {
        method: 'POST',
        body: JSON.stringify({ stepId: 5, sessionId: 42 }),
      }
    );

    const response = await POST(request, { params: makeParams('1') });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.sessionId).toBe(42);
  });

  it('should return 404 if user has no team', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockMarkComplete.mockRejectedValue(
      new Error('User is not a member of any team')
    );

    const request = new NextRequest(
      'http://localhost:3000/api/team/onboarding-courses/1/progress',
      {
        method: 'POST',
        body: JSON.stringify({ stepId: 1 }),
      }
    );

    const response = await POST(request, { params: makeParams('1') });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('No team found');
  });

  it('should return 404 if step not found', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockMarkComplete.mockRejectedValue(new Error('Course step not found'));

    const request = new NextRequest(
      'http://localhost:3000/api/team/onboarding-courses/1/progress',
      {
        method: 'POST',
        body: JSON.stringify({ stepId: 999 }),
      }
    );

    const response = await POST(request, { params: makeParams('1') });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Step not found');
  });

  it('should return 500 on unexpected error', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockMarkComplete.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest(
      'http://localhost:3000/api/team/onboarding-courses/1/progress',
      {
        method: 'POST',
        body: JSON.stringify({ stepId: 1 }),
      }
    );

    const response = await POST(request, { params: makeParams('1') });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
