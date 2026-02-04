import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock getSessionWithKeystrokeLogs
vi.mock('@/lib/db/queries', () => ({
  getSessionWithKeystrokeLogs: vi.fn(),
}));

import { getSessionWithKeystrokeLogs } from '@/lib/db/queries';

const mockGetSessionWithKeystrokeLogs = getSessionWithKeystrokeLogs as ReturnType<typeof vi.fn>;

function createMockRequest(): NextRequest {
  return {} as unknown as NextRequest;
}

describe('GET /api/sessions/[sessionId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validation', () => {
    it('should return 400 for invalid session ID (non-numeric)', async () => {
      const request = createMockRequest();
      const response = await GET(request, {
        params: Promise.resolve({ sessionId: 'abc' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid session ID');
    });

    it('should return 400 for invalid session ID (zero)', async () => {
      const request = createMockRequest();
      const response = await GET(request, {
        params: Promise.resolve({ sessionId: '0' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid session ID');
    });

    it('should return 400 for invalid session ID (negative)', async () => {
      const request = createMockRequest();
      const response = await GET(request, {
        params: Promise.resolve({ sessionId: '-5' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid session ID');
    });
  });

  describe('authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetSessionWithKeystrokeLogs.mockRejectedValue(
        new Error('User not authenticated')
      );

      const request = createMockRequest();
      const response = await GET(request, {
        params: Promise.resolve({ sessionId: '1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('session retrieval', () => {
    it('should return 404 if session is not found', async () => {
      mockGetSessionWithKeystrokeLogs.mockResolvedValue(null);

      const request = createMockRequest();
      const response = await GET(request, {
        params: Promise.resolve({ sessionId: '999' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Session not found');
    });

    it('should return session with keystroke logs on success', async () => {
      const mockSession = {
        id: 1,
        userId: 1,
        challengeId: 1,
        wpm: 60,
        rawWpm: 65,
        accuracy: 95,
        keystrokes: 10,
        errors: 1,
        durationMs: 5000,
        completedAt: new Date('2025-01-20T10:00:00Z'),
        challenge: {
          id: 1,
          content: 'git commit',
          difficulty: 'beginner',
          syntaxType: 'git',
          category: {
            id: 1,
            name: 'Git Basics',
            slug: 'git-basics',
          },
        },
        keystrokeLogs: [
          {
            id: 1,
            timestamp: 100,
            expected: 'g',
            actual: 'g',
            isCorrect: true,
            latencyMs: 100,
          },
          {
            id: 2,
            timestamp: 200,
            expected: 'i',
            actual: 'i',
            isCorrect: true,
            latencyMs: 100,
          },
          {
            id: 3,
            timestamp: 300,
            expected: 't',
            actual: 'r',
            isCorrect: false,
            latencyMs: 100,
          },
        ],
      };

      mockGetSessionWithKeystrokeLogs.mockResolvedValue(mockSession);

      const request = createMockRequest();
      const response = await GET(request, {
        params: Promise.resolve({ sessionId: '1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(1);
      expect(data.wpm).toBe(60);
      expect(data.accuracy).toBe(95);
      expect(data.challenge.content).toBe('git commit');
      expect(data.challenge.category.name).toBe('Git Basics');
      expect(data.keystrokeLogs).toHaveLength(3);
      expect(data.keystrokeLogs[2].isCorrect).toBe(false);
    });

    it('should return session with empty keystroke logs array', async () => {
      const mockSession = {
        id: 1,
        userId: 1,
        challengeId: 1,
        wpm: 60,
        rawWpm: 65,
        accuracy: 95,
        keystrokes: 10,
        errors: 1,
        durationMs: 5000,
        completedAt: new Date('2025-01-20T10:00:00Z'),
        challenge: {
          id: 1,
          content: 'git commit',
          difficulty: 'beginner',
          syntaxType: 'git',
          category: {
            id: 1,
            name: 'Git Basics',
            slug: 'git-basics',
          },
        },
        keystrokeLogs: [],
      };

      mockGetSessionWithKeystrokeLogs.mockResolvedValue(mockSession);

      const request = createMockRequest();
      const response = await GET(request, {
        params: Promise.resolve({ sessionId: '1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.keystrokeLogs).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should return 500 on unexpected database error', async () => {
      mockGetSessionWithKeystrokeLogs.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = createMockRequest();
      const response = await GET(request, {
        params: Promise.resolve({ sessionId: '1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
