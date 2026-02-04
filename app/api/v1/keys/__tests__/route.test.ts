import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '../route';

// Mock the database
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}));

// Mock the auth module
vi.mock('@/lib/auth/api-key', () => ({
  authenticateApiKey: vi.fn(),
  hasScope: vi.fn(),
  generateApiKey: vi.fn(),
}));

import { authenticateApiKey, hasScope, generateApiKey } from '@/lib/auth/api-key';
import { db } from '@/lib/db/drizzle';

const mockAuth = authenticateApiKey as ReturnType<typeof vi.fn>;
const mockHasScope = hasScope as ReturnType<typeof vi.fn>;
const mockGenerateApiKey = generateApiKey as ReturnType<typeof vi.fn>;
const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  returning: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
};

const mockUser = { id: 1, email: 'test@test.com', name: 'Test', apiKeyId: 1, scopes: ['read', 'write'] };

function createGetRequest(url: string): NextRequest {
  return new NextRequest(new Request(url, {
    headers: { authorization: 'Bearer sk_testkey' },
  }));
}

function createPostRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(new Request(url, {
    method: 'POST',
    headers: {
      authorization: 'Bearer sk_testkey',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  }));
}

function createDeleteRequest(url: string): NextRequest {
  return new NextRequest(new Request(url, {
    method: 'DELETE',
    headers: { authorization: 'Bearer sk_testkey' },
  }));
}

describe('GET /api/v1/keys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if API key is invalid', async () => {
    mockAuth.mockResolvedValue(null);

    const request = createGetRequest('http://localhost:3000/api/v1/keys');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid or missing API key');
  });

  it('should return list of API keys', async () => {
    mockAuth.mockResolvedValue(mockUser);

    const mockKeys = [
      {
        id: 1,
        name: 'My Key',
        keyPrefix: 'sk_abc12345',
        scopes: ['read'],
        lastUsedAt: null,
        expiresAt: null,
        revokedAt: null,
        createdAt: new Date(),
      },
    ];

    const mockOrderByFn = vi.fn().mockResolvedValue(mockKeys);
    const mockWhereFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
    const mockFromFn = vi.fn().mockReturnValue({ where: mockWhereFn });
    const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
    mockDb.select.mockImplementation(mockSelectFn);

    const request = createGetRequest('http://localhost:3000/api/v1/keys');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.keys).toHaveLength(1);
    expect(data.keys[0].name).toBe('My Key');
  });

  it('should return 500 on database error', async () => {
    mockAuth.mockResolvedValue(mockUser);

    const mockFromFn = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockRejectedValue(new Error('Database error')),
      }),
    });
    mockDb.select.mockReturnValue({ from: mockFromFn });

    const request = createGetRequest('http://localhost:3000/api/v1/keys');
    const response = await GET(request);

    expect(response.status).toBe(500);
  });
});

describe('POST /api/v1/keys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if API key is invalid', async () => {
    mockAuth.mockResolvedValue(null);

    const request = createPostRequest('http://localhost:3000/api/v1/keys', { name: 'Test' });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('should return 403 if user lacks write scope', async () => {
    mockAuth.mockResolvedValue(mockUser);
    mockHasScope.mockReturnValue(false);

    const request = createPostRequest('http://localhost:3000/api/v1/keys', { name: 'Test' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Insufficient permissions');
  });

  it('should return 400 for invalid request body', async () => {
    mockAuth.mockResolvedValue(mockUser);
    mockHasScope.mockReturnValue(true);

    const request = createPostRequest('http://localhost:3000/api/v1/keys', {});
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should create API key and return 201', async () => {
    mockAuth.mockResolvedValue(mockUser);
    mockHasScope.mockReturnValue(true);
    mockGenerateApiKey.mockReturnValue({
      key: 'sk_abc123',
      hash: 'hashvalue',
      prefix: 'sk_abc12345',
    });

    const createdKey = {
      id: 2,
      name: 'New Key',
      keyPrefix: 'sk_abc12345',
      scopes: ['read'],
      expiresAt: null,
      createdAt: new Date(),
    };

    const mockReturning = vi.fn().mockResolvedValue([createdKey]);
    const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
    const mockInsertFn = vi.fn().mockReturnValue({ values: mockValues });
    mockDb.insert.mockImplementation(mockInsertFn);

    const request = createPostRequest('http://localhost:3000/api/v1/keys', {
      name: 'New Key',
      scopes: ['read'],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.name).toBe('New Key');
    expect(data.key).toBe('sk_abc123');
  });

  it('should return 400 for invalid scopes', async () => {
    mockAuth.mockResolvedValue(mockUser);
    mockHasScope.mockReturnValue(true);

    const request = createPostRequest('http://localhost:3000/api/v1/keys', {
      name: 'Test',
      scopes: ['invalid'],
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});

describe('DELETE /api/v1/keys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if API key is invalid', async () => {
    mockAuth.mockResolvedValue(null);

    const request = createDeleteRequest('http://localhost:3000/api/v1/keys?keyId=1');
    const response = await DELETE(request);

    expect(response.status).toBe(401);
  });

  it('should return 403 if user lacks write scope', async () => {
    mockAuth.mockResolvedValue(mockUser);
    mockHasScope.mockReturnValue(false);

    const request = createDeleteRequest('http://localhost:3000/api/v1/keys?keyId=1');
    const response = await DELETE(request);

    expect(response.status).toBe(403);
  });

  it('should return 400 for missing keyId', async () => {
    mockAuth.mockResolvedValue(mockUser);
    mockHasScope.mockReturnValue(true);

    const request = createDeleteRequest('http://localhost:3000/api/v1/keys');
    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required query parameter');
  });

  it('should return 400 for invalid keyId', async () => {
    mockAuth.mockResolvedValue(mockUser);
    mockHasScope.mockReturnValue(true);

    const request = createDeleteRequest('http://localhost:3000/api/v1/keys?keyId=abc');
    const response = await DELETE(request);

    expect(response.status).toBe(400);
  });

  it('should return 404 if key not found', async () => {
    mockAuth.mockResolvedValue(mockUser);
    mockHasScope.mockReturnValue(true);

    const mockLimitFn = vi.fn().mockResolvedValue([]);
    const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
    const mockFromFn = vi.fn().mockReturnValue({ where: mockWhereFn });
    const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
    mockDb.select.mockImplementation(mockSelectFn);

    const request = createDeleteRequest('http://localhost:3000/api/v1/keys?keyId=999');
    const response = await DELETE(request);

    expect(response.status).toBe(404);
  });

  it('should revoke key and return success', async () => {
    mockAuth.mockResolvedValue(mockUser);
    mockHasScope.mockReturnValue(true);

    // Mock key lookup
    const mockLimitFn = vi.fn().mockResolvedValue([{ id: 1 }]);
    const mockWhereFn = vi.fn().mockReturnValue({ limit: mockLimitFn });
    const mockFromFn = vi.fn().mockReturnValue({ where: mockWhereFn });
    const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
    mockDb.select.mockImplementation(mockSelectFn);

    // Mock update
    const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
    const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
    const mockUpdateFn = vi.fn().mockReturnValue({ set: mockUpdateSet });
    mockDb.update.mockImplementation(mockUpdateFn);

    const request = createDeleteRequest('http://localhost:3000/api/v1/keys?keyId=1');
    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('API key revoked successfully');
  });
});
