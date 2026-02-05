'use client';

import { useEffect, useState } from 'react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  pendingSyncCount: number;
  onSyncClick?: () => void;
}

export function OfflineIndicator({ isOnline, pendingSyncCount, onSyncClick }: OfflineIndicatorProps) {
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [prevPendingCount, setPrevPendingCount] = useState(pendingSyncCount);
  const [justWentOnline, setJustWentOnline] = useState(false);

  // Detect when user goes from offline to online
  useEffect(() => {
    if (isOnline && !justWentOnline && pendingSyncCount > 0) {
      setJustWentOnline(true);
    } else if (!isOnline) {
      setJustWentOnline(false);
    }
  }, [isOnline, pendingSyncCount, justWentOnline]);

  // Show success message when sync completes
  useEffect(() => {
    if (prevPendingCount > 0 && pendingSyncCount === 0 && isOnline) {
      setShowSyncSuccess(true);
      const timer = setTimeout(() => setShowSyncSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
    setPrevPendingCount(pendingSyncCount);
  }, [pendingSyncCount, isOnline, prevPendingCount]);

  // Don't show anything if online and no pending items and no success message
  if (isOnline && pendingSyncCount === 0 && !showSyncSuccess) {
    return null;
  }

  return (
    <div
      className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300"
      role={!isOnline ? 'alert' : 'status'}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 shadow-lg">
        <div className="flex items-center gap-3">
          {!isOnline ? (
            <>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" aria-hidden="true" />
              <span className="text-sm text-zinc-300">Offline - sessions saved locally</span>
            </>
          ) : showSyncSuccess ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full" aria-hidden="true" />
              <span className="text-sm text-zinc-300">All sessions synced!</span>
            </>
          ) : pendingSyncCount > 0 ? (
            <>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" aria-hidden="true" />
              <span className="text-sm text-zinc-300">
                {justWentOnline ? 'Back online - syncing' : 'Syncing'} {pendingSyncCount} session{pendingSyncCount !== 1 ? 's' : ''}...
              </span>
              {onSyncClick && (
                <button
                  onClick={onSyncClick}
                  className="ml-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  aria-label="Retry syncing sessions"
                >
                  Retry
                </button>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
