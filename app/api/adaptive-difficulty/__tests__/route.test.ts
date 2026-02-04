import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  getRecentSessionsForCategory: vi.fn(),
  getChallengeByDifficulty: vi.fn(),
}));

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    query: {
      categories: {
        findFirst: vi.fn(),
      },
    },
  },
}));

import {
  getUser,
  getRecentSessionsForCategory,
  getChallengeByDifficulty,
} from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockGetRecentSessions = getRecentSessionsForCategory as ReturnType<typeof vi.fn>;
const mockGetChallengeByDifficulty = getChallengeByDifficulty as ReturnType<typeof vi.fn>;
const mockCategoriesFindFirst = db.query.categories.findFirst as ReturnType<typeof vi.fn>;

function createRequest(url: string): NextRequest {
  return new NextRequest(url);
}

describe('GET /api/adaptive-difficulty', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetUser.mockResolvedValue(null);

      const request = createRequest('http://localhost:3000/api/adaptive-difficulty?categoryId=1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Not authenticated');
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    });

    it('should return 400 when neither categoryId nor categorySlug is provided', async () => {
      const request = createRequest('http://localhost:3000/api/adaptive-difficulty');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Either categoryId or categorySlug is required');
    });

    it('should return 404 when categorySlug does not exist', async () => {
      mockCategoriesFindFirst.mockResolvedValue(undefined);

      const request = createRequest(
        'http://localhost:3000/api/adaptive-difficulty?categorySlug=nonexistent'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Category not found');
    });
  });

  describe('successful recommendation', () => {
    const mockUser = { id: 1, email: 'test@test.com' };

    beforeEach(() => {
      mockGetUser.mockResolvedValue(mockUser);
    });

    it('should return recommendation with categoryId', async () => {
      mockGetRecentSessions.mockResolvedValue([
        { wpm: 60, accuracy: 95, difficulty: 'beginner', completedAt: new Date() },
        { wpm: 55, accuracy: 92, difficulty: 'beginner', completedAt: new Date() },
        { wpm: 58, accuracy: 94, difficulty: 'beginner', completedAt: new Date() },
      ]);
      mockGetChallengeByDifficulty.mockResolvedValue({
        id: 42,
        difficulty: 'intermediate',
      });

      const request = createRequest(
        'http://localhost:3000/api/adaptive-difficulty?categoryId=1'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recommendation).toBeDefined();
      expect(data.recommendation.recommendedDifficulty).toBeDefined();
      expect(data.recommendation.currentDifficulty).toBeDefined();
      expect(data.recommendation.reason).toBeDefined();
      expect(data.suggestedChallenge).toBeDefined();
      expect(data.recentPerformance).toBeDefined();
    });

    it('should resolve categorySlug to categoryId', async () => {
      mockCategoriesFindFirst.mockResolvedValue({ id: 5, slug: 'git-basics' });
      mockGetRecentSessions.mockResolvedValue([]);
      mockGetChallengeByDifficulty.mockResolvedValue(null);

      const request = createRequest(
        'http://localhost:3000/api/adaptive-difficulty?categorySlug=git-basics'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockGetRecentSessions).toHaveBeenCalledWith(5, 5);
    });

    it('should return beginner recommendation when no sessions exist', async () => {
      mockGetRecentSessions.mockResolvedValue([]);
      mockGetChallengeByDifficulty.mockResolvedValue({
        id: 1,
        difficulty: 'beginner',
      });

      const request = createRequest(
        'http://localhost:3000/api/adaptive-difficulty?categoryId=1'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recommendation.recommendedDifficulty).toBe('beginner');
      expect(data.recentPerformance.sessions).toBe(0);
      expect(data.recentPerformance.avgWpm).toBe(0);
      expect(data.recentPerformance.avgAccuracy).toBe(0);
    });

    it('should suggest promoting to intermediate with strong beginner performance', async () => {
      const sessions = Array.from({ length: 5 }, () => ({
        wpm: 60,
        accuracy: 95,
        difficulty: 'beginner',
        completedAt: new Date(),
      }));
      mockGetRecentSessions.mockResolvedValue(sessions);
      mockGetChallengeByDifficulty.mockResolvedValue({
        id: 10,
        difficulty: 'intermediate',
      });

      const request = createRequest(
        'http://localhost:3000/api/adaptive-difficulty?categoryId=1'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recommendation.recommendedDifficulty).toBe('intermediate');
      expect(data.suggestedChallenge.id).toBe(10);
      expect(data.recentPerformance.avgWpm).toBe(60);
      expect(data.recentPerformance.avgAccuracy).toBe(95);
    });

    it('should handle null suggested challenge gracefully', async () => {
      mockGetRecentSessions.mockResolvedValue([]);
      mockGetChallengeByDifficulty.mockResolvedValue(null);

      const request = createRequest(
        'http://localhost:3000/api/adaptive-difficulty?categoryId=1'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.suggestedChallenge).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should return 401 when getRecentSessionsForCategory throws auth error', async () => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
      mockGetRecentSessions.mockRejectedValue(new Error('User not authenticated'));

      const request = createRequest(
        'http://localhost:3000/api/adaptive-difficulty?categoryId=1'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Not authenticated');
    });

    it('should return 500 on unexpected error', async () => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
      mockGetRecentSessions.mockRejectedValue(new Error('Database connection failed'));

      const request = createRequest(
        'http://localhost:3000/api/adaptive-difficulty?categoryId=1'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
