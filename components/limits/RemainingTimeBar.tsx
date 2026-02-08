'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PracticeLimitStatus } from '@/lib/limits/practice-limit';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface RemainingTimeBarProps {
  className?: string;
}

/**
 * Formats milliseconds to mm:ss display format
 */
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * RemainingTimeBar - Displays remaining practice time for free tier users
 *
 * Shows a subtle bar with:
 * - Remaining time counter
 * - Progress bar showing usage
 * - Warning state when time is low
 * - Upgrade CTA when approaching/at limit
 */
export function RemainingTimeBar({ className }: RemainingTimeBarProps) {
  const { data: status, isLoading } = useSWR<PracticeLimitStatus>(
    '/api/practice-limit',
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );

  // Don't show for unlimited users or while loading
  if (isLoading || !status || !status.isFreeTier) {
    return null;
  }

  const remainingMs = status.remainingMs ?? 0;
  const dailyLimitMs = status.dailyLimitMs ?? 0;
  const usedPercent = dailyLimitMs > 0
    ? Math.round((status.usedTodayMs / dailyLimitMs) * 100)
    : 0;

  // Time thresholds
  const isLow = remainingMs > 0 && remainingMs <= 5 * 60 * 1000; // 5 minutes or less
  const isExhausted = remainingMs === 0;

  if (isExhausted) {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-4 rounded-xl bg-white/[0.03] px-4 py-2.5',
          className
        )}
        role="alert"
        data-testid="remaining-time-bar"
      >
        <div className="flex items-center gap-2 text-sm text-white/60">
          <Clock className="h-4 w-4" />
          <span>Daily practice limit reached</span>
        </div>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-white/90"
        >
          <Zap className="h-3.5 w-3.5" />
          Upgrade
        </Link>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl bg-white/[0.03] px-4 py-2.5',
        className
      )}
      role="status"
      aria-live="polite"
      data-testid="remaining-time-bar"
    >
      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4 text-white/40" />
        <span className="text-white/60">
          <span className="font-medium text-white/80" data-testid="remaining-time">
            {formatTime(remainingMs)}
          </span>
          {' remaining today'}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-1 w-20 rounded-full bg-white/[0.08] overflow-hidden"
        role="progressbar"
        aria-valuenow={usedPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Daily practice time used"
      >
        <div
          className="h-full bg-white/30 transition-all duration-300"
          style={{ width: `${usedPercent}%` }}
          data-testid="remaining-time-progress"
        />
      </div>

      <span className="text-xs text-white/40" data-testid="remaining-time-percent">
        {usedPercent}% used
      </span>

      {isLow && (
        <Link
          href="/pricing"
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-white/90"
        >
          <Zap className="h-3.5 w-3.5" />
          Upgrade
        </Link>
      )}
    </div>
  );
}
