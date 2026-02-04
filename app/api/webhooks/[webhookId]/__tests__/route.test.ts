import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from '../route';

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
    returning: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
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
  limit: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  returning: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
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

function createParams(webhookId: string): Promise<{ webhookId: string }> {
  return Promise.resolve({ webhookId });
}

describe('GET /api/webhooks/[webhookId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const request = createMockRequest();
    const response = await GET(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid webhook ID', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = createMockRequest();
    const response = await GET(request, { params: createParams('abc') });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid webhook ID');
  });

  it('should return 404 when webhook not found', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const limitFn = vi.fn().mockResolvedValue([]);
    const whereFn = vi.fn().mockReturnValue({ limit: limitFn });
    const fromFn = vi.fn().mockReturnValue({ where: whereFn });
    const selectFn = vi.fn().mockReturnValue({ from: fromFn });
    mockDb.select.mockImplementation(selectFn);

    const request = createMockRequest();
    const response = await GET(request, { params: createParams('999') });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Webhook not found');
  });

  it('should return webhook with recent deliveries', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const mockWebhook = {
      id: 1,
      url: 'https://example.com/hook',
      events: ['session.completed'],
      active: true,
      description: 'test',
      lastDeliveredAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockDeliveries = [
      {
        id: 1,
        event: 'session.completed',
        statusCode: 200,
        success: true,
        attemptNumber: 1,
        deliveredAt: new Date(),
      },
    ];

    // First select: webhook lookup
    const webhookLimitFn = vi.fn().mockResolvedValue([mockWebhook]);
    const webhookWhereFn = vi.fn().mockReturnValue({ limit: webhookLimitFn });
    const webhookFromFn = vi.fn().mockReturnValue({ where: webhookWhereFn });

    // Second select: deliveries
    const deliveriesLimitFn = vi.fn().mockResolvedValue(mockDeliveries);
    const deliveriesOrderByFn = vi.fn().mockReturnValue({ limit: deliveriesLimitFn });
    const deliveriesWhereFn = vi.fn().mockReturnValue({ orderBy: deliveriesOrderByFn });
    const deliveriesFromFn = vi.fn().mockReturnValue({ where: deliveriesWhereFn });

    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { from: webhookFromFn };
      }
      return { from: deliveriesFromFn };
    });

    const request = createMockRequest();
    const response = await GET(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.url).toBe('https://example.com/hook');
    expect(data.recentDeliveries).toHaveLength(1);
  });
});

describe('PATCH /api/webhooks/[webhookId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const request = createMockRequest({ active: false });
    const response = await PATCH(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid request body', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = createMockRequest({ events: ['invalid.event'] });
    const response = await PATCH(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should return 404 when webhook not found', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const limitFn = vi.fn().mockResolvedValue([]);
    const whereFn = vi.fn().mockReturnValue({ limit: limitFn });
    const fromFn = vi.fn().mockReturnValue({ where: whereFn });
    const selectFn = vi.fn().mockReturnValue({ from: fromFn });
    mockDb.select.mockImplementation(selectFn);

    const request = createMockRequest({ active: false });
    const response = await PATCH(request, { params: createParams('999') });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Webhook not found');
  });

  it('should update webhook successfully', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    // Mock select for ownership check
    const limitFn = vi.fn().mockResolvedValue([{ id: 1 }]);
    const whereFn = vi.fn().mockReturnValue({ limit: limitFn });
    const fromFn = vi.fn().mockReturnValue({ where: whereFn });
    const selectFn = vi.fn().mockReturnValue({ from: fromFn });
    mockDb.select.mockImplementation(selectFn);

    // Mock update chain
    const updatedWebhook = {
      id: 1,
      url: 'https://example.com/hook',
      events: ['session.completed'],
      active: false,
      description: 'updated',
      lastDeliveredAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const returningFn = vi.fn().mockResolvedValue([updatedWebhook]);
    const updateWhereFn = vi.fn().mockReturnValue({ returning: returningFn });
    const setFn = vi.fn().mockReturnValue({ where: updateWhereFn });
    mockDb.update.mockReturnValue({ set: setFn });

    const request = createMockRequest({ active: false, description: 'updated' });
    const response = await PATCH(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.active).toBe(false);
  });
});

describe('DELETE /api/webhooks/[webhookId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const request = createMockRequest();
    const response = await DELETE(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 404 when webhook not found', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const limitFn = vi.fn().mockResolvedValue([]);
    const whereFn = vi.fn().mockReturnValue({ limit: limitFn });
    const fromFn = vi.fn().mockReturnValue({ where: whereFn });
    const selectFn = vi.fn().mockReturnValue({ from: fromFn });
    mockDb.select.mockImplementation(selectFn);

    const request = createMockRequest();
    const response = await DELETE(request, { params: createParams('999') });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Webhook not found');
  });

  it('should delete webhook successfully', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    // Mock select for ownership check
    const limitFn = vi.fn().mockResolvedValue([{ id: 1 }]);
    const whereFn = vi.fn().mockReturnValue({ limit: limitFn });
    const fromFn = vi.fn().mockReturnValue({ where: whereFn });
    const selectFn = vi.fn().mockReturnValue({ from: fromFn });
    mockDb.select.mockImplementation(selectFn);

    // Mock delete chain
    const deleteWhereFn = vi.fn().mockResolvedValue(undefined);
    mockDb.delete.mockReturnValue({ where: deleteWhereFn });

    const request = createMockRequest();
    const response = await DELETE(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Webhook deleted');
  });
});
