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
  limit: ReturnType<typeof vi.fn>;
};

const mockUser = { id: 1, email: 'test@test.com', name: 'Test', apiKeyId: 1, scopes: ['read'] };

function createRequest(url: string): NextRequest {
  return new NextRequest(new Request(url, {
    headers: { authorization: 'Bearer sk_testkey' },
  }));
}

describe('GET /api/v1/challenges/[challengeId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return 401 if API key is invalid', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createRequest('http://localhost:3000/api/v1/challenges/1');
      const response = await GET(request, { params: Promise.resolve({ challengeId: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid or missing API key');
    });
  });

  describe('validation', () => {
    it('should return 400 for invalid challengeId', async () => {
      mockAuth.mockResolvedValue(mockUser);

      const request = createRequest('http://localhost:3000/api/v1/challenges/abc');
      const response = await GET(request, { params: Promise.resolve({ challengeId: 'abc' }) });

      expect(response.status).toBe(400);
    });

    it('should return 400 for negative challengeId', async () => {
      mockAuth.mockResolvedValue(mockUser);

      const request = createRequest('http://localhost:3000/api/v1/challenges/-1');
      const response = await GET(request, { params: Promise.resolve({ challengeId: '-1' }) });

      expect(response.status).toBe(400);
    });
  });

  describe('successful retrieval', () => {
    const mockChallenge = {
      id: 1,
      content: 'git commit -m "test"',
      difficulty: 'beginner',
      syntaxType: 'bash',
      hint: 'Use the commit command',
      avgWpm: 45,
      timesCompleted: 100,
      createdAt: new Date('2025-01-20T10:00:00Z'),
      category: { id: 1, name: 'Git Basics', slug: 'git-basics', icon: 'git' },
    };

    it('should return challenge details', async () => {
      mockAuth.mockResolvedValue(mockUser);

      const mockLimitFn = vi.fn().mockResolvedValue([mockChallenge]);
      const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      const request = createRequest('http://localhost:3000/api/v1/challenges/1');
      const response = await GET(request, { params: Promise.resolve({ challengeId: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.challenge).toBeDefined();
      expect(data.challenge.id).toBe(1);
      expect(data.challenge.category.slug).toBe('git-basics');
    });

    it('should return 404 if challenge not found', async () => {
      mockAuth.mockResolvedValue(mockUser);

      const mockLimitFn = vi.fn().mockResolvedValue([]);
      const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      const request = createRequest('http://localhost:3000/api/v1/challenges/999');
      const response = await GET(request, { params: Promise.resolve({ challengeId: '999' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Challenge not found');
    });
  });

  describe('error handling', () => {
    it('should return 500 on database error', async () => {
      mockAuth.mockResolvedValue(mockUser);

      const mockFromFn = vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      });
      mockDb.select.mockReturnValue({ from: mockFromFn });

      const request = createRequest('http://localhost:3000/api/v1/challenges/1');
      const response = await GET(request, { params: Promise.resolve({ challengeId: '1' }) });

      expect(response.status).toBe(500);
    });
  });
});
