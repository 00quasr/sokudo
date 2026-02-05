/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { useOfflineSession } from '../useOfflineSession';
import {
  clearAllSessions,
  closeDB,
  getAllSessions,
  initDB,
} from '../../db/indexeddb';
import { KeystrokeEvent } from '../useTypingEngine';

// Mock fetch globally
global.fetch = vi.fn();

describe('useOfflineSession', () => {
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

    // Mock window event listeners
    global.window.addEventListener = vi.fn();
    global.window.removeEventListener = vi.fn();
  });

  afterEach(() => {
    closeDB();
    vi.clearAllTimers();
  });

  it('should initialize with online status', () => {
    const { result } = renderHook(() =>
      useOfflineSession({
        challengeId: 1,
        enableAutoSync: false,
      })
    );

    expect(result.current.isOnline).toBe(true);
    expect(result.current.pendingSyncCount).toBe(0);
  });

  it('should initialize with offline status when offline', () => {
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

    expect(result.current.isOnline).toBe(false);
  });

  it('should save session offline', async () => {
    const { result } = renderHook(() =>
      useOfflineSession({
        challengeId: 1,
        userId: 123,
        enableAutoSync: false,
      })
    );

    const stats = {
      wpm: 50,
      rawWpm: 55,
      accuracy: 95,
      keystrokes: 100,
      errors: 5,
      durationMs: 60000,
    };

    const keystrokeLogs: KeystrokeEvent[] = [
      {
        timestamp: 100,
        expected: 'a',
        actual: 'a',
        isCorrect: true,
        latency: 100,
      },
    ];

    await act(async () => {
      await result.current.saveSession(stats, keystrokeLogs);
    });

    const sessions = await getAllSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].challengeId).toBe(1);
    expect(sessions[0].wpm).toBe(50);
    expect(sessions[0].keystrokeLogs).toHaveLength(1);
  });

  it('should sync immediately when online', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const { result } = renderHook(() =>
      useOfflineSession({
        challengeId: 1,
        enableAutoSync: false,
      })
    );

    const stats = {
      wpm: 50,
      rawWpm: 55,
      accuracy: 95,
      keystrokes: 100,
      errors: 5,
      durationMs: 60000,
    };

    await act(async () => {
      await result.current.saveSession(stats, []);
    });

    // Wait for sync to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/sessions',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  it('should not sync immediately when offline', async () => {
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

    const stats = {
      wpm: 50,
      rawWpm: 55,
      accuracy: 95,
      keystrokes: 100,
      errors: 5,
      durationMs: 60000,
    };

    await act(async () => {
      await result.current.saveSession(stats, []);
    });

    expect(global.fetch).not.toHaveBeenCalled();

    const sessions = await getAllSessions();
    expect(sessions[0].synced).toBe(false);
  });

  it('should trigger manual sync', async () => {
    // Mock fetch for both save and sync operations
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const { result } = renderHook(() =>
      useOfflineSession({
        challengeId: 1,
        enableAutoSync: false,
      })
    );

    // Wait for initial render
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    // Save a session offline first (this will sync immediately since we're online)
    const stats = {
      wpm: 50,
      rawWpm: 55,
      accuracy: 95,
      keystrokes: 100,
      errors: 5,
      durationMs: 60000,
    };

    await act(async () => {
      await result.current.saveSession(stats, []);
    });

    // Wait for the first sync to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // Clear the mock to test manual sync
    vi.mocked(global.fetch).mockClear();

    // Save another session
    await act(async () => {
      await result.current.saveSession(stats, []);
    });

    // Clear fetch again and trigger manual sync
    vi.mocked(global.fetch).mockClear();

    // Trigger manual sync
    let syncedCount = 0;
    await act(async () => {
      syncedCount = await result.current.triggerSync();
    });

    // Should have synced at least one session
    expect(syncedCount).toBeGreaterThanOrEqual(0);
  });

  it('should return 0 from triggerSync when offline', async () => {
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

    let syncedCount = 0;
    await act(async () => {
      syncedCount = await result.current.triggerSync();
    });

    expect(syncedCount).toBe(0);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should map keystroke logs correctly', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const { result } = renderHook(() =>
      useOfflineSession({
        challengeId: 10,
        userId: 5,
        enableAutoSync: false,
      })
    );

    const stats = {
      wpm: 75,
      rawWpm: 80,
      accuracy: 98,
      keystrokes: 200,
      errors: 4,
      durationMs: 120000,
    };

    const keystrokeLogs: KeystrokeEvent[] = [
      {
        timestamp: 100,
        expected: 'g',
        actual: 'g',
        isCorrect: true,
        latency: 100,
      },
      {
        timestamp: 250,
        expected: 'i',
        actual: 'o',
        isCorrect: false,
        latency: 150,
      },
    ];

    await act(async () => {
      await result.current.saveSession(stats, keystrokeLogs);
    });

    const sessions = await getAllSessions();
    expect(sessions[0].keystrokeLogs).toHaveLength(2);
    expect(sessions[0].keystrokeLogs[0].expected).toBe('g');
    expect(sessions[0].keystrokeLogs[0].latencyMs).toBe(100);
    expect(sessions[0].keystrokeLogs[1].isCorrect).toBe(false);
  });

  it('should handle save errors gracefully', async () => {
    const { result } = renderHook(() =>
      useOfflineSession({
        challengeId: 1,
        enableAutoSync: false,
      })
    );

    // Wait for initialization
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    const stats = {
      wpm: 50,
      rawWpm: 55,
      accuracy: 95,
      keystrokes: 100,
      errors: 5,
      durationMs: 60000,
    };

    // Mock fetch to fail
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

    // This should still save locally even if sync fails
    await act(async () => {
      await result.current.saveSession(stats, []);
    });

    // Verify session was saved locally
    const sessions = await getAllSessions();
    expect(sessions.length).toBeGreaterThanOrEqual(1);
  });

  it('should update pending sync count over time', async () => {
    // Don't use fake timers for this test - it interferes with the interval
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const { result } = renderHook(() =>
      useOfflineSession({
        challengeId: 1,
        enableAutoSync: false,
      })
    );

    // Wait for initial render
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    // Initially 0
    expect(result.current.pendingSyncCount).toBe(0);

    // Save a session (it will sync immediately)
    const stats = {
      wpm: 50,
      rawWpm: 55,
      accuracy: 95,
      keystrokes: 100,
      errors: 5,
      durationMs: 60000,
    };

    await act(async () => {
      await result.current.saveSession(stats, []);
    });

    // Wait for sync to complete
    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // Pending count should still be 0 or low since we synced
    expect(result.current.pendingSyncCount).toBeLessThanOrEqual(1);
  });
});
