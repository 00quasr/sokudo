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
    returning: vi.fn(),
  },
}));

vi.mock('@/lib/auth/api-key', () => ({
  authenticateApiKey: vi.fn(),
  hasScope: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  apiRateLimit: vi.fn().mockReturnValue(null),
}));

import { authenticateApiKey, hasScope } from '@/lib/auth/api-key';
import { db } from '@/lib/db/drizzle';

const mockAuth = authenticateApiKey as ReturnType<typeof vi.fn>;
const mockHasScope = hasScope as ReturnType<typeof vi.fn>;
const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  returning: ReturnType<typeof vi.fn>;
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

describe('GET /api/v1/webhooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if API key is invalid', async () => {
    mockAuth.mockResolvedValue(null);

    const request = createGetRequest('http://localhost:3000/api/v1/webhooks');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid or missing API key');
  });

  it('should return webhooks for authenticated user', async () => {
    mockAuth.mockResolvedValue(mockUser);

    const mockWebhooks = [
      {
        id: 1,
        url: 'https://example.com/hook',
        events: ['session.completed'],
        active: true,
        description: 'My hook',
        lastDeliveredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const orderByFn = vi.fn().mockResolvedValue(mockWebhooks);
    const whereFn = vi.fn().mockReturnValue({ orderBy: orderByFn });
    const fromFn = vi.fn().mockReturnValue({ where: whereFn });
    const selectFn = vi.fn().mockReturnValue({ from: fromFn });
    mockDb.select.mockImplementation(selectFn);

    const request = createGetRequest('http://localhost:3000/api/v1/webhooks');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.webhooks).toHaveLength(1);
    expect(data.webhooks[0].url).toBe('https://example.com/hook');
  });

  it('should return empty array when no webhooks exist', async () => {
    mockAuth.mockResolvedValue(mockUser);

    const orderByFn = vi.fn().mockResolvedValue([]);
    const whereFn = vi.fn().mockReturnValue({ orderBy: orderByFn });
    const fromFn = vi.fn().mockReturnValue({ where: whereFn });
    const selectFn = vi.fn().mockReturnValue({ from: fromFn });
    mockDb.select.mockImplementation(selectFn);

    const request = createGetRequest('http://localhost:3000/api/v1/webhooks');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.webhooks).toHaveLength(0);
  });
});

describe('POST /api/v1/webhooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if API key is invalid', async () => {
    mockAuth.mockResolvedValue(null);

    const request = createPostRequest('http://localhost:3000/api/v1/webhooks', {
      url: 'https://example.com/hook',
      events: ['session.completed'],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid or missing API key');
  });

  it('should return 403 if user lacks write scope', async () => {
    mockAuth.mockResolvedValue(mockUser);
    mockHasScope.mockReturnValue(false);

    const request = createPostRequest('http://localhost:3000/api/v1/webhooks', {
      url: 'https://example.com/hook',
      events: ['session.completed'],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Insufficient permissions');
  });

  it('should return 400 for invalid URL', async () => {
    mockAuth.mockResolvedValue(mockUser);
    mockHasScope.mockReturnValue(true);

    const request = createPostRequest('http://localhost:3000/api/v1/webhooks', {
      url: 'not-a-url',
      events: ['session.completed'],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should return 400 for empty events array', async () => {
    mockAuth.mockResolvedValue(mockUser);
    mockHasScope.mockReturnValue(true);

    const request = createPostRequest('http://localhost:3000/api/v1/webhooks', {
      url: 'https://example.com/hook',
      events: [],
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should return 400 for invalid event type', async () => {
    mockAuth.mockResolvedValue(mockUser);
    mockHasScope.mockReturnValue(true);

    const request = createPostRequest('http://localhost:3000/api/v1/webhooks', {
      url: 'https://example.com/hook',
      events: ['invalid.event'],
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should create webhook and return 201 with secret', async () => {
    mockAuth.mockResolvedValue(mockUser);
    mockHasScope.mockReturnValue(true);

    const createdWebhook = {
      id: 1,
      url: 'https://example.com/hook',
      events: ['session.completed'],
      active: true,
      description: null,
      createdAt: new Date(),
    };

    const returningFn = vi.fn().mockResolvedValue([createdWebhook]);
    const valuesFn = vi.fn().mockReturnValue({ returning: returningFn });
    mockDb.insert.mockReturnValue({ values: valuesFn });

    const request = createPostRequest('http://localhost:3000/api/v1/webhooks', {
      url: 'https://example.com/hook',
      events: ['session.completed'],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe(1);
    expect(data.url).toBe('https://example.com/hook');
    expect(data.secret).toBeDefined();
    expect(data.secret).toMatch(/^whsec_/);
  });

  it('should create webhook with both event types and description', async () => {
    mockAuth.mockResolvedValue(mockUser);
    mockHasScope.mockReturnValue(true);

    const createdWebhook = {
      id: 2,
      url: 'https://example.com/hook2',
      events: ['session.completed', 'achievement.earned'],
      active: true,
      description: 'Track all events',
      createdAt: new Date(),
    };

    const returningFn = vi.fn().mockResolvedValue([createdWebhook]);
    const valuesFn = vi.fn().mockReturnValue({ returning: returningFn });
    mockDb.insert.mockReturnValue({ values: valuesFn });

    const request = createPostRequest('http://localhost:3000/api/v1/webhooks', {
      url: 'https://example.com/hook2',
      events: ['session.completed', 'achievement.earned'],
      description: 'Track all events',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.events).toEqual(['session.completed', 'achievement.earned']);
    expect(data.description).toBe('Track all events');
  });
});
