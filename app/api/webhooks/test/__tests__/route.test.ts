import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
}));

vi.mock('@/lib/webhooks/deliver', () => ({
  dispatchWebhookEvent: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  apiRateLimit: vi.fn(() => null),
}));

import { getUser } from '@/lib/db/queries';
import { dispatchWebhookEvent } from '@/lib/webhooks/deliver';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockDispatchWebhookEvent = dispatchWebhookEvent as ReturnType<typeof vi.fn>;

function createMockPostRequest(body: unknown): NextRequest {
  return {
    json: async () => body,
  } as unknown as NextRequest;
}

describe('POST /api/webhooks/test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetUser.mockResolvedValue(null);

      const request = createMockPostRequest({
        event: 'session.completed',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    });

    it('should return 400 for invalid event type', async () => {
      const request = createMockPostRequest({
        event: 'invalid.event',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 400 for missing event', async () => {
      const request = createMockPostRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });
  });

  describe('successful test webhook dispatch', () => {
    const mockUser = { id: 1, email: 'test@test.com' };

    beforeEach(() => {
      mockGetUser.mockResolvedValue(mockUser);
      mockDispatchWebhookEvent.mockResolvedValue(undefined);
    });

    it('should dispatch session.completed test webhook', async () => {
      const request = createMockPostRequest({
        event: 'session.completed',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('session.completed');
      expect(data.payload).toHaveProperty('sessionId');
      expect(data.payload).toHaveProperty('wpm');
      expect(mockDispatchWebhookEvent).toHaveBeenCalledWith(
        mockUser.id,
        'session.completed',
        expect.any(Object)
      );
    });

    it('should dispatch achievement.earned test webhook', async () => {
      const request = createMockPostRequest({
        event: 'achievement.earned',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.payload).toHaveProperty('achievementId');
      expect(data.payload).toHaveProperty('slug');
      expect(mockDispatchWebhookEvent).toHaveBeenCalledWith(
        mockUser.id,
        'achievement.earned',
        expect.any(Object)
      );
    });

    it('should dispatch user.signed_up test webhook', async () => {
      const request = createMockPostRequest({
        event: 'user.signed_up',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.payload).toHaveProperty('userId');
      expect(data.payload).toHaveProperty('email');
      expect(mockDispatchWebhookEvent).toHaveBeenCalledWith(
        mockUser.id,
        'user.signed_up',
        expect.any(Object)
      );
    });

    it('should dispatch user.subscription_updated test webhook', async () => {
      const request = createMockPostRequest({
        event: 'user.subscription_updated',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.payload).toHaveProperty('subscriptionId');
      expect(data.payload).toHaveProperty('status');
      expect(mockDispatchWebhookEvent).toHaveBeenCalledWith(
        mockUser.id,
        'user.subscription_updated',
        expect.any(Object)
      );
    });

    it('should dispatch user.milestone_reached test webhook', async () => {
      const request = createMockPostRequest({
        event: 'user.milestone_reached',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.payload).toHaveProperty('milestoneType');
      expect(data.payload).toHaveProperty('milestoneValue');
      expect(mockDispatchWebhookEvent).toHaveBeenCalledWith(
        mockUser.id,
        'user.milestone_reached',
        expect.any(Object)
      );
    });

    it('should use custom testData if provided', async () => {
      const customData = {
        sessionId: 12345,
        wpm: 120,
      };
      const request = createMockPostRequest({
        event: 'session.completed',
        testData: customData,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.payload).toEqual(customData);
      expect(mockDispatchWebhookEvent).toHaveBeenCalledWith(
        mockUser.id,
        'session.completed',
        customData
      );
    });
  });

  describe('error handling', () => {
    it('should return 500 on dispatchWebhookEvent error', async () => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
      mockDispatchWebhookEvent.mockRejectedValue(new Error('Webhook error'));

      const request = createMockPostRequest({
        event: 'session.completed',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
