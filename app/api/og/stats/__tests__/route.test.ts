import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database queries
vi.mock('@/lib/db/queries', () => ({
  getUserByUsername: vi.fn(),
  getPublicProfileStats: vi.fn(),
  getPublicCategoryPerformance: vi.fn(),
}));

// Mock @vercel/og ImageResponse
vi.mock('@vercel/og', () => ({
  ImageResponse: class MockImageResponse {
    constructor(public element: unknown, public options: unknown) {}
  },
}));

import { GET } from '../[username]/route';
import {
  getUserByUsername,
  getPublicProfileStats,
  getPublicCategoryPerformance,
} from '@/lib/db/queries';

const mockGetUserByUsername = vi.mocked(getUserByUsername);
const mockGetPublicProfileStats = vi.mocked(getPublicProfileStats);
const mockGetPublicCategoryPerformance = vi.mocked(getPublicCategoryPerformance);

function createRequest(url: string = 'http://localhost:3000/api/og/stats/testuser') {
  return new Request(url);
}

describe('OG Stats Image Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 404 when user is not found', async () => {
    mockGetUserByUsername.mockResolvedValue(null);

    const response = await GET(createRequest() as never, {
      params: Promise.resolve({ username: 'nonexistent' }),
    });

    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(404);
  });

  it('should call getUserByUsername with the correct username', async () => {
    mockGetUserByUsername.mockResolvedValue(null);

    await GET(createRequest() as never, {
      params: Promise.resolve({ username: 'testuser' }),
    });

    expect(mockGetUserByUsername).toHaveBeenCalledWith('testuser');
  });

  it('should fetch stats when user exists', async () => {
    const mockUser = {
      id: 1,
      name: 'Test User',
      username: 'testuser',
      email: 'test@test.com',
      passwordHash: 'hash',
      role: 'member' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    mockGetUserByUsername.mockResolvedValue(mockUser);
    mockGetPublicProfileStats.mockResolvedValue({
      totalSessions: 10,
      avgWpm: 65,
      avgAccuracy: 95,
      totalPracticeTimeMs: 3600000,
      bestWpm: 85,
      bestAccuracy: 100,
      currentStreak: 5,
      longestStreak: 12,
    });
    mockGetPublicCategoryPerformance.mockResolvedValue([
      {
        categoryId: 1,
        categoryName: 'Git Basics',
        categorySlug: 'git-basics',
        sessions: 5,
        avgWpm: 70,
        avgAccuracy: 96,
      },
    ]);

    const response = await GET(createRequest() as never, {
      params: Promise.resolve({ username: 'testuser' }),
    });

    expect(mockGetPublicProfileStats).toHaveBeenCalledWith(1);
    expect(mockGetPublicCategoryPerformance).toHaveBeenCalledWith(1);
    // ImageResponse is returned (not a plain Response with 404)
    expect(response).not.toBeInstanceOf(Response);
  });

  it('should handle user with no name gracefully', async () => {
    const mockUser = {
      id: 2,
      name: null,
      username: 'noname',
      email: 'noname@test.com',
      passwordHash: 'hash',
      role: 'member' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    mockGetUserByUsername.mockResolvedValue(mockUser);
    mockGetPublicProfileStats.mockResolvedValue({
      totalSessions: 0,
      avgWpm: 0,
      avgAccuracy: 0,
      totalPracticeTimeMs: 0,
      bestWpm: 0,
      bestAccuracy: 0,
      currentStreak: 0,
      longestStreak: 0,
    });
    mockGetPublicCategoryPerformance.mockResolvedValue([]);

    const response = await GET(createRequest() as never, {
      params: Promise.resolve({ username: 'noname' }),
    });

    // Should not throw - falls back to username
    expect(response).not.toBeInstanceOf(Response);
  });

  it('should handle empty category performance', async () => {
    const mockUser = {
      id: 3,
      name: 'Empty User',
      username: 'emptyuser',
      email: 'empty@test.com',
      passwordHash: 'hash',
      role: 'member' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    mockGetUserByUsername.mockResolvedValue(mockUser);
    mockGetPublicProfileStats.mockResolvedValue({
      totalSessions: 1,
      avgWpm: 50,
      avgAccuracy: 90,
      totalPracticeTimeMs: 60000,
      bestWpm: 50,
      bestAccuracy: 90,
      currentStreak: 1,
      longestStreak: 1,
    });
    mockGetPublicCategoryPerformance.mockResolvedValue([]);

    const response = await GET(createRequest() as never, {
      params: Promise.resolve({ username: 'emptyuser' }),
    });

    expect(response).not.toBeInstanceOf(Response);
  });
});
