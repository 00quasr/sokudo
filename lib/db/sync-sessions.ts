'use client';

import {
  getUnsyncedSessions,
  markSessionAsSynced,
  deleteSession,
  OfflineTypingSession,
} from './indexeddb';

// Prevent concurrent sync calls
let isSyncing = false;

// Delay between individual session syncs to avoid rate limiting
const SYNC_DELAY_MS = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sync offline sessions to the server
 * Returns number of successfully synced sessions
 */
export async function syncOfflineSessions(): Promise<number> {
  // Check if we're online
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 0;
  }

  // Prevent concurrent syncs
  if (isSyncing) {
    return 0;
  }

  isSyncing = true;

  try {
    const unsyncedSessions = await getUnsyncedSessions();

    if (unsyncedSessions.length === 0) {
      return 0;
    }

    let syncedCount = 0;

    for (const session of unsyncedSessions) {
      try {
        await syncSingleSession(session);
        await markSessionAsSynced(session.localId);
        // Optionally delete after successful sync
        // await deleteSession(session.localId);
        syncedCount++;

        // Delay between syncs to avoid rate limiting
        if (syncedCount < unsyncedSessions.length) {
          await delay(SYNC_DELAY_MS);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('Too Many Requests')) {
          console.warn('Rate limited while syncing sessions, will retry later');
          break;
        }
        console.error('Failed to sync session:', session.localId, error);
        // Continue with next session
      }
    }

    return syncedCount;
  } catch (error) {
    console.error('Failed to sync offline sessions:', error);
    return 0;
  } finally {
    isSyncing = false;
  }
}

/**
 * Sync a single session to the server with retry on 429
 */
async function syncSingleSession(session: OfflineTypingSession): Promise<void> {
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        challengeId: session.challengeId,
        wpm: session.wpm,
        rawWpm: session.rawWpm,
        accuracy: session.accuracy,
        keystrokes: session.keystrokes,
        errors: session.errors,
        durationMs: session.durationMs,
        completedAt: new Date(session.completedAt).toISOString(),
        keystrokeLogs: session.keystrokeLogs.map((log) => ({
          timestamp: log.timestamp,
          expected: log.expected,
          actual: log.actual,
          isCorrect: log.isCorrect,
          latencyMs: log.latencyMs,
        })),
      }),
    });

    if (response.ok) {
      return;
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const backoffMs = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : Math.min(1000 * Math.pow(2, attempt), 10000);
      await delay(backoffMs);
      continue;
    }

    throw new Error(`Failed to sync session: ${response.statusText}`);
  }

  throw new Error('Failed to sync session: Too Many Requests');
}

/**
 * Set up automatic sync when online
 */
export function setupAutoSync(intervalMs: number = 60000): () => void {
  let intervalId: NodeJS.Timeout | null = null;

  const startSync = () => {
    // Sync immediately
    syncOfflineSessions().catch(console.error);

    // Set up periodic sync
    intervalId = setInterval(() => {
      syncOfflineSessions().catch(console.error);
    }, intervalMs);
  };

  const stopSync = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  // Listen for online/offline events
  const handleOnline = () => {
    startSync();
  };

  const handleOffline = () => {
    stopSync();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Start sync if already online
    if (navigator.onLine) {
      startSync();
    }
  }

  // Return cleanup function
  return () => {
    stopSync();
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  };
}
