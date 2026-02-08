'use client';

interface OfflineIndicatorProps {
  isOnline: boolean;
  pendingSyncCount: number;
  onSyncClick?: () => void;
}

export function OfflineIndicator({ isOnline, pendingSyncCount, onSyncClick }: OfflineIndicatorProps) {
  // Only show indicator when offline - sync happens silently in background
  // This removes the confusing "Back online - syncing X sessions" message
  if (isOnline) {
    return null;
  }

  return (
    <div
      className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300"
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" aria-hidden="true" />
          <span className="text-sm text-zinc-300">
            Offline{pendingSyncCount > 0 ? ` - ${pendingSyncCount} session${pendingSyncCount !== 1 ? 's' : ''} saved locally` : ''}
          </span>
          {onSyncClick && pendingSyncCount > 0 && (
            <button
              onClick={onSyncClick}
              className="ml-2 text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
              aria-label="Retry syncing sessions"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
