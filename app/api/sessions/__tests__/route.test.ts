import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, CreateSessionInput } from '../route';

// Mock the database
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
  },
}));

// Mock getUser and daily practice functions
vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  upsertDailyPractice: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    date: '2025-01-20',
    practiceTimeMs: 30000,
    sessionsCompleted: 1,
  }),
  updateUserTotalPracticeTime: vi.fn().mockResolvedValue(undefined),
  updateUserStreak: vi.fn().mockResolvedValue(undefined),
  upsertKeyAccuracy: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    key: 'a',
    totalPresses: 1,
    correctPresses: 1,
    avgLatencyMs: 100,
  }),
  batchUpsertCharErrorPatterns: vi.fn().mockResolvedValue([]),
  batchUpsertSequenceErrorPatterns: vi.fn().mockResolvedValue([]),
  getSpacedRepetitionItem: vi.fn().mockResolvedValue(null),
  upsertSpacedRepetitionItem: vi.fn().mockResolvedValue(undefined),
  getUserStatsOverview: vi.fn().mockResolvedValue({
    totalSessions: 10,
    avgWpm: 40,
    avgAccuracy: 90,
    totalPracticeTimeMs: 300000,
    totalKeystrokes: 5000,
    totalErrors: 500,
    currentStreak: 3,
    longestStreak: 5,
    bestWpm: 70,
    bestAccuracy: 98,
  }),
}));

// Mock practice limits
vi.mock('@/lib/limits', () => ({
  checkSessionAllowed: vi.fn(),
  FREE_TIER_DAILY_LIMIT_MS: 15 * 60 * 1000,
}));

// Mock achievement checking
vi.mock('@/lib/db/check-achievements', () => ({
  checkAndUnlockAchievements: vi.fn().mockResolvedValue([]),
}));

// Import mocked modules
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { checkSessionAllowed } from '@/lib/limits';

const mockDb = db as unknown as {
  insert: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  returning: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  innerJoin: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  offset: ReturnType<typeof vi.fn>;
};

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockCheckSessionAllowed = checkSessionAllowed as ReturnType<typeof vi.fn>;

function createMockRequest(body: unknown): NextRequest {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
}

function createMockGetRequest(url: string): NextRequest {
  return {
    url,
  } as unknown as NextRequest;
}

