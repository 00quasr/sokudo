import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db/queries', () => ({
  searchChallenges: vi.fn(),
  getCategories: vi.fn(),
}));

import { searchChallenges, getCategories } from '@/lib/db/queries';

const mockSearchChallenges = searchChallenges as ReturnType<typeof vi.fn>;
const mockGetCategories = getCategories as ReturnType<typeof vi.fn>;

const mockChallengesResult = {
  challenges: [
    {
      id: 1,
      content: 'git commit -m "test"',
      difficulty: 'beginner',
      syntaxType: 'bash',
      hint: 'Stage your changes first',
      avgWpm: 45,
      timesCompleted: 10,
      createdAt: '2025-01-01T00:00:00.000Z',
      categoryId: 1,
      categoryName: 'Git Basics',
      categorySlug: 'git-basics',
      categoryIcon: 'git-branch',
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

const mockCategories = [
  { id: 1, slug: 'git-basics', name: 'Git Basics', icon: 'git-branch', difficulty: 'beginner', isPremium: false, displayOrder: 0, description: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 2, slug: 'docker', name: 'Docker', icon: 'container', difficulty: 'advanced', isPremium: true, displayOrder: 5, description: null, createdAt: new Date(), updatedAt: new Date() },
];

describe('GET /api/challenges/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchChallenges.mockResolvedValue(mockChallengesResult);
    mockGetCategories.mockResolvedValue(mockCategories);
  });

  it('should return challenges with default parameters', async () => {
    const request = new NextRequest('http://localhost:3000/api/challenges/search');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.challenges).toHaveLength(1);
    expect(json.pagination).toBeDefined();
    expect(json.categories).toHaveLength(2);
    expect(mockSearchChallenges).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      search: undefined,
      category: undefined,
      difficulty: undefined,
      sortBy: 'timesCompleted',
      sortOrder: 'desc',
    });
  });

  it('should pass search parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/challenges/search?search=git');
    await GET(request);

    expect(mockSearchChallenges).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'git' })
    );
  });

  it('should pass category filter', async () => {
    const request = new NextRequest('http://localhost:3000/api/challenges/search?category=git-basics');
    await GET(request);

    expect(mockSearchChallenges).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'git-basics' })
    );
  });

  it('should pass difficulty filter', async () => {
    const request = new NextRequest('http://localhost:3000/api/challenges/search?difficulty=beginner');
    await GET(request);

    expect(mockSearchChallenges).toHaveBeenCalledWith(
      expect.objectContaining({ difficulty: 'beginner' })
    );
  });

  it('should pass sort parameters', async () => {
    const request = new NextRequest('http://localhost:3000/api/challenges/search?sortBy=avgWpm&sortOrder=asc');
    await GET(request);

    expect(mockSearchChallenges).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'avgWpm', sortOrder: 'asc' })
    );
  });

  it('should return 400 for invalid difficulty', async () => {
    const request = new NextRequest('http://localhost:3000/api/challenges/search?difficulty=invalid');
    const response = await GET(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Invalid query parameters');
  });

  it('should return 400 for invalid sortBy', async () => {
    const request = new NextRequest('http://localhost:3000/api/challenges/search?sortBy=invalid');
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('should return categories in response', async () => {
    const request = new NextRequest('http://localhost:3000/api/challenges/search');
    const response = await GET(request);
    const json = await response.json();

    expect(json.categories).toEqual([
      { slug: 'git-basics', name: 'Git Basics', icon: 'git-branch' },
      { slug: 'docker', name: 'Docker', icon: 'container' },
    ]);
  });

  it('should handle combined filters', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/challenges/search?search=commit&category=git-basics&difficulty=beginner&sortBy=avgWpm'
    );
    await GET(request);

    expect(mockSearchChallenges).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      search: 'commit',
      category: 'git-basics',
      difficulty: 'beginner',
      sortBy: 'avgWpm',
      sortOrder: 'desc',
    });
  });

  it('should handle pagination parameters', async () => {
    const request = new NextRequest('http://localhost:3000/api/challenges/search?page=2&limit=10');
    await GET(request);

    expect(mockSearchChallenges).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 10 })
    );
  });

  it('should return 400 for limit exceeding max', async () => {
    const request = new NextRequest('http://localhost:3000/api/challenges/search?limit=100');
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('should return 500 on internal error', async () => {
    mockSearchChallenges.mockRejectedValue(new Error('DB error'));
    const request = new NextRequest('http://localhost:3000/api/challenges/search');
    const response = await GET(request);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Internal server error');
  });
});
