import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db/queries', () => ({
  getUserByUsername: vi.fn(),
  getUserProfile: vi.fn(),
  getPublicProfileStats: vi.fn(),
  getPublicCategoryPerformance: vi.fn(),
  getPublicRecentSessions: vi.fn(),
  getPublicUserAchievements: vi.fn(),
}));

import {
  getUserByUsername,
  getUserProfile,
  getPublicProfileStats,
  getPublicCategoryPerformance,
  getPublicRecentSessions,
  getPublicUserAchievements,
} from '@/lib/db/queries';

const mockGetUserByUsername = getUserByUsername as ReturnType<typeof vi.fn>;
const mockGetUserProfile = getUserProfile as ReturnType<typeof vi.fn>;
const mockGetPublicProfileStats = getPublicProfileStats as ReturnType<typeof vi.fn>;
const mockGetPublicCategoryPerformance = getPublicCategoryPerformance as ReturnType<typeof vi.fn>;
const mockGetPublicRecentSessions = getPublicRecentSessions as ReturnType<typeof vi.fn>;
const mockGetPublicUserAchievements = getPublicUserAchievements as ReturnType<typeof vi.fn>;

function createMockRequest(url: string): NextRequest {
  return new NextRequest(url);
}

const mockUser = {
  id: 1,
  name: 'Test User',
  username: 'testuser',
  createdAt: new Date('2025-01-01'),
};

const mockStats = {
  totalSessions: 50,
  avgWpm: 65,
  avgAccuracy: 94,
  bestWpm: 95,
  bestAccuracy: 100,
  totalPracticeTimeMs: 3600000,
  currentStreak: 5,
  longestStreak: 10,
};

const mockCategoryPerformance = [
  { categoryName: 'Git Basics', sessions: 30, avgWpm: 70, avgAccuracy: 95 },
];

const mockRecentSessions = [
  {
    wpm: 70,
    accuracy: 95,
    durationMs: 60000,
    completedAt: new Date('2025-01-20'),
    categoryName: 'Git Basics',
  },
];

const mockAchievements = [
  { name: 'Speed Demon', icon: '🏎️', earnedAt: new Date('2025-01-15') },
];

