/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import {
  syncOfflineSessions,
  setupAutoSync,
} from '../sync-sessions';
import {
  saveSessionOffline,
  getUnsyncedSessions,
  clearAllSessions,
  generateLocalId,
  closeDB,
  OfflineTypingSession,
  getAllSessions,
} from '../indexeddb';

// Mock fetch globally
global.fetch = vi.fn();

describe('Session sync utilities', () => {
  beforeEach(async () => {
    // Clear all sessions before each test
    try {
      await clearAllSessions();
    } catch {
      // Ignore errors if DB doesn't exist yet
    }
    closeDB();

    // Reset fetch mock
    vi.mocked(global.fetch).mockReset();

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    closeDB();
  });

  describe('syncOfflineSessions', () => {
    it('should return 0 when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const session: Omit<OfflineTypingSession, 'id' | 'synced'> = {
        localId: generateLocalId(),
        challengeId: 1,
        wpm: 50,
        rawWpm: 55,
        accuracy: 95,
        keystrokes: 100,
        errors: 5,
        durationMs: 60000,
        completedAt: Date.now(),
        keystrokeLogs: [],
      };

      await saveSessionOffline(session);

      const syncedCount = await syncOfflineSessions();
      expect(syncedCount).toBe(0);

      // Verify session is still not synced
      const allSessions = await getAllSessions();
      expect(allSessions[0].synced).toBe(false);
    });

    it('should return 0 when no unsynced sessions exist', async () => {
      const syncedCount = await syncOfflineSessions();
      expect(syncedCount).toBe(0);
    });

    it('should sync unsynced sessions when online', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const session: Omit<OfflineTypingSession, 'id' | 'synced'> = {
        localId: generateLocalId(),
        challengeId: 1,
        wpm: 50,
        rawWpm: 55,
        accuracy: 95,
        keystrokes: 100,
        errors: 5,
        durationMs: 60000,
        completedAt: Date.now(),
        keystrokeLogs: [
          {
            timestamp: 100,
            expected: 'a',
            actual: 'a',
            isCorrect: true,
            latencyMs: 100,
          },
        ],
      };

      await saveSessionOffline(session);

      const allBefore = await getAllSessions();
      expect(allBefore).toHaveLength(1);
      expect(allBefore[0].synced).toBe(false);

      const syncedCount = await syncOfflineSessions();
      expect(syncedCount).toBe(1);

      expect(global.fetch).toHaveBeenCalledWith('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"challengeId":1'),
      });

      const allAfter = await getAllSessions();
      expect(allAfter[0].synced).toBe(true);
    });

    it('should handle multiple sessions', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const session1: Omit<OfflineTypingSession, 'id' | 'synced'> = {
        localId: generateLocalId(),
        challengeId: 1,
        wpm: 50,
        rawWpm: 55,
        accuracy: 95,
        keystrokes: 100,
        errors: 5,
        durationMs: 60000,
        completedAt: Date.now(),
        keystrokeLogs: [],
      };

      const session2: Omit<OfflineTypingSession, 'id' | 'synced'> = {
        localId: generateLocalId(),
        challengeId: 2,
        wpm: 60,
        rawWpm: 65,
        accuracy: 92,
        keystrokes: 120,
        errors: 10,
        durationMs: 70000,
        completedAt: Date.now(),
        keystrokeLogs: [],
      };

      await saveSessionOffline(session1);
      await saveSessionOffline(session2);

      const syncedCount = await syncOfflineSessions();
      expect(syncedCount).toBe(2);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should continue syncing if one session fails', async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Internal Server Error',
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        } as Response);

      const session1: Omit<OfflineTypingSession, 'id' | 'synced'> = {
        localId: generateLocalId(),
        challengeId: 1,
        wpm: 50,
        rawWpm: 55,
        accuracy: 95,
        keystrokes: 100,
        errors: 5,
        durationMs: 60000,
        completedAt: Date.now(),
        keystrokeLogs: [],
      };

      const session2: Omit<OfflineTypingSession, 'id' | 'synced'> = {
        localId: generateLocalId(),
        challengeId: 2,
        wpm: 60,
        rawWpm: 65,
        accuracy: 92,
        keystrokes: 120,
        errors: 10,
        durationMs: 70000,
        completedAt: Date.now(),
        keystrokeLogs: [],
      };

      await saveSessionOffline(session1);
      await saveSessionOffline(session2);

      const syncedCount = await syncOfflineSessions();
      expect(syncedCount).toBe(1);

      const allAfter = await getAllSessions();
      const unsyncedCount = allAfter.filter(s => !s.synced).length;
      expect(unsyncedCount).toBe(1);
    });

    it('should send correct payload to API', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const completedAt = Date.now();
      const session: Omit<OfflineTypingSession, 'id' | 'synced'> = {
        localId: generateLocalId(),
        challengeId: 5,
        wpm: 75,
        rawWpm: 80,
        accuracy: 98,
        keystrokes: 200,
        errors: 4,
        durationMs: 120000,
        completedAt,
        keystrokeLogs: [
          {
            timestamp: 100,
            expected: 'g',
            actual: 'g',
            isCorrect: true,
            latencyMs: 100,
          },
          {
            timestamp: 250,
            expected: 'i',
            actual: 'i',
            isCorrect: true,
            latencyMs: 150,
          },
        ],
      };

      await saveSessionOffline(session);
      await syncOfflineSessions();

      expect(global.fetch).toHaveBeenCalledWith('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId: 5,
          wpm: 75,
          rawWpm: 80,
          accuracy: 98,
          keystrokes: 200,
          errors: 4,
          durationMs: 120000,
          completedAt: new Date(completedAt).toISOString(),
          keystrokeLogs: [
            {
              timestamp: 100,
              expected: 'g',
              actual: 'g',
              isCorrect: true,
              latencyMs: 100,
            },
            {
              timestamp: 250,
              expected: 'i',
              actual: 'i',
              isCorrect: true,
              latencyMs: 150,
            },
          ],
        }),
      });
    });
  });

  describe('setupAutoSync', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return a cleanup function', () => {
      const cleanup = setupAutoSync(60000);
      expect(typeof cleanup).toBe('function');
      cleanup();
    });

    it('should sync immediately when online', async () => {
      vi.useRealTimers(); // Use real timers for this test

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const session: Omit<OfflineTypingSession, 'id' | 'synced'> = {
        localId: generateLocalId(),
        challengeId: 1,
        wpm: 50,
        rawWpm: 55,
        accuracy: 95,
        keystrokes: 100,
        errors: 5,
        durationMs: 60000,
        completedAt: Date.now(),
        keystrokeLogs: [],
      };

      await saveSessionOffline(session);

      const cleanup = setupAutoSync(60000);

      // Wait for immediate sync
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(global.fetch).toHaveBeenCalled();

      cleanup();
      vi.useFakeTimers(); // Restore fake timers for other tests
    });

    it('should sync periodically', async () => {
      vi.useRealTimers(); // Use real timers for this test

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      // Add an unsynced session so there's something to sync
      const session: Omit<OfflineTypingSession, 'id' | 'synced'> = {
        localId: generateLocalId(),
        challengeId: 1,
        wpm: 50,
        rawWpm: 55,
        accuracy: 95,
        keystrokes: 100,
        errors: 5,
        durationMs: 60000,
        completedAt: Date.now(),
        keystrokeLogs: [],
      };

      await saveSessionOffline(session);

      const cleanup = setupAutoSync(200); // Use shorter interval for testing

      // Wait for immediate sync
      await new Promise((resolve) => setTimeout(resolve, 100));
      const callCountAfterImmediate = vi.mocked(global.fetch).mock.calls.length;
      expect(callCountAfterImmediate).toBeGreaterThan(0);

      // Add another session to sync
      const session2: Omit<OfflineTypingSession, 'id' | 'synced'> = {
        localId: generateLocalId(),
        challengeId: 2,
        wpm: 60,
        rawWpm: 65,
        accuracy: 92,
        keystrokes: 120,
        errors: 10,
        durationMs: 70000,
        completedAt: Date.now(),
        keystrokeLogs: [],
      };
      await saveSessionOffline(session2);

      // Wait for periodic sync
      await new Promise((resolve) => setTimeout(resolve, 250));

      const callCountAfterPeriodic = vi.mocked(global.fetch).mock.calls.length;
      expect(callCountAfterPeriodic).toBeGreaterThan(callCountAfterImmediate);

      cleanup();
      vi.useFakeTimers(); // Restore fake timers for other tests
    });
  });
});
