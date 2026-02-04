/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

vi.mock('../actions', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signInWithGoogle: vi.fn(),
}));

vi.mock('@/lib/auth/middleware', () => ({
  ActionState: {},
}));

import { Login } from '../login';

describe('Google OAuth integration', () => {
  it('should render Google sign-in button', () => {
    mockSearchParams = new URLSearchParams();

    render(<Login mode="signin" />);

    const googleButton = screen.getByText('Continue with Google');
    expect(googleButton).toBeTruthy();
  });

  it('should render Google sign-in button on sign-up page', () => {
    mockSearchParams = new URLSearchParams();

    render(<Login mode="signup" />);

    const googleButton = screen.getByText('Continue with Google');
    expect(googleButton).toBeTruthy();
  });

  it('should include redirect param in Google OAuth form', () => {
    mockSearchParams = new URLSearchParams({ redirect: 'checkout' });

    const { container } = render(<Login mode="signin" />);

    const form = container.querySelector('form[action]');
    const redirectInput = form?.querySelector('input[name="redirect"]') as HTMLInputElement;
    expect(redirectInput).toBeTruthy();
    expect(redirectInput?.value).toBe('checkout');
  });

  it('should include priceId param in Google OAuth form', () => {
    mockSearchParams = new URLSearchParams({ priceId: 'price_123' });

    const { container } = render(<Login mode="signin" />);

    const forms = container.querySelectorAll('form');
    // Find the Google OAuth form (should be the second form)
    const googleForm = Array.from(forms).find((form) => {
      const button = form.querySelector('button');
      return button?.textContent?.includes('Continue with Google');
    });

    const priceIdInput = googleForm?.querySelector('input[name="priceId"]') as HTMLInputElement;
    expect(priceIdInput).toBeTruthy();
    expect(priceIdInput?.value).toBe('price_123');
  });

  it('should preserve redirect and priceId params in Google OAuth form', () => {
    mockSearchParams = new URLSearchParams({
      redirect: 'checkout',
      priceId: 'price_123',
    });

    const { container } = render(<Login mode="signin" />);

    const forms = container.querySelectorAll('form');
    const googleForm = Array.from(forms).find((form) => {
      const button = form.querySelector('button');
      return button?.textContent?.includes('Continue with Google');
    });

    const redirectInput = googleForm?.querySelector('input[name="redirect"]') as HTMLInputElement;
    const priceIdInput = googleForm?.querySelector('input[name="priceId"]') as HTMLInputElement;

    expect(redirectInput?.value).toBe('checkout');
    expect(priceIdInput?.value).toBe('price_123');
  });

  it('should display Google logo SVG', () => {
    mockSearchParams = new URLSearchParams();

    const { container } = render(<Login mode="signin" />);

    const googleButton = screen.getByText('Continue with Google');
    const svg = googleButton.parentElement?.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
  });
});
