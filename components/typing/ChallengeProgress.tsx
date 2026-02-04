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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center gap-3">
          {current === total ? (
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          ) : (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          )}
          <div>
            <div className="text-lg font-medium">
              Challenge {current}/{total} complete
            </div>
            <div className="text-sm text-muted-foreground">
              {current === total
                ? 'Category complete!'
                : 'Next challenge loading...'}
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-2 w-64 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
