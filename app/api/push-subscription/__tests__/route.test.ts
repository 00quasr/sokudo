import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
}));

vi.mock('@/lib/notifications/push', () => ({
  saveSubscription: vi.fn(),
  removeSubscription: vi.fn(),
  hasSubscription: vi.fn(),
}));

const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  username: null,
  passwordHash: 'hash',
  role: 'member',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('GET /api/push-subscription', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should return 401 when user is not authenticated', async () => {
    const { getUser } = await import('@/lib/db/queries');
    vi.mocked(getUser).mockResolvedValue(null);

    const { GET } = await import('../route');
    const response = await GET();

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('should return subscription status for authenticated user', async () => {
    const { getUser } = await import('@/lib/db/queries');
    const { hasSubscription } = await import('@/lib/notifications/push');

    vi.mocked(getUser).mockResolvedValue(mockUser);
    vi.mocked(hasSubscription).mockResolvedValue(true);

    const { GET } = await import('../route');
    const response = await GET();

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.subscribed).toBe(true);
  });

  it('should return false when user has no subscription', async () => {
    const { getUser } = await import('@/lib/db/queries');
    const { hasSubscription } = await import('@/lib/notifications/push');

    vi.mocked(getUser).mockResolvedValue(mockUser);
    vi.mocked(hasSubscription).mockResolvedValue(false);

    const { GET } = await import('../route');
    const response = await GET();

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.subscribed).toBe(false);
  });
});

describe('POST /api/push-subscription', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should return 401 when user is not authenticated', async () => {
    const { getUser } = await import('@/lib/db/queries');
    vi.mocked(getUser).mockResolvedValue(null);

    const { POST } = await import('../route');
    const request = new NextRequest('http://localhost/api/push-subscription', {
      method: 'POST',
      body: JSON.stringify({
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: { p256dh: 'key1', auth: 'key2' },
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should return 400 for invalid subscription data', async () => {
    const { getUser } = await import('@/lib/db/queries');
    vi.mocked(getUser).mockResolvedValue(mockUser);

    const { POST } = await import('../route');
    const request = new NextRequest('http://localhost/api/push-subscription', {
      method: 'POST',
      body: JSON.stringify({ endpoint: 'not-a-url' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Invalid subscription');
  });

  it('should save a valid subscription', async () => {
    const { getUser } = await import('@/lib/db/queries');
    const { saveSubscription } = await import('@/lib/notifications/push');

    vi.mocked(getUser).mockResolvedValue(mockUser);
    vi.mocked(saveSubscription).mockResolvedValue(undefined);

    const { POST } = await import('../route');
    const request = new NextRequest('http://localhost/api/push-subscription', {
      method: 'POST',
      body: JSON.stringify({
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: { p256dh: 'key1', auth: 'key2' },
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(saveSubscription).toHaveBeenCalledWith(1, {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test',
      keys: { p256dh: 'key1', auth: 'key2' },
    });
  });
});

describe('DELETE /api/push-subscription', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should return 401 when user is not authenticated', async () => {
    const { getUser } = await import('@/lib/db/queries');
    vi.mocked(getUser).mockResolvedValue(null);

    const { DELETE } = await import('../route');
    const request = new NextRequest('http://localhost/api/push-subscription', {
      method: 'DELETE',
      body: JSON.stringify({
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
      }),
    });

    const response = await DELETE(request);
    expect(response.status).toBe(401);
  });

  it('should return 400 for invalid request', async () => {
    const { getUser } = await import('@/lib/db/queries');
    vi.mocked(getUser).mockResolvedValue(mockUser);

    const { DELETE } = await import('../route');
    const request = new NextRequest('http://localhost/api/push-subscription', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint: 'not-a-url' }),
    });

    const response = await DELETE(request);
    expect(response.status).toBe(400);
  });

  it('should remove a valid subscription', async () => {
    const { getUser } = await import('@/lib/db/queries');
    const { removeSubscription } = await import('@/lib/notifications/push');

    vi.mocked(getUser).mockResolvedValue(mockUser);
    vi.mocked(removeSubscription).mockResolvedValue(undefined);

    const { DELETE } = await import('../route');
    const request = new NextRequest('http://localhost/api/push-subscription', {
      method: 'DELETE',
      body: JSON.stringify({
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
      }),
    });

    const response = await DELETE(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(removeSubscription).toHaveBeenCalledWith(
      1,
      'https://fcm.googleapis.com/fcm/send/test'
    );
  });
});
