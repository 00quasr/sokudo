import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  getDueReviewItems: vi.fn(),
  getUserReviewStats: vi.fn(),
  getSpacedRepetitionItem: vi.fn(),
  upsertSpacedRepetitionItem: vi.fn(),
  getUserAvgWpm: vi.fn(),
  getUpcomingReviewItems: vi.fn(),
}));

vi.mock('@/lib/practice/spaced-repetition', () => ({
  deriveQuality: vi.fn(),
  computeNextReview: vi.fn(),
  DEFAULT_EASE_FACTOR: 2.5,
}));

import { GET, POST } from '../route';
import {
  getUser,
  getDueReviewItems,
  getUserReviewStats,
  getSpacedRepetitionItem,
  upsertSpacedRepetitionItem,
  getUserAvgWpm,
  getUpcomingReviewItems,
} from '@/lib/db/queries';
import {
  deriveQuality,
  computeNextReview,
} from '@/lib/practice/spaced-repetition';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockGetDueItems = getDueReviewItems as ReturnType<typeof vi.fn>;
const mockGetReviewStats = getUserReviewStats as ReturnType<typeof vi.fn>;
const mockGetItem = getSpacedRepetitionItem as ReturnType<typeof vi.fn>;
const mockUpsertItem = upsertSpacedRepetitionItem as ReturnType<typeof vi.fn>;
const mockGetAvgWpm = getUserAvgWpm as ReturnType<typeof vi.fn>;
const mockGetUpcoming = getUpcomingReviewItems as ReturnType<typeof vi.fn>;
const mockDeriveQuality = deriveQuality as ReturnType<typeof vi.fn>;
const mockComputeNext = computeNextReview as ReturnType<typeof vi.fn>;

function createGetRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

function createPostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(new URL('/api/practice/review', 'http://localhost:3000'), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GET /api/practice/review', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);
    const request = createGetRequest('/api/practice/review');
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it('should return due items and stats for authenticated user', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetDueItems.mockResolvedValue([
      { id: 1, challengeId: 10, easeFactor: 2.5, interval: 3, repetitions: 2, nextReviewAt: new Date() },
    ]);
    mockGetReviewStats.mockResolvedValue({
      totalItems: 5,
      dueItems: 1,
      avgEaseFactor: 2.5,
      avgInterval: 8,
    });

    const request = createGetRequest('/api/practice/review');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(1);
    expect(data.stats.totalItems).toBe(5);
    expect(data.stats.dueItems).toBe(1);
  });

  it('should respect limit parameter', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetDueItems.mockResolvedValue([]);
    mockGetReviewStats.mockResolvedValue({ totalItems: 0, dueItems: 0, avgEaseFactor: 2.5, avgInterval: 0 });

    const request = createGetRequest('/api/practice/review?limit=5');
    await GET(request);

    expect(mockGetDueItems).toHaveBeenCalledWith(5);
  });

  it('should return 400 for invalid limit', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    const request = createGetRequest('/api/practice/review?limit=0');
    const response = await GET(request);
    expect(response.status).toBe(400);
  });

  it('should return upcoming reviews for schedule view', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetUpcoming.mockResolvedValue([
      { id: 2, challengeId: 20, nextReviewAt: new Date('2025-02-01') },
    ]);
    mockGetReviewStats.mockResolvedValue({ totalItems: 5, dueItems: 0, avgEaseFactor: 2.5, avgInterval: 8 });

    const request = createGetRequest('/api/practice/review?view=schedule');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(1);
    expect(mockGetUpcoming).toHaveBeenCalledWith(1, 10);
  });
});

describe('POST /api/practice/review', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);
    const request = createPostRequest({ challengeId: 1, wpm: 50, accuracy: 90 });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should return 400 for invalid body', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    const request = createPostRequest({ challengeId: 'not-a-number' });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should create a new review item for first-time challenge', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetAvgWpm.mockResolvedValue(40);
    mockDeriveQuality.mockReturnValue(4);
    mockGetItem.mockResolvedValue(null);
    mockComputeNext.mockReturnValue({
      easeFactor: 2.5,
      interval: 1,
      repetitions: 1,
      nextReviewAt: new Date('2025-01-16'),
    });
    mockUpsertItem.mockResolvedValue(undefined);

    const request = createPostRequest({ challengeId: 1, wpm: 50, accuracy: 92 });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.quality).toBe(4);
    expect(data.interval).toBe(1);
    expect(data.repetitions).toBe(1);

    expect(mockDeriveQuality).toHaveBeenCalledWith({
      wpm: 50,
      accuracy: 92,
      userAvgWpm: 40,
    });

    expect(mockUpsertItem).toHaveBeenCalledWith(1, 1, {
      easeFactor: 2.5,
      interval: 1,
      repetitions: 1,
      nextReviewAt: expect.any(Date),
      lastQuality: 4,
    });
  });

  it('should update an existing review item', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetAvgWpm.mockResolvedValue(50);
    mockDeriveQuality.mockReturnValue(3);
    mockGetItem.mockResolvedValue({
      id: 5,
      easeFactor: 2.3,
      interval: 6,
      repetitions: 2,
    });
    mockComputeNext.mockReturnValue({
      easeFactor: 2.18,
      interval: 14,
      repetitions: 3,
      nextReviewAt: new Date('2025-01-29'),
    });
    mockUpsertItem.mockResolvedValue(undefined);

    const request = createPostRequest({ challengeId: 10, wpm: 45, accuracy: 82 });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.quality).toBe(3);
    expect(data.interval).toBe(14);
    expect(data.repetitions).toBe(3);

    // Should have passed existing card data to computeNextReview
    expect(mockComputeNext).toHaveBeenCalledWith(
      { easeFactor: 2.3, interval: 6, repetitions: 2 },
      3
    );
  });

  it('should handle failed review (quality < 3)', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetAvgWpm.mockResolvedValue(50);
    mockDeriveQuality.mockReturnValue(1);
    mockGetItem.mockResolvedValue({
      id: 5,
      easeFactor: 2.5,
      interval: 15,
      repetitions: 3,
    });
    mockComputeNext.mockReturnValue({
      easeFactor: 2.3,
      interval: 1,
      repetitions: 0,
      nextReviewAt: new Date('2025-01-16'),
    });
    mockUpsertItem.mockResolvedValue(undefined);

    const request = createPostRequest({ challengeId: 10, wpm: 15, accuracy: 55 });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.quality).toBe(1);
    expect(data.interval).toBe(1);
    expect(data.repetitions).toBe(0);
  });
});
