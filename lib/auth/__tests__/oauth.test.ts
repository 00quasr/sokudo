import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateClientCredentials,
  hashSecret,
  generateAuthorizationCode,
  generateAccessToken,
  authenticateOAuthToken,
  createAuthorizationCode,
  exchangeAuthorizationCode,
  validateRedirectUri,
  validateScopes,
  VALID_OAUTH_SCOPES,
} from '../oauth';

// Mock the database
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}));

import { db } from '@/lib/db/drizzle';

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  innerJoin: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  returning: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
};

describe('OAuth Provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateClientCredentials', () => {
    it('should generate a client ID starting with sokudo_', () => {
      const result = generateClientCredentials();
      expect(result.clientId).toMatch(/^sokudo_/);
    });

    it('should generate a client secret starting with secret_', () => {
      const result = generateClientCredentials();
      expect(result.clientSecret).toMatch(/^secret_/);
    });

    it('should generate a SHA-256 hash for the secret', () => {
      const result = generateClientCredentials();
      expect(result.clientSecretHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique credentials each time', () => {
      const cred1 = generateClientCredentials();
      const cred2 = generateClientCredentials();
      expect(cred1.clientId).not.toBe(cred2.clientId);
      expect(cred1.clientSecret).not.toBe(cred2.clientSecret);
    });

    it('should produce a hash that matches the secret', () => {
      const result = generateClientCredentials();
      const verifyHash = hashSecret(result.clientSecret);
      expect(verifyHash).toBe(result.clientSecretHash);
    });
  });

  describe('hashSecret', () => {
    it('should produce consistent hashes for the same input', () => {
      const hash1 = hashSecret('test_secret_123');
      const hash2 = hashSecret('test_secret_123');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = hashSecret('secret_aaa');
      const hash2 = hashSecret('secret_bbb');
      expect(hash1).not.toBe(hash2);
    });

    it('should return a 64-character hex string', () => {
      const hash = hashSecret('any_input');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('generateAuthorizationCode', () => {
    it('should generate a 96-character hex string', () => {
      const code = generateAuthorizationCode();
      expect(code).toMatch(/^[a-f0-9]{96}$/);
    });

    it('should generate unique codes', () => {
      const code1 = generateAuthorizationCode();
      const code2 = generateAuthorizationCode();
      expect(code1).not.toBe(code2);
    });
  });

  describe('generateAccessToken', () => {
    it('should generate a token starting with sok_at_', () => {
      const token = generateAccessToken();
      expect(token).toMatch(/^sok_at_/);
    });

    it('should generate unique tokens', () => {
      const token1 = generateAccessToken();
      const token2 = generateAccessToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('validateScopes', () => {
    it('should accept valid scopes', () => {
      expect(validateScopes(['read'])).toBe(true);
      expect(validateScopes(['write'])).toBe(true);
      expect(validateScopes(['read', 'write'])).toBe(true);
    });

    it('should reject invalid scopes', () => {
      expect(validateScopes(['admin'])).toBe(false);
      expect(validateScopes(['read', 'delete'])).toBe(false);
      expect(validateScopes(['*'])).toBe(false);
    });

    it('should accept empty scopes array', () => {
      expect(validateScopes([])).toBe(true);
    });
  });

  describe('VALID_OAUTH_SCOPES', () => {
    it('should contain read and write', () => {
      expect(VALID_OAUTH_SCOPES).toContain('read');
      expect(VALID_OAUTH_SCOPES).toContain('write');
    });

    it('should not contain wildcard', () => {
      expect(VALID_OAUTH_SCOPES).not.toContain('*');
    });
  });

  describe('authenticateOAuthToken', () => {
    it('should return null if no authorization header', async () => {
      const request = new Request('http://localhost:3000/api/v1/test', {
        headers: {},
      });
      const result = await authenticateOAuthToken(request);
      expect(result).toBeNull();
    });

    it('should return null if bearer token does not start with sok_at_', async () => {
      const request = new Request('http://localhost:3000/api/v1/test', {
        headers: { authorization: 'Bearer sk_invalid_token' },
      });
      const result = await authenticateOAuthToken(request);
      expect(result).toBeNull();
    });

    it('should return null if token not found in database', async () => {
      const mockLimitFn = vi.fn().mockResolvedValue([]);
      const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      const request = new Request('http://localhost:3000/api/v1/test', {
        headers: { authorization: 'Bearer sok_at_0000000000000000000000000000000000000000000000000000000000000000' },
      });
      const result = await authenticateOAuthToken(request);
      expect(result).toBeNull();
    });

    it('should return null if token is expired', async () => {
      const pastDate = new Date(Date.now() - 86400000);
      const mockLimitFn = vi.fn().mockResolvedValue([
        {
          tokenId: 1,
          clientId: 1,
          userId: 42,
          scopes: ['read'],
          expiresAt: pastDate,
          revokedAt: null,
          email: 'test@test.com',
          name: 'Test',
        },
      ]);
      const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      const request = new Request('http://localhost:3000/api/v1/test', {
        headers: { authorization: 'Bearer sok_at_0000000000000000000000000000000000000000000000000000000000000000' },
      });
      const result = await authenticateOAuthToken(request);
      expect(result).toBeNull();
    });

    it('should return user data for a valid OAuth token', async () => {
      const futureDate = new Date(Date.now() + 86400000);
      const mockLimitFn = vi.fn().mockResolvedValue([
        {
          tokenId: 1,
          clientId: 5,
          userId: 42,
          scopes: ['read', 'write'],
          expiresAt: futureDate,
          revokedAt: null,
          email: 'test@test.com',
          name: 'Test User',
        },
      ]);
      const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockInnerJoinFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockFromFn = vi.fn().mockReturnValue({ innerJoin: mockInnerJoinFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      const request = new Request('http://localhost:3000/api/v1/test', {
        headers: { authorization: 'Bearer sok_at_0000000000000000000000000000000000000000000000000000000000000000' },
      });
      const result = await authenticateOAuthToken(request);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(42);
      expect(result!.email).toBe('test@test.com');
      expect(result!.name).toBe('Test User');
      expect(result!.oauthClientId).toBe(5);
      expect(result!.scopes).toEqual(['read', 'write']);
    });
  });

  describe('createAuthorizationCode', () => {
    it('should insert an authorization code into the database', async () => {
      const mockValuesFn = vi.fn().mockResolvedValue(undefined);
      const mockInsertFn = vi.fn().mockReturnValue({ values: mockValuesFn });
      mockDb.insert.mockImplementation(mockInsertFn);

      const code = await createAuthorizationCode({
        clientDbId: 1,
        userId: 42,
        redirectUri: 'https://example.com/callback',
        scopes: ['read'],
      });

      expect(code).toMatch(/^[a-f0-9]{96}$/);
      expect(mockInsertFn).toHaveBeenCalled();
      expect(mockValuesFn).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: 1,
          userId: 42,
          redirectUri: 'https://example.com/callback',
          scopes: ['read'],
        })
      );
    });

    it('should include PKCE parameters when provided', async () => {
      const mockValuesFn = vi.fn().mockResolvedValue(undefined);
      const mockInsertFn = vi.fn().mockReturnValue({ values: mockValuesFn });
      mockDb.insert.mockImplementation(mockInsertFn);

      await createAuthorizationCode({
        clientDbId: 1,
        userId: 42,
        redirectUri: 'https://example.com/callback',
        scopes: ['read'],
        codeChallenge: 'challenge123',
        codeChallengeMethod: 'S256',
      });

      expect(mockValuesFn).toHaveBeenCalledWith(
        expect.objectContaining({
          codeChallenge: 'challenge123',
          codeChallengeMethod: 'S256',
        })
      );
    });
  });

  describe('validateRedirectUri', () => {
    it('should return invalid for unknown client', async () => {
      const mockLimitFn = vi.fn().mockResolvedValue([]);
      const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockFromFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      const result = await validateRedirectUri('unknown_client', 'https://example.com/callback');
      expect(result.valid).toBe(false);
    });

    it('should return invalid for unregistered redirect URI', async () => {
      const mockLimitFn = vi.fn().mockResolvedValue([
        {
          id: 1,
          clientId: 'sokudo_abc123',
          redirectUris: ['https://example.com/callback'],
          active: true,
        },
      ]);
      const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockFromFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      const result = await validateRedirectUri('sokudo_abc123', 'https://evil.com/callback');
      expect(result.valid).toBe(false);
    });

    it('should return valid for matching client and redirect URI', async () => {
      const mockLimitFn = vi.fn().mockResolvedValue([
        {
          id: 1,
          clientId: 'sokudo_abc123',
          clientSecretHash: 'hash',
          name: 'Test App',
          userId: 1,
          redirectUris: ['https://example.com/callback'],
          scopes: ['read'],
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockFromFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      const result = await validateRedirectUri('sokudo_abc123', 'https://example.com/callback');
      expect(result.valid).toBe(true);
      expect(result.clientDbId).toBe(1);
    });
  });

  describe('exchangeAuthorizationCode', () => {
    it('should return null for unknown authorization code', async () => {
      const mockLimitFn = vi.fn().mockResolvedValue([]);
      const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockFromFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      const result = await exchangeAuthorizationCode({
        code: 'nonexistent_code',
        clientId: 'sokudo_abc',
        clientSecret: 'secret_xyz',
        redirectUri: 'https://example.com/callback',
      });
      expect(result).toBeNull();
    });

    it('should return null for already-used authorization code', async () => {
      const mockLimitFn = vi.fn().mockResolvedValue([
        {
          id: 1,
          code: 'used_code',
          clientId: 1,
          userId: 42,
          redirectUri: 'https://example.com/callback',
          scopes: ['read'],
          codeChallenge: null,
          codeChallengeMethod: null,
          expiresAt: new Date(Date.now() + 600000),
          usedAt: new Date(), // Already used
          createdAt: new Date(),
        },
      ]);
      const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockFromFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      const result = await exchangeAuthorizationCode({
        code: 'used_code',
        clientId: 'sokudo_abc',
        clientSecret: 'secret_xyz',
        redirectUri: 'https://example.com/callback',
      });
      expect(result).toBeNull();
    });

    it('should return null for expired authorization code', async () => {
      const mockLimitFn = vi.fn().mockResolvedValue([
        {
          id: 1,
          code: 'expired_code',
          clientId: 1,
          userId: 42,
          redirectUri: 'https://example.com/callback',
          scopes: ['read'],
          codeChallenge: null,
          codeChallengeMethod: null,
          expiresAt: new Date(Date.now() - 600000), // Expired
          usedAt: null,
          createdAt: new Date(),
        },
      ]);
      const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
      const mockFromFn = vi.fn().mockReturnValue({ where: mockWhereFn });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
      mockDb.select.mockImplementation(mockSelectFn);

      const result = await exchangeAuthorizationCode({
        code: 'expired_code',
        clientId: 'sokudo_abc',
        clientSecret: 'secret_xyz',
        redirectUri: 'https://example.com/callback',
      });
      expect(result).toBeNull();
    });

    it('should return null for mismatched redirect URI', async () => {
      // First select: find auth code
      const authCodeResult = [
        {
          id: 1,
          code: 'valid_code',
          clientId: 1,
          userId: 42,
          redirectUri: 'https://example.com/callback',
          scopes: ['read'],
          codeChallenge: null,
          codeChallengeMethod: null,
          expiresAt: new Date(Date.now() + 600000),
          usedAt: null,
          createdAt: new Date(),
        },
      ];

      // Second select: find client
      const clientResult = [
        {
          id: 1,
          clientId: 'sokudo_abc',
          clientSecretHash: hashSecret('secret_xyz'),
          name: 'Test App',
          userId: 1,
          redirectUris: ['https://example.com/callback'],
          scopes: ['read'],
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      let callCount = 0;
      mockDb.select.mockImplementation(() => ({
        from: () => ({
          where: () => ({
            limit: vi.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) return Promise.resolve(authCodeResult);
              return Promise.resolve(clientResult);
            }),
          }),
        }),
      }));

      const result = await exchangeAuthorizationCode({
        code: 'valid_code',
        clientId: 'sokudo_abc',
        clientSecret: 'secret_xyz',
        redirectUri: 'https://different.com/callback', // Wrong URI
      });
      expect(result).toBeNull();
    });

    it('should return token data for valid exchange', async () => {
      const secret = 'secret_xyz';
      const secretHash = hashSecret(secret);

      // First select: find auth code
      const authCodeResult = [
        {
          id: 1,
          code: 'valid_code',
          clientId: 1,
          userId: 42,
          redirectUri: 'https://example.com/callback',
          scopes: ['read', 'write'],
          codeChallenge: null,
          codeChallengeMethod: null,
          expiresAt: new Date(Date.now() + 600000),
          usedAt: null,
          createdAt: new Date(),
        },
      ];

      // Second select: find client
      const clientResult = [
        {
          id: 1,
          clientId: 'sokudo_abc',
          clientSecretHash: secretHash,
          name: 'Test App',
          userId: 1,
          redirectUris: ['https://example.com/callback'],
          scopes: ['read', 'write'],
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      let selectCallCount = 0;
      mockDb.select.mockImplementation(() => ({
        from: () => ({
          where: () => ({
            limit: vi.fn().mockImplementation(() => {
              selectCallCount++;
              if (selectCallCount === 1) return Promise.resolve(authCodeResult);
              return Promise.resolve(clientResult);
            }),
          }),
        }),
      }));

      // Mock update for marking code as used
      mockDb.update.mockReturnValue({
        set: () => ({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      // Mock insert for creating access token
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const result = await exchangeAuthorizationCode({
        code: 'valid_code',
        clientId: 'sokudo_abc',
        clientSecret: secret,
        redirectUri: 'https://example.com/callback',
      });

      expect(result).not.toBeNull();
      expect(result!.accessToken).toMatch(/^sok_at_/);
      expect(result!.tokenType).toBe('Bearer');
      expect(result!.expiresIn).toBe(3600);
      expect(result!.scope).toBe('read write');
    });

    it('should return null for wrong client secret', async () => {
      const correctSecretHash = hashSecret('secret_correct');

      const authCodeResult = [
        {
          id: 1,
          code: 'valid_code',
          clientId: 1,
          userId: 42,
          redirectUri: 'https://example.com/callback',
          scopes: ['read'],
          codeChallenge: null,
          codeChallengeMethod: null,
          expiresAt: new Date(Date.now() + 600000),
          usedAt: null,
          createdAt: new Date(),
        },
      ];

      const clientResult = [
        {
          id: 1,
          clientId: 'sokudo_abc',
          clientSecretHash: correctSecretHash,
          name: 'Test App',
          userId: 1,
          redirectUris: ['https://example.com/callback'],
          scopes: ['read'],
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      let selectCallCount = 0;
      mockDb.select.mockImplementation(() => ({
        from: () => ({
          where: () => ({
            limit: vi.fn().mockImplementation(() => {
              selectCallCount++;
              if (selectCallCount === 1) return Promise.resolve(authCodeResult);
              return Promise.resolve(clientResult);
            }),
          }),
        }),
      }));

      const result = await exchangeAuthorizationCode({
        code: 'valid_code',
        clientId: 'sokudo_abc',
        clientSecret: 'secret_wrong', // Wrong secret
        redirectUri: 'https://example.com/callback',
      });
      expect(result).toBeNull();
    });
  });
});
