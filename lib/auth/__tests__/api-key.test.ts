import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateApiKey, hashApiKey, hasScope, authenticateApiKey } from '../api-key';
import type { ApiKeyUser } from '../api-key';

// Mock the database
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    then: vi.fn(),
  },
}));

import { db } from '@/lib/db/drizzle';

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  innerJoin: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
};

describe('API Key utilities', () => {
  describe('generateApiKey', () => {
    it('should generate a key starting with sk_', () => {
      const result = generateApiKey();
      expect(result.key).toMatch(/^sk_/);
    });

    it('should generate a 12-character prefix', () => {
      const result = generateApiKey();
      expect(result.prefix).toHaveLength(12);
    });

    it('should generate a SHA-256 hash', () => {
      const result = generateApiKey();
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique keys', () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();
      expect(key1.key).not.toBe(key2.key);
      expect(key1.hash).not.toBe(key2.hash);
    });
  });

  describe('hashApiKey', () => {
    it('should produce consistent hashes for the same input', () => {
      const hash1 = hashApiKey('sk_test123');
      const hash2 = hashApiKey('sk_test123');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = hashApiKey('sk_test123');
      const hash2 = hashApiKey('sk_test456');
      expect(hash1).not.toBe(hash2);
    });

    it('should return a 64-character hex string', () => {
      const hash = hashApiKey('sk_anykey');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('hasScope', () => {
    const baseUser: ApiKeyUser = {
      id: 1,
      email: 'test@test.com',
      name: 'Test',
      apiKeyId: 1,
      scopes: ['read'],
    };

    it('should return true when user has the exact scope', () => {
      expect(hasScope(baseUser, 'read')).toBe(true);
    });

    it('should return false when user lacks the scope', () => {
      expect(hasScope(baseUser, 'write')).toBe(false);
    });

    it('should return true when user has wildcard scope', () => {
      const adminUser: ApiKeyUser = { ...baseUser, scopes: ['*'] };
      expect(hasScope(adminUser, 'write')).toBe(true);
      expect(hasScope(adminUser, 'read')).toBe(true);
    });

    it('should handle multiple scopes', () => {
      const multiUser: ApiKeyUser = { ...baseUser, scopes: ['read', 'write'] };
      expect(hasScope(multiUser, 'read')).toBe(true);
      expect(hasScope(multiUser, 'write')).toBe(true);
      expect(hasScope(multiUser, 'admin')).toBe(false);
    });

    it('should return false for empty scopes', () => {
      const noScopeUser: ApiKeyUser = { ...baseUser, scopes: [] };
      expect(hasScope(noScopeUser, 'read')).toBe(false);
    });
  });

  describe('authenticateApiKey', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return null if no authorization header', async () => {
      const request = new Request('http://localhost:3000/api/v1/test', {
        headers: {},
      });
      const result = await authenticateApiKey(request);
      expect(result).toBeNull();
    });

    it('should return null if authorization header does not start with Bearer', async () => {
      const request = new Request('http://localhost:3000/api/v1/test', {
        headers: { authorization: 'Basic abc123' },
      });
      const result = await authenticateApiKey(request);
      expect(result).toBeNull();
    });

    it('should return null if key does not start with sk_', async () => {
      const request = new Request('http://localhost:3000/api/v1/test', {
        headers: { authorization: 'Bearer invalid_key' },
      });
      const result = await authenticateApiKey(request);
      expect(result).toBeNull();
    });

    it('should return null if key is not found in database', async () => {
      const mockLimitFn = vi.fn().mockResolvedValue([]);
      const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      const request = new Request('http://localhost:3000/api/v1/test', {
        headers: { authorization: 'Bearer sk_0000000000000000000000000000000000000000000000000000000000000000ab' },
      });
      const result = await authenticateApiKey(request);
      expect(result).toBeNull();
    });

    it('should return null if key is expired', async () => {
      const pastDate = new Date(Date.now() - 86400000); // 1 day ago
      const mockLimitFn = vi.fn().mockResolvedValue([
        {
          apiKeyId: 1,
          userId: 1,
          scopes: ['read'],
          expiresAt: pastDate,
          email: 'test@test.com',
          name: 'Test',
        },
      ]);
      const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      // Mock the update chain for lastUsedAt
      const mockUpdateThen = vi.fn().mockReturnValue({ catch: vi.fn() });
      const mockUpdateWhere = vi.fn().mockReturnValue({ then: mockUpdateThen });
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      mockDb.update.mockReturnValue({ set: mockUpdateSet });

      const request = new Request('http://localhost:3000/api/v1/test', {
        headers: { authorization: 'Bearer sk_0000000000000000000000000000000000000000000000000000000000000000ab' },
      });
      const result = await authenticateApiKey(request);
      expect(result).toBeNull();
    });

    it('should return user data for a valid API key', async () => {
      const futureDate = new Date(Date.now() + 86400000); // 1 day from now
      const mockLimitFn = vi.fn().mockResolvedValue([
        {
          apiKeyId: 1,
          userId: 42,
          scopes: ['read', 'write'],
          expiresAt: futureDate,
          email: 'test@test.com',
          name: 'Test User',
        },
      ]);
      const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      // Mock the update chain for lastUsedAt
      const mockUpdateThen = vi.fn().mockReturnValue({ catch: vi.fn() });
      const mockUpdateWhere = vi.fn().mockReturnValue({ then: mockUpdateThen });
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      mockDb.update.mockReturnValue({ set: mockUpdateSet });

      const request = new Request('http://localhost:3000/api/v1/test', {
        headers: { authorization: 'Bearer sk_0000000000000000000000000000000000000000000000000000000000000000ab' },
      });
      const result = await authenticateApiKey(request);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(42);
      expect(result!.email).toBe('test@test.com');
      expect(result!.name).toBe('Test User');
      expect(result!.scopes).toEqual(['read', 'write']);
    });

    it('should return user data when expiresAt is null (no expiration)', async () => {
      const mockLimitFn = vi.fn().mockResolvedValue([
        {
          apiKeyId: 1,
          userId: 42,
          scopes: ['read'],
          expiresAt: null,
          email: 'test@test.com',
          name: 'Test User',
        },
      ]);
      const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      // Mock the update chain for lastUsedAt
      const mockUpdateThen = vi.fn().mockReturnValue({ catch: vi.fn() });
      const mockUpdateWhere = vi.fn().mockReturnValue({ then: mockUpdateThen });
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      mockDb.update.mockReturnValue({ set: mockUpdateSet });

      const request = new Request('http://localhost:3000/api/v1/test', {
        headers: { authorization: 'Bearer sk_0000000000000000000000000000000000000000000000000000000000000000ab' },
      });
      const result = await authenticateApiKey(request);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(42);
    });
  });
});