describe('GET /api/profile/[username]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 404 if user is not found', async () => {
    mockGetUserByUsername.mockResolvedValue(null);

    const request = createMockRequest('http://localhost:3000/api/profile/nonexistent');
    const response = await GET(request, {
      params: Promise.resolve({ username: 'nonexistent' }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('should return profile data for valid username', async () => {
    mockGetUserByUsername.mockResolvedValue(mockUser);
    mockGetUserProfile.mockResolvedValue(null);
    mockGetPublicProfileStats.mockResolvedValue(mockStats);
    mockGetPublicCategoryPerformance.mockResolvedValue(mockCategoryPerformance);
    mockGetPublicRecentSessions.mockResolvedValue(mockRecentSessions);
    mockGetPublicUserAchievements.mockResolvedValue(mockAchievements);

    const request = createMockRequest('http://localhost:3000/api/profile/testuser');
    const response = await GET(request, {
      params: Promise.resolve({ username: 'testuser' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.username).toBe('testuser');
    expect(data.user.name).toBe('Test User');
    expect(data.stats.totalSessions).toBe(50);
    expect(data.stats.avgWpm).toBe(65);
    expect(data.categoryPerformance).toHaveLength(1);
    expect(data.recentSessions).toHaveLength(1);
    expect(data.achievements).toHaveLength(1);
  });

  it('should call getUserByUsername with the correct username', async () => {
    mockGetUserByUsername.mockResolvedValue(null);

    const request = createMockRequest('http://localhost:3000/api/profile/john-doe');
    await GET(request, {
      params: Promise.resolve({ username: 'john-doe' }),
    });

    expect(mockGetUserByUsername).toHaveBeenCalledWith('john-doe');
  });

  it('should pass user id to all query functions', async () => {
    mockGetUserByUsername.mockResolvedValue(mockUser);
    mockGetUserProfile.mockResolvedValue(null);
    mockGetPublicProfileStats.mockResolvedValue(mockStats);
    mockGetPublicCategoryPerformance.mockResolvedValue([]);
    mockGetPublicRecentSessions.mockResolvedValue([]);
    mockGetPublicUserAchievements.mockResolvedValue([]);

    const request = createMockRequest('http://localhost:3000/api/profile/testuser');
    await GET(request, {
      params: Promise.resolve({ username: 'testuser' }),
    });

    expect(mockGetPublicProfileStats).toHaveBeenCalledWith(1);
    expect(mockGetPublicCategoryPerformance).toHaveBeenCalledWith(1);
    expect(mockGetPublicRecentSessions).toHaveBeenCalledWith(1, 10);
    expect(mockGetPublicUserAchievements).toHaveBeenCalledWith(1);
  });

  it('should not expose sensitive user data', async () => {
    mockGetUserByUsername.mockResolvedValue(mockUser);
    mockGetUserProfile.mockResolvedValue(null);
    mockGetPublicProfileStats.mockResolvedValue(mockStats);
    mockGetPublicCategoryPerformance.mockResolvedValue([]);
    mockGetPublicRecentSessions.mockResolvedValue([]);
    mockGetPublicUserAchievements.mockResolvedValue([]);

    const request = createMockRequest('http://localhost:3000/api/profile/testuser');
    const response = await GET(request, {
      params: Promise.resolve({ username: 'testuser' }),
    });
    const data = await response.json();

    expect(data.user.email).toBeUndefined();
    expect(data.user.passwordHash).toBeUndefined();
    expect(data.user.id).toBeUndefined();
  });

  it('should include avatar, bio, and preferred categories from profile', async () => {
    mockGetUserByUsername.mockResolvedValue(mockUser);
    mockGetUserProfile.mockResolvedValue({
      id: 1,
      userId: 1,
      avatarUrl: 'https://example.com/avatar.png',
      bio: 'Test bio',
      preferredCategoryIds: [1, 3],
      subscriptionTier: 'free',
      currentStreak: 0,
      longestStreak: 0,
      totalPracticeTimeMs: 0,
      preferences: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockGetPublicProfileStats.mockResolvedValue(mockStats);
    mockGetPublicCategoryPerformance.mockResolvedValue([]);
    mockGetPublicRecentSessions.mockResolvedValue([]);
    mockGetPublicUserAchievements.mockResolvedValue([]);

    const request = createMockRequest('http://localhost:3000/api/profile/testuser');
    const response = await GET(request, {
      params: Promise.resolve({ username: 'testuser' }),
    });
    const data = await response.json();

    expect(data.user.avatarUrl).toBe('https://example.com/avatar.png');
    expect(data.user.bio).toBe('Test bio');
    expect(data.user.preferredCategoryIds).toEqual([1, 3]);
  });

  it('should return null/empty defaults when user has no profile', async () => {
    mockGetUserByUsername.mockResolvedValue(mockUser);
    mockGetUserProfile.mockResolvedValue(null);
    mockGetPublicProfileStats.mockResolvedValue(mockStats);
    mockGetPublicCategoryPerformance.mockResolvedValue([]);
    mockGetPublicRecentSessions.mockResolvedValue([]);
    mockGetPublicUserAchievements.mockResolvedValue([]);

    const request = createMockRequest('http://localhost:3000/api/profile/testuser');
    const response = await GET(request, {
      params: Promise.resolve({ username: 'testuser' }),
    });
    const data = await response.json();

    expect(data.user.avatarUrl).toBeNull();
    expect(data.user.bio).toBeNull();
    expect(data.user.preferredCategoryIds).toEqual([]);
  });

  it('should return empty arrays when user has no data', async () => {
    mockGetUserByUsername.mockResolvedValue(mockUser);
    mockGetUserProfile.mockResolvedValue(null);
    mockGetPublicProfileStats.mockResolvedValue({
      totalSessions: 0,
      avgWpm: 0,
      avgAccuracy: 0,
      bestWpm: 0,
      bestAccuracy: 0,
      totalPracticeTimeMs: 0,
      currentStreak: 0,
      longestStreak: 0,
    });
    mockGetPublicCategoryPerformance.mockResolvedValue([]);
    mockGetPublicRecentSessions.mockResolvedValue([]);
    mockGetPublicUserAchievements.mockResolvedValue([]);

    const request = createMockRequest('http://localhost:3000/api/profile/testuser');
    const response = await GET(request, {
      params: Promise.resolve({ username: 'testuser' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats.totalSessions).toBe(0);
    expect(data.categoryPerformance).toEqual([]);
    expect(data.recentSessions).toEqual([]);
    expect(data.achievements).toEqual([]);
  });
});
