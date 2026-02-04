import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock the database
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
  },
}));

// Mock the auth module
vi.mock('@/lib/auth/api-key', () => ({
  authenticateApiKey: vi.fn(),
}));

import { authenticateApiKey } from '@/lib/auth/api-key';
import { db } from '@/lib/db/drizzle';

const mockAuth = authenticateApiKey as ReturnType<typeof vi.fn>;
const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
};

const mockUser = { id: 1, email: 'test@test.com', name: 'Test', apiKeyId: 1, scopes: ['read'] };

function createRequest(url: string): NextRequest {
  return new NextRequest(new Request(url, {
    headers: { authorization: 'Bearer sk_testkey' },
  }));
}

describe('GET /api/v1/categories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return 401 if API key is invalid', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createRequest('http://localhost:3000/api/v1/categories');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid or missing API key');
    });
  });

  describe('successful retrieval', () => {
    const mockCategories = [
      {
        id: 1,
        name: 'Git Basics',
        slug: 'git-basics',
        description: 'Learn git commands',
        icon: 'git',
        difficulty: 'beginner',
        isPremium: false,
        displayOrder: 0,
      },
      {
        id: 2,
        name: 'Docker Commands',
        slug: 'docker-commands',
        description: 'Docker workflow',
        icon: 'docker',
        difficulty: 'intermediate',
        isPremium: true,
        displayOrder: 1,
      },
    ];

    it('should return all categories ordered by displayOrder', async () => {
      mockAuth.mockResolvedValue(mockUser);

      const mockOrderByFn = vi.fn().mockResolvedValue(mockCategories);
      const mockFromFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      const request = createRequest('http://localhost:3000/api/v1/categories');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories).toHaveLength(2);
      expect(data.categories[0].slug).toBe('git-basics');
      expect(data.categories[1].slug).toBe('docker-commands');
    });

    it('should return empty array when no categories exist', async () => {
      mockAuth.mockResolvedValue(mockUser);

      const mockOrderByFn = vi.fn().mockResolvedValue([]);
      const mockFromFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      const request = createRequest('http://localhost:3000/api/v1/categories');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should return 500 on database error', async () => {
      mockAuth.mockResolvedValue(mockUser);

      const mockFromFn = vi.fn().mockReturnValue({
        orderBy: vi.fn().mockRejectedValue(new Error('Database error')),
      });
      mockDb.select.mockReturnValue({ from: mockFromFn });

      const request = createRequest('http://localhost:3000/api/v1/categories');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
