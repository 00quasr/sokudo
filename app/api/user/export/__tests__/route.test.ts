import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

// Mock the database - provide chainable methods for all query patterns used
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

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
}));

import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;

// Helper to create a mock db chain that resolves to a value at the terminal call
function mockDbChain(resolvedValue: unknown) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const handler: ProxyHandler<Record<string, ReturnType<typeof vi.fn>>> = {
    get(_target, prop) {
      if (prop === 'then') {
        // Make it thenable - resolve with the value
        return (resolve: (v: unknown) => void) => resolve(resolvedValue);
      }
      if (!chain[prop as string]) {
        chain[prop as string] = vi.fn();
      }
      chain[prop as string].mockReturnValue(new Proxy({}, handler));
      return chain[prop as string];
    },
  };
  return new Proxy({}, handler);
}

describe('GET /api/user/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return JSON with all user data sections', async () => {
    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@test.com',
      role: 'member',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-15T00:00:00Z'),
    };
    mockGetUser.mockResolvedValue(mockUser);

    const mockProfile = [{
      subscriptionTier: 'free',
      currentStreak: 5,
      longestStreak: 10,
      totalPracticeTimeMs: 3600000,
      preferences: { theme: 'dark' },
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-15'),
    }];

    const mockSessions = [{
      id: 1,
      wpm: 60,
      rawWpm: 65,
      accuracy: 95,
      keystrokes: 150,
      errors: 8,
      durationMs: 30000,
      completedAt: new Date('2025-01-20T10:00:00Z'),
      challengeContent: 'git commit -m "test"',
      challengeDifficulty: 'beginner',
      categoryName: 'Git Basics',
    }];

    const mockDailyPractice = [{
      date: '2025-01-20',
      practiceTimeMs: 30000,
      sessionsCompleted: 1,
    }];

    const mockKeyAccuracy = [{
      key: 'a',
      totalPresses: 100,
      correctPresses: 95,
      avgLatencyMs: 120,
    }];

    const mockCharErrors = [{
      expectedChar: 'a',
      actualChar: 's',
      count: 5,
    }];

    const mockSequenceErrors = [{
      sequence: 'git',
      totalAttempts: 50,
      errorCount: 3,
      avgLatencyMs: 200,
    }];

    const mockAchievements = [{
      achievementName: 'First Steps',
      achievementDescription: 'Complete your first session',
      earnedAt: new Date('2025-01-20T10:00:00Z'),
    }];

    const mockCustomChallenges = [{
      id: 1,
      name: 'My Challenge',
      content: 'echo hello',
      isPublic: false,
      timesCompleted: 3,
      createdAt: new Date('2025-01-15'),
    }];

    const mockVotes = [{
      challengeId: 2,
      value: 1,
      createdAt: new Date('2025-01-16'),
    }];

    const mockCollections = [{
      id: 1,
      name: 'Favorites',
      description: 'My favorites',
      isPublic: false,
      createdAt: new Date('2025-01-10'),
    }];

    const mockTeamMemberships = [{
      teamName: 'Dev Team',
      role: 'member',
      joinedAt: new Date('2025-01-05'),
    }];

    const mockActivityLogs = [{
      action: 'SIGN_IN',
      timestamp: new Date('2025-01-20T09:00:00Z'),
      ipAddress: '127.0.0.1',
    }];

    // Mock Promise.all by making db.select return different chains
    // for each call in sequence
    const mockResults = [
      mockProfile,
      mockSessions,
      mockDailyPractice,
      mockKeyAccuracy,
      mockCharErrors,
      mockSequenceErrors,
      mockAchievements,
      mockCustomChallenges,
      mockVotes,
      mockCollections,
      mockTeamMemberships,
      mockActivityLogs,
    ];

    let callIndex = 0;
    const mockSelect = vi.fn().mockImplementation(() => {
      return mockDbChain(mockResults[callIndex++]);
    });
    (db as unknown as { select: ReturnType<typeof vi.fn> }).select = mockSelect;

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="sokudo-data-export-1.json"'
    );

    // Verify all sections are present
    expect(data.exportedAt).toBeDefined();
    expect(data.user.name).toBe('Test User');
    expect(data.user.email).toBe('test@test.com');
    expect(data.user.role).toBe('member');
    expect(data.profile.subscriptionTier).toBe('free');
    expect(data.profile.currentStreak).toBe(5);
    expect(data.typingSessions).toHaveLength(1);
    expect(data.typingSessions[0].wpm).toBe(60);
    expect(data.dailyPractice).toHaveLength(1);
    expect(data.keyAccuracy).toHaveLength(1);
    expect(data.charErrorPatterns).toHaveLength(1);
    expect(data.sequenceErrorPatterns).toHaveLength(1);
    expect(data.achievements).toHaveLength(1);
    expect(data.achievements[0].achievementName).toBe('First Steps');
    expect(data.customChallenges).toHaveLength(1);
    expect(data.challengeVotes).toHaveLength(1);
    expect(data.challengeCollections).toHaveLength(1);
    expect(data.teamMemberships).toHaveLength(1);
    expect(data.teamMemberships[0].teamName).toBe('Dev Team');
    expect(data.activityLogs).toHaveLength(1);
    expect(data.activityLogs[0].action).toBe('SIGN_IN');
  });

  it('should return empty arrays when user has no data', async () => {
    const mockUser = {
      id: 2,
      name: null,
      email: 'empty@test.com',
      role: 'member',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
    };
    mockGetUser.mockResolvedValue(mockUser);

    const emptyResults = [
      [],  // profile
      [],  // sessions
      [],  // dailyPractice
      [],  // keyAccuracy
      [],  // charErrors
      [],  // sequenceErrors
      [],  // achievements
      [],  // customChallenges
      [],  // votes
      [],  // collections
      [],  // teamMemberships
      [],  // activityLogs
    ];

    let callIndex = 0;
    const mockSelect = vi.fn().mockImplementation(() => {
      return mockDbChain(emptyResults[callIndex++]);
    });
    (db as unknown as { select: ReturnType<typeof vi.fn> }).select = mockSelect;

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.email).toBe('empty@test.com');
    expect(data.user.name).toBeNull();
    expect(data.profile).toBeNull();
    expect(data.typingSessions).toHaveLength(0);
    expect(data.dailyPractice).toHaveLength(0);
    expect(data.keyAccuracy).toHaveLength(0);
    expect(data.charErrorPatterns).toHaveLength(0);
    expect(data.sequenceErrorPatterns).toHaveLength(0);
    expect(data.achievements).toHaveLength(0);
    expect(data.customChallenges).toHaveLength(0);
    expect(data.challengeVotes).toHaveLength(0);
    expect(data.challengeCollections).toHaveLength(0);
    expect(data.teamMemberships).toHaveLength(0);
    expect(data.activityLogs).toHaveLength(0);
  });

  it('should not include password hash in exported data', async () => {
    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@test.com',
      passwordHash: 'hashed_password_secret',
      role: 'member',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-15T00:00:00Z'),
    };
    mockGetUser.mockResolvedValue(mockUser);

    const emptyResults = [[], [], [], [], [], [], [], [], [], [], [], []];
    let callIndex = 0;
    const mockSelect = vi.fn().mockImplementation(() => {
      return mockDbChain(emptyResults[callIndex++]);
    });
    (db as unknown as { select: ReturnType<typeof vi.fn> }).select = mockSelect;

    const response = await GET();
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).not.toContain('hashed_password_secret');
    expect(text).not.toContain('passwordHash');
    expect(text).not.toContain('password_hash');
  });

  it('should return 500 on database error', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const mockSelect = vi.fn().mockImplementation(() => {
      return mockDbChain(Promise.reject(new Error('Database error')));
    });
    (db as unknown as { select: ReturnType<typeof vi.fn> }).select = mockSelect;

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should set correct content-disposition filename with user id', async () => {
    const mockUser = {
      id: 42,
      name: 'Test User',
      email: 'test@test.com',
      role: 'member',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockGetUser.mockResolvedValue(mockUser);

    const emptyResults = [[], [], [], [], [], [], [], [], [], [], [], []];
    let callIndex = 0;
    const mockSelect = vi.fn().mockImplementation(() => {
      return mockDbChain(emptyResults[callIndex++]);
    });
    (db as unknown as { select: ReturnType<typeof vi.fn> }).select = mockSelect;

    const response = await GET();

    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="sokudo-data-export-42.json"'
    );
  });
});
