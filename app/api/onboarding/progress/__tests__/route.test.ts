import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{}])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{}])),
        })),
      })),
    })),
  },
}));

import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';

const mockGetSession = getSession as ReturnType<typeof vi.fn>;
const mockDb = db as any;

function createRequest(url: string, body: any): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/onboarding/progress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const request = createRequest('/api/onboarding/progress', {
      stepId: 1,
      completed: true,
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 if request data is invalid', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 1, email: 'test@test.com' },
    });

    const request = createRequest('/api/onboarding/progress', {
      stepId: 'invalid',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request data');
  });

  it('should create new progress record for new step', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 1, email: 'test@test.com' },
    });

    mockDb.select.mockImplementation(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    }));

    const mockCreated = {
      id: 1,
      userId: 1,
      stepId: 1,
      completed: true,
      skipped: false,
      completedAt: new Date(),
    };

    mockDb.insert.mockImplementation(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([mockCreated])),
      })),
    }));

    const request = createRequest('/api/onboarding/progress', {
      stepId: 1,
      completed: true,
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.progress).toBeDefined();
  });

  it('should update existing progress record', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 1, email: 'test@test.com' },
    });

    const existingProgress = {
      id: 1,
      userId: 1,
      stepId: 1,
      completed: false,
      skipped: false,
      completedAt: null,
    };

    mockDb.select.mockImplementation(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([existingProgress])),
        })),
      })),
    }));

    const mockUpdated = {
      ...existingProgress,
      completed: true,
      completedAt: new Date(),
    };

    mockDb.update.mockImplementation(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([mockUpdated])),
        })),
      })),
    }));

    const request = createRequest('/api/onboarding/progress', {
      stepId: 1,
      completed: true,
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.progress).toBeDefined();
  });

  it('should handle skip action', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 1, email: 'test@test.com' },
    });

    mockDb.select.mockImplementation(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    }));

    const mockCreated = {
      id: 1,
      userId: 1,
      stepId: 1,
      completed: false,
      skipped: true,
      completedAt: null,
    };

    mockDb.insert.mockImplementation(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([mockCreated])),
      })),
    }));

    const request = createRequest('/api/onboarding/progress', {
      stepId: 1,
      skipped: true,
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.progress).toBeDefined();
  });

  it('should handle database errors gracefully', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 1, email: 'test@test.com' },
    });

    mockDb.select.mockImplementation(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.reject(new Error('Database error'))),
        })),
      })),
    }));

    const request = createRequest('/api/onboarding/progress', {
      stepId: 1,
      completed: true,
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to update onboarding progress');
  });
});
