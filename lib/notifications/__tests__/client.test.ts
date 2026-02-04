/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('notification client utilities', () => {
  const originalNotification = window.Notification;
  const originalPushManager = window.PushManager;
  const originalServiceWorker = navigator.serviceWorker;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    // Restore originals after each test
    Object.defineProperty(window, 'Notification', {
      value: originalNotification,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'PushManager', {
      value: originalPushManager,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'serviceWorker', {
      value: originalServiceWorker,
      writable: true,
      configurable: true,
    });
  });

  describe('isPushSupported', () => {
    it('should return true when all APIs are available', async () => {
      Object.defineProperty(window, 'Notification', {
        value: { permission: 'default' },
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'PushManager', {
        value: {},
        writable: true,
        configurable: true,
      });
      Object.defineProperty(navigator, 'serviceWorker', {
        value: { register: vi.fn() },
        writable: true,
        configurable: true,
      });

      const { isPushSupported } = await import('../client');
      expect(isPushSupported()).toBe(true);
    });
  });

  describe('getPermissionState', () => {
    it('should return the current notification permission', async () => {
      Object.defineProperty(window, 'Notification', {
        value: { permission: 'granted' },
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'PushManager', {
        value: {},
        writable: true,
        configurable: true,
      });
      Object.defineProperty(navigator, 'serviceWorker', {
        value: { register: vi.fn() },
        writable: true,
        configurable: true,
      });

      const { getPermissionState } = await import('../client');
      expect(getPermissionState()).toBe('granted');
    });

    it('should return denied when permission is denied', async () => {
      Object.defineProperty(window, 'Notification', {
        value: { permission: 'denied' },
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'PushManager', {
        value: {},
        writable: true,
        configurable: true,
      });
      Object.defineProperty(navigator, 'serviceWorker', {
        value: { register: vi.fn() },
        writable: true,
        configurable: true,
      });

      const { getPermissionState } = await import('../client');
      expect(getPermissionState()).toBe('denied');
    });
  });

  describe('registerServiceWorker', () => {
    it('should register service worker when supported', async () => {
      const mockRegistration = { scope: '/' };
      Object.defineProperty(window, 'Notification', {
        value: { permission: 'default' },
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'PushManager', {
        value: {},
        writable: true,
        configurable: true,
      });
      Object.defineProperty(navigator, 'serviceWorker', {
        value: { register: vi.fn().mockResolvedValue(mockRegistration) },
        writable: true,
        configurable: true,
      });

      const { registerServiceWorker } = await import('../client');
      const result = await registerServiceWorker();
      expect(result).toBe(mockRegistration);
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
    });
  });

  describe('getCurrentSubscription', () => {
    it('should return subscription when available', async () => {
      const mockSubscription = { endpoint: 'https://example.com' };
      Object.defineProperty(window, 'Notification', {
        value: { permission: 'granted' },
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'PushManager', {
        value: {},
        writable: true,
        configurable: true,
      });
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: vi.fn(),
          ready: Promise.resolve({
            pushManager: {
              getSubscription: vi.fn().mockResolvedValue(mockSubscription),
            },
          }),
        },
        writable: true,
        configurable: true,
      });

      const { getCurrentSubscription } = await import('../client');
      const result = await getCurrentSubscription();
      expect(result).toBe(mockSubscription);
    });
  });

  describe('unsubscribeFromPush', () => {
    it('should unsubscribe and return true', async () => {
      const mockUnsubscribe = vi.fn().mockResolvedValue(true);
      Object.defineProperty(window, 'Notification', {
        value: { permission: 'granted' },
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'PushManager', {
        value: {},
        writable: true,
        configurable: true,
      });
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: vi.fn(),
          ready: Promise.resolve({
            pushManager: {
              getSubscription: vi.fn().mockResolvedValue({
                unsubscribe: mockUnsubscribe,
              }),
            },
          }),
        },
        writable: true,
        configurable: true,
      });

      const { unsubscribeFromPush } = await import('../client');
      const result = await unsubscribeFromPush();
      expect(result).toBe(true);
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});
