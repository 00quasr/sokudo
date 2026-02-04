/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RemainingTimeBar } from '../RemainingTimeBar';

// Mock useSWR
vi.mock('swr', () => ({
  __esModule: true,
  default: vi.fn(),
}));

import useSWR from 'swr';

const mockUseSWR = useSWR as ReturnType<typeof vi.fn>;

describe('RemainingTimeBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null while loading', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
      mutate: vi.fn(),
      isValidating: false,
    });

    const { container } = render(<RemainingTimeBar />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null for unlimited (pro) users', () => {
    mockUseSWR.mockReturnValue({
      data: {
        canPractice: true,
        isFreeTier: false,
        remainingMs: null,
        dailyLimitMs: null,
        usedTodayMs: 300000,
        subscriptionTier: 'pro',
      },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
      isValidating: false,
    });

    const { container } = render(<RemainingTimeBar />);
    expect(container.firstChild).toBeNull();
  });

  it('displays remaining time for free users', () => {
    mockUseSWR.mockReturnValue({
      data: {
        canPractice: true,
        isFreeTier: true,
        remainingMs: 10 * 60 * 1000, // 10 minutes
        dailyLimitMs: 15 * 60 * 1000, // 15 minutes
        usedTodayMs: 5 * 60 * 1000, // 5 minutes used
        subscriptionTier: 'free',
      },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
      isValidating: false,
    });

    render(<RemainingTimeBar />);

    expect(screen.getByTestId('remaining-time-bar')).toBeTruthy();
    expect(screen.getByTestId('remaining-time').textContent).toBe('10:00');
    expect(screen.getByText('remaining today')).toBeTruthy();
    expect(screen.getByTestId('remaining-time-percent').textContent).toBe('33% used');
  });

  it('displays warning state when time is low (5 minutes or less)', () => {
    mockUseSWR.mockReturnValue({
      data: {
        canPractice: true,
        isFreeTier: true,
        remainingMs: 3 * 60 * 1000, // 3 minutes
        dailyLimitMs: 15 * 60 * 1000, // 15 minutes
        usedTodayMs: 12 * 60 * 1000, // 12 minutes used
        subscriptionTier: 'free',
      },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
      isValidating: false,
    });

    render(<RemainingTimeBar />);

    expect(screen.getByTestId('remaining-time').textContent).toBe('3:00');
    expect(screen.getByTestId('remaining-time-percent').textContent).toBe('80% used');
    // Upgrade button should be visible
    expect(screen.getByRole('link', { name: /upgrade/i })).toBeTruthy();
  });

  it('displays exhausted state when time is 0', () => {
    mockUseSWR.mockReturnValue({
      data: {
        canPractice: false,
        isFreeTier: true,
        remainingMs: 0,
        dailyLimitMs: 15 * 60 * 1000,
        usedTodayMs: 15 * 60 * 1000,
        subscriptionTier: 'free',
      },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
      isValidating: false,
    });

    render(<RemainingTimeBar />);

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Daily practice limit reached')).toBeTruthy();
    expect(screen.getByRole('link', { name: /upgrade for unlimited/i })).toBeTruthy();
  });

  it('links to pricing page for upgrade', () => {
    mockUseSWR.mockReturnValue({
      data: {
        canPractice: false,
        isFreeTier: true,
        remainingMs: 0,
        dailyLimitMs: 15 * 60 * 1000,
        usedTodayMs: 15 * 60 * 1000,
        subscriptionTier: 'free',
      },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
      isValidating: false,
    });

    render(<RemainingTimeBar />);

    const upgradeLink = screen.getByRole('link', { name: /upgrade for unlimited/i });
    expect(upgradeLink.getAttribute('href')).toBe('/pricing');
  });

  it('formats time correctly', () => {
    // Test with 9 minutes 30 seconds
    mockUseSWR.mockReturnValue({
      data: {
        canPractice: true,
        isFreeTier: true,
        remainingMs: 9 * 60 * 1000 + 30 * 1000, // 9:30
        dailyLimitMs: 15 * 60 * 1000,
        usedTodayMs: 5 * 60 * 1000 + 30 * 1000,
        subscriptionTier: 'free',
      },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
      isValidating: false,
    });

    render(<RemainingTimeBar />);

    expect(screen.getByTestId('remaining-time').textContent).toBe('9:30');
  });

  it('calculates percentage correctly', () => {
    mockUseSWR.mockReturnValue({
      data: {
        canPractice: true,
        isFreeTier: true,
        remainingMs: 7.5 * 60 * 1000, // 7.5 minutes
        dailyLimitMs: 15 * 60 * 1000,
        usedTodayMs: 7.5 * 60 * 1000, // 50% used
        subscriptionTier: 'free',
      },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
      isValidating: false,
    });

    render(<RemainingTimeBar />);

    expect(screen.getByTestId('remaining-time-percent').textContent).toBe('50% used');
  });

  it('applies custom className', () => {
    mockUseSWR.mockReturnValue({
      data: {
        canPractice: true,
        isFreeTier: true,
        remainingMs: 10 * 60 * 1000,
        dailyLimitMs: 15 * 60 * 1000,
        usedTodayMs: 5 * 60 * 1000,
        subscriptionTier: 'free',
      },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
      isValidating: false,
    });

    render(<RemainingTimeBar className="custom-class" />);

    expect(screen.getByTestId('remaining-time-bar').className).toContain('custom-class');
  });

  it('has proper accessibility attributes', () => {
    mockUseSWR.mockReturnValue({
      data: {
        canPractice: true,
        isFreeTier: true,
        remainingMs: 10 * 60 * 1000,
        dailyLimitMs: 15 * 60 * 1000,
        usedTodayMs: 5 * 60 * 1000,
        subscriptionTier: 'free',
      },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
      isValidating: false,
    });

    render(<RemainingTimeBar />);

    const bar = screen.getByTestId('remaining-time-bar');
    expect(bar.getAttribute('role')).toBe('status');
    expect(bar.getAttribute('aria-live')).toBe('polite');

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar.getAttribute('aria-valuenow')).toBe('33');
    expect(progressBar.getAttribute('aria-valuemin')).toBe('0');
    expect(progressBar.getAttribute('aria-valuemax')).toBe('100');
  });

  it('shows upgrade link in low-time warning state', () => {
    mockUseSWR.mockReturnValue({
      data: {
        canPractice: true,
        isFreeTier: true,
        remainingMs: 2 * 60 * 1000, // 2 minutes (low)
        dailyLimitMs: 15 * 60 * 1000,
        usedTodayMs: 13 * 60 * 1000,
        subscriptionTier: 'free',
      },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
      isValidating: false,
    });

    render(<RemainingTimeBar />);

    const upgradeLink = screen.getByRole('link', { name: /upgrade/i });
    expect(upgradeLink.getAttribute('href')).toBe('/pricing');
  });

  it('does not show upgrade link when time is not low', () => {
    mockUseSWR.mockReturnValue({
      data: {
        canPractice: true,
        isFreeTier: true,
        remainingMs: 10 * 60 * 1000, // 10 minutes (not low)
        dailyLimitMs: 15 * 60 * 1000,
        usedTodayMs: 5 * 60 * 1000,
        subscriptionTier: 'free',
      },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
      isValidating: false,
    });

    render(<RemainingTimeBar />);

    // No upgrade link in normal state
    expect(screen.queryByRole('link', { name: /upgrade/i })).toBeNull();
  });

  it('handles edge case at exactly 5 minutes (threshold)', () => {
    mockUseSWR.mockReturnValue({
      data: {
        canPractice: true,
        isFreeTier: true,
        remainingMs: 5 * 60 * 1000, // exactly 5 minutes
        dailyLimitMs: 15 * 60 * 1000,
        usedTodayMs: 10 * 60 * 1000,
        subscriptionTier: 'free',
      },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
      isValidating: false,
    });

    render(<RemainingTimeBar />);

    // 5 minutes is at the threshold, should show warning
    expect(screen.getByTestId('remaining-time').textContent).toBe('5:00');
    expect(screen.getByRole('link', { name: /upgrade/i })).toBeTruthy();
  });
});
