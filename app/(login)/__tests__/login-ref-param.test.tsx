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

describe('Login component ref parameter preservation', () => {
  it('should include ref param in the toggle link when switching to sign-up', () => {
    mockSearchParams = new URLSearchParams({ ref: 'ABCD1234' });

    render(<Login mode="signin" />);

    const toggleLink = screen.getByText('Create an account');
    expect(toggleLink.getAttribute('href')).toContain('ref=ABCD1234');
    expect(toggleLink.getAttribute('href')).toContain('/sign-up');
  });

  it('should include ref param in the toggle link when switching to sign-in', () => {
    mockSearchParams = new URLSearchParams({ ref: 'WXYZ5678' });

    render(<Login mode="signup" />);

    const toggleLink = screen.getByText('Sign in to existing account');
    expect(toggleLink.getAttribute('href')).toContain('ref=WXYZ5678');
    expect(toggleLink.getAttribute('href')).toContain('/sign-in');
  });

  it('should not include ref param in toggle link when not present', () => {
    mockSearchParams = new URLSearchParams();

    render(<Login mode="signin" />);

    const toggleLink = screen.getByText('Create an account');
    expect(toggleLink.getAttribute('href')).not.toContain('ref=');
  });

  it('should preserve both ref and redirect params in the toggle link', () => {
    mockSearchParams = new URLSearchParams({ ref: 'ABCD1234', redirect: 'checkout' });

    render(<Login mode="signin" />);

    const toggleLink = screen.getByText('Create an account');
    const href = toggleLink.getAttribute('href');
    expect(href).toContain('ref=ABCD1234');
    expect(href).toContain('redirect=checkout');
  });

  it('should preserve ref, redirect, and priceId params in the toggle link', () => {
    mockSearchParams = new URLSearchParams({
      ref: 'ABCD1234',
      redirect: 'checkout',
      priceId: 'price_123',
    });

    render(<Login mode="signin" />);

    const toggleLink = screen.getByText('Create an account');
    const href = toggleLink.getAttribute('href');
    expect(href).toContain('ref=ABCD1234');
    expect(href).toContain('redirect=checkout');
    expect(href).toContain('priceId=price_123');
  });

  it('should include ref as a hidden form field', () => {
    mockSearchParams = new URLSearchParams({ ref: 'ABCD1234' });

    const { container } = render(<Login mode="signup" />);

    const hiddenInput = container.querySelector('input[name="ref"]') as HTMLInputElement;
    expect(hiddenInput).toBeTruthy();
    expect(hiddenInput.value).toBe('ABCD1234');
  });
});
