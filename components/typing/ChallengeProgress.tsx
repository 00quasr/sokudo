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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
      <div className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-lg max-w-sm w-full">
        <div className="flex items-center gap-3">
          {current === total ? (
            <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 flex-shrink-0" />
          ) : (
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary flex-shrink-0" />
          )}
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-medium">
              Challenge {current}/{total} complete
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {current === total
                ? 'Category complete!'
                : 'Next challenge loading...'}
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
