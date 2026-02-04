/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import OAuthAuthorizePage from '../page';

// Mock next/navigation
const mockSearchParams = new Map<string, string>();
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams.get(key) ?? null,
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

function setSearchParams(params: Record<string, string>) {
  mockSearchParams.clear();
  for (const [key, value] of Object.entries(params)) {
    mockSearchParams.set(key, value);
  }
}

describe('OAuthAuthorizePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.clear();
  });

  it('should show error when required parameters are missing', async () => {
    setSearchParams({});
    render(<OAuthAuthorizePage />);

    await waitFor(() => {
      expect(screen.getByText('Authorization Error')).toBeDefined();
      expect(screen.getByText('Missing required parameters')).toBeDefined();
    });
  });

  it('should show consent screen with client name and scopes', async () => {
    setSearchParams({
      client_id: 'sokudo_test',
      redirect_uri: 'https://example.com/callback',
      response_type: 'code',
      scope: 'read write',
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      redirected: false,
      json: () =>
        Promise.resolve({
          client: { name: 'My Test App', clientId: 'sokudo_test' },
          requestedScopes: ['read', 'write'],
          redirectUri: 'https://example.com/callback',
        }),
    });

    render(<OAuthAuthorizePage />);

    await waitFor(() => {
      expect(screen.getByText('Authorize Application')).toBeDefined();
      expect(screen.getByText('My Test App')).toBeDefined();
      expect(
        screen.getByText('Read your typing sessions, stats, and profile')
      ).toBeDefined();
      expect(
        screen.getByText('Create typing sessions and modify your data')
      ).toBeDefined();
    });

    expect(screen.getByText('Authorize')).toBeDefined();
    expect(screen.getByText('Deny')).toBeDefined();
  });

  it('should show error when API returns an error', async () => {
    setSearchParams({
      client_id: 'unknown',
      redirect_uri: 'https://example.com/callback',
      response_type: 'code',
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      redirected: false,
      json: () =>
        Promise.resolve({
          error: 'invalid_client',
          error_description: 'Unknown or inactive client',
        }),
    });

    render(<OAuthAuthorizePage />);

    await waitFor(() => {
      expect(screen.getByText('Authorization Error')).toBeDefined();
      expect(
        screen.getByText('Unknown or inactive client')
      ).toBeDefined();
    });
  });

  it('should call POST /api/oauth/authorize when user clicks Authorize', async () => {
    setSearchParams({
      client_id: 'sokudo_test',
      redirect_uri: 'https://example.com/callback',
      response_type: 'code',
      scope: 'read',
      state: 'xyz',
    });

    // First call: GET to validate
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      redirected: false,
      json: () =>
        Promise.resolve({
          client: { name: 'My App', clientId: 'sokudo_test' },
          requestedScopes: ['read'],
          redirectUri: 'https://example.com/callback',
        }),
    });

    render(<OAuthAuthorizePage />);

    await waitFor(() => {
      expect(screen.getByText('Authorize')).toBeDefined();
    });

    // Second call: POST to approve
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          redirectUrl: 'https://example.com/callback?code=abc123&state=xyz',
        }),
    });

    fireEvent.click(screen.getByText('Authorize'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
      const [url, opts] = mockFetch.mock.calls[1];
      expect(url).toBe('/api/oauth/authorize');
      expect(opts.method).toBe('POST');
      const body = JSON.parse(opts.body);
      expect(body.client_id).toBe('sokudo_test');
      expect(body.redirect_uri).toBe('https://example.com/callback');
      expect(body.scope).toBe('read');
      expect(body.state).toBe('xyz');
    });
  });
});
