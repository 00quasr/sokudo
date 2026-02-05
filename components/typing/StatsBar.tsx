'use client';

import { cn } from '@/lib/utils';
import type { TypingStats } from '@/lib/hooks/useTypingEngine';

export interface StatsBarProps {
  stats: TypingStats;
  progress?: number;
  showProgress?: boolean;
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
 * StatsBar - Displays live typing statistics
 *
 * Shows WPM, accuracy, and elapsed time in a subtle, non-prominent bar.
 * Optionally displays a progress indicator.
 *
 * Design principles:
 * - Subtle and not prominent (doesn't distract from typing)
 * - Real-time updates
 * - Dark mode optimized
 */
export function StatsBar({
  stats,
  progress = 0,
  showProgress = true,
  className,
}: StatsBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 sm:gap-4 md:gap-6 lg:gap-8 text-xs sm:text-sm md:text-base text-muted-foreground',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label="Typing statistics"
    >
      {/* WPM */}
      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 touch-target">
        <span className="text-[10px] sm:text-xs md:text-sm uppercase tracking-wide">WPM</span>
        <span
          className="font-mono text-sm sm:text-base md:text-lg text-foreground font-medium"
          data-testid="stats-wpm"
        >
          {stats.wpm}
        </span>
      </div>

      {/* Accuracy */}
      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 touch-target">
        <span className="text-[10px] sm:text-xs md:text-sm uppercase tracking-wide">ACC</span>
        <span
          className="font-mono text-sm sm:text-base md:text-lg text-foreground font-medium"
          data-testid="stats-accuracy"
        >
          {stats.accuracy}%
        </span>
      </div>

      {/* Time elapsed */}
      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 touch-target">
        <span className="text-[10px] sm:text-xs md:text-sm uppercase tracking-wide">Time</span>
        <span
          className="font-mono text-sm sm:text-base md:text-lg text-foreground font-medium"
          data-testid="stats-time"
        >
          {formatTime(stats.durationMs)}
        </span>
      </div>

      {/* Progress indicator - subtle */}
      {showProgress && (
        <div className="flex items-center gap-1.5 sm:gap-2 sm:ml-auto w-full sm:w-auto mt-2 sm:mt-0">
          <div
            className="h-1 sm:h-1.5 md:h-2 flex-1 sm:flex-none sm:w-20 md:w-28 lg:w-32 rounded-full bg-muted overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Typing progress"
          >
            <div
              className="h-full bg-primary transition-all duration-150"
              style={{ width: `${progress}%` }}
              data-testid="stats-progress-fill"
            />
          </div>
          <span
            className="font-mono text-[10px] sm:text-xs md:text-sm whitespace-nowrap"
            data-testid="stats-progress-text"
          >
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
}

export type { TypingStats };
