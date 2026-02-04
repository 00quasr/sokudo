import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

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

const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  username: 'testuser',
  passwordHash: 'hash',
  role: 'member',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockProfile = {
  id: 1,
  userId: 1,
  avatarUrl: 'https://example.com/avatar.png',
  bio: 'A developer',
  preferredCategoryIds: [1, 2],
  subscriptionTier: 'free',
  currentStreak: 5,
  longestStreak: 10,
  totalPracticeTimeMs: 300000,
  preferences: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('GET /api/user/profile', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should return 401 when user is not authenticated', async () => {
    const { getUser } = await import('@/lib/db/queries');
    vi.mocked(getUser).mockResolvedValue(null);

    const { GET } = await import('../route');
    const response = await GET();

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('should return default profile when user has no profile', async () => {
    const { getUser } = await import('@/lib/db/queries');
    const { db } = await import('@/lib/db/drizzle');

    vi.mocked(getUser).mockResolvedValue(mockUser);
    vi.mocked(db.query.userProfiles.findFirst).mockResolvedValue(undefined);

    const { GET } = await import('../route');
    const response = await GET();

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.avatarUrl).toBeNull();
    expect(json.bio).toBeNull();
    expect(json.preferredCategoryIds).toEqual([]);
  });

  it('should return saved profile data', async () => {
    const { getUser } = await import('@/lib/db/queries');
    const { db } = await import('@/lib/db/drizzle');

    vi.mocked(getUser).mockResolvedValue(mockUser);
    vi.mocked(db.query.userProfiles.findFirst).mockResolvedValue(mockProfile);

    const { GET } = await import('../route');
    const response = await GET();

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.avatarUrl).toBe('https://example.com/avatar.png');
    expect(json.bio).toBe('A developer');
    expect(json.preferredCategoryIds).toEqual([1, 2]);
  });
});

describe('PATCH /api/user/profile', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should return 401 when user is not authenticated', async () => {
    const { getUser } = await import('@/lib/db/queries');
    vi.mocked(getUser).mockResolvedValue(null);

    const { PATCH } = await import('../route');
    const request = new NextRequest('http://localhost/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({ bio: 'New bio' }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(401);
  });

  it('should return 400 for invalid avatar URL', async () => {
    const { getUser } = await import('@/lib/db/queries');
    vi.mocked(getUser).mockResolvedValue(mockUser);

    const { PATCH } = await import('../route');
    const request = new NextRequest('http://localhost/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({ avatarUrl: 'not-a-url' }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Invalid profile data');
  });

  it('should return 400 for bio exceeding max length', async () => {
    const { getUser } = await import('@/lib/db/queries');
    vi.mocked(getUser).mockResolvedValue(mockUser);

    const { PATCH } = await import('../route');
    const request = new NextRequest('http://localhost/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({ bio: 'a'.repeat(501) }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(400);
  });

  it('should return 400 for invalid category IDs', async () => {
    const { getUser } = await import('@/lib/db/queries');
    vi.mocked(getUser).mockResolvedValue(mockUser);

    const { PATCH } = await import('../route');
    const request = new NextRequest('http://localhost/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({ preferredCategoryIds: [-1, 0] }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(400);
  });

  it('should update existing profile', async () => {
    const { getUser } = await import('@/lib/db/queries');
    const { db } = await import('@/lib/db/drizzle');

    vi.mocked(getUser).mockResolvedValue(mockUser);
    // First call for existing profile check, second for returning updated data
    vi.mocked(db.query.userProfiles.findFirst)
      .mockResolvedValueOnce(mockProfile)
      .mockResolvedValueOnce({
        ...mockProfile,
        bio: 'Updated bio',
      });

    const { PATCH } = await import('../route');
    const request = new NextRequest('http://localhost/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({ bio: 'Updated bio' }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.bio).toBe('Updated bio');
  });

  it('should create profile when none exists', async () => {
    const { getUser } = await import('@/lib/db/queries');
    const { db } = await import('@/lib/db/drizzle');

    vi.mocked(getUser).mockResolvedValue(mockUser);
    vi.mocked(db.query.userProfiles.findFirst)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({
        ...mockProfile,
        avatarUrl: 'https://example.com/new.png',
        bio: 'New user bio',
        preferredCategoryIds: [3],
      });

    const { PATCH } = await import('../route');
    const request = new NextRequest('http://localhost/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        avatarUrl: 'https://example.com/new.png',
        bio: 'New user bio',
        preferredCategoryIds: [3],
      }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.avatarUrl).toBe('https://example.com/new.png');
    expect(json.preferredCategoryIds).toEqual([3]);
  });

  it('should accept null avatar URL to clear it', async () => {
    const { getUser } = await import('@/lib/db/queries');
    const { db } = await import('@/lib/db/drizzle');

    vi.mocked(getUser).mockResolvedValue(mockUser);
    vi.mocked(db.query.userProfiles.findFirst)
      .mockResolvedValueOnce(mockProfile)
      .mockResolvedValueOnce({
        ...mockProfile,
        avatarUrl: null,
      });

    const { PATCH } = await import('../route');
    const request = new NextRequest('http://localhost/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({ avatarUrl: null }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.avatarUrl).toBeNull();
  });
});
