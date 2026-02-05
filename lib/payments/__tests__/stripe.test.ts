import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Stripe
const mockStripeCheckoutSessionCreate = vi.fn();
const mockStripeBillingPortalSessionCreate = vi.fn();
const mockStripeBillingPortalConfigurationsList = vi.fn();
const mockStripeBillingPortalConfigurationsCreate = vi.fn();
const mockStripeProductsRetrieve = vi.fn();
const mockStripePricesList = vi.fn();

vi.mock('stripe', () => {
  const StripeMock = function() {
    return {
      checkout: {
        sessions: {
          create: mockStripeCheckoutSessionCreate,
        },
      },
      billingPortal: {
        sessions: {
          create: mockStripeBillingPortalSessionCreate,
        },
        configurations: {
          list: mockStripeBillingPortalConfigurationsList,
          create: mockStripeBillingPortalConfigurationsCreate,
        },
      },
      products: {
        retrieve: mockStripeProductsRetrieve,
      },
      prices: {
        list: mockStripePricesList,
      },
    };
  };
  return {
    default: StripeMock,
  };
});

// Mock next/navigation
// In Next.js, redirect() throws a special error to interrupt execution
const REDIRECT_ERROR_CODE = 'NEXT_REDIRECT';
const mockRedirect = vi.fn((url: string) => {
  const error = new Error('NEXT_REDIRECT') as Error & { digest: string };
  error.digest = REDIRECT_ERROR_CODE;
  throw error;
});
vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}));

// Mock database queries
const mockGetUser = vi.fn();
vi.mock('@/lib/db/queries', () => ({
  getUser: mockGetUser,
  getTeamByStripeCustomerId: vi.fn(),
  updateTeamSubscription: vi.fn(),
}));

describe('createCheckoutSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BASE_URL = 'http://localhost:3000';
  });

  it('should use BASE_URL env var for success_url', async () => {
    const mockTeam = {
      id: 1,
      name: 'Test Team',
      stripeCustomerId: 'cus_test123',
      stripeSubscriptionId: null,
      stripeProductId: null,
      planName: null,
      subscriptionStatus: null,
    };

    const mockUser = {
      id: 1,
      email: 'test@test.com',
    };

    mockGetUser.mockResolvedValue(mockUser);
    mockStripeCheckoutSessionCreate.mockResolvedValue({
      id: 'cs_test123',
      url: 'https://checkout.stripe.com/pay/cs_test123',
    });

    const { createCheckoutSession } = await import('../stripe');

    try {
      await createCheckoutSession({
        team: mockTeam,
        priceId: 'price_test123',
      });
    } catch (error: any) {
      // Expected to throw redirect error
      expect(error.digest).toBe(REDIRECT_ERROR_CODE);
    }

    expect(mockStripeCheckoutSessionCreate).toHaveBeenCalledWith({
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_test123',
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: 'http://localhost:3000/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/pricing',
      customer: 'cus_test123',
      client_reference_id: '1',
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 14,
      },
    });
  });

  it('should use custom BASE_URL when set', async () => {
    process.env.BASE_URL = 'https://sokudo.app';

    const mockTeam = {
      id: 1,
      name: 'Test Team',
      stripeCustomerId: 'cus_test123',
      stripeSubscriptionId: null,
      stripeProductId: null,
      planName: null,
      subscriptionStatus: null,
    };

    const mockUser = {
      id: 1,
      email: 'test@test.com',
    };

    mockGetUser.mockResolvedValue(mockUser);
    mockStripeCheckoutSessionCreate.mockResolvedValue({
      id: 'cs_test123',
      url: 'https://checkout.stripe.com/pay/cs_test123',
    });

    const { createCheckoutSession } = await import('../stripe');

    try {
      await createCheckoutSession({
        team: mockTeam,
        priceId: 'price_test123',
      });
    } catch (error: any) {
      // Expected to throw redirect error
      expect(error.digest).toBe(REDIRECT_ERROR_CODE);
    }

    expect(mockStripeCheckoutSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: 'https://sokudo.app/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://sokudo.app/pricing',
      })
    );
  });

  it('should redirect to sign-up when team is null', async () => {
    const { createCheckoutSession } = await import('../stripe');

    try {
      await createCheckoutSession({
        team: null,
        priceId: 'price_test123',
      });
    } catch (error: any) {
      // Expected to throw redirect error
      expect(error.digest).toBe(REDIRECT_ERROR_CODE);
    }

    expect(mockRedirect).toHaveBeenCalledWith('/sign-up?redirect=checkout&priceId=price_test123');
  });

  it('should redirect to sign-up when user is null', async () => {
    const mockTeam = {
      id: 1,
      name: 'Test Team',
      stripeCustomerId: 'cus_test123',
      stripeSubscriptionId: null,
      stripeProductId: null,
      planName: null,
      subscriptionStatus: null,
    };

    mockGetUser.mockResolvedValue(null);

    const { createCheckoutSession } = await import('../stripe');

    try {
      await createCheckoutSession({
        team: mockTeam,
        priceId: 'price_test123',
      });
    } catch (error: any) {
      // Expected to throw redirect error
      expect(error.digest).toBe(REDIRECT_ERROR_CODE);
    }

    expect(mockRedirect).toHaveBeenCalledWith('/sign-up?redirect=checkout&priceId=price_test123');
  });
});

