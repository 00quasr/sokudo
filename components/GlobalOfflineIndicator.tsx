'use client';

import { OfflineIndicator } from './typing/OfflineIndicator';
import { useOfflineSession } from '@/lib/hooks/useOfflineSession';

/**
 * Global offline indicator that shows connection status and sync progress
 * across the entire app. Uses a temporary challengeId of 0 since this is
 * for global sync monitoring, not specific to any challenge.
 */
export function GlobalOfflineIndicator() {
  const { isOnline, pendingSyncCount, triggerSync } = useOfflineSession({
    challengeId: 0, // Temporary ID for global sync monitoring
    enableAutoSync: true,
    autoSyncIntervalMs: 60000, // Check every 60 seconds
  });

  return (
    <OfflineIndicator
      isOnline={isOnline}
      pendingSyncCount={pendingSyncCount}
      onSyncClick={triggerSync}
    />
  );
}
