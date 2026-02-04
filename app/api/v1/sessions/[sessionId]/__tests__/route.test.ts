import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock the database
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  },
}));

// Mock the auth module
vi.mock('@/lib/auth/api-key', () => ({
  authenticateApiKey: vi.fn(),
}));

import { authenticateApiKey } from '@/lib/auth/api-key';
import { db } from '@/lib/db/drizzle';

const mockAuth = authenticateApiKey as ReturnType<typeof vi.fn>;
const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  innerJoin: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
};

const mockUser = { id: 1, email: 'test@test.com', name: 'Test', apiKeyId: 1, scopes: ['read'] };

function createRequest(url: string): NextRequest {
  return new NextRequest(new Request(url, {
    headers: { authorization: 'Bearer sk_testkey' },
  }));
}

describe('GET /api/v1/sessions/[sessionId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return 401 if API key is invalid', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createRequest('http://localhost:3000/api/v1/sessions/1');
      const response = await GET(request, { params: Promise.resolve({ sessionId: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid or missing API key');
    });
  });

  describe('validation', () => {
    it('should return 400 for invalid sessionId', async () => {
      mockAuth.mockResolvedValue(mockUser);

      const request = createRequest('http://localhost:3000/api/v1/sessions/abc');
      const response = await GET(request, { params: Promise.resolve({ sessionId: 'abc' }) });

      expect(response.status).toBe(400);
    });

    it('should return 400 for zero sessionId', async () => {
      mockAuth.mockResolvedValue(mockUser);

      const request = createRequest('http://localhost:3000/api/v1/sessions/0');
      const response = await GET(request, { params: Promise.resolve({ sessionId: '0' }) });

      expect(response.status).toBe(400);
    });
  });

  describe('successful retrieval', () => {
    const mockSession = {
      id: 1,
      wpm: 65,
      rawWpm: 70,
      accuracy: 94,
      keystrokes: 200,
      errors: 12,
      durationMs: 60000,
      completedAt: new Date('2025-01-20T10:00:00Z'),
      challenge: { id: 1, content: 'git commit', difficulty: 'beginner', syntaxType: 'bash' },
      category: { id: 1, name: 'Git Basics', slug: 'git-basics' },
    };

    const mockKeystrokeLogs = [
      { id: 1, timestamp: 0, expected: 'g', actual: 'g', isCorrect: true, latencyMs: 100 },
      { id: 2, timestamp: 100, expected: 'i', actual: 'i', isCorrect: true, latencyMs: 80 },
    ];

    it('should return session with keystroke logs', async () => {
      mockAuth.mockResolvedValue(mockUser);

      // First call: session lookup
      const mockLimitFn = vi.fn().mockResolvedValue([mockSession]);
      const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockInnerJoinFn2 = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn2 });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });

      // Second call: keystroke logs
      const mockOrderByFn = vi.fn().mockResolvedValue(mockKeystrokeLogs);
      const mockWhereFn2 = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
      const mockFromFn2 = vi.fn().mockReturnValue({ where: mockWhereFn2 });

      let callCount = 0;
      const mockSelectFn = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return { from: mockFromFn };
        return { from: mockFromFn2 };
      });
      mockDb.select.mockImplementation(mockSelectFn);

      const request = createRequest('http://localhost:3000/api/v1/sessions/1');
      const response = await GET(request, { params: Promise.resolve({ sessionId: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.session).toBeDefined();
      expect(data.session.id).toBe(1);
      expect(data.session.wpm).toBe(65);
      expect(data.session.keystrokeLogs).toHaveLength(2);
    });

    it('should return 404 if session not found', async () => {
      mockAuth.mockResolvedValue(mockUser);

      const mockLimitFn = vi.fn().mockResolvedValue([]);
      const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockInnerJoinFn2 = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn2 });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      const request = createRequest('http://localhost:3000/api/v1/sessions/999');
      const response = await GET(request, { params: Promise.resolve({ sessionId: '999' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Session not found');
    });
  });

  describe('error handling', () => {
    it('should return 500 on database error', async () => {
      mockAuth.mockResolvedValue(mockUser);

      const mockFromFn = vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockRejectedValue(new Error('Database error')),
            }),
          }),
        }),
      });
      mockDb.select.mockReturnValue({ from: mockFromFn });

      const request = createRequest('http://localhost:3000/api/v1/sessions/1');
      const response = await GET(request, { params: Promise.resolve({ sessionId: '1' }) });

      expect(response.status).toBe(500);
    });
  });
});