describe('createCustomerPortalSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BASE_URL = 'http://localhost:3000';
  });

  it('should use BASE_URL env var for return_url', async () => {
    const mockTeam = {
      id: 1,
      name: 'Test Team',
      stripeCustomerId: 'cus_test123',
      stripeSubscriptionId: 'sub_test123',
      stripeProductId: 'prod_test123',
      planName: 'Pro Plan',
      subscriptionStatus: 'active',
    };

    mockStripeBillingPortalConfigurationsList.mockResolvedValue({
      data: [
        {
          id: 'bpc_test123',
        },
      ],
    });

    mockStripeBillingPortalSessionCreate.mockResolvedValue({
      id: 'bps_test123',
      url: 'https://billing.stripe.com/session/test123',
    });

    const { createCustomerPortalSession } = await import('../stripe');
    const result = await createCustomerPortalSession(mockTeam);

    expect(mockStripeBillingPortalSessionCreate).toHaveBeenCalledWith({
      customer: 'cus_test123',
      return_url: 'http://localhost:3000/dashboard',
      configuration: 'bpc_test123',
    });
    expect(result).toEqual({
      id: 'bps_test123',
      url: 'https://billing.stripe.com/session/test123',
    });
  });

  it('should use custom BASE_URL when set', async () => {
    process.env.BASE_URL = 'https://sokudo.app';

    const mockTeam = {
      id: 1,
      name: 'Test Team',
      stripeCustomerId: 'cus_test123',
      stripeSubscriptionId: 'sub_test123',
      stripeProductId: 'prod_test123',
      planName: 'Pro Plan',
      subscriptionStatus: 'active',
    };

    mockStripeBillingPortalConfigurationsList.mockResolvedValue({
      data: [
        {
          id: 'bpc_test123',
        },
      ],
    });

    mockStripeBillingPortalSessionCreate.mockResolvedValue({
      id: 'bps_test123',
      url: 'https://billing.stripe.com/session/test123',
    });

    const { createCustomerPortalSession } = await import('../stripe');
    await createCustomerPortalSession(mockTeam);

    expect(mockStripeBillingPortalSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        return_url: 'https://sokudo.app/dashboard',
      })
    );
  });

  it('should redirect to pricing when stripeCustomerId is missing', async () => {
    const mockTeam = {
      id: 1,
      name: 'Test Team',
      stripeCustomerId: null,
      stripeSubscriptionId: 'sub_test123',
      stripeProductId: 'prod_test123',
      planName: 'Pro Plan',
      subscriptionStatus: 'active',
    };

    const { createCustomerPortalSession } = await import('../stripe');

    try {
      await createCustomerPortalSession(mockTeam);
    } catch (error: any) {
      // Expected to throw redirect error
      expect(error.digest).toBe(REDIRECT_ERROR_CODE);
    }

    expect(mockRedirect).toHaveBeenCalledWith('/pricing');
  });

  it('should redirect to pricing when stripeProductId is missing', async () => {
    const mockTeam = {
      id: 1,
      name: 'Test Team',
      stripeCustomerId: 'cus_test123',
      stripeSubscriptionId: 'sub_test123',
      stripeProductId: null,
      planName: 'Pro Plan',
      subscriptionStatus: 'active',
    };

    const { createCustomerPortalSession } = await import('../stripe');

    try {
      await createCustomerPortalSession(mockTeam);
    } catch (error: any) {
      // Expected to throw redirect error
      expect(error.digest).toBe(REDIRECT_ERROR_CODE);
    }

    expect(mockRedirect).toHaveBeenCalledWith('/pricing');
  });

  it('should create configuration when none exists', async () => {
    const mockTeam = {
      id: 1,
      name: 'Test Team',
      stripeCustomerId: 'cus_test123',
      stripeSubscriptionId: 'sub_test123',
      stripeProductId: 'prod_test123',
      planName: 'Pro Plan',
      subscriptionStatus: 'active',
    };

    mockStripeBillingPortalConfigurationsList.mockResolvedValue({
      data: [],
    });

    mockStripeProductsRetrieve.mockResolvedValue({
      id: 'prod_test123',
      active: true,
    });

    mockStripePricesList.mockResolvedValue({
      data: [
        {
          id: 'price_test123',
        },
      ],
    });

    mockStripeBillingPortalConfigurationsCreate.mockResolvedValue({
      id: 'bpc_new123',
    });

    mockStripeBillingPortalSessionCreate.mockResolvedValue({
      id: 'bps_test123',
      url: 'https://billing.stripe.com/session/test123',
    });

    const { createCustomerPortalSession } = await import('../stripe');
    await createCustomerPortalSession(mockTeam);

    expect(mockStripeBillingPortalConfigurationsCreate).toHaveBeenCalled();
    expect(mockStripeBillingPortalSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        configuration: 'bpc_new123',
      })
    );
  });
});
