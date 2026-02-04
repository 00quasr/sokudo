import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
  },
}));

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
}));

vi.mock('@/lib/auth/api-key', () => ({
  generateApiKey: vi.fn().mockReturnValue({
    key: 'sk_abc123def456',
    hash: 'hashed_value',
    prefix: 'sk_abc123de',
  }),
}));

import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  returning: ReturnType<typeof vi.fn>;
};

const mockGetUser = getUser as ReturnType<typeof vi.fn>;

describe('GET /api/keys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return keys for authenticated user', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const mockKeys = [
      {
        id: 1,
        name: 'Test Key',
        keyPrefix: 'sk_abc123de',
        scopes: ['read'],
        lastUsedAt: null,
        expiresAt: null,
        revokedAt: null,
        createdAt: new Date('2026-01-01'),
      },
    ];

    const mockOrderBy = vi.fn().mockResolvedValue(mockKeys);
    const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
    mockDb.select.mockImplementation(mockSelect);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.keys).toHaveLength(1);
    expect(data.keys[0].name).toBe('Test Key');
  });

  it('should return 500 on database error', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const mockFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockRejectedValue(new Error('DB error')),
      }),
    });
    mockDb.select.mockReturnValue({ from: mockFrom });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});

describe('POST /api/keys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/keys', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', scopes: ['read'] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid body', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = new NextRequest('http://localhost:3000/api/keys', {
      method: 'POST',
      body: JSON.stringify({ name: '', scopes: [] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should create a key and return it with the raw key value', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const createdKey = {
      id: 1,
      name: 'My Key',
      keyPrefix: 'sk_abc123de',
      scopes: ['read'],
      expiresAt: null,
      createdAt: new Date('2026-01-01'),
    };

    const mockReturning = vi.fn().mockResolvedValue([createdKey]);
    const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
    const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
    mockDb.insert.mockImplementation(mockInsert);

    const request = new NextRequest('http://localhost:3000/api/keys', {
      method: 'POST',
      body: JSON.stringify({ name: 'My Key', scopes: ['read'] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.key).toBe('sk_abc123def456');
    expect(data.name).toBe('My Key');
  });

  it('should create a key with expiration', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const createdKey = {
      id: 1,
      name: 'Expiring Key',
      keyPrefix: 'sk_abc123de',
      scopes: ['read', 'write'],
      expiresAt: new Date('2026-04-01'),
      createdAt: new Date('2026-01-01'),
    };

    const mockReturning = vi.fn().mockResolvedValue([createdKey]);
    const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
    const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
    mockDb.insert.mockImplementation(mockInsert);

    const request = new NextRequest('http://localhost:3000/api/keys', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Expiring Key',
        scopes: ['read', 'write'],
        expiresInDays: 90,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.key).toBe('sk_abc123def456');
    expect(data.scopes).toEqual(['read', 'write']);
  });

  it('should return 400 for invalid scopes', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = new NextRequest('http://localhost:3000/api/keys', {
      method: 'POST',
      body: JSON.stringify({ name: 'Bad Key', scopes: ['admin'] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should return 500 on database error during creation', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const mockReturning = vi.fn().mockRejectedValue(new Error('Insert failed'));
    const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
    const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
    mockDb.insert.mockImplementation(mockInsert);

    const request = new NextRequest('http://localhost:3000/api/keys', {
      method: 'POST',
      body: JSON.stringify({ name: 'Fail Key', scopes: ['read'] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
