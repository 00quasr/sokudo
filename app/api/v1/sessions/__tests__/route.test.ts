import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock the database
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
  },
}));

// Mock the auth module
vi.mock('@/lib/auth/api-key', () => ({
  authenticateApiKey: vi.fn(),
  hasScope: vi.fn(),
}));

import { authenticateApiKey, hasScope } from '@/lib/auth/api-key';
import { db } from '@/lib/db/drizzle';

const mockAuth = authenticateApiKey as ReturnType<typeof vi.fn>;
const mockHasScope = hasScope as ReturnType<typeof vi.fn>;
const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  innerJoin: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  offset: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  returning: ReturnType<typeof vi.fn>;
};

const mockUser = { id: 1, email: 'test@test.com', name: 'Test', apiKeyId: 1, scopes: ['read', 'write'] };

function createGetRequest(url: string): NextRequest {
  return new NextRequest(new Request(url, {
    headers: { authorization: 'Bearer sk_testkey' },
  }));
}

function createPostRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(new Request(url, {
    method: 'POST',
    headers: {
      authorization: 'Bearer sk_testkey',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  }));
}

describe('GET /api/v1/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return 401 if API key is invalid', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createGetRequest('http://localhost:3000/api/v1/sessions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid or missing API key');
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockUser);
    });

    it('should return 400 for invalid page parameter', async () => {
      const request = createGetRequest('http://localhost:3000/api/v1/sessions?page=0');
      const response = await GET(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 for limit exceeding maximum', async () => {
      const request = createGetRequest('http://localhost:3000/api/v1/sessions?limit=101');
      const response = await GET(request);
      expect(response.status).toBe(400);
    });
  });

  describe('successful retrieval', () => {
    const mockSessions = [
      {
        id: 1,
        wpm: 65,
        rawWpm: 70,
        accuracy: 94,
        keystrokes: 200,
        errors: 12,
        durationMs: 60000,
        completedAt: new Date('2025-01-20T10:00:00Z'),
        challenge: { id: 1, content: 'git commit', difficulty: 'beginner' },
        category: { id: 1, name: 'Git Basics', slug: 'git-basics' },
      },
    ];

    it('should return paginated sessions', async () => {
      mockAuth.mockResolvedValue(mockUser);

      let callCount = 0;
      mockDb.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Count query: select().from().innerJoin().where()
          return {
            from: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([{ count: 1 }]),
              }),
            }),
          };
        } else {
          // Sessions query: select().from().innerJoin().innerJoin().where().orderBy().limit().offset()
          return {
            from: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                innerJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    orderBy: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        offset: vi.fn().mockResolvedValue(mockSessions),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
      });

      const request = createGetRequest('http://localhost:3000/api/v1/sessions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessions).toBeDefined();
      expect(data.pagination).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should return 500 on database error', async () => {
      mockAuth.mockResolvedValue(mockUser);

      const mockFromFn = vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error('Database error')),
        }),
      });
      mockDb.select.mockReturnValue({ from: mockFromFn });

      const request = createGetRequest('http://localhost:3000/api/v1/sessions');
      const response = await GET(request);
      expect(response.status).toBe(500);
    });
  });
});

describe('POST /api/v1/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validBody = {
    challengeId: 1,
    wpm: 65,
    rawWpm: 70,
    accuracy: 94,
    keystrokes: 200,
    errors: 12,
    durationMs: 60000,
  };

  describe('authentication', () => {
    it('should return 401 if API key is invalid', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createPostRequest('http://localhost:3000/api/v1/sessions', validBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid or missing API key');
    });
  });

  describe('authorization', () => {
    it('should return 403 if user lacks write scope', async () => {
      mockAuth.mockResolvedValue(mockUser);
      mockHasScope.mockReturnValue(false);

      const request = createPostRequest('http://localhost:3000/api/v1/sessions', validBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Insufficient permissions');
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockUser);
      mockHasScope.mockReturnValue(true);
    });

    it('should return 400 for missing required fields', async () => {
      const request = createPostRequest('http://localhost:3000/api/v1/sessions', {});
      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid accuracy (>100)', async () => {
      const request = createPostRequest('http://localhost:3000/api/v1/sessions', {
        ...validBody,
        accuracy: 101,
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 for negative wpm', async () => {
      const request = createPostRequest('http://localhost:3000/api/v1/sessions', {
        ...validBody,
        wpm: -1,
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 for zero durationMs', async () => {
      const request = createPostRequest('http://localhost:3000/api/v1/sessions', {
        ...validBody,
        durationMs: 0,
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('successful creation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockUser);
      mockHasScope.mockReturnValue(true);
    });

    it('should return 404 if challenge does not exist', async () => {
      // Mock challenge lookup returning empty
      const mockLimitFn = vi.fn().mockResolvedValue([]);
      const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockFromFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      const request = createPostRequest('http://localhost:3000/api/v1/sessions', validBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Challenge not found');
    });

    it('should create session and return 201', async () => {
      const createdSession = { id: 1, ...validBody, userId: 1, completedAt: new Date() };

      // First call: challenge lookup; Second call: insert
      const mockLimitFn = vi.fn().mockResolvedValue([{ id: 1 }]);
      const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockFromFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      const mockReturning = vi.fn().mockResolvedValue([createdSession]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockInsertFn = vi.fn().mockReturnValue({ values: mockValues });
      mockDb.insert.mockImplementation(mockInsertFn);

      const request = createPostRequest('http://localhost:3000/api/v1/sessions', validBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe(1);
      expect(data.wpm).toBe(65);
    });
  });

  describe('error handling', () => {
    it('should return 500 on database error during creation', async () => {
      mockAuth.mockResolvedValue(mockUser);
      mockHasScope.mockReturnValue(true);

      // Challenge lookup succeeds
      const mockLimitFn = vi.fn().mockResolvedValue([{ id: 1 }]);
      const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockFromFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      // Insert fails
      const mockValues = vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue(new Error('Database error')),
      });
      mockDb.insert.mockReturnValue({ values: mockValues });

      const request = createPostRequest('http://localhost:3000/api/v1/sessions', validBody);
      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });
});
