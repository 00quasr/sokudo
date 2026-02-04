import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock the database
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

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
}));

// Mock rate limiting to always allow
vi.mock('@/lib/rate-limit', () => ({
  apiRateLimit: vi.fn().mockReturnValue(null),
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

function createMockRequest(body?: unknown): NextRequest {
  if (body) {
    return {
      json: vi.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
  }
  return {} as unknown as NextRequest;
}

describe('GET /api/webhooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return list of webhooks for authenticated user', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

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

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.webhooks).toHaveLength(1);
    expect(data.webhooks[0].url).toBe('https://example.com/hook');
  });
});

describe('POST /api/webhooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const request = createMockRequest({
      url: 'https://example.com/hook',
      events: ['session.completed'],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid URL', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = createMockRequest({
      url: 'not-a-url',
      events: ['session.completed'],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should return 400 for empty events array', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = createMockRequest({
      url: 'https://example.com/hook',
      events: [],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should return 400 for invalid event type', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = createMockRequest({
      url: 'https://example.com/hook',
      events: ['invalid.event'],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should create a webhook and return the secret', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const mockCreated = {
      id: 1,
      url: 'https://example.com/hook',
      events: ['session.completed'],
      active: true,
      description: null,
      createdAt: new Date(),
    };

    const returningFn = vi.fn().mockResolvedValue([mockCreated]);
    const valuesFn = vi.fn().mockReturnValue({ returning: returningFn });
    mockDb.insert.mockReturnValue({ values: valuesFn });

    const request = createMockRequest({
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

  it('should create a webhook with description', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const mockCreated = {
      id: 1,
      url: 'https://example.com/hook',
      events: ['session.completed', 'achievement.earned'],
      active: true,
      description: 'My webhook',
      createdAt: new Date(),
    };

    const returningFn = vi.fn().mockResolvedValue([mockCreated]);
    const valuesFn = vi.fn().mockReturnValue({ returning: returningFn });
    mockDb.insert.mockReturnValue({ values: valuesFn });

    const request = createMockRequest({
      url: 'https://example.com/hook',
      events: ['session.completed', 'achievement.earned'],
      description: 'My webhook',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.description).toBe('My webhook');
  });
});
