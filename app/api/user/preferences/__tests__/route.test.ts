import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/rate-limit', () => ({
  apiRateLimit: vi.fn(() => null),
}));

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
}));

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    query: {
      userProfiles: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(),
    })),
  },
}));

describe('GET /api/user/preferences', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should return 401 when user is not authenticated', async () => {
    const { getUser } = await import('@/lib/db/queries');
    vi.mocked(getUser).mockResolvedValue(null);

    const { GET } = await import('../route');
    const request = new NextRequest('http://localhost/api/user/preferences');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('should return default preferences when user has no profile', async () => {
    const { getUser } = await import('@/lib/db/queries');
    const { db } = await import('@/lib/db/drizzle');

    vi.mocked(getUser).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hash',
      role: 'member',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    vi.mocked(db.query.userProfiles.findFirst).mockResolvedValue(undefined);

    const { GET } = await import('../route');
    const request = new NextRequest('http://localhost/api/user/preferences');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.weeklyReportEnabled).toBe(true);
    expect(json.theme).toBe('system');
  });

  it('should return saved preferences', async () => {
    const { getUser } = await import('@/lib/db/queries');
    const { db } = await import('@/lib/db/drizzle');

    vi.mocked(getUser).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hash',
      role: 'member',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    vi.mocked(db.query.userProfiles.findFirst).mockResolvedValue({
      id: 1,
      userId: 1,
      subscriptionTier: 'free',
      currentStreak: 0,
      longestStreak: 0,
      totalPracticeTimeMs: 0,
      preferences: { weeklyReportEnabled: false, theme: 'dark' },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { GET } = await import('../route');
    const request = new NextRequest('http://localhost/api/user/preferences');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.weeklyReportEnabled).toBe(false);
    expect(json.theme).toBe('dark');
  });
});

describe('PATCH /api/user/preferences', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should return 401 when user is not authenticated', async () => {
    const { getUser } = await import('@/lib/db/queries');
    vi.mocked(getUser).mockResolvedValue(null);

    const { PATCH } = await import('../route');
    const request = new NextRequest('http://localhost/api/user/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ weeklyReportEnabled: false }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(401);
  });

  it('should return 400 for invalid preferences', async () => {
    const { getUser } = await import('@/lib/db/queries');
    vi.mocked(getUser).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hash',
      role: 'member',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const { PATCH } = await import('../route');
    const request = new NextRequest('http://localhost/api/user/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ weeklyReportEnabled: 'not-a-boolean' }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Invalid preferences');
  });

  it('should accept valid boolean preference', async () => {
    const { getUser } = await import('@/lib/db/queries');
    const { db } = await import('@/lib/db/drizzle');

    vi.mocked(getUser).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hash',
      role: 'member',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    vi.mocked(db.query.userProfiles.findFirst).mockResolvedValue({
      id: 1,
      userId: 1,
      subscriptionTier: 'free',
      currentStreak: 0,
      longestStreak: 0,
      totalPracticeTimeMs: 0,
      preferences: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { PATCH } = await import('../route');
    const request = new NextRequest('http://localhost/api/user/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ weeklyReportEnabled: false }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.preferences.weeklyReportEnabled).toBe(false);
  });

  it('should accept valid theme preference', async () => {
    const { getUser } = await import('@/lib/db/queries');
    const { db } = await import('@/lib/db/drizzle');

    vi.mocked(getUser).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hash',
      role: 'member',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    vi.mocked(db.query.userProfiles.findFirst).mockResolvedValue({
      id: 1,
      userId: 1,
      subscriptionTier: 'free',
      currentStreak: 0,
      longestStreak: 0,
      totalPracticeTimeMs: 0,
      preferences: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { PATCH } = await import('../route');
    const request = new NextRequest('http://localhost/api/user/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ theme: 'dark' }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.preferences.theme).toBe('dark');
  });

  it('should reject invalid theme value', async () => {
    const { getUser } = await import('@/lib/db/queries');
    vi.mocked(getUser).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hash',
      role: 'member',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const { PATCH } = await import('../route');
    const request = new NextRequest('http://localhost/api/user/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ theme: 'invalid-theme' }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Invalid preferences');
  });

  it('should accept all valid theme values', async () => {
    const { getUser } = await import('@/lib/db/queries');
    const { db } = await import('@/lib/db/drizzle');

    vi.mocked(getUser).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hash',
      role: 'member',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    vi.mocked(db.query.userProfiles.findFirst).mockResolvedValue({
      id: 1,
      userId: 1,
      subscriptionTier: 'free',
      currentStreak: 0,
      longestStreak: 0,
      totalPracticeTimeMs: 0,
      preferences: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { PATCH } = await import('../route');

    for (const theme of ['light', 'dark', 'system']) {
      const request = new NextRequest('http://localhost/api/user/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ theme }),
      });

      const response = await PATCH(request);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.preferences.theme).toBe(theme);
    }
  });
});
