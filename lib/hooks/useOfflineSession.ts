'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  saveSessionOffline,
  generateLocalId,
  OfflineTypingSession,
  OfflineKeystrokeLog,
  initDB,
} from '../db/indexeddb';
import { syncOfflineSessions, setupAutoSync } from '../db/sync-sessions';
import { KeystrokeEvent } from './useTypingEngine';

export interface UseOfflineSessionOptions {
  challengeId: number;
  userId?: number;
  enableAutoSync?: boolean;
  autoSyncIntervalMs?: number;
}

export interface UseOfflineSessionReturn {
  isOnline: boolean;
  pendingSyncCount: number;
  saveSession: (
    stats: {
      wpm: number;
      rawWpm: number;
      accuracy: number;
      keystrokes: number;
      errors: number;
      durationMs: number;
    },
    keystrokeLogs: KeystrokeEvent[]
  ) => Promise<void>;
  triggerSync: () => Promise<number>;
}

/**
 * Hook to manage offline session storage and syncing
 */
export function useOfflineSession(
  options: UseOfflineSessionOptions
): UseOfflineSessionReturn {
  const { challengeId, userId, enableAutoSync = true, autoSyncIntervalMs = 60000 } = options;
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Initialize IndexedDB on mount
  useEffect(() => {
    initDB().catch(console.error);
  }, []);

  // Set up online/offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Set up auto-sync
  useEffect(() => {
    if (enableAutoSync && typeof window !== 'undefined') {
      cleanupRef.current = setupAutoSync(autoSyncIntervalMs);

      return () => {
        if (cleanupRef.current) {
          cleanupRef.current();
        }
      };
    }
  }, [enableAutoSync, autoSyncIntervalMs]);

  // Update pending sync count periodically
  useEffect(() => {
    const updatePendingCount = async () => {
      try {
        const { getUnsyncedSessions } = await import('../db/indexeddb');
        const unsynced = await getUnsyncedSessions();
        setPendingSyncCount(unsynced.length);
      } catch (error) {
        console.error('Failed to get pending sync count:', error);
      }
    };

    updatePendingCount();

    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const saveSession = useCallback(
    async (
      stats: {
        wpm: number;
        rawWpm: number;
        accuracy: number;
        keystrokes: number;
        errors: number;
        durationMs: number;
      },
      keystrokeLogs: KeystrokeEvent[]
    ) => {
      const localId = generateLocalId();

      const offlineSession: Omit<OfflineTypingSession, 'id' | 'synced'> = {
        localId,
        userId,
        challengeId,
        wpm: stats.wpm,
        rawWpm: stats.rawWpm,
        accuracy: stats.accuracy,
        keystrokes: stats.keystrokes,
        errors: stats.errors,
        durationMs: stats.durationMs,
        completedAt: Date.now(),
        keystrokeLogs: keystrokeLogs.map(
          (log): OfflineKeystrokeLog => ({
            timestamp: log.timestamp,
            expected: log.expected,
            actual: log.actual,
            isCorrect: log.isCorrect,
            latencyMs: log.latency,
          })
        ),
      };

      try {
        // Always save to IndexedDB first
        await saveSessionOffline(offlineSession);

        // If online, try to sync immediately
        if (isOnline) {
          await syncOfflineSessions();
        }
      } catch (error) {
        console.error('Failed to save session offline:', error);
        throw error;
      }
    },
    [challengeId, userId, isOnline]
  );

  const triggerSync = useCallback(async (): Promise<number> => {
    if (!isOnline) {
      return 0;
    }

    try {
      const syncedCount = await syncOfflineSessions();
      setPendingSyncCount((prev) => Math.max(0, prev - syncedCount));
      return syncedCount;
    } catch (error) {
      console.error('Failed to trigger sync:', error);
      return 0;
    }
  }, [isOnline]);

  return {
    isOnline,
    pendingSyncCount,
    saveSession,
    triggerSync,
  };
}
