/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/lib/db/queries', () => ({
  getUserByUsername: vi.fn(),
  getPublicProfileStats: vi.fn(),
  getPublicCategoryPerformance: vi.fn(),
  getPublicRecentSessions: vi.fn(),
  getPublicUserAchievements: vi.fn(),
}));

import {
  getUserByUsername,
  getPublicProfileStats,
  getPublicCategoryPerformance,
  getPublicRecentSessions,
  getPublicUserAchievements,
} from '@/lib/db/queries';
import PublicProfilePage from '../page';

const mockGetUserByUsername = getUserByUsername as ReturnType<typeof vi.fn>;
const mockGetPublicProfileStats = getPublicProfileStats as ReturnType<typeof vi.fn>;
const mockGetPublicCategoryPerformance = getPublicCategoryPerformance as ReturnType<typeof vi.fn>;
const mockGetPublicRecentSessions = getPublicRecentSessions as ReturnType<typeof vi.fn>;
const mockGetPublicUserAchievements = getPublicUserAchievements as ReturnType<typeof vi.fn>;

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

const emptyStats = {
  totalSessions: 0,
  avgWpm: 0,
  avgAccuracy: 0,
  bestWpm: 0,
  bestAccuracy: 0,
  totalPracticeTimeMs: 0,
  currentStreak: 0,
  longestStreak: 0,
};

