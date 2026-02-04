import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock getPublicChallenges
const mockGetPublicChallenges = vi.fn();

vi.mock('@/lib/db/queries', () => ({
  getPublicChallenges: (...args: unknown[]) => mockGetPublicChallenges(...args),
}));

import { GET } from '../route';
import { NextRequest } from 'next/server';

function createRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/community-challenges');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

describe('GET /api/community-challenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return paginated community challenges with defaults', async () => {
    const mockData = {
      challenges: [
        {
          id: 1,
          name: 'Git Commands',
          content: 'git add . && git commit -m "test"',
          timesCompleted: 5,
          createdAt: new Date().toISOString(),
          authorName: 'Test User',
          authorEmail: 'test@test.com',
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };

    mockGetPublicChallenges.mockResolvedValue(mockData);

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.challenges).toHaveLength(1);
    expect(body.pagination.total).toBe(1);
    expect(mockGetPublicChallenges).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      minPracticed: undefined,
    });
  });

  it('should pass search parameter to query', async () => {
    mockGetPublicChallenges.mockResolvedValue({
      challenges: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false },
    });

    await GET(createRequest({ search: 'git' }));

    expect(mockGetPublicChallenges).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'git' })
    );
  });

  it('should pass sort parameters to query', async () => {
    mockGetPublicChallenges.mockResolvedValue({
      challenges: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false },
    });

    await GET(createRequest({ sortBy: 'timesCompleted', sortOrder: 'desc' }));

    expect(mockGetPublicChallenges).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'timesCompleted', sortOrder: 'desc' })
    );
  });

  it('should pass pagination parameters to query', async () => {
    mockGetPublicChallenges.mockResolvedValue({
      challenges: [],
      pagination: { page: 2, limit: 10, total: 15, totalPages: 2, hasNextPage: false, hasPrevPage: true },
    });

    await GET(createRequest({ page: '2', limit: '10' }));

    expect(mockGetPublicChallenges).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 10 })
    );
  });

  it('should return 400 for invalid sort parameter', async () => {
    const response = await GET(createRequest({ sortBy: 'invalidField' }));
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe('Invalid query parameters');
  });

  it('should return 400 for invalid page number', async () => {
    const response = await GET(createRequest({ page: '-1' }));
    expect(response.status).toBe(400);
  });

  it('should return 400 for limit exceeding maximum', async () => {
    const response = await GET(createRequest({ limit: '100' }));
    expect(response.status).toBe(400);
  });

  it('should pass minPracticed parameter to query', async () => {
    mockGetPublicChallenges.mockResolvedValue({
      challenges: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false },
    });

    await GET(createRequest({ minPracticed: '5' }));

    expect(mockGetPublicChallenges).toHaveBeenCalledWith(
      expect.objectContaining({ minPracticed: 5 })
    );
  });

  it('should return 500 on internal error', async () => {
    mockGetPublicChallenges.mockRejectedValue(new Error('DB error'));

    const response = await GET(createRequest());
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.error).toBe('Internal server error');
  });
});
