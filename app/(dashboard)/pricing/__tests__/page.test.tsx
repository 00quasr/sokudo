/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Stripe helpers
vi.mock('@/lib/payments/stripe', () => ({
  getStripePrices: vi.fn(),
  getStripeProducts: vi.fn(),
}));

// Mock the SubmitButton component
vi.mock('../submit-button', () => ({
  SubmitButton: ({ popular }: { popular?: boolean }) => (
    <button type="submit" data-popular={popular}>
      Start Free Trial
    </button>
  ),
}));

// Mock the checkoutAction
vi.mock('@/lib/payments/actions', () => ({
  checkoutAction: vi.fn(),
}));

import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import PricingPage from '../page';

describe('PricingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Stripe products
    vi.mocked(getStripeProducts).mockResolvedValue([
      {
        id: 'prod_pro',
        name: 'Pro',
        description: 'Pro plan',
        defaultPriceId: 'price_pro',
      },
      {
        id: 'prod_elite',
        name: 'Elite',
        description: 'Elite plan',
        defaultPriceId: 'price_elite',
      },
    ]);

    // Mock Stripe prices
    vi.mocked(getStripePrices).mockResolvedValue([
      {
        id: 'price_pro',
        productId: 'prod_pro',
        unitAmount: 900,
        currency: 'usd',
        interval: 'month',
        trialPeriodDays: 14,
      },
      {
        id: 'price_elite',
        productId: 'prod_elite',
        unitAmount: 1900,
        currency: 'usd',
        interval: 'month',
        trialPeriodDays: 14,
      },
    ]);
  });

  it('renders the pricing page with all three tiers', async () => {
    const page = await PricingPage();
    render(page);

    expect(screen.getByText('Build Your Typing Speed')).toBeTruthy();
    expect(screen.getAllByText('Free').length).toBeGreaterThan(0);
    expect(screen.getByText('Pro')).toBeTruthy();
    expect(screen.getByText('Elite')).toBeTruthy();
  });

  it('displays correct pricing for each tier', async () => {
    const page = await PricingPage();
    render(page);

    // Free tier
    expect(screen.getByText('forever')).toBeTruthy();

    // Pro tier - $9/month
    expect(screen.getByText('$9')).toBeTruthy();

    // Elite tier - $19/month
    expect(screen.getByText('$19')).toBeTruthy();
  });

  it('displays free tier features', async () => {
    const page = await PricingPage();
    render(page);

    expect(screen.getByText('15 minutes practice per day')).toBeTruthy();
    expect(screen.getByText('Access to 3 basic categories')).toBeTruthy();
    expect(screen.getByText('Track WPM and accuracy')).toBeTruthy();
  });

  it('displays pro tier features', async () => {
    const page = await PricingPage();
    render(page);

    expect(screen.getByText('Unlimited practice time')).toBeTruthy();
    expect(screen.getByText('Access to all 10 categories')).toBeTruthy();
    expect(screen.getByText('Advanced analytics & insights')).toBeTruthy();
    expect(screen.getByText('Custom challenges')).toBeTruthy();
  });

  it('displays elite tier features', async () => {
    const page = await PricingPage();
    render(page);

    expect(screen.getByText('Team management & leaderboards')).toBeTruthy();
    expect(screen.getByText('Multiplayer typing races')).toBeTruthy();
    expect(screen.getByText('AI-generated practice content')).toBeTruthy();
    expect(screen.getByText('SSO & SAML integration')).toBeTruthy();
  });

  it('shows "Most Popular" badge on Pro tier', async () => {
    const page = await PricingPage();
    render(page);

    expect(screen.getByText('Most Popular')).toBeTruthy();
  });

  it('shows trial period for paid tiers', async () => {
    const page = await PricingPage();
    render(page);

    // Should show "14 day free trial" for both Pro and Elite
    const trialTexts = screen.getAllByText('14 day free trial');
    expect(trialTexts).toHaveLength(2);
  });

  it('renders Get Started link for free tier', async () => {
    const page = await PricingPage();
    render(page);

    const getStartedLink = screen.getByRole('link', { name: /get started/i });
    expect(getStartedLink).toBeTruthy();
    expect(getStartedLink.getAttribute('href')).toBe('/sign-up');
  });

  it('renders subscription buttons for paid tiers', async () => {
    const page = await PricingPage();
    render(page);

    const subscribeButtons = screen.getAllByRole('button', { name: /start free trial/i });
    // Should have 2 buttons - one for Pro and one for Elite
    expect(subscribeButtons).toHaveLength(2);
  });
});
