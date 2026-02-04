/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SWRConfig } from 'swr';
import ReferralsPage from '../page';

const mockReferralsData = {
  stats: {
    totalReferrals: 3,
    pendingReferrals: 1,
    completedReferrals: 2,
    rewardsEarned: 2,
  },
  referrals: [
    {
      id: 1,
      referredName: 'Alice Johnson',
      referredEmail: 'alice@test.com',
      status: 'completed',
      rewardGiven: true,
      createdAt: '2025-06-01T00:00:00Z',
    },
    {
      id: 2,
      referredName: 'Bob Smith',
      referredEmail: 'bob@test.com',
      status: 'pending',
      rewardGiven: false,
      createdAt: '2025-06-15T00:00:00Z',
    },
    {
      id: 3,
      referredName: null,
      referredEmail: 'charlie@test.com',
      status: 'completed',
      rewardGiven: true,
      createdAt: '2025-07-01T00:00:00Z',
    },
  ],
};

const mockReferralCodeData = {
  referralCode: 'ABC12345',
};

let fetchResponses: Record<string, unknown> = {};

vi.stubGlobal(
  'fetch',
  vi.fn((url: string) => {
    const data = fetchResponses[url] ?? {};
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    });
  })
);

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

function renderPage() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <ReferralsPage />
    </SWRConfig>
  );
}

describe('ReferralsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchResponses = {
      '/api/referrals': mockReferralsData,
      '/api/referral-code': mockReferralCodeData,
    };
  });

  it('should render the page title', async () => {
    renderPage();
    expect(screen.getByText('Referrals')).toBeTruthy();
  });

  it('should display stat cards', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Total')).toBeTruthy();
      expect(screen.getAllByText('Pending').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Rewards')).toBeTruthy();
    });
  });

  it('should display stat values after loading', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('3')).toBeTruthy();
      expect(screen.getByText('1')).toBeTruthy();
    });
  });

  it('should display the referral code section', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Your Referral Code')).toBeTruthy();
    });
  });

  it('should display the referral code value', async () => {
    renderPage();

    await waitFor(() => {
      const codeInput = screen.getByTestId('referral-code');
      expect(codeInput).toBeTruthy();
      expect((codeInput as HTMLInputElement).value).toBe('ABC12345');
    });
  });

  it('should display referral link', async () => {
    renderPage();

    await waitFor(() => {
      const linkInput = screen.getByTestId('referral-link');
      expect(linkInput).toBeTruthy();
      expect((linkInput as HTMLInputElement).value).toContain('ref=ABC12345');
    });
  });

  it('should display the referrals table', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('referrals-table')).toBeTruthy();
    });
  });

  it('should display referred user names', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeTruthy();
      expect(screen.getByText('Bob Smith')).toBeTruthy();
    });
  });

  it('should display "Unknown" for null names', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Unknown')).toBeTruthy();
    });
  });

  it('should display referred user emails', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('alice@test.com')).toBeTruthy();
      expect(screen.getByText('bob@test.com')).toBeTruthy();
      expect(screen.getByText('charlie@test.com')).toBeTruthy();
    });
  });

  it('should display status badges', async () => {
    renderPage();

    await waitFor(() => {
      // "Completed" appears in stat card label + 2 status badges in table
      const completedElements = screen.getAllByText('Completed');
      expect(completedElements.length).toBeGreaterThanOrEqual(3);
      // "Pending" appears in stat card label + 1 status badge in table
      const pendingElements = screen.getAllByText('Pending');
      expect(pendingElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('should show empty state when no referrals', async () => {
    fetchResponses['/api/referrals'] = {
      stats: {
        totalReferrals: 0,
        pendingReferrals: 0,
        completedReferrals: 0,
        rewardsEarned: 0,
      },
      referrals: [],
    };

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText('No referrals yet. Share your code to get started!')
      ).toBeTruthy();
    });
  });

  it('should display Your Referrals card header', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Your Referrals')).toBeTruthy();
    });
  });
});
