'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface ChallengeProgressProps {
  current: number;
  total: number;
  isTransitioning?: boolean;
}

export function ChallengeProgress({
  current,
  total,
  isTransitioning = false,
}: ChallengeProgressProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isTransitioning) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  if (!isTransitioning && !show) {
    return null;
  }

  const progress = (current / total) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-3 sm:px-4"
      role="status"
      aria-live="assertive"
      aria-label={`Challenge ${current} of ${total} complete. ${current === total ? 'Category complete!' : 'Loading next challenge'}`}
    >
      <div className="rounded-lg border border-border bg-card p-3 sm:p-4 md:p-6 shadow-lg max-w-[320px] sm:max-w-sm w-full">
        <div className="flex items-center gap-2 sm:gap-3">
          {current === total ? (
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-500 flex-shrink-0" aria-hidden="true" />
          ) : (
            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 animate-spin text-primary flex-shrink-0" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <div className="text-sm sm:text-base md:text-lg font-medium">
              Challenge {current}/{total} complete
            </div>
            <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
              {current === total
                ? 'Category complete!'
                : 'Next challenge loading...'}
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div
          className="mt-3 sm:mt-4 h-1.5 sm:h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Challenge progress: ${progress}%`}
        >
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