describe('PublicProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call notFound when user does not exist', async () => {
    mockGetUserByUsername.mockResolvedValue(null);

    await expect(
      PublicProfilePage({ params: Promise.resolve({ username: 'nonexistent' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('should render user display name and username', async () => {
    mockGetUserByUsername.mockResolvedValue(mockUser);
    mockGetPublicProfileStats.mockResolvedValue(mockStats);
    mockGetPublicCategoryPerformance.mockResolvedValue([]);
    mockGetPublicRecentSessions.mockResolvedValue([]);
    mockGetPublicUserAchievements.mockResolvedValue([]);

    const result = await PublicProfilePage({
      params: Promise.resolve({ username: 'testuser' }),
    });
    render(result);

    expect(screen.getByText('Test User')).toBeTruthy();
    expect(screen.getByText(/@testuser/)).toBeTruthy();
  });

  it('should show empty state when user has no sessions', async () => {
    mockGetUserByUsername.mockResolvedValue(mockUser);
    mockGetPublicProfileStats.mockResolvedValue(emptyStats);
    mockGetPublicCategoryPerformance.mockResolvedValue([]);
    mockGetPublicRecentSessions.mockResolvedValue([]);
    mockGetPublicUserAchievements.mockResolvedValue([]);

    const result = await PublicProfilePage({
      params: Promise.resolve({ username: 'testuser' }),
    });
    render(result);

    expect(screen.getByText('No stats yet')).toBeTruthy();
  });

  it('should render stats when user has sessions', async () => {
    mockGetUserByUsername.mockResolvedValue(mockUser);
    mockGetPublicProfileStats.mockResolvedValue(mockStats);
    mockGetPublicCategoryPerformance.mockResolvedValue([]);
    mockGetPublicRecentSessions.mockResolvedValue([]);
    mockGetPublicUserAchievements.mockResolvedValue([]);

    const result = await PublicProfilePage({
      params: Promise.resolve({ username: 'testuser' }),
    });
    render(result);

    expect(screen.getByText('65')).toBeTruthy(); // avgWpm
    expect(screen.getByText('94%')).toBeTruthy(); // avgAccuracy
    expect(screen.getByText('5 days')).toBeTruthy(); // currentStreak
  });

  it('should render personal bests', async () => {
    mockGetUserByUsername.mockResolvedValue(mockUser);
    mockGetPublicProfileStats.mockResolvedValue(mockStats);
    mockGetPublicCategoryPerformance.mockResolvedValue([]);
    mockGetPublicRecentSessions.mockResolvedValue([]);
    mockGetPublicUserAchievements.mockResolvedValue([]);

    const result = await PublicProfilePage({
      params: Promise.resolve({ username: 'testuser' }),
    });
    render(result);

    expect(screen.getByText('Personal Bests')).toBeTruthy();
    expect(screen.getByText('95')).toBeTruthy(); // bestWpm
    expect(screen.getByText('100%')).toBeTruthy(); // bestAccuracy
    expect(screen.getByText('10 days')).toBeTruthy(); // longestStreak
  });

  it('should render category performance', async () => {
    mockGetUserByUsername.mockResolvedValue(mockUser);
    mockGetPublicProfileStats.mockResolvedValue(mockStats);
    mockGetPublicCategoryPerformance.mockResolvedValue([
      { categoryName: 'Git Basics', sessions: 30, avgWpm: 70, avgAccuracy: 95 },
    ]);
    mockGetPublicRecentSessions.mockResolvedValue([]);
    mockGetPublicUserAchievements.mockResolvedValue([]);

    const result = await PublicProfilePage({
      params: Promise.resolve({ username: 'testuser' }),
    });
    render(result);

    expect(screen.getByText('Category Performance')).toBeTruthy();
    expect(screen.getByText('Git Basics')).toBeTruthy();
    expect(screen.getByText('30 sessions')).toBeTruthy();
  });

  it('should render recent sessions', async () => {
    mockGetUserByUsername.mockResolvedValue(mockUser);
    mockGetPublicProfileStats.mockResolvedValue(mockStats);
    mockGetPublicCategoryPerformance.mockResolvedValue([]);
    mockGetPublicRecentSessions.mockResolvedValue([
      {
        wpm: 72,
        accuracy: 96,
        durationMs: 45000,
        completedAt: new Date('2025-01-20'),
        categoryName: 'Docker Commands',
      },
    ]);
    mockGetPublicUserAchievements.mockResolvedValue([]);

    const result = await PublicProfilePage({
      params: Promise.resolve({ username: 'testuser' }),
    });
    render(result);

    expect(screen.getByText('Recent Sessions')).toBeTruthy();
    expect(screen.getByText('Docker Commands')).toBeTruthy();
  });

  it('should render earned achievements as badges', async () => {
    mockGetUserByUsername.mockResolvedValue(mockUser);
    mockGetPublicProfileStats.mockResolvedValue(mockStats);
    mockGetPublicCategoryPerformance.mockResolvedValue([]);
    mockGetPublicRecentSessions.mockResolvedValue([]);
    mockGetPublicUserAchievements.mockResolvedValue([
      { name: 'Speed Demon', icon: '🏎️', earnedAt: new Date('2025-01-15') },
    ]);

    const result = await PublicProfilePage({
      params: Promise.resolve({ username: 'testuser' }),
    });
    render(result);

    expect(screen.getByText('Speed Demon')).toBeTruthy();
  });

  it('should use username as display name when name is not set', async () => {
    mockGetUserByUsername.mockResolvedValue({
      ...mockUser,
      name: null,
    });
    mockGetPublicProfileStats.mockResolvedValue(emptyStats);
    mockGetPublicCategoryPerformance.mockResolvedValue([]);
    mockGetPublicRecentSessions.mockResolvedValue([]);
    mockGetPublicUserAchievements.mockResolvedValue([]);

    const result = await PublicProfilePage({
      params: Promise.resolve({ username: 'testuser' }),
    });
    render(result);

    // Should fall back to username
    expect(screen.getByText('testuser')).toBeTruthy();
  });

  it('should render back to Sokudo link', async () => {
    mockGetUserByUsername.mockResolvedValue(mockUser);
    mockGetPublicProfileStats.mockResolvedValue(emptyStats);
    mockGetPublicCategoryPerformance.mockResolvedValue([]);
    mockGetPublicRecentSessions.mockResolvedValue([]);
    mockGetPublicUserAchievements.mockResolvedValue([]);

    const result = await PublicProfilePage({
      params: Promise.resolve({ username: 'testuser' }),
    });
    render(result);

    expect(screen.getByText('Back to Sokudo')).toBeTruthy();
  });
});
