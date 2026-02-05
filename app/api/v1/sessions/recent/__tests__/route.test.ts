import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/auth/api-key', () => ({
  getApiKeyUser: vi.fn(),
  hasScope: vi.fn(),
}));

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve([])),
              })),
            })),
          })),
        })),
      })),
    })),
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  apiRateLimit: vi.fn(() => null),
}));

import { getApiKeyUser, hasScope } from '@/lib/auth/api-key';
import { db } from '@/lib/db/drizzle';

const mockGetApiKeyUser = getApiKeyUser as ReturnType<typeof vi.fn>;
const mockHasScope = hasScope as ReturnType<typeof vi.fn>;

function createMockGetRequest(apiKey: string | null, queryParams?: string): NextRequest {
  const headers = new Headers();
  if (apiKey) {
    headers.set('X-API-Key', apiKey);
  }

  const url = `http://localhost:3000/api/v1/sessions/recent${queryParams ? `?${queryParams}` : ''}`;

  return {
    headers,
    url,
  } as unknown as NextRequest;
}

describe('GET /api/v1/sessions/recent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return 401 if API key is missing', async () => {
      const request = createMockGetRequest(null);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('API key required');
    });

    it('should return 401 if API key is invalid', async () => {
      mockGetApiKeyUser.mockResolvedValue(null);

      const request = createMockGetRequest('invalid_key');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid API key');
    });
  });

  describe('authorization', () => {
    it('should return 403 if user lacks read scope', async () => {
      mockGetApiKeyUser.mockResolvedValue({ id: 1, email: 'test@test.com', scopes: ['write'] });
      mockHasScope.mockReturnValue(false);

      const request = createMockGetRequest('valid_key');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Insufficient permissions');
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      mockGetApiKeyUser.mockResolvedValue({ id: 1, email: 'test@test.com', scopes: ['read'] });
      mockHasScope.mockReturnValue(true);
    });

    it('should return 400 for invalid limit parameter (negative)', async () => {
      const request = createMockGetRequest('valid_key', 'limit=-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });

    it('should return 400 for invalid limit parameter (zero)', async () => {
      const request = createMockGetRequest('valid_key', 'limit=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });

    it('should return 400 for invalid limit parameter (exceeds max)', async () => {
      const request = createMockGetRequest('valid_key', 'limit=101');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });

    it('should return 400 for invalid limit parameter (non-numeric)', async () => {
      const request = createMockGetRequest('valid_key', 'limit=abc');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });
  });

  describe('successful sessions retrieval', () => {
    const mockUser = { id: 1, email: 'test@test.com', scopes: ['read'] };
    const mockSessions = [
      {
        id: 123,
        wpm: 85,
        rawWpm: 90,
        accuracy: 95,
        keystrokes: 250,
        errors: 12,
        durationMs: 60000,
        completedAt: '2024-02-05T10:30:00.000Z',
        challenge: {
          id: 45,
          content: 'git commit -m "Fix typo"',
          difficulty: 'intermediate',
        },
        category: {
          id: 2,
          name: 'Git Commands',
          slug: 'git',
        },
      },
    ];

    beforeEach(() => {
      mockGetApiKeyUser.mockResolvedValue(mockUser);
      mockHasScope.mockReturnValue(true);

      // Mock the db query chain
      const mockLimit = vi.fn().mockResolvedValue(mockSessions);
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockInnerJoin2 = vi.fn().mockReturnValue({ where: mockWhere });
      const mockInnerJoin1 = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin2 });
      const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin1 });
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
      (db.select as ReturnType<typeof vi.fn>) = mockSelect;
    });

    it('should return recent sessions with default limit', async () => {
      const request = createMockGetRequest('valid_key');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessions).toEqual(mockSessions);
    });

    it('should return sessions with custom limit', async () => {
      const request = createMockGetRequest('valid_key', 'limit=5');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessions).toBeDefined();
    });

    it('should return sessions with max limit', async () => {
      const request = createMockGetRequest('valid_key', 'limit=100');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessions).toBeDefined();
    });

    it('should include all session fields', async () => {
      const request = createMockGetRequest('valid_key');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      const session = data.sessions[0];
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('wpm');
      expect(session).toHaveProperty('rawWpm');
      expect(session).toHaveProperty('accuracy');
      expect(session).toHaveProperty('keystrokes');
      expect(session).toHaveProperty('errors');
      expect(session).toHaveProperty('durationMs');
      expect(session).toHaveProperty('completedAt');
      expect(session).toHaveProperty('challenge');
      expect(session).toHaveProperty('category');
    });
  });

  describe('error handling', () => {
    it('should return 500 on database error', async () => {
      mockGetApiKeyUser.mockResolvedValue({ id: 1, email: 'test@test.com', scopes: ['read'] });
      mockHasScope.mockReturnValue(true);

      // Mock database error
      const mockLimit = vi.fn().mockRejectedValue(new Error('Database error'));
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockInnerJoin2 = vi.fn().mockReturnValue({ where: mockWhere });
      const mockInnerJoin1 = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin2 });
      const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin1 });
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
      (db.select as ReturnType<typeof vi.fn>) = mockSelect;

      const request = createMockGetRequest('valid_key');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
