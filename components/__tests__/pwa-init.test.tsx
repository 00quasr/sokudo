/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import { PWAInit } from '../pwa-init';
import * as notificationClient from '@/lib/notifications/client';

// Mock the notification client module
vi.mock('@/lib/notifications/client', () => ({
  registerServiceWorker: vi.fn(() => Promise.resolve(null))
}));

describe('PWAInit', () => {
  beforeAll(() => {
    // Mock navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: {
        register: vi.fn(),
        ready: Promise.resolve({
          pushManager: {
            subscribe: vi.fn(),
            getSubscription: vi.fn()
          }
        })
      }
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(<PWAInit />);
    expect(container).toBeTruthy();
  });

  it('should return null (no visible output)', () => {
    const { container } = render(<PWAInit />);
    expect(container.firstChild).toBeNull();
  });

  it('should call registerServiceWorker on mount', async () => {
    const mockRegister = vi.spyOn(notificationClient, 'registerServiceWorker')
      .mockResolvedValue(null);

    render(<PWAInit />);

    // Wait for the effect to run
    await vi.waitFor(() => {
      expect(mockRegister).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle service worker registration errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockRegister = vi.spyOn(notificationClient, 'registerServiceWorker')
      .mockRejectedValue(new Error('Registration failed'));

    render(<PWAInit />);

    // Wait for the effect to run and error to be caught
    await vi.waitFor(() => {
      expect(mockRegister).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to register service worker:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });
});
