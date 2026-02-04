import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signPayload, dispatchWebhookEvent } from '../deliver';

// Mock the database
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}));

import { db } from '@/lib/db/drizzle';

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
};

describe('signPayload', () => {
  it('should produce a consistent HMAC-SHA256 signature', () => {
    const payload = '{"event":"session.completed","data":{}}';
    const secret = 'whsec_test_secret';

    const sig1 = signPayload(payload, secret);
    const sig2 = signPayload(payload, secret);

    expect(sig1).toBe(sig2);
    expect(sig1).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should produce different signatures for different secrets', () => {
    const payload = '{"event":"session.completed"}';
    const sig1 = signPayload(payload, 'secret1');
    const sig2 = signPayload(payload, 'secret2');

    expect(sig1).not.toBe(sig2);
  });

  it('should produce different signatures for different payloads', () => {
    const secret = 'whsec_test';
    const sig1 = signPayload('payload1', secret);
    const sig2 = signPayload('payload2', secret);

    expect(sig1).not.toBe(sig2);
  });
});

describe('dispatchWebhookEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should do nothing when no webhooks are registered', async () => {
    // Mock db chain: select -> from -> where returns empty array
    const whereFn = vi.fn().mockResolvedValue([]);
    const fromFn = vi.fn().mockReturnValue({ where: whereFn });
    const selectFn = vi.fn().mockReturnValue({ from: fromFn });
    mockDb.select.mockImplementation(selectFn);

    await dispatchWebhookEvent(1, 'session.completed', { sessionId: 42 });

    // Should not try to insert delivery records
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it('should skip webhooks not subscribed to the event', async () => {
    const whereFn = vi.fn().mockResolvedValue([
      {
        id: 1,
        url: 'https://example.com/hook',
        secret: 'whsec_test',
        events: ['achievement.earned'], // Not subscribed to session.completed
      },
    ]);
    const fromFn = vi.fn().mockReturnValue({ where: whereFn });
    const selectFn = vi.fn().mockReturnValue({ from: fromFn });
    mockDb.select.mockImplementation(selectFn);

    await dispatchWebhookEvent(1, 'session.completed', { sessionId: 42 });

    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it('should deliver to matching webhooks', async () => {
    // Mock a successful fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('OK'),
    });

    const whereFn = vi.fn().mockResolvedValue([
      {
        id: 1,
        url: 'https://example.com/hook',
        secret: 'whsec_test',
        events: ['session.completed'],
      },
    ]);
    const fromFn = vi.fn().mockReturnValue({ where: whereFn });
    const selectFn = vi.fn().mockReturnValue({ from: fromFn });
    mockDb.select.mockImplementation(selectFn);

    // Mock insert chain for delivery record
    const insertValuesFn = vi.fn().mockResolvedValue(undefined);
    mockDb.insert.mockReturnValue({ values: insertValuesFn });

    // Mock update chain for lastDeliveredAt
    const updateWhereFn = vi.fn().mockResolvedValue(undefined);
    const updateSetFn = vi.fn().mockReturnValue({ where: updateWhereFn });
    mockDb.update.mockReturnValue({ set: updateSetFn });

    await dispatchWebhookEvent(1, 'session.completed', { sessionId: 42 });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(fetchCall[0]).toBe('https://example.com/hook');
    expect(fetchCall[1].method).toBe('POST');
    expect(fetchCall[1].headers['X-Webhook-Event']).toBe('session.completed');
    expect(fetchCall[1].headers['X-Webhook-Signature']).toMatch(/^sha256=[0-9a-f]{64}$/);

    // Should record the delivery
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it('should send correct payload structure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('OK'),
    });

    const whereFn = vi.fn().mockResolvedValue([
      {
        id: 1,
        url: 'https://example.com/hook',
        secret: 'whsec_test',
        events: ['session.completed'],
      },
    ]);
    const fromFn = vi.fn().mockReturnValue({ where: whereFn });
    const selectFn = vi.fn().mockReturnValue({ from: fromFn });
    mockDb.select.mockImplementation(selectFn);

    const insertValuesFn = vi.fn().mockResolvedValue(undefined);
    mockDb.insert.mockReturnValue({ values: insertValuesFn });

    const updateWhereFn = vi.fn().mockResolvedValue(undefined);
    const updateSetFn = vi.fn().mockReturnValue({ where: updateWhereFn });
    mockDb.update.mockReturnValue({ set: updateSetFn });

    await dispatchWebhookEvent(1, 'session.completed', { sessionId: 42, wpm: 60 });

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.event).toBe('session.completed');
    expect(body.data.sessionId).toBe(42);
    expect(body.data.wpm).toBe(60);
    expect(body.timestamp).toBeDefined();
  });
});
