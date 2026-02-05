import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        orderBy: vi.fn(() => Promise.resolve([])),
        where: vi.fn(() => Promise.resolve([])),
      })),
    })),
  },
}));

import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';

const mockGetSession = getSession as ReturnType<typeof vi.fn>;
const mockDb = db as any;

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('GET /api/onboarding/steps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const request = createRequest('/api/onboarding/steps');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return onboarding steps and user progress for authenticated user', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 1, email: 'test@test.com' },
    });

    const mockSteps = [
      {
        id: 1,
        stepKey: 'welcome',
        title: 'Welcome',
        description: 'Get started',
        content: 'Welcome content',
        category: 'getting-started',
        stepOrder: 1,
        isOptional: false,
      },
    ];

    const mockProgress = [
      {
        id: 1,
        userId: 1,
        stepId: 1,
        completed: true,
        skipped: false,
        completedAt: new Date(),
      },
    ];

    let selectCallCount = 0;
    mockDb.select.mockImplementation(() => ({
      from: vi.fn(() => ({
        orderBy: vi.fn(() => {
          selectCallCount++;
          if (selectCallCount === 1) {
            return Promise.resolve(mockSteps);
          }
          return Promise.resolve([]);
        }),
        where: vi.fn(() => {
          return Promise.resolve(mockProgress);
        }),
      })),
    }));

    const request = createRequest('/api/onboarding/steps');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.steps).toBeDefined();
    expect(data.progress).toBeDefined();
  });

  it('should handle database errors gracefully', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 1, email: 'test@test.com' },
    });

    mockDb.select.mockImplementation(() => ({
      from: vi.fn(() => ({
        orderBy: vi.fn(() => Promise.reject(new Error('Database error'))),
      })),
    }));

    const request = createRequest('/api/onboarding/steps');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch onboarding steps');
  });
});
