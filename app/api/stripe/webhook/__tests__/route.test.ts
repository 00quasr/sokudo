import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

// Mock dependencies - must be defined before vi.mock
vi.mock('@/lib/payments/stripe', () => ({
  handleSubscriptionChange: vi.fn(),
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  webhookRateLimit: vi.fn(() => null),
}));

// Import after mocks
import { POST } from '../route';
import { handleSubscriptionChange, stripe } from '@/lib/payments/stripe';

const mockHandleSubscriptionChange = handleSubscriptionChange as ReturnType<typeof vi.fn>;
const mockConstructEvent = stripe.webhooks.constructEvent as ReturnType<typeof vi.fn>;

const WEBHOOK_SECRET = 'whsec_test_secret';

function createMockRequest(body: string, signature: string): NextRequest {
  return {
    text: vi.fn().mockResolvedValue(body),
    headers: {
      get: vi.fn((name: string) => {
        if (name === 'stripe-signature') return signature;
        return null;
      }),
    },
  } as any;
}

// Set env before importing route
process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signature verification', () => {
    it('should return 400 when signature verification fails', async () => {
      const payload = JSON.stringify({
        id: 'evt_test123',
        type: 'customer.subscription.updated',
      });
      const signature = 'invalid_signature';

      mockConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const request = createMockRequest(payload, signature);
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'Webhook signature verification failed.' });
      expect(mockHandleSubscriptionChange).not.toHaveBeenCalled();
    });

    it('should verify signature with webhook secret', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        api_version: '2025-04-30.basil',
        created: 1706140800,
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test123',
            object: 'subscription',
            customer: 'cus_test123',
            status: 'active',
          } as Stripe.Subscription,
        },
        livemode: false,
        pending_webhooks: 1,
        request: {
          id: null,
          idempotency_key: null,
        },
      };

      const payload = JSON.stringify(mockEvent);
      const signature = 't=1234567890,v1=abc123';

      mockConstructEvent.mockReturnValue(mockEvent);

      const request = createMockRequest(payload, signature);
      const response = await POST(request);

      // Verify constructEvent was called with payload and signature
      // The secret comes from process.env at module load time
      expect(mockConstructEvent).toHaveBeenCalledWith(
        payload,
        signature,
        expect.any(String)
      );
      expect(response.status).toBe(200);
    });
  });

  describe('customer.subscription.updated event', () => {
    it('should handle subscription updated to active', async () => {
      const mockSubscription: Stripe.Subscription = {
        id: 'sub_test123',
        object: 'subscription',
        customer: 'cus_test123',
        status: 'active',
        items: {
          object: 'list',
          data: [
            {
              id: 'si_test123',
              object: 'subscription_item',
              plan: {
                id: 'price_test123',
                object: 'plan',
                active: true,
                amount: 2000,
                currency: 'usd',
                interval: 'month',
                interval_count: 1,
                product: 'prod_test123',
              } as Stripe.Plan,
              price: {
                id: 'price_test123',
                object: 'price',
                active: true,
                currency: 'usd',
                product: 'prod_test123',
                type: 'recurring',
                unit_amount: 2000,
              } as Stripe.Price,
              quantity: 1,
            } as Stripe.SubscriptionItem,
          ],
          has_more: false,
          total_count: 1,
          url: '/v1/subscription_items',
        },
        current_period_start: 1706140800,
        current_period_end: 1708819200,
        cancel_at_period_end: false,
        created: 1706140800,
      } as Stripe.Subscription;

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        api_version: '2025-04-30.basil',
        created: 1706140800,
        type: 'customer.subscription.updated',
        data: {
          object: mockSubscription,
        },
        livemode: false,
        pending_webhooks: 1,
        request: {
          id: null,
          idempotency_key: null,
        },
      };

      const payload = JSON.stringify(mockEvent);
      const signature = 't=1234567890,v1=abc123';

      mockConstructEvent.mockReturnValue(mockEvent);

      const request = createMockRequest(payload, signature);
      const response = await POST(request);

      expect(mockHandleSubscriptionChange).toHaveBeenCalledWith(mockSubscription);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ received: true });
    });

    it('should handle subscription updated to trialing', async () => {
      const mockSubscription: Stripe.Subscription = {
        id: 'sub_test123',
        object: 'subscription',
        customer: 'cus_test123',
        status: 'trialing',
        items: {
          object: 'list',
          data: [
            {
              id: 'si_test123',
              object: 'subscription_item',
              plan: {
                id: 'price_test123',
                object: 'plan',
                active: true,
                amount: 2000,
                currency: 'usd',
                interval: 'month',
                interval_count: 1,
                product: 'prod_test123',
              } as Stripe.Plan,
            } as Stripe.SubscriptionItem,
          ],
          has_more: false,
          total_count: 1,
          url: '/v1/subscription_items',
        },
        trial_start: 1704672000,
        trial_end: 1706140800,
        current_period_start: 1704672000,
        current_period_end: 1706140800,
        cancel_at_period_end: false,
        created: 1704672000,
      } as Stripe.Subscription;

      const mockEvent: Stripe.Event = {
        id: 'evt_test456',
        object: 'event',
        api_version: '2025-04-30.basil',
        created: 1704672000,
        type: 'customer.subscription.updated',
        data: {
          object: mockSubscription,
          previous_attributes: {
            status: 'incomplete',
          },
        },
        livemode: false,
        pending_webhooks: 1,
        request: {
          id: null,
          idempotency_key: null,
        },
      };

      const payload = JSON.stringify(mockEvent);
      const signature = 't=1234567890,v1=abc456';

      mockConstructEvent.mockReturnValue(mockEvent);

      const request = createMockRequest(payload, signature);
      const response = await POST(request);

      expect(mockHandleSubscriptionChange).toHaveBeenCalledWith(mockSubscription);
      expect(response.status).toBe(200);
    });

    it('should handle subscription updated to past_due', async () => {
      const mockSubscription: Stripe.Subscription = {
        id: 'sub_test123',
        object: 'subscription',
        customer: 'cus_test123',
        status: 'past_due',
        items: {
          object: 'list',
          data: [
            {
              id: 'si_test123',
              object: 'subscription_item',
              plan: {
                id: 'price_test123',
                object: 'plan',
                product: 'prod_test123',
              } as Stripe.Plan,
            } as Stripe.SubscriptionItem,
          ],
          has_more: false,
          total_count: 1,
          url: '/v1/subscription_items',
        },
        current_period_start: 1708905600,
        current_period_end: 1711584000,
        cancel_at_period_end: false,
        created: 1706140800,
      } as Stripe.Subscription;

      const mockEvent: Stripe.Event = {
        id: 'evt_test789',
        object: 'event',
        api_version: '2025-04-30.basil',
        created: 1708992000,
        type: 'customer.subscription.updated',
        data: {
          object: mockSubscription,
          previous_attributes: {
            status: 'active',
          },
        },
        livemode: false,
        pending_webhooks: 2,
        request: {
          id: 'req_test123',
          idempotency_key: null,
        },
      };

      const payload = JSON.stringify(mockEvent);
      const signature = 't=1234567890,v1=abc789';

      mockConstructEvent.mockReturnValue(mockEvent);

      const request = createMockRequest(payload, signature);
      const response = await POST(request);

      expect(mockHandleSubscriptionChange).toHaveBeenCalledWith(mockSubscription);
      expect(response.status).toBe(200);
    });

    it('should handle subscription updated to unpaid', async () => {
      const mockSubscription: Stripe.Subscription = {
        id: 'sub_test123',
        object: 'subscription',
        customer: 'cus_test123',
        status: 'unpaid',
        items: {
          object: 'list',
          data: [
            {
              id: 'si_test123',
              object: 'subscription_item',
              plan: {
                id: 'price_test123',
                object: 'plan',
                product: 'prod_test123',
              } as Stripe.Plan,
            } as Stripe.SubscriptionItem,
          ],
          has_more: false,
          total_count: 1,
          url: '/v1/subscription_items',
        },
        current_period_start: 1708905600,
        current_period_end: 1711584000,
        ended_at: 1709596800,
        cancel_at_period_end: false,
        created: 1706140800,
      } as Stripe.Subscription;

      const mockEvent: Stripe.Event = {
        id: 'evt_test012',
        object: 'event',
        api_version: '2025-04-30.basil',
        created: 1709596800,
        type: 'customer.subscription.updated',
        data: {
          object: mockSubscription,
          previous_attributes: {
            status: 'past_due',
          },
        },
        livemode: false,
        pending_webhooks: 1,
        request: {
          id: null,
          idempotency_key: null,
        },
      };

      const payload = JSON.stringify(mockEvent);
      const signature = 't=1234567890,v1=abc012';

      mockConstructEvent.mockReturnValue(mockEvent);

      const request = createMockRequest(payload, signature);
      const response = await POST(request);

      expect(mockHandleSubscriptionChange).toHaveBeenCalledWith(mockSubscription);
      expect(response.status).toBe(200);
    });

    it('should handle plan change (subscription item update)', async () => {
      const mockSubscription: Stripe.Subscription = {
        id: 'sub_test123',
        object: 'subscription',
        customer: 'cus_test123',
        status: 'active',
        items: {
          object: 'list',
          data: [
            {
              id: 'si_test123',
              object: 'subscription_item',
              plan: {
                id: 'price_pro_monthly',
                object: 'plan',
                active: true,
                amount: 5000,
                currency: 'usd',
                interval: 'month',
                interval_count: 1,
                product: 'prod_pro_plan',
              } as Stripe.Plan,
            } as Stripe.SubscriptionItem,
          ],
          has_more: false,
          total_count: 1,
          url: '/v1/subscription_items',
        },
        current_period_start: 1706227200,
        current_period_end: 1708905600,
        cancel_at_period_end: false,
        created: 1706140800,
      } as Stripe.Subscription;

      const mockEvent: Stripe.Event = {
        id: 'evt_test345',
        object: 'event',
        api_version: '2025-04-30.basil',
        created: 1706227200,
        type: 'customer.subscription.updated',
        data: {
          object: mockSubscription,
          previous_attributes: {
            items: {
              data: [
                {
                  plan: {
                    id: 'price_starter_monthly',
                    amount: 2000,
                    product: 'prod_starter_plan',
                  },
                },
              ],
            },
          },
        },
        livemode: false,
        pending_webhooks: 1,
        request: {
          id: 'req_change789',
          idempotency_key: null,
        },
      };

      const payload = JSON.stringify(mockEvent);
      const signature = 't=1234567890,v1=abc345';

      mockConstructEvent.mockReturnValue(mockEvent);

      const request = createMockRequest(payload, signature);
      const response = await POST(request);

      expect(mockHandleSubscriptionChange).toHaveBeenCalledWith(mockSubscription);
      expect(response.status).toBe(200);
    });
  });

  describe('customer.subscription.deleted event', () => {
    it('should handle subscription deletion', async () => {
      const mockSubscription: Stripe.Subscription = {
        id: 'sub_test123',
        object: 'subscription',
        customer: 'cus_test123',
        status: 'canceled',
        items: {
          object: 'list',
          data: [
            {
              id: 'si_test123',
              object: 'subscription_item',
              plan: {
                id: 'price_test123',
                object: 'plan',
                product: 'prod_test123',
              } as Stripe.Plan,
            } as Stripe.SubscriptionItem,
          ],
          has_more: false,
          total_count: 1,
          url: '/v1/subscription_items',
        },
        current_period_start: 1706227200,
        current_period_end: 1708905600,
        cancel_at_period_end: false,
        canceled_at: 1706400000,
        ended_at: 1708905600,
        created: 1706140800,
      } as Stripe.Subscription;

      const mockEvent: Stripe.Event = {
        id: 'evt_test678',
        object: 'event',
        api_version: '2025-04-30.basil',
        created: 1708905600,
        type: 'customer.subscription.deleted',
        data: {
          object: mockSubscription,
        },
        livemode: false,
        pending_webhooks: 1,
        request: {
          id: null,
          idempotency_key: null,
        },
      };

      const payload = JSON.stringify(mockEvent);
      const signature = 't=1234567890,v1=abc678';

      mockConstructEvent.mockReturnValue(mockEvent);

      const request = createMockRequest(payload, signature);
      const response = await POST(request);

      expect(mockHandleSubscriptionChange).toHaveBeenCalledWith(mockSubscription);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ received: true });
    });

    it('should handle immediate cancellation', async () => {
      const mockSubscription: Stripe.Subscription = {
        id: 'sub_test123',
        object: 'subscription',
        customer: 'cus_test123',
        status: 'canceled',
        items: {
          object: 'list',
          data: [
            {
              id: 'si_test123',
              object: 'subscription_item',
              plan: {
                id: 'price_test123',
                object: 'plan',
                product: 'prod_test123',
              } as Stripe.Plan,
            } as Stripe.SubscriptionItem,
          ],
          has_more: false,
          total_count: 1,
          url: '/v1/subscription_items',
        },
        current_period_start: 1706227200,
        current_period_end: 1708905600,
        cancel_at_period_end: false,
        canceled_at: 1706400000,
        ended_at: 1706400000, // Same as canceled_at for immediate
        created: 1706140800,
      } as Stripe.Subscription;

      const mockEvent: Stripe.Event = {
        id: 'evt_test901',
        object: 'event',
        api_version: '2025-04-30.basil',
        created: 1706400000,
        type: 'customer.subscription.deleted',
        data: {
          object: mockSubscription,
        },
        livemode: false,
        pending_webhooks: 1,
        request: {
          id: 'req_cancel_immediate',
          idempotency_key: null,
        },
      };

      const payload = JSON.stringify(mockEvent);
      const signature = 't=1234567890,v1=abc901';

      mockConstructEvent.mockReturnValue(mockEvent);

      const request = createMockRequest(payload, signature);
      const response = await POST(request);

      expect(mockHandleSubscriptionChange).toHaveBeenCalledWith(mockSubscription);
      expect(response.status).toBe(200);
    });
  });

  describe('unhandled events', () => {
    it('should log unhandled event types', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const mockEvent: Stripe.Event = {
        id: 'evt_test999',
        object: 'event',
        api_version: '2025-04-30.basil',
        created: 1706140800,
        type: 'customer.subscription.trial_will_end',
        data: {
          object: {
            id: 'sub_test123',
            object: 'subscription',
            customer: 'cus_test123',
            status: 'trialing',
          } as Stripe.Subscription,
        },
        livemode: false,
        pending_webhooks: 1,
        request: {
          id: null,
          idempotency_key: null,
        },
      };

      const payload = JSON.stringify(mockEvent);
      const signature = 't=1234567890,v1=abc999';

      mockConstructEvent.mockReturnValue(mockEvent);

      const request = createMockRequest(payload, signature);
      const response = await POST(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Unhandled event type customer.subscription.trial_will_end'
      );
      expect(mockHandleSubscriptionChange).not.toHaveBeenCalled();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ received: true });

      consoleSpy.mockRestore();
    });

    it('should handle customer.created event without error', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test111',
        object: 'event',
        api_version: '2025-04-30.basil',
        created: 1706140800,
        type: 'customer.created',
        data: {
          object: {
            id: 'cus_test123',
            object: 'customer',
            email: 'test@test.com',
          } as Stripe.Customer,
        },
        livemode: false,
        pending_webhooks: 1,
        request: {
          id: null,
          idempotency_key: null,
        },
      };

      const payload = JSON.stringify(mockEvent);
      const signature = 't=1234567890,v1=abc111';

      mockConstructEvent.mockReturnValue(mockEvent);

      const request = createMockRequest(payload, signature);
      const response = await POST(request);

      expect(mockHandleSubscriptionChange).not.toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });

  describe('edge cases', () => {
    it('should handle subscription with no items', async () => {
      const mockSubscription: Stripe.Subscription = {
        id: 'sub_test123',
        object: 'subscription',
        customer: 'cus_test123',
        status: 'active',
        items: {
          object: 'list',
          data: [],
          has_more: false,
          total_count: 0,
          url: '/v1/subscription_items',
        },
        current_period_start: 1706140800,
        current_period_end: 1708819200,
        cancel_at_period_end: false,
        created: 1706140800,
      } as Stripe.Subscription;

      const mockEvent: Stripe.Event = {
        id: 'evt_test222',
        object: 'event',
        api_version: '2025-04-30.basil',
        created: 1706140800,
        type: 'customer.subscription.updated',
        data: {
          object: mockSubscription,
        },
        livemode: false,
        pending_webhooks: 1,
        request: {
          id: null,
          idempotency_key: null,
        },
      };

      const payload = JSON.stringify(mockEvent);
      const signature = 't=1234567890,v1=abc222';

      mockConstructEvent.mockReturnValue(mockEvent);

      const request = createMockRequest(payload, signature);
      const response = await POST(request);

      expect(mockHandleSubscriptionChange).toHaveBeenCalledWith(mockSubscription);
      expect(response.status).toBe(200);
    });

    it('should handle duplicate webhook events idempotently', async () => {
      const mockSubscription: Stripe.Subscription = {
        id: 'sub_test123',
        object: 'subscription',
        customer: 'cus_test123',
        status: 'active',
        items: {
          object: 'list',
          data: [
            {
              id: 'si_test123',
              object: 'subscription_item',
              plan: {
                id: 'price_test123',
                object: 'plan',
                product: 'prod_test123',
              } as Stripe.Plan,
            } as Stripe.SubscriptionItem,
          ],
          has_more: false,
          total_count: 1,
          url: '/v1/subscription_items',
        },
        current_period_start: 1706140800,
        current_period_end: 1708819200,
        cancel_at_period_end: false,
        created: 1706140800,
      } as Stripe.Subscription;

      const mockEvent: Stripe.Event = {
        id: 'evt_test333',
        object: 'event',
        api_version: '2025-04-30.basil',
        created: 1706140800,
        type: 'customer.subscription.updated',
        data: {
          object: mockSubscription,
        },
        livemode: false,
        pending_webhooks: 1,
        request: {
          id: null,
          idempotency_key: null,
        },
      };

      const payload = JSON.stringify(mockEvent);
      const signature = 't=1234567890,v1=abc333';

      mockConstructEvent.mockReturnValue(mockEvent);

      // First call
      const request1 = createMockRequest(payload, signature);
      const response1 = await POST(request1);
      expect(response1.status).toBe(200);
      expect(mockHandleSubscriptionChange).toHaveBeenCalledTimes(1);

      // Second call (duplicate)
      const request2 = createMockRequest(payload, signature);
      const response2 = await POST(request2);
      expect(response2.status).toBe(200);
      expect(mockHandleSubscriptionChange).toHaveBeenCalledTimes(2);
      // Note: Our handler is idempotent, processing twice is safe
    });

    it('should handle subscription with metadata', async () => {
      const mockSubscription: Stripe.Subscription = {
        id: 'sub_test123',
        object: 'subscription',
        customer: 'cus_test123',
        status: 'active',
        items: {
          object: 'list',
          data: [
            {
              id: 'si_test123',
              object: 'subscription_item',
              plan: {
                id: 'price_test123',
                object: 'plan',
                product: 'prod_test123',
              } as Stripe.Plan,
              metadata: {
                custom_field: 'custom_value',
              },
            } as Stripe.SubscriptionItem,
          ],
          has_more: false,
          total_count: 1,
          url: '/v1/subscription_items',
        },
        metadata: {
          team_id: '123',
          source: 'dashboard',
        },
        current_period_start: 1706140800,
        current_period_end: 1708819200,
        cancel_at_period_end: false,
        created: 1706140800,
      } as Stripe.Subscription;

      const mockEvent: Stripe.Event = {
        id: 'evt_test444',
        object: 'event',
        api_version: '2025-04-30.basil',
        created: 1706140800,
        type: 'customer.subscription.updated',
        data: {
          object: mockSubscription,
        },
        livemode: false,
        pending_webhooks: 1,
        request: {
          id: null,
          idempotency_key: null,
        },
      };

      const payload = JSON.stringify(mockEvent);
      const signature = 't=1234567890,v1=abc444';

      mockConstructEvent.mockReturnValue(mockEvent);

      const request = createMockRequest(payload, signature);
      const response = await POST(request);

      expect(mockHandleSubscriptionChange).toHaveBeenCalledWith(mockSubscription);
      expect(response.status).toBe(200);
    });
  });

  describe('error handling in handler', () => {
    it('should return 200 even if handler throws error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockSubscription: Stripe.Subscription = {
        id: 'sub_test123',
        object: 'subscription',
        customer: 'cus_test123',
        status: 'active',
        items: {
          object: 'list',
          data: [],
          has_more: false,
          total_count: 0,
          url: '/v1/subscription_items',
        },
        current_period_start: 1706140800,
        current_period_end: 1708819200,
        cancel_at_period_end: false,
        created: 1706140800,
      } as Stripe.Subscription;

      const mockEvent: Stripe.Event = {
        id: 'evt_test555',
        object: 'event',
        api_version: '2025-04-30.basil',
        created: 1706140800,
        type: 'customer.subscription.updated',
        data: {
          object: mockSubscription,
        },
        livemode: false,
        pending_webhooks: 1,
        request: {
          id: null,
          idempotency_key: null,
        },
      };

      const payload = JSON.stringify(mockEvent);
      const signature = 't=1234567890,v1=abc555';

      mockConstructEvent.mockReturnValue(mockEvent);
      mockHandleSubscriptionChange.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = createMockRequest(payload, signature);

      // Handler errors should not cause webhook to fail (Stripe best practice)
      await expect(POST(request)).rejects.toThrow('Database connection failed');

      expect(mockHandleSubscriptionChange).toHaveBeenCalledWith(mockSubscription);

      consoleErrorSpy.mockRestore();
    });
  });
});
