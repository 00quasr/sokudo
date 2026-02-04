/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/notifications/client', () => ({
  isPushSupported: vi.fn(),
  getPermissionState: vi.fn(),
  subscribeToPush: vi.fn(),
  unsubscribeFromPush: vi.fn(),
  getCurrentSubscription: vi.fn(),
}));

describe('PushNotificationToggle', () => {
  beforeEach(() => {
    vi.resetModules();
    global.fetch = vi.fn();
  });

  it('should show unsupported message when push is not available', async () => {
    const { isPushSupported, getPermissionState, getCurrentSubscription } =
      await import('@/lib/notifications/client');

    vi.mocked(isPushSupported).mockReturnValue(false);
    vi.mocked(getPermissionState).mockReturnValue('unsupported');
    vi.mocked(getCurrentSubscription).mockResolvedValue(null);

    const { PushNotificationToggle } = await import('../PushNotificationToggle');
    render(<PushNotificationToggle />);

    // Wait for useEffect
    await vi.waitFor(() => {
      expect(
        screen.getByText('Push notifications are not supported in this browser.')
      ).toBeTruthy();
    });
  });

  it('should show denied message when permission is denied', async () => {
    const { isPushSupported, getPermissionState, getCurrentSubscription } =
      await import('@/lib/notifications/client');

    vi.mocked(isPushSupported).mockReturnValue(true);
    vi.mocked(getPermissionState).mockReturnValue('denied');
    vi.mocked(getCurrentSubscription).mockResolvedValue(null);

    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ subscribed: false }), { status: 200 })
    );

    const { PushNotificationToggle } = await import('../PushNotificationToggle');
    render(<PushNotificationToggle />);

    await vi.waitFor(() => {
      expect(
        screen.getByText(/Notifications are blocked/)
      ).toBeTruthy();
    });
  });

  it('should show enable button when not subscribed', async () => {
    const { isPushSupported, getPermissionState, getCurrentSubscription } =
      await import('@/lib/notifications/client');

    vi.mocked(isPushSupported).mockReturnValue(true);
    vi.mocked(getPermissionState).mockReturnValue('default');
    vi.mocked(getCurrentSubscription).mockResolvedValue(null);

    const { PushNotificationToggle } = await import('../PushNotificationToggle');
    render(<PushNotificationToggle />);

    await vi.waitFor(() => {
      expect(screen.getByTestId('push-subscribe-btn')).toBeTruthy();
      expect(screen.getByText('Enable Push Notifications')).toBeTruthy();
    });
  });

  it('should show disable button when subscribed', async () => {
    const { isPushSupported, getPermissionState, getCurrentSubscription } =
      await import('@/lib/notifications/client');

    vi.mocked(isPushSupported).mockReturnValue(true);
    vi.mocked(getPermissionState).mockReturnValue('granted');
    vi.mocked(getCurrentSubscription).mockResolvedValue({
      endpoint: 'https://fcm.googleapis.com/test',
    } as PushSubscription);

    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ subscribed: true }), { status: 200 })
    );

    const { PushNotificationToggle } = await import('../PushNotificationToggle');
    render(<PushNotificationToggle />);

    await vi.waitFor(() => {
      expect(screen.getByTestId('push-unsubscribe-btn')).toBeTruthy();
      expect(screen.getByText('Disable Push Notifications')).toBeTruthy();
    });
  });
});
