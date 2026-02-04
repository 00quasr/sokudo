import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  getRecentSessionsForAdaptive: vi.fn(),
}));

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([]),
        })),
      })),
    })),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  challenges: { categoryId: 'category_id', difficulty: 'difficulty', id: 'id' },
  categories: { id: 'id', name: 'name', slug: 'slug' },
}));

import { getUser, getRecentSessionsForAdaptive } from '@/lib/db/queries';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockGetRecentSessions = getRecentSessionsForAdaptive as ReturnType<typeof vi.fn>;

function createRequest(url: string) {
  return { url } as unknown as Request;
}

describe('GET /api/practice/adaptive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const request = createRequest('http://localhost:3000/api/practice/adaptive');
    const response = await GET(request as never);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return adaptive recommendation for user with no sessions', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetRecentSessions.mockResolvedValue([]);

    const request = createRequest('http://localhost:3000/api/practice/adaptive');
    const response = await GET(request as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.adaptive).toBeDefined();
    expect(data.adaptive.recommendedDifficulty).toBe('beginner');
    expect(data.adaptive.confidence).toBe(0);
    expect(data.challenges).toBeDefined();
  });

  it('should return adaptive recommendation for user with sessions', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetRecentSessions.mockResolvedValue([
      { wpm: 50, accuracy: 92, errors: 4, keystrokes: 50, durationMs: 30000, challengeDifficulty: 'intermediate' },
      { wpm: 48, accuracy: 90, errors: 5, keystrokes: 50, durationMs: 32000, challengeDifficulty: 'intermediate' },
      { wpm: 45, accuracy: 91, errors: 4, keystrokes: 50, durationMs: 31000, challengeDifficulty: 'intermediate' },
    ]);

    const request = createRequest('http://localhost:3000/api/practice/adaptive');
    const response = await GET(request as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.adaptive).toBeDefined();
    expect(data.adaptive.recommendedDifficulty).toBeDefined();
    expect(data.adaptive.difficultyScore).toBeGreaterThan(0);
    expect(data.adaptive.trend).toBeDefined();
    expect(data.adaptive.confidence).toBeGreaterThan(0);
    expect(data.adaptive.reasons).toBeInstanceOf(Array);
  });

  it('should return 400 for invalid query parameters', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = createRequest('http://localhost:3000/api/practice/adaptive?limit=0');
    const response = await GET(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid query parameters');
  });

  it('should accept valid categoryId parameter', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetRecentSessions.mockResolvedValue([]);

    const request = createRequest('http://localhost:3000/api/practice/adaptive?categoryId=1');
    const response = await GET(request as never);

    expect(response.status).toBe(200);
  });
});