describe('GET /api/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetUser.mockResolvedValue(null);

      const request = createMockGetRequest('http://localhost:3000/api/sessions');
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

    it('should return 400 for invalid page parameter', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/sessions?page=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });

    it('should return 400 for negative page parameter', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/sessions?page=-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });

    it('should return 400 for invalid limit parameter', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/sessions?limit=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });

    it('should return 400 for limit exceeding maximum', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/sessions?limit=101');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });

    it('should return 400 for invalid categoryId parameter', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/sessions?categoryId=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });
  });

  describe('successful session retrieval', () => {
    const mockUser = { id: 1, email: 'test@test.com' };
    const mockSessions = [
      {
        id: 1,
        wpm: 60,
        rawWpm: 65,
        accuracy: 95,
        keystrokes: 150,
        errors: 8,
        durationMs: 30000,
        completedAt: new Date('2025-01-20T10:00:00Z'),
        challenge: {
          id: 1,
          content: 'git commit -m "test"',
          difficulty: 'beginner',
        },
        category: {
          id: 1,
          name: 'Git Basics',
          slug: 'git-basics',
        },
      },
      {
        id: 2,
        wpm: 70,
        rawWpm: 75,
        accuracy: 98,
        keystrokes: 200,
        errors: 4,
        durationMs: 45000,
        completedAt: new Date('2025-01-19T10:00:00Z'),
        challenge: {
          id: 2,
          content: 'git push origin main',
          difficulty: 'beginner',
        },
        category: {
          id: 1,
          name: 'Git Basics',
          slug: 'git-basics',
        },
      },
    ];

    beforeEach(() => {
      mockGetUser.mockResolvedValue(mockUser);
    });

    it('should return paginated sessions with default parameters', async () => {
      // Setup mock chain for count query
      const mockOffsetFn = vi.fn().mockResolvedValue(mockSessions);
      const mockLimitFn = vi.fn().mockReturnValue({ offset: mockOffsetFn });
      const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockWhereFn = vi.fn()
        .mockResolvedValueOnce([{ count: 2 }]) // First call for count
        .mockReturnValueOnce({ orderBy: mockOrderByFn }); // Second call for sessions
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn, innerJoin: vi.fn().mockReturnValue({ where: mockWhereFn }) });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

      mockDb.select.mockImplementation(mockSelectFn);

      const request = createMockGetRequest('http://localhost:3000/api/sessions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessions).toBeDefined();
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(20);
    });

    it('should return paginated sessions with custom page and limit', async () => {
      const mockOffsetFn = vi.fn().mockResolvedValue([mockSessions[1]]);
      const mockLimitFn = vi.fn().mockReturnValue({ offset: mockOffsetFn });
      const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockWhereFn = vi.fn()
        .mockResolvedValueOnce([{ count: 2 }])
        .mockReturnValueOnce({ orderBy: mockOrderByFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn, innerJoin: vi.fn().mockReturnValue({ where: mockWhereFn }) });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

      mockDb.select.mockImplementation(mockSelectFn);

      const request = createMockGetRequest('http://localhost:3000/api/sessions?page=2&limit=1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(1);
    });

    it('should filter sessions by categoryId', async () => {
      const mockOffsetFn = vi.fn().mockResolvedValue(mockSessions);
      const mockLimitFn = vi.fn().mockReturnValue({ offset: mockOffsetFn });
      const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockWhereFn = vi.fn()
        .mockResolvedValueOnce([{ count: 2 }])
        .mockReturnValueOnce({ orderBy: mockOrderByFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn, innerJoin: vi.fn().mockReturnValue({ where: mockWhereFn }) });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

      mockDb.select.mockImplementation(mockSelectFn);

      const request = createMockGetRequest('http://localhost:3000/api/sessions?categoryId=1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessions).toBeDefined();
    });

    it('should return correct pagination metadata', async () => {
      const mockOffsetFn = vi.fn().mockResolvedValue(mockSessions);
      const mockLimitFn = vi.fn().mockReturnValue({ offset: mockOffsetFn });
      const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockWhereFn = vi.fn()
        .mockResolvedValueOnce([{ count: 25 }])
        .mockReturnValueOnce({ orderBy: mockOrderByFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn, innerJoin: vi.fn().mockReturnValue({ where: mockWhereFn }) });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

      mockDb.select.mockImplementation(mockSelectFn);

      const request = createMockGetRequest('http://localhost:3000/api/sessions?page=2&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.total).toBe(25);
      expect(data.pagination.totalPages).toBe(3);
      expect(data.pagination.hasNextPage).toBe(true);
      expect(data.pagination.hasPrevPage).toBe(true);
    });

    it('should return empty sessions array when no sessions exist', async () => {
      const mockOffsetFn = vi.fn().mockResolvedValue([]);
      const mockLimitFn = vi.fn().mockReturnValue({ offset: mockOffsetFn });
      const mockOrderByFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockWhereFn = vi.fn()
        .mockResolvedValueOnce([{ count: 0 }])
        .mockReturnValueOnce({ orderBy: mockOrderByFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn, innerJoin: vi.fn().mockReturnValue({ where: mockWhereFn }) });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

      mockDb.select.mockImplementation(mockSelectFn);

      const request = createMockGetRequest('http://localhost:3000/api/sessions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessions).toEqual([]);
      expect(data.pagination.total).toBe(0);
      expect(data.pagination.totalPages).toBe(0);
      expect(data.pagination.hasNextPage).toBe(false);
      expect(data.pagination.hasPrevPage).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should return 500 on database error', async () => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

      const mockFromFn = vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error('Database error')),
        }),
      });
      mockDb.select.mockReturnValue({ from: mockFromFn });

      const request = createMockGetRequest('http://localhost:3000/api/sessions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});

describe('POST /api/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetUser.mockResolvedValue(null);

      const request = createMockRequest({
        challengeId: 1,
        wpm: 60,
        rawWpm: 65,
        accuracy: 95,
        keystrokes: 150,
        errors: 8,
        durationMs: 30000,
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

    it('should return 400 for missing required fields', async () => {
      const request = createMockRequest({
        wpm: 60,
        // missing challengeId and other required fields
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
      expect(data.details).toBeDefined();
    });

    it('should return 400 for invalid challengeId', async () => {
      const request = createMockRequest({
        challengeId: 0, // must be positive
        wpm: 60,
        rawWpm: 65,
        accuracy: 95,
        keystrokes: 150,
        errors: 8,
        durationMs: 30000,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 400 for negative wpm', async () => {
      const request = createMockRequest({
        challengeId: 1,
        wpm: -5,
        rawWpm: 65,
        accuracy: 95,
        keystrokes: 150,
        errors: 8,
        durationMs: 30000,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 400 for accuracy over 100', async () => {
      const request = createMockRequest({
        challengeId: 1,
        wpm: 60,
        rawWpm: 65,
        accuracy: 101,
        keystrokes: 150,
        errors: 8,
        durationMs: 30000,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 400 for negative accuracy', async () => {
      const request = createMockRequest({
        challengeId: 1,
        wpm: 60,
        rawWpm: 65,
        accuracy: -1,
        keystrokes: 150,
        errors: 8,
        durationMs: 30000,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 400 for zero durationMs', async () => {
      const request = createMockRequest({
        challengeId: 1,
        wpm: 60,
        rawWpm: 65,
        accuracy: 95,
        keystrokes: 150,
        errors: 8,
        durationMs: 0,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 400 for invalid keystroke log data', async () => {
      const request = createMockRequest({
        challengeId: 1,
        wpm: 60,
        rawWpm: 65,
        accuracy: 95,
        keystrokes: 150,
        errors: 8,
        durationMs: 30000,
        keystrokeLogs: [
          {
            timestamp: -1, // invalid: negative timestamp
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
  });

  describe('successful session creation', () => {
    const mockUser = { id: 1, email: 'test@test.com' };
    const mockSession = {
      id: 42,
      userId: 1,
      challengeId: 1,
      wpm: 60,
      rawWpm: 65,
      accuracy: 95,
      keystrokes: 150,
      errors: 8,
      durationMs: 30000,
      completedAt: new Date('2025-01-20T10:00:00Z'),
    };

    beforeEach(() => {
      mockGetUser.mockResolvedValue(mockUser);
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockSession]),
        }),
      });
      // Default mock: session is allowed within limit
      mockCheckSessionAllowed.mockResolvedValue({
        allowed: true,
        allowedDurationMs: 30000,
        limitExceeded: false,
        remainingBeforeSession: 600000,
      });
    });

    it('should create a session with valid data', async () => {
      const sessionInput: CreateSessionInput = {
        challengeId: 1,
        wpm: 60,
        rawWpm: 65,
        accuracy: 95,
        keystrokes: 150,
        errors: 8,
        durationMs: 30000,
      };

      const request = createMockRequest(sessionInput);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe(42);
      expect(data.userId).toBe(1);
      expect(data.wpm).toBe(60);
    });

    it('should create a session with zero errors', async () => {
      // 200 keystrokes, 0 errors, 45s → WPM = (200/5)/(45/60) = 53
      const sessionInput: CreateSessionInput = {
        challengeId: 1,
        wpm: 53,
        rawWpm: 53,
        accuracy: 100,
        keystrokes: 200,
        errors: 0,
        durationMs: 45000,
      };

      const request = createMockRequest(sessionInput);
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('should create a session with keystroke logs', async () => {
      // 3 keystrokes, 1 error → 2 correct chars
      // Last keystroke at timestamp 280 + latency 130 → logDuration ~410ms
      // WPM = (2/5)/(410/60000) ≈ 59
      // rawWpm = (3/5)/(410/60000) ≈ 88
      // accuracy = (2/3)*100 = 67%
      const sessionInput: CreateSessionInput = {
        challengeId: 1,
        wpm: 59,
        rawWpm: 88,
        accuracy: 67,
        keystrokes: 3,
        errors: 1,
        durationMs: 410,
        keystrokeLogs: [
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

      // Mock for keystroke logs insertion
      const mockValuesReturn = {
        returning: vi.fn().mockResolvedValue([mockSession]),
      };
      const mockInsertReturn = {
        values: vi.fn().mockReturnValue(mockValuesReturn),
      };
      mockDb.insert.mockReturnValue(mockInsertReturn);

      const request = createMockRequest(sessionInput);
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('should allow high WPM values', async () => {
      // 500 keystrokes, 15 errors, 60s → correct=485
      // WPM = (485/5)/(60/60) = 97, rawWpm = (500/5)/1 = 100
      // accuracy = (485/500)*100 = 97%
      const sessionInput: CreateSessionInput = {
        challengeId: 1,
        wpm: 97,
        rawWpm: 100,
        accuracy: 97,
        keystrokes: 500,
        errors: 15,
        durationMs: 60000,
      };

      const request = createMockRequest(sessionInput);
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('should allow minimum valid values', async () => {
      const sessionInput: CreateSessionInput = {
        challengeId: 1,
        wpm: 0,
        rawWpm: 0,
        accuracy: 0,
        keystrokes: 0,
        errors: 0,
        durationMs: 1,
      };

      const request = createMockRequest(sessionInput);
      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  describe('error handling', () => {
    it('should return 500 on database error', async () => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
      mockCheckSessionAllowed.mockResolvedValue({
        allowed: true,
        allowedDurationMs: 30000,
        limitExceeded: false,
        remainingBeforeSession: 600000,
      });
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      const request = createMockRequest({
        challengeId: 1,
        wpm: 60,
        rawWpm: 65,
        accuracy: 95,
        keystrokes: 150,
        errors: 8,
        durationMs: 30000,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('practice limits', () => {
    const mockUser = { id: 1, email: 'test@test.com' };
    const mockSession = {
      id: 42,
      userId: 1,
      challengeId: 1,
      wpm: 60,
      rawWpm: 65,
      accuracy: 95,
      keystrokes: 150,
      errors: 8,
      durationMs: 30000,
      completedAt: new Date('2025-01-20T10:00:00Z'),
    };

    beforeEach(() => {
      mockGetUser.mockResolvedValue(mockUser);
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockSession]),
        }),
      });
    });

    it('should return 403 when daily practice limit exceeded', async () => {
      mockCheckSessionAllowed.mockResolvedValue({
        allowed: false,
        allowedDurationMs: 0,
        limitExceeded: true,
        remainingBeforeSession: 0,
      });

      const request = createMockRequest({
        challengeId: 1,
        wpm: 60,
        rawWpm: 65,
        accuracy: 95,
        keystrokes: 150,
        errors: 8,
        durationMs: 30000,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Daily practice limit exceeded');
      expect(data.code).toBe('PRACTICE_LIMIT_EXCEEDED');
      expect(data.details.dailyLimitMs).toBe(15 * 60 * 1000);
    });

    it('should include practiceLimit in response when limit is reached with this session', async () => {
      mockCheckSessionAllowed.mockResolvedValue({
        allowed: true,
        allowedDurationMs: 60000, // Only 1 min of 30 sec session credited
        limitExceeded: true,
        remainingBeforeSession: 60000,
      });

      // 150 keystrokes, 8 errors, 180s → correct=142
      // WPM = (142/5)/(180/60) = 28.4/3 = 9 (rounded)
      // accuracy = (142/150)*100 = 95%
      const request = createMockRequest({
        challengeId: 1,
        wpm: 9,
        rawWpm: 10,
        accuracy: 95,
        keystrokes: 150,
        errors: 8,
        durationMs: 180000, // 3 minute session
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.practiceLimit).toBeDefined();
      expect(data.practiceLimit.limitReached).toBe(true);
      expect(data.practiceLimit.effectiveDurationMs).toBe(60000);
    });

    it('should not include practiceLimit in response when limit not reached', async () => {
      mockCheckSessionAllowed.mockResolvedValue({
        allowed: true,
        allowedDurationMs: 30000,
        limitExceeded: false,
        remainingBeforeSession: 600000,
      });

      const request = createMockRequest({
        challengeId: 1,
        wpm: 60,
        rawWpm: 65,
        accuracy: 95,
        keystrokes: 150,
        errors: 8,
        durationMs: 30000,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.practiceLimit).toBeNull();
    });
  });
});

describe('CreateSessionInput type', () => {
  it('should match SessionResult interface from components', () => {
    // This type check ensures our API input aligns with frontend expectations
    const input: CreateSessionInput = {
      challengeId: 1,
      wpm: 65,
      rawWpm: 70,
      accuracy: 95,
      keystrokes: 150,
      errors: 8,
      durationMs: 30000,
    };

    expect(input.wpm).toBeDefined();
    expect(input.rawWpm).toBeDefined();
    expect(input.accuracy).toBeDefined();
    expect(input.keystrokes).toBeDefined();
    expect(input.errors).toBeDefined();
    expect(input.durationMs).toBeDefined();
  });
});
