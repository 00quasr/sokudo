import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

// Mock database queries
vi.mock('@/lib/db/queries', () => ({
  getUserByUsername: vi.fn(),
  getPublicProfileStats: vi.fn(),
}));

import { getUserByUsername, getPublicProfileStats } from '@/lib/db/queries';

const mockGetUserByUsername = vi.mocked(getUserByUsername);
const mockGetPublicProfileStats = vi.mocked(getPublicProfileStats);

function createRequest(
  username: string,
  searchParams: Record<string, string> = {}
): NextRequest {
  const url = new URL(`http://localhost:3000/api/badges/${username}`);
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

describe('GET /api/badges/[username]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return SVG content type', async () => {
    mockGetUserByUsername.mockResolvedValue({
      id: 1,
      name: 'Test User',
      username: 'testuser',
      email: 'test@test.com',
      passwordHash: 'hash',
      role: 'member',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    mockGetPublicProfileStats.mockResolvedValue({
      totalSessions: 10,
      avgWpm: 80,
      avgAccuracy: 95,
      bestWpm: 110,
      bestAccuracy: 100,
      totalPracticeTimeMs: 60000,
      currentStreak: 5,
      longestStreak: 10,
    });

    const response = await GET(createRequest('testuser'), {
      params: Promise.resolve({ username: 'testuser' }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
  });

  it('should return cache headers', async () => {
    mockGetUserByUsername.mockResolvedValue({
      id: 1,
      name: 'Test User',
      username: 'testuser',
      email: 'test@test.com',
      passwordHash: 'hash',
      role: 'member',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    mockGetPublicProfileStats.mockResolvedValue({
      totalSessions: 10,
      avgWpm: 80,
      avgAccuracy: 95,
      bestWpm: 110,
      bestAccuracy: 100,
      totalPracticeTimeMs: 60000,
      currentStreak: 5,
      longestStreak: 10,
    });

    const response = await GET(createRequest('testuser'), {
      params: Promise.resolve({ username: 'testuser' }),
    });

    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=300, s-maxage=300'
    );
  });

  it('should return valid SVG body', async () => {
    mockGetUserByUsername.mockResolvedValue({
      id: 1,
      name: 'Test User',
      username: 'testuser',
      email: 'test@test.com',
      passwordHash: 'hash',
      role: 'member',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    mockGetPublicProfileStats.mockResolvedValue({
      totalSessions: 10,
      avgWpm: 80,
      avgAccuracy: 95,
      bestWpm: 110,
      bestAccuracy: 100,
      totalPracticeTimeMs: 60000,
      currentStreak: 5,
      longestStreak: 10,
    });

    const response = await GET(createRequest('testuser'), {
      params: Promise.resolve({ username: 'testuser' }),
    });

    const body = await response.text();
    expect(body).toContain('<svg');
    expect(body).toContain('</svg>');
    expect(body).toContain('sokudo wpm');
    expect(body).toContain('>80<');
  });

  it('should return 404 for unknown user', async () => {
    mockGetUserByUsername.mockResolvedValue(null);

    const response = await GET(createRequest('nonexistent'), {
      params: Promise.resolve({ username: 'nonexistent' }),
    });

    expect(response.status).toBe(404);
  });

  it('should support type parameter', async () => {
    mockGetUserByUsername.mockResolvedValue({
      id: 1,
      name: 'Test User',
      username: 'testuser',
      email: 'test@test.com',
      passwordHash: 'hash',
      role: 'member',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    mockGetPublicProfileStats.mockResolvedValue({
      totalSessions: 10,
      avgWpm: 80,
      avgAccuracy: 95,
      bestWpm: 110,
      bestAccuracy: 100,
      totalPracticeTimeMs: 60000,
      currentStreak: 5,
      longestStreak: 10,
    });

    const response = await GET(
      createRequest('testuser', { type: 'accuracy' }),
      { params: Promise.resolve({ username: 'testuser' }) }
    );

    const body = await response.text();
    expect(body).toContain('sokudo accuracy');
    expect(body).toContain('>95%<');
  });

  it('should support streak type', async () => {
    mockGetUserByUsername.mockResolvedValue({
      id: 1,
      name: 'Test User',
      username: 'testuser',
      email: 'test@test.com',
      passwordHash: 'hash',
      role: 'member',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    mockGetPublicProfileStats.mockResolvedValue({
      totalSessions: 10,
      avgWpm: 80,
      avgAccuracy: 95,
      bestWpm: 110,
      bestAccuracy: 100,
      totalPracticeTimeMs: 60000,
      currentStreak: 5,
      longestStreak: 10,
    });

    const response = await GET(
      createRequest('testuser', { type: 'streak' }),
      { params: Promise.resolve({ username: 'testuser' }) }
    );

    const body = await response.text();
    expect(body).toContain('sokudo streak');
    expect(body).toContain('>5 days<');
  });

  it('should support sessions type', async () => {
    mockGetUserByUsername.mockResolvedValue({
      id: 1,
      name: 'Test User',
      username: 'testuser',
      email: 'test@test.com',
      passwordHash: 'hash',
      role: 'member',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    mockGetPublicProfileStats.mockResolvedValue({
      totalSessions: 10,
      avgWpm: 80,
      avgAccuracy: 95,
      bestWpm: 110,
      bestAccuracy: 100,
      totalPracticeTimeMs: 60000,
      currentStreak: 5,
      longestStreak: 10,
    });

    const response = await GET(
      createRequest('testuser', { type: 'sessions' }),
      { params: Promise.resolve({ username: 'testuser' }) }
    );

    const body = await response.text();
    expect(body).toContain('sokudo sessions');
    expect(body).toContain('>10<');
  });

  it('should support best-wpm type', async () => {
    mockGetUserByUsername.mockResolvedValue({
      id: 1,
      name: 'Test User',
      username: 'testuser',
      email: 'test@test.com',
      passwordHash: 'hash',
      role: 'member',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    mockGetPublicProfileStats.mockResolvedValue({
      totalSessions: 10,
      avgWpm: 80,
      avgAccuracy: 95,
      bestWpm: 110,
      bestAccuracy: 100,
      totalPracticeTimeMs: 60000,
      currentStreak: 5,
      longestStreak: 10,
    });

    const response = await GET(
      createRequest('testuser', { type: 'best-wpm' }),
      { params: Promise.resolve({ username: 'testuser' }) }
    );

    const body = await response.text();
    expect(body).toContain('sokudo best wpm');
    expect(body).toContain('>110<');
  });

  it('should support style parameter', async () => {
    mockGetUserByUsername.mockResolvedValue({
      id: 1,
      name: 'Test User',
      username: 'testuser',
      email: 'test@test.com',
      passwordHash: 'hash',
      role: 'member',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    mockGetPublicProfileStats.mockResolvedValue({
      totalSessions: 10,
      avgWpm: 80,
      avgAccuracy: 95,
      bestWpm: 110,
      bestAccuracy: 100,
      totalPracticeTimeMs: 60000,
      currentStreak: 5,
      longestStreak: 10,
    });

    const response = await GET(
      createRequest('testuser', { style: 'flat-square' }),
      { params: Promise.resolve({ username: 'testuser' }) }
    );

    const body = await response.text();
    expect(body).toContain('rx="0"');
  });

  it('should return 400 for invalid badge type', async () => {
    const response = await GET(
      createRequest('testuser', { type: 'invalid' }),
      { params: Promise.resolve({ username: 'testuser' }) }
    );

    expect(response.status).toBe(400);
  });

  it('should return 400 for invalid style', async () => {
    const response = await GET(
      createRequest('testuser', { style: 'invalid' }),
      { params: Promise.resolve({ username: 'testuser' }) }
    );

    expect(response.status).toBe(400);
  });

  it('should default to wpm type when no type specified', async () => {
    mockGetUserByUsername.mockResolvedValue({
      id: 1,
      name: 'Test User',
      username: 'testuser',
      email: 'test@test.com',
      passwordHash: 'hash',
      role: 'member',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    mockGetPublicProfileStats.mockResolvedValue({
      totalSessions: 10,
      avgWpm: 80,
      avgAccuracy: 95,
      bestWpm: 110,
      bestAccuracy: 100,
      totalPracticeTimeMs: 60000,
      currentStreak: 5,
      longestStreak: 10,
    });

    const response = await GET(createRequest('testuser'), {
      params: Promise.resolve({ username: 'testuser' }),
    });

    const body = await response.text();
    expect(body).toContain('sokudo wpm');
  });
});
