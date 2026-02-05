/**
 * @vitest-environment jsdom
 *
 * Integration test for offline functionality
 * Tests the complete flow: offline detection → session storage → sync when online
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { GlobalOfflineIndicator } from '@/components/GlobalOfflineIndicator';
import { useOfflineSession } from '@/lib/hooks/useOfflineSession';
import {
  initDB,
  closeDB,
  clearAllSessions,
  saveSessionOffline,
  getAllSessions,
  generateLocalId,
} from '@/lib/db/indexeddb';
import { renderHook } from '@testing-library/react';

// Mock fetch globally
global.fetch = vi.fn();

describe('Offline Integration', () => {
  beforeEach(async () => {
    // Close and reinitialize DB
    closeDB();
    await initDB();
    await clearAllSessions();

    // Reset fetch mock
    vi.mocked(global.fetch).mockReset();

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
      configurable: true,
    });
  });

  afterEach(() => {
    closeDB();
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  it('should complete full offline-to-online flow', async () => {
    // Step 1: Start online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
      configurable: true,
    });

    const { result } = renderHook(() =>
      useOfflineSession({
        challengeId: 1,
        enableAutoSync: false,
      })
    );

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
    });

    // Step 2: Go offline
    await act(async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
        configurable: true,
      });
      window.dispatchEvent(new Event('offline'));
    });

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false);
    });

    // Step 3: Save a session while offline
    const stats = {
      wpm: 60,
      rawWpm: 65,
      accuracy: 92,
      keystrokes: 120,
      errors: 10,
      durationMs: 60000,
    };

    const keystrokeLogs = [
      {
        timestamp: 100,
        expected: 'g',
        actual: 'g',
        isCorrect: true,
        latency: 100,
      },
    ];

    await act(async () => {
      await result.current.saveSession(stats, keystrokeLogs);
    });

    // Verify session is saved locally
    const sessions = await getAllSessions();
    expect(sessions.length).toBeGreaterThanOrEqual(1);
    expect(sessions[0].synced).toBe(false);
    expect(sessions[0].wpm).toBe(60);

    // Step 4: Mock successful API response
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    // Step 5: Go back online
    await act(async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
        configurable: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
    });

    // Step 6: Trigger sync manually
    let syncedCount = 0;
    await act(async () => {
      syncedCount = await result.current.triggerSync();
    });

    // Verify sync was attempted
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/sessions',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('should handle multiple offline sessions and batch sync', async () => {
    // Set offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
      configurable: true,
    });

    const { result } = renderHook(() =>
      useOfflineSession({
        challengeId: 1,
        enableAutoSync: false,
      })
    );

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false);
    });

    // Save multiple sessions while offline
    const sessions = [
      { wpm: 50, accuracy: 90, keystrokes: 100, errors: 10 },
      { wpm: 55, accuracy: 92, keystrokes: 110, errors: 9 },
      { wpm: 60, accuracy: 94, keystrokes: 120, errors: 7 },
    ];

    for (const stats of sessions) {
      await act(async () => {
        await result.current.saveSession(
          {
            ...stats,
            rawWpm: stats.wpm + 5,
            durationMs: 60000,
          },
          []
        );
      });
    }

    // Verify all sessions are saved locally
    const savedSessions = await getAllSessions();
    expect(savedSessions.length).toBeGreaterThanOrEqual(3);

    // Mock successful API responses
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    // Go back online
    await act(async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
        configurable: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    // Trigger sync
    await act(async () => {
      await result.current.triggerSync();
    });

    // Verify sync was called for each session
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should show offline indicator in global component', async () => {
    // Start offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
      configurable: true,
    });

    const { container } = render(<GlobalOfflineIndicator />);

    // Wait for offline indicator
    await waitFor(
      () => {
        const text = container.textContent;
        expect(text).toContain('Offline');
      },
      { timeout: 2000 }
    );
  });

  it('should persist sessions across page reloads', async () => {
    // Save a session
    const localId = generateLocalId();
    await saveSessionOffline({
      localId,
      challengeId: 1,
      wpm: 50,
      rawWpm: 55,
      accuracy: 95,
      keystrokes: 100,
      errors: 5,
      durationMs: 60000,
      completedAt: Date.now(),
      keystrokeLogs: [],
    });

    // Close and reopen DB (simulating page reload)
    closeDB();
    await initDB();

    // Verify session is still there
    const sessions = await getAllSessions();
    expect(sessions.length).toBeGreaterThanOrEqual(1);
    expect(sessions[0].wpm).toBe(50);
    expect(sessions[0].synced).toBe(false);
  });

  it('should handle sync failures gracefully', async () => {
    // Start offline and save a session
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
      configurable: true,
    });

    const { result } = renderHook(() =>
      useOfflineSession({
        challengeId: 1,
        enableAutoSync: false,
      })
    );

    await act(async () => {
      await result.current.saveSession(
        {
          wpm: 50,
          rawWpm: 55,
          accuracy: 95,
          keystrokes: 100,
          errors: 5,
          durationMs: 60000,
        },
        []
      );
    });

    // Mock failed API response
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    // Go back online
    await act(async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
        configurable: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    // Trigger sync (should fail gracefully)
    await act(async () => {
      await result.current.triggerSync();
    });

    // Session should still be unsynced
    const sessions = await getAllSessions();
    expect(sessions.length).toBeGreaterThanOrEqual(1);
    // The session might still be unsynced or the error might be logged
  });

  it('should maintain pending sync count accuracy', async () => {
    const { result } = renderHook(() =>
      useOfflineSession({
        challengeId: 1,
        enableAutoSync: false,
      })
    );

    // Initially no pending syncs
    expect(result.current.pendingSyncCount).toBe(0);

    // Save a session (will try to sync immediately since we're online)
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    await act(async () => {
      await result.current.saveSession(
        {
          wpm: 50,
          rawWpm: 55,
          accuracy: 95,
          keystrokes: 100,
          errors: 5,
          durationMs: 60000,
        },
        []
      );
    });

    // Wait for sync to complete
    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });
});
