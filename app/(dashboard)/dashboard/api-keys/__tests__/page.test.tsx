/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ApiKeysPage from '../page';

// Mock SWR
const mockMutate = vi.fn();
vi.mock('swr', () => ({
  default: vi.fn(),
}));

import useSWR from 'swr';
const mockUseSWR = useSWR as ReturnType<typeof vi.fn>;

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ApiKeysPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it('should render the page title', () => {
    mockUseSWR.mockReturnValue({ data: { keys: [] }, mutate: mockMutate });
    render(<ApiKeysPage />);
    expect(screen.getByText('API Keys')).toBeTruthy();
  });

  it('should show create button', () => {
    mockUseSWR.mockReturnValue({ data: { keys: [] }, mutate: mockMutate });
    render(<ApiKeysPage />);
    expect(screen.getByText('Create API Key')).toBeTruthy();
  });

  it('should show empty state when no keys exist', () => {
    mockUseSWR.mockReturnValue({ data: { keys: [] }, mutate: mockMutate });
    render(<ApiKeysPage />);
    expect(screen.getByText('No active API keys. Create one to get started.')).toBeTruthy();
  });

  it('should display active keys', () => {
    const keys = [
      {
        id: 1,
        name: 'VS Code Extension',
        keyPrefix: 'sk_abc123de',
        scopes: ['read'],
        lastUsedAt: null,
        expiresAt: null,
        revokedAt: null,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];
    mockUseSWR.mockReturnValue({ data: { keys }, mutate: mockMutate });
    render(<ApiKeysPage />);

    expect(screen.getByText('VS Code Extension')).toBeTruthy();
    expect(screen.getByText('sk_abc123de...')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText('read')).toBeTruthy();
  });

  it('should display revoked keys in separate section', () => {
    const keys = [
      {
        id: 1,
        name: 'Old Key',
        keyPrefix: 'sk_old12345',
        scopes: ['read'],
        lastUsedAt: null,
        expiresAt: null,
        revokedAt: '2026-01-15T00:00:00Z',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];
    mockUseSWR.mockReturnValue({ data: { keys }, mutate: mockMutate });
    render(<ApiKeysPage />);

    expect(screen.getByText('Old Key')).toBeTruthy();
    expect(screen.getByText('Revoked')).toBeTruthy();
    expect(screen.getByText(/Revoked \/ Expired Keys/)).toBeTruthy();
  });

  it('should show expired status for expired keys', () => {
    const keys = [
      {
        id: 1,
        name: 'Expired Key',
        keyPrefix: 'sk_exp12345',
        scopes: ['read'],
        lastUsedAt: null,
        expiresAt: '2020-01-01T00:00:00Z',
        revokedAt: null,
        createdAt: '2019-01-01T00:00:00Z',
      },
    ];
    mockUseSWR.mockReturnValue({ data: { keys }, mutate: mockMutate });
    render(<ApiKeysPage />);

    expect(screen.getByText('Expired')).toBeTruthy();
  });

  it('should show revoke button for active keys', () => {
    const keys = [
      {
        id: 1,
        name: 'Active Key',
        keyPrefix: 'sk_act12345',
        scopes: ['read', 'write'],
        lastUsedAt: '2026-01-10T00:00:00Z',
        expiresAt: null,
        revokedAt: null,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];
    mockUseSWR.mockReturnValue({ data: { keys }, mutate: mockMutate });
    render(<ApiKeysPage />);

    expect(screen.getByText('Revoke')).toBeTruthy();
  });

  it('should show confirm/cancel when revoking', () => {
    const keys = [
      {
        id: 1,
        name: 'Active Key',
        keyPrefix: 'sk_act12345',
        scopes: ['read'],
        lastUsedAt: null,
        expiresAt: null,
        revokedAt: null,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];
    mockUseSWR.mockReturnValue({ data: { keys }, mutate: mockMutate });
    render(<ApiKeysPage />);

    fireEvent.click(screen.getByText('Revoke'));

    expect(screen.getByText('Confirm')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('should hide confirm when cancel is clicked', () => {
    const keys = [
      {
        id: 1,
        name: 'Active Key',
        keyPrefix: 'sk_act12345',
        scopes: ['read'],
        lastUsedAt: null,
        expiresAt: null,
        revokedAt: null,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];
    mockUseSWR.mockReturnValue({ data: { keys }, mutate: mockMutate });
    render(<ApiKeysPage />);

    fireEvent.click(screen.getByText('Revoke'));
    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.getByText('Revoke')).toBeTruthy();
    expect(screen.queryByText('Confirm')).toBeNull();
  });

  it('should display scope badges correctly', () => {
    const keys = [
      {
        id: 1,
        name: 'Full Access Key',
        keyPrefix: 'sk_ful12345',
        scopes: ['*'],
        lastUsedAt: null,
        expiresAt: null,
        revokedAt: null,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];
    mockUseSWR.mockReturnValue({ data: { keys }, mutate: mockMutate });
    render(<ApiKeysPage />);

    expect(screen.getByText('full')).toBeTruthy();
  });

  it('should handle loading state gracefully', () => {
    mockUseSWR.mockReturnValue({ data: undefined, mutate: mockMutate });
    render(<ApiKeysPage />);

    expect(screen.getByText('API Keys')).toBeTruthy();
    expect(screen.getByText('Active Keys (0)')).toBeTruthy();
  });

  it('should call mutate after revoking a key', async () => {
    const keys = [
      {
        id: 1,
        name: 'To Revoke',
        keyPrefix: 'sk_rev12345',
        scopes: ['read'],
        lastUsedAt: null,
        expiresAt: null,
        revokedAt: null,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];
    mockUseSWR.mockReturnValue({ data: { keys }, mutate: mockMutate });
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ message: 'Revoked' }) });

    render(<ApiKeysPage />);

    fireEvent.click(screen.getByText('Revoke'));
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
  });
});
