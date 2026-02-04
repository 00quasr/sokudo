import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
    WebPushError: class WebPushError extends Error {
      statusCode: number;
      constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
      }
    },
  },
}));

const mockDbResults: { select: unknown[] } = {
  select: [],
};

const mockInsertValues = vi.fn(() => Promise.resolve());
const mockInsertFn = vi.fn(() => ({ values: mockInsertValues }));
const mockDeleteWhere = vi.fn(() => Promise.resolve());
const mockDeleteFn = vi.fn(() => ({ where: mockDeleteWhere }));

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve(mockDbResults.select)),
        })),
      })),
    })),
    insert: (...args: unknown[]) => mockInsertFn(...args),
    delete: (...args: unknown[]) => mockDeleteFn(...args),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  pushSubscriptions: {
    id: 'id',
    userId: 'user_id',
    endpoint: 'endpoint',
    p256dh: 'p256dh',
    auth: 'auth',
    createdAt: 'created_at',
  },
}));

describe('push notification functions', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockDbResults.select = [];
  });

  describe('saveSubscription', () => {
    it('should insert a new subscription when none exists', async () => {
      mockDbResults.select = [];

      const { saveSubscription } = await import('../push');

      await saveSubscription(1, {
        endpoint: 'https://fcm.googleapis.com/test',
        keys: { p256dh: 'key1', auth: 'key2' },
      });

      expect(mockInsertFn).toHaveBeenCalled();
      expect(mockInsertValues).toHaveBeenCalledWith({
        userId: 1,
        endpoint: 'https://fcm.googleapis.com/test',
        p256dh: 'key1',
        auth: 'key2',
      });
    });

    it('should not insert a duplicate subscription', async () => {
      mockDbResults.select = [{ id: 1 }];

      const { saveSubscription } = await import('../push');

      await saveSubscription(1, {
        endpoint: 'https://fcm.googleapis.com/test',
        keys: { p256dh: 'key1', auth: 'key2' },
      });

      expect(mockInsertFn).not.toHaveBeenCalled();
    });
  });

  describe('removeSubscription', () => {
    it('should delete the subscription', async () => {
      const { removeSubscription } = await import('../push');

      await removeSubscription(1, 'https://fcm.googleapis.com/test');

      expect(mockDeleteFn).toHaveBeenCalled();
    });
  });

  describe('hasSubscription', () => {
    it('should return true when subscription exists', async () => {
      mockDbResults.select = [{ id: 1 }];

      const { hasSubscription } = await import('../push');

      const result = await hasSubscription(1);
      expect(result).toBe(true);
    });

    it('should return false when no subscription exists', async () => {
      mockDbResults.select = [];

      const { hasSubscription } = await import('../push');

      const result = await hasSubscription(1);
      expect(result).toBe(false);
    });
  });

  describe('sendPushNotification', () => {
    it('should return zeros when VAPID keys are not configured', async () => {
      delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      delete process.env.VAPID_PRIVATE_KEY;

      const { sendPushNotification } = await import('../push');

      const result = await sendPushNotification(1, {
        title: 'Test',
        body: 'Test body',
      });

      expect(result).toEqual({ sent: 0, failed: 0 });
    });
  });
});
