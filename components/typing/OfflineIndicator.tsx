'use client';

interface OfflineIndicatorProps {
  isOnline: boolean;
  pendingSyncCount: number;
}

export function OfflineIndicator({ isOnline, pendingSyncCount }: OfflineIndicatorProps) {
  if (isOnline && pendingSyncCount === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-sm text-zinc-300">Offline - sessions saved locally</span>
            </>
          ) : pendingSyncCount > 0 ? (
            <>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm text-zinc-300">
                Syncing {pendingSyncCount} session{pendingSyncCount !== 1 ? 's' : ''}...
              </span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
