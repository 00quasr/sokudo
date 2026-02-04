import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock the queries module
vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  getDailyPractice: vi.fn(),
  getDailyPracticeHistory: vi.fn(),
}));

import { getUser, getDailyPractice, getDailyPracticeHistory } from '@/lib/db/queries';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockGetDailyPractice = getDailyPractice as ReturnType<typeof vi.fn>;
const mockGetDailyPracticeHistory = getDailyPracticeHistory as ReturnType<typeof vi.fn>;

function createMockGetRequest(url: string): NextRequest {
  return {
    url,
  } as unknown as NextRequest;
}

describe('GET /api/daily-practice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetUser.mockResolvedValue(null);

      const request = createMockGetRequest('http://localhost:3000/api/daily-practice');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    });

    it('should return 400 for invalid date format', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/daily-practice?date=invalid');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });

    it('should return 400 for invalid days parameter', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/daily-practice?days=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });

    it('should return 400 for days exceeding maximum', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/daily-practice?days=366');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });
  });

  describe('successful daily practice retrieval', () => {
    const mockUser = { id: 1, email: 'test@test.com' };

    beforeEach(() => {
      mockGetUser.mockResolvedValue(mockUser);
    });

    it('should return daily practice for today when no date specified', async () => {
      mockGetDailyPractice.mockResolvedValue({
        id: 1,
        userId: 1,
        date: '2025-01-20',
        practiceTimeMs: 3600000,
        sessionsCompleted: 5,
      });

      const request = createMockGetRequest('http://localhost:3000/api/daily-practice');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.practiceTimeMs).toBe(3600000);
      expect(data.sessionsCompleted).toBe(5);
    });

    it('should return daily practice for specific date', async () => {
      mockGetDailyPractice.mockResolvedValue({
        id: 1,
        userId: 1,
        date: '2025-01-15',
        practiceTimeMs: 1800000,
        sessionsCompleted: 3,
      });

      const request = createMockGetRequest('http://localhost:3000/api/daily-practice?date=2025-01-15');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.date).toBe('2025-01-15');
      expect(data.practiceTimeMs).toBe(1800000);
      expect(data.sessionsCompleted).toBe(3);
    });

    it('should return zeros when no practice exists for date', async () => {
      mockGetDailyPractice.mockResolvedValue(null);

      const request = createMockGetRequest('http://localhost:3000/api/daily-practice?date=2025-01-10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.date).toBe('2025-01-10');
      expect(data.practiceTimeMs).toBe(0);
      expect(data.sessionsCompleted).toBe(0);
    });

    it('should return practice history when days parameter is provided', async () => {
      const mockHistory = [
        { id: 1, userId: 1, date: '2025-01-18', practiceTimeMs: 1200000, sessionsCompleted: 2 },
        { id: 2, userId: 1, date: '2025-01-19', practiceTimeMs: 1800000, sessionsCompleted: 3 },
        { id: 3, userId: 1, date: '2025-01-20', practiceTimeMs: 3600000, sessionsCompleted: 5 },
      ];
      mockGetDailyPracticeHistory.mockResolvedValue(mockHistory);

      const request = createMockGetRequest('http://localhost:3000/api/daily-practice?days=7');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.history).toBeDefined();
      expect(data.history).toHaveLength(3);
      expect(mockGetDailyPracticeHistory).toHaveBeenCalledWith(7);
    });

    it('should return empty history when no practice exists in date range', async () => {
      mockGetDailyPracticeHistory.mockResolvedValue([]);

      const request = createMockGetRequest('http://localhost:3000/api/daily-practice?days=30');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.history).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should return 500 on database error', async () => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
      mockGetDailyPractice.mockRejectedValue(new Error('Database error'));

      const request = createMockGetRequest('http://localhost:3000/api/daily-practice');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
