import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, BatchKeystrokeLogInput } from '../route';

// Mock the database
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(),
  },
}));

// Mock getUser
vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
}));

// Import mocked modules
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';

const mockDb = db as unknown as {
  insert: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  returning: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
};

const mockGetUser = getUser as ReturnType<typeof vi.fn>;

function createMockRequest(body: unknown): NextRequest {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
}

describe('POST /api/keystroke-log', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetUser.mockResolvedValue(null);

      const request = createMockRequest({
        sessionId: 1,
        logs: [
          {
            timestamp: 0,
            expected: 'a',
            actual: 'a',
            isCorrect: true,
            latencyMs: 100,
          },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    });

    it('should return 400 for missing sessionId', async () => {
      const request = createMockRequest({
        logs: [
          {
            timestamp: 0,
            expected: 'a',
            actual: 'a',
            isCorrect: true,
            latencyMs: 100,
          },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 400 for invalid sessionId (zero)', async () => {
      const request = createMockRequest({
        sessionId: 0,
        logs: [
          {
            timestamp: 0,
            expected: 'a',
            actual: 'a',
            isCorrect: true,
            latencyMs: 100,
          },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 400 for negative sessionId', async () => {
      const request = createMockRequest({
        sessionId: -1,
        logs: [
          {
            timestamp: 0,
            expected: 'a',
            actual: 'a',
            isCorrect: true,
            latencyMs: 100,
          },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 400 for empty logs array', async () => {
      const request = createMockRequest({
        sessionId: 1,
        logs: [],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 400 for missing logs field', async () => {
      const request = createMockRequest({
        sessionId: 1,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 400 for negative timestamp in log', async () => {
      const request = createMockRequest({
        sessionId: 1,
        logs: [
          {
            timestamp: -1,
            expected: 'a',
            actual: 'a',
            isCorrect: true,
            latencyMs: 100,
          },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 400 for negative latencyMs in log', async () => {
      const request = createMockRequest({
        sessionId: 1,
        logs: [
          {
            timestamp: 0,
            expected: 'a',
            actual: 'a',
            isCorrect: true,
            latencyMs: -100,
          },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 400 for expected string exceeding max length', async () => {
      const request = createMockRequest({
        sessionId: 1,
        logs: [
          {
            timestamp: 0,
            expected: 'a'.repeat(11),
            actual: 'a',
            isCorrect: true,
            latencyMs: 100,
          },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 400 for actual string exceeding max length', async () => {
      const request = createMockRequest({
        sessionId: 1,
        logs: [
          {
            timestamp: 0,
            expected: 'a',
            actual: 'a'.repeat(11),
            isCorrect: true,
            latencyMs: 100,
          },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 400 for missing isCorrect field', async () => {
      const request = createMockRequest({
        sessionId: 1,
        logs: [
          {
            timestamp: 0,
            expected: 'a',
            actual: 'a',
            latencyMs: 100,
          },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });
  });

  describe('session authorization', () => {
    const mockUser = { id: 1, email: 'test@test.com' };

    beforeEach(() => {
      mockGetUser.mockResolvedValue(mockUser);
    });

    it('should return 404 if session does not exist', async () => {
      mockDb.limit.mockResolvedValue([]);

      const request = createMockRequest({
        sessionId: 999,
        logs: [
          {
            timestamp: 0,
            expected: 'a',
            actual: 'a',
            isCorrect: true,
            latencyMs: 100,
          },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Session not found');
    });

    it('should return 403 if session belongs to another user', async () => {
      mockDb.limit.mockResolvedValue([{ id: 1, userId: 2 }]); // Different user

      const request = createMockRequest({
        sessionId: 1,
        logs: [
          {
            timestamp: 0,
            expected: 'a',
            actual: 'a',
            isCorrect: true,
            latencyMs: 100,
          },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });
  });

  describe('successful keystroke log creation', () => {
    const mockUser = { id: 1, email: 'test@test.com' };
    const mockSession = { id: 42, userId: 1 };

    beforeEach(() => {
      mockGetUser.mockResolvedValue(mockUser);
      mockDb.limit.mockResolvedValue([mockSession]);
    });

    it('should create keystroke logs with valid data', async () => {
      const mockReturning = vi.fn().mockResolvedValue([
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      mockDb.insert.mockReturnValue({ values: mockValues });

      const input: BatchKeystrokeLogInput = {
        sessionId: 42,
        logs: [
          {
            timestamp: 0,
            expected: 'g',
            actual: 'g',
            isCorrect: true,
            latencyMs: 0,
          },
          {
            timestamp: 150,
            expected: 'i',
            actual: 'i',
            isCorrect: true,
            latencyMs: 150,
          },
          {
            timestamp: 280,
            expected: 't',
            actual: 'r',
            isCorrect: false,
            latencyMs: 130,
          },
        ],
      };

      const request = createMockRequest(input);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe('Keystroke logs created successfully');
      expect(data.count).toBe(3);
    });

    it('should create a single keystroke log', async () => {
      const mockReturning = vi.fn().mockResolvedValue([{ id: 1 }]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      mockDb.insert.mockReturnValue({ values: mockValues });

      const input: BatchKeystrokeLogInput = {
        sessionId: 42,
        logs: [
          {
            timestamp: 0,
            expected: 'a',
            actual: 'a',
            isCorrect: true,
            latencyMs: 100,
          },
        ],
      };

      const request = createMockRequest(input);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.count).toBe(1);
    });

    it('should handle special characters in expected/actual', async () => {
      const mockReturning = vi.fn().mockResolvedValue([{ id: 1 }]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      mockDb.insert.mockReturnValue({ values: mockValues });

      const input: BatchKeystrokeLogInput = {
        sessionId: 42,
        logs: [
          {
            timestamp: 0,
            expected: '\n',
            actual: '\n',
            isCorrect: true,
            latencyMs: 200,
          },
        ],
      };

      const request = createMockRequest(input);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.count).toBe(1);
    });

    it('should allow zero latencyMs for first keystroke', async () => {
      const mockReturning = vi.fn().mockResolvedValue([{ id: 1 }]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      mockDb.insert.mockReturnValue({ values: mockValues });

      const input: BatchKeystrokeLogInput = {
        sessionId: 42,
        logs: [
          {
            timestamp: 0,
            expected: 'a',
            actual: 'a',
            isCorrect: true,
            latencyMs: 0,
          },
        ],
      };

      const request = createMockRequest(input);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
    });

    it('should allow empty string for expected/actual (for special keys)', async () => {
      const mockReturning = vi.fn().mockResolvedValue([{ id: 1 }]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      mockDb.insert.mockReturnValue({ values: mockValues });

      const input: BatchKeystrokeLogInput = {
        sessionId: 42,
        logs: [
          {
            timestamp: 0,
            expected: '',
            actual: '',
            isCorrect: true,
            latencyMs: 100,
          },
        ],
      };

      const request = createMockRequest(input);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
    });
  });

  describe('error handling', () => {
    const mockUser = { id: 1, email: 'test@test.com' };
    const mockSession = { id: 42, userId: 1 };

    it('should return 500 on session lookup database error', async () => {
      mockGetUser.mockResolvedValue(mockUser);
      mockDb.limit.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({
        sessionId: 1,
        logs: [
          {
            timestamp: 0,
            expected: 'a',
            actual: 'a',
            isCorrect: true,
            latencyMs: 100,
          },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should return 500 on keystroke insert database error', async () => {
      mockGetUser.mockResolvedValue(mockUser);
      mockDb.limit.mockResolvedValue([mockSession]);

      const mockReturning = vi.fn().mockRejectedValue(new Error('Database error'));
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      mockDb.insert.mockReturnValue({ values: mockValues });

      const request = createMockRequest({
        sessionId: 42,
        logs: [
          {
            timestamp: 0,
            expected: 'a',
            actual: 'a',
            isCorrect: true,
            latencyMs: 100,
          },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});

describe('BatchKeystrokeLogInput type', () => {
  it('should match KeystrokeEvent interface from CLAUDE.md reference', () => {
    // This type check ensures our API input aligns with the typing engine reference
    const input: BatchKeystrokeLogInput = {
      sessionId: 1,
      logs: [
        {
          timestamp: 0,
          expected: 'a',
          actual: 'a',
          isCorrect: true,
          latencyMs: 100,
        },
      ],
    };

    expect(input.sessionId).toBeDefined();
    expect(input.logs).toBeDefined();
    expect(input.logs[0].timestamp).toBeDefined();
    expect(input.logs[0].expected).toBeDefined();
    expect(input.logs[0].actual).toBeDefined();
    expect(input.logs[0].isCorrect).toBeDefined();
    expect(input.logs[0].latencyMs).toBeDefined();
  });
});
