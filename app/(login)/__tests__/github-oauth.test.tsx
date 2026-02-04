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
  signInWithGitHub: vi.fn(),
}));

vi.mock('@/lib/auth/middleware', () => ({
  ActionState: {},
}));

import { Login } from '../login';

describe('GitHub OAuth integration', () => {
  it('should render GitHub sign-in button', () => {
    mockSearchParams = new URLSearchParams();

    render(<Login mode="signin" />);

    const githubButton = screen.getByText('Continue with GitHub');
    expect(githubButton).toBeTruthy();
  });

  it('should render GitHub sign-in button on sign-up page', () => {
    mockSearchParams = new URLSearchParams();

    render(<Login mode="signup" />);

    const githubButton = screen.getByText('Continue with GitHub');
    expect(githubButton).toBeTruthy();
  });

  it('should include redirect param in GitHub OAuth form', () => {
    mockSearchParams = new URLSearchParams({ redirect: 'checkout' });

    const { container } = render(<Login mode="signin" />);

    const forms = container.querySelectorAll('form');
    // Find the GitHub OAuth form
    const githubForm = Array.from(forms).find((form) => {
      const button = form.querySelector('button');
      return button?.textContent?.includes('Continue with GitHub');
    });

    const redirectInput = githubForm?.querySelector('input[name="redirect"]') as HTMLInputElement;
    expect(redirectInput).toBeTruthy();
    expect(redirectInput?.value).toBe('checkout');
  });

  it('should include priceId param in GitHub OAuth form', () => {
    mockSearchParams = new URLSearchParams({ priceId: 'price_123' });

    const { container } = render(<Login mode="signin" />);

    const forms = container.querySelectorAll('form');
    // Find the GitHub OAuth form
    const githubForm = Array.from(forms).find((form) => {
      const button = form.querySelector('button');
      return button?.textContent?.includes('Continue with GitHub');
    });

    const priceIdInput = githubForm?.querySelector('input[name="priceId"]') as HTMLInputElement;
    expect(priceIdInput).toBeTruthy();
    expect(priceIdInput?.value).toBe('price_123');
  });

  it('should preserve redirect and priceId params in GitHub OAuth form', () => {
    mockSearchParams = new URLSearchParams({
      redirect: 'checkout',
      priceId: 'price_123',
    });

    const { container } = render(<Login mode="signin" />);

    const forms = container.querySelectorAll('form');
    const githubForm = Array.from(forms).find((form) => {
      const button = form.querySelector('button');
      return button?.textContent?.includes('Continue with GitHub');
    });

    const redirectInput = githubForm?.querySelector('input[name="redirect"]') as HTMLInputElement;
    const priceIdInput = githubForm?.querySelector('input[name="priceId"]') as HTMLInputElement;

    expect(redirectInput?.value).toBe('checkout');
    expect(priceIdInput?.value).toBe('price_123');
  });

  it('should display GitHub logo SVG', () => {
    mockSearchParams = new URLSearchParams();

    const { container } = render(<Login mode="signin" />);

    const githubButton = screen.getByText('Continue with GitHub');
    const svg = githubButton.parentElement?.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
  });

  it('should render both Google and GitHub OAuth buttons', () => {
    mockSearchParams = new URLSearchParams();

    render(<Login mode="signin" />);

    const googleButton = screen.getByText('Continue with Google');
    const githubButton = screen.getByText('Continue with GitHub');

    expect(googleButton).toBeTruthy();
    expect(githubButton).toBeTruthy();
  });
});
