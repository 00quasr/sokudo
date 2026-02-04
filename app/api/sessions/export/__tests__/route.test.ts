import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

// Mock the database
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
  },
}));

// Mock getUser
vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
}));

import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  innerJoin: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
};

const mockGetUser = getUser as ReturnType<typeof vi.fn>;

describe('GET /api/sessions/export', () => {
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

  it('should return CSV with correct headers for authenticated user', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

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
        challengeDifficulty: 'beginner',
        categoryName: 'Git Basics',
      },
    ];

    const mockOrderByFn = vi.fn().mockResolvedValue(mockSessions);
    const mockWhereFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
    const mockInnerJoinFn2 = vi.fn().mockReturnValue({ where: mockWhereFn });
    const mockInnerJoinFn1 = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn2 });
    const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn1 });
    const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

    mockDb.select.mockImplementation(mockSelectFn);

    const response = await GET();
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/csv');
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="sokudo-sessions.csv"'
    );

    const lines = text.split('\n');
    expect(lines[0]).toBe(
      'Session ID,Date,Category,Difficulty,WPM,Raw WPM,Accuracy (%),Keystrokes,Errors,Duration (ms),Duration'
    );
  });

  it('should return correct CSV data rows', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const mockSessions = [
      {
        id: 1,
        wpm: 60,
        rawWpm: 65,
        accuracy: 95,
        keystrokes: 150,
        errors: 8,
        durationMs: 90000,
        completedAt: new Date('2025-01-20T10:00:00Z'),
        challengeDifficulty: 'beginner',
        categoryName: 'Git Basics',
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
        challengeDifficulty: 'intermediate',
        categoryName: 'Docker',
      },
    ];

    const mockOrderByFn = vi.fn().mockResolvedValue(mockSessions);
    const mockWhereFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
    const mockInnerJoinFn2 = vi.fn().mockReturnValue({ where: mockWhereFn });
    const mockInnerJoinFn1 = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn2 });
    const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn1 });
    const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

    mockDb.select.mockImplementation(mockSelectFn);

    const response = await GET();
    const text = await response.text();
    const lines = text.split('\n');

    expect(lines).toHaveLength(3); // header + 2 data rows

    // First data row
    expect(lines[1]).toBe(
      '1,2025-01-20T10:00:00.000Z,Git Basics,beginner,60,65,95,150,8,90000,1m 30s'
    );

    // Second data row
    expect(lines[2]).toBe(
      '2,2025-01-19T10:00:00.000Z,Docker,intermediate,70,75,98,200,4,45000,0m 45s'
    );
  });

  it('should return CSV with only headers when no sessions exist', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const mockOrderByFn = vi.fn().mockResolvedValue([]);
    const mockWhereFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
    const mockInnerJoinFn2 = vi.fn().mockReturnValue({ where: mockWhereFn });
    const mockInnerJoinFn1 = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn2 });
    const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn1 });
    const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

    mockDb.select.mockImplementation(mockSelectFn);

    const response = await GET();
    const text = await response.text();
    const lines = text.split('\n');

    expect(response.status).toBe(200);
    expect(lines).toHaveLength(1); // only header
  });

  it('should escape CSV fields with commas', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

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
        challengeDifficulty: 'beginner',
        categoryName: 'Git, Advanced',
      },
    ];

    const mockOrderByFn = vi.fn().mockResolvedValue(mockSessions);
    const mockWhereFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
    const mockInnerJoinFn2 = vi.fn().mockReturnValue({ where: mockWhereFn });
    const mockInnerJoinFn1 = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn2 });
    const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn1 });
    const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

    mockDb.select.mockImplementation(mockSelectFn);

    const response = await GET();
    const text = await response.text();
    const lines = text.split('\n');

    // Category name with comma should be quoted
    expect(lines[1]).toContain('"Git, Advanced"');
  });

  it('should escape CSV fields with double quotes', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

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
        challengeDifficulty: 'beginner',
        categoryName: 'Git "Pro"',
      },
    ];

    const mockOrderByFn = vi.fn().mockResolvedValue(mockSessions);
    const mockWhereFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
    const mockInnerJoinFn2 = vi.fn().mockReturnValue({ where: mockWhereFn });
    const mockInnerJoinFn1 = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn2 });
    const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn1 });
    const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

    mockDb.select.mockImplementation(mockSelectFn);

    const response = await GET();
    const text = await response.text();
    const lines = text.split('\n');

    // Double quotes should be escaped as ""
    expect(lines[1]).toContain('"Git ""Pro"""');
  });

  it('should return 500 on database error', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const mockFromFn = vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      }),
    });
    mockDb.select.mockReturnValue({ from: mockFromFn });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should handle sessions with null completedAt', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const mockSessions = [
      {
        id: 1,
        wpm: 60,
        rawWpm: 65,
        accuracy: 95,
        keystrokes: 150,
        errors: 8,
        durationMs: 30000,
        completedAt: null,
        challengeDifficulty: 'beginner',
        categoryName: 'Git Basics',
      },
    ];

    const mockOrderByFn = vi.fn().mockResolvedValue(mockSessions);
    const mockWhereFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
    const mockInnerJoinFn2 = vi.fn().mockReturnValue({ where: mockWhereFn });
    const mockInnerJoinFn1 = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn2 });
    const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn1 });
    const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

    mockDb.select.mockImplementation(mockSelectFn);

    const response = await GET();
    const text = await response.text();
    const lines = text.split('\n');

    expect(response.status).toBe(200);
    // Date field should be empty for null completedAt
    expect(lines[1]).toBe('1,,Git Basics,beginner,60,65,95,150,8,30000,0m 30s');
  });
});
