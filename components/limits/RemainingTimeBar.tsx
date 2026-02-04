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
          'flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2',
          className
        )}
        role="alert"
        data-testid="remaining-time-bar"
      >
        <div className="flex items-center gap-2 text-sm text-red-700">
          <Clock className="h-4 w-4" />
          <span>Daily practice limit reached</span>
        </div>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 rounded-md bg-orange-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-orange-600"
        >
          <Zap className="h-3.5 w-3.5" />
          Upgrade for Unlimited
        </Link>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg border px-4 py-2',
        isLow
          ? 'border-yellow-200 bg-yellow-50'
          : 'border-gray-200 bg-gray-50',
        className
      )}
      role="status"
      aria-live="polite"
      data-testid="remaining-time-bar"
    >
      <div className="flex items-center gap-2 text-sm">
        <Clock className={cn('h-4 w-4', isLow ? 'text-yellow-600' : 'text-gray-500')} />
        <span className={cn(isLow ? 'text-yellow-700' : 'text-gray-600')}>
          <span className="font-medium" data-testid="remaining-time">
            {formatTime(remainingMs)}
          </span>
          {' remaining today'}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 w-24 rounded-full bg-gray-200 overflow-hidden"
        role="progressbar"
        aria-valuenow={usedPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Daily practice time used"
      >
        <div
          className={cn(
            'h-full transition-all duration-300',
            isLow ? 'bg-yellow-500' : 'bg-orange-500'
          )}
          style={{ width: `${usedPercent}%` }}
          data-testid="remaining-time-progress"
        />
      </div>

      <span className="text-xs text-gray-500" data-testid="remaining-time-percent">
        {usedPercent}% used
      </span>

      {isLow && (
        <Link
          href="/pricing"
          className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-orange-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-orange-600"
        >
          <Zap className="h-3.5 w-3.5" />
          Upgrade
        </Link>
      )}
    </div>
  );
}
