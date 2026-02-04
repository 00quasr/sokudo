import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the drizzle database
vi.mock('../drizzle', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    query: {
      userProfiles: {
        findFirst: vi.fn(),
      },
    },
  },
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: 'valid-session-token' }),
  }),
}));

// Mock auth session
vi.mock('@/lib/auth/session', () => ({
  verifyToken: vi.fn().mockResolvedValue({
    user: { id: 1 },
    expires: new Date(Date.now() + 86400000).toISOString(),
  }),
}));

import { db } from '../drizzle';

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  returning: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  query: {
    userProfiles: {
      findFirst: ReturnType<typeof vi.fn>;
    };
  };
};

describe('getDailyPracticeForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return daily practice record when it exists', async () => {
    const mockPractice = {
      id: 1,
      userId: 1,
      date: '2025-01-20',
      practiceTimeMs: 1800000,
      sessionsCompleted: 3,
    };

    mockDb.limit.mockResolvedValue([mockPractice]);

    const { getDailyPracticeForUser } = await import('../queries');
    const result = await getDailyPracticeForUser(1, '2025-01-20');

    expect(result).toEqual(mockPractice);
  });

  it('should return null when no practice record exists', async () => {
    mockDb.limit.mockResolvedValue([]);

    const { getDailyPracticeForUser } = await import('../queries');
    const result = await getDailyPracticeForUser(1, '2025-01-20');

    expect(result).toBeNull();
  });
});

describe('upsertDailyPractice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create new record when none exists', async () => {
    const newPractice = {
      id: 1,
      userId: 1,
      date: '2025-01-20',
      practiceTimeMs: 30000,
      sessionsCompleted: 1,
    };

    // No existing record
    mockDb.limit.mockResolvedValue([]);
    mockDb.returning.mockResolvedValue([newPractice]);

    const { upsertDailyPractice } = await import('../queries');
    const result = await upsertDailyPractice(1, '2025-01-20', 30000, 1);

    expect(result).toEqual(newPractice);
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it('should update existing record when one exists', async () => {
    const existingPractice = {
      id: 5,
      userId: 1,
      date: '2025-01-20',
      practiceTimeMs: 60000,
      sessionsCompleted: 2,
    };
    const updatedPractice = {
      id: 5,
      userId: 1,
      date: '2025-01-20',
      practiceTimeMs: 90000,
      sessionsCompleted: 3,
    };

    // Existing record found
    mockDb.limit.mockResolvedValue([existingPractice]);
    mockDb.returning.mockResolvedValue([updatedPractice]);

    const { upsertDailyPractice } = await import('../queries');
    const result = await upsertDailyPractice(1, '2025-01-20', 30000, 1);

    expect(result).toEqual(updatedPractice);
    expect(mockDb.update).toHaveBeenCalled();
  });
});

describe('updateUserTotalPracticeTime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update existing profile total practice time', async () => {
    const existingProfile = {
      userId: 1,
      totalPracticeTimeMs: 100000,
    };

    mockDb.query.userProfiles.findFirst.mockResolvedValue(existingProfile);

    const { updateUserTotalPracticeTime } = await import('../queries');
    await updateUserTotalPracticeTime(1, 50000);

    expect(mockDb.update).toHaveBeenCalled();
  });

  it('should create new profile when none exists', async () => {
    mockDb.query.userProfiles.findFirst.mockResolvedValue(null);

    const { updateUserTotalPracticeTime } = await import('../queries');
    await updateUserTotalPracticeTime(1, 50000);

    expect(mockDb.insert).toHaveBeenCalled();
  });
});

describe('updateUserStreak', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create new profile with streak of 1 when none exists and user practiced today', async () => {
    const today = new Date().toISOString().split('T')[0];
    const todayPractice = {
      id: 1,
      userId: 1,
      date: today,
      practiceTimeMs: 30000,
      sessionsCompleted: 1,
    };

    mockDb.query.userProfiles.findFirst.mockResolvedValue(null);
    // First call returns today's practice, second call (for yesterday) returns empty
    mockDb.limit
      .mockResolvedValueOnce([todayPractice])
      .mockResolvedValueOnce([]);

    const { updateUserStreak } = await import('../queries');
    await updateUserStreak(1);

    expect(mockDb.insert).toHaveBeenCalled();
  });
});

describe('getDailyPracticeHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return practice history for the specified number of days', async () => {
    const mockHistory = [
      { id: 1, userId: 1, date: '2025-01-18', practiceTimeMs: 1200000, sessionsCompleted: 2 },
      { id: 2, userId: 1, date: '2025-01-19', practiceTimeMs: 1800000, sessionsCompleted: 3 },
      { id: 3, userId: 1, date: '2025-01-20', practiceTimeMs: 3600000, sessionsCompleted: 5 },
    ];

    // Mock the getUser call chain
    mockDb.limit.mockResolvedValue([{ id: 1, email: 'test@test.com' }]);
    mockDb.orderBy.mockResolvedValue(mockHistory);

    const { getDailyPracticeHistory } = await import('../queries');
    const result = await getDailyPracticeHistory(7);

    expect(result).toEqual(mockHistory);
  });
});
