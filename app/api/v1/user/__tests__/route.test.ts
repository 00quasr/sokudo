import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock the database
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
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
  where: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
};

const mockUser = { id: 1, email: 'test@test.com', name: 'Test', apiKeyId: 1, scopes: ['read'] };

function createRequest(url: string): NextRequest {
  return new NextRequest(new Request(url, {
    headers: { authorization: 'Bearer sk_testkey' },
  }));
}

describe('GET /api/v1/user', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return 401 if API key is invalid', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createRequest('http://localhost:3000/api/v1/user');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid or missing API key');
    });
  });

  describe('successful retrieval', () => {
    const mockUserData = {
      id: 1,
      name: 'Test User',
      username: 'testuser',
      email: 'test@test.com',
      createdAt: new Date('2025-01-01T00:00:00Z'),
    };

    const mockProfile = {
      avatarUrl: null,
      bio: 'Developer',
      subscriptionTier: 'pro',
      currentStreak: 5,
      longestStreak: 10,
      totalPracticeTimeMs: 3600000,
    };

    it('should return user data with profile', async () => {
      mockAuth.mockResolvedValue(mockUser);

      let callCount = 0;
      mockDb.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // User data query
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockUserData]),
              }),
            }),
          };
        } else {
          // Profile query
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockProfile]),
              }),
            }),
          };
        }
      });

      const request = createRequest('http://localhost:3000/api/v1/user');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.id).toBe(1);
      expect(data.user.email).toBe('test@test.com');
      expect(data.user.username).toBe('testuser');
      expect(data.user.profile).toBeDefined();
      expect(data.user.profile.subscriptionTier).toBe('pro');
    });

    it('should return user data with null profile when profile does not exist', async () => {
      mockAuth.mockResolvedValue(mockUser);

      let callCount = 0;
      mockDb.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockUserData]),
              }),
            }),
          };
        } else {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
          };
        }
      });

      const request = createRequest('http://localhost:3000/api/v1/user');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.profile).toBeNull();
    });

    it('should return 404 if user is not found in database', async () => {
      mockAuth.mockResolvedValue(mockUser);

      mockDb.select.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }));

      const request = createRequest('http://localhost:3000/api/v1/user');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });
  });

  describe('error handling', () => {
    it('should return 500 on database error', async () => {
      mockAuth.mockResolvedValue(mockUser);

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      });

      const request = createRequest('http://localhost:3000/api/v1/user');
      const response = await GET(request);
      expect(response.status).toBe(500);
    });
  });
});
