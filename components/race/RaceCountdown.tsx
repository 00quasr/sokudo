'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface RaceCountdownProps {
  /** Server-provided countdown value (3, 2, 1, 0) */
  countdownValue: number;
  /** Absolute Unix ms timestamp when the race starts (from server) */
  startTime?: number;
  /** Called when countdown reaches 0 and race should begin */
  onGo?: () => void;
  /** Current race status */
  status: 'countdown' | 'in_progress' | 'waiting' | 'finished';
}

export function RaceCountdown({
  countdownValue,
  startTime,
  onGo,
  status,
}: RaceCountdownProps) {
  const [displayValue, setDisplayValue] = useState<number | 'GO'>(
    countdownValue
  );
  const hasCalledGo = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerGo = useCallback(() => {
    if (!hasCalledGo.current) {
      hasCalledGo.current = true;
      setDisplayValue('GO');
      onGo?.();
    }
  }, [onGo]);

  // Sync with server countdown value
  useEffect(() => {
    if (status !== 'countdown') return;

    if (countdownValue > 0) {
      setDisplayValue(countdownValue);
    } else if (countdownValue === 0) {
      triggerGo();
    }
  }, [countdownValue, status, triggerGo]);

  // Use startTime for precise synchronization if available
  useEffect(() => {
    if (status !== 'countdown' || !startTime) return;

    function tick() {
      const remaining = startTime! - Date.now();
      if (remaining <= 0) {
        triggerGo();
        return;
      }

      const seconds = Math.ceil(remaining / 1000);
      setDisplayValue(Math.min(seconds, 3));

      timerRef.current = setTimeout(tick, 100);
    }

    tick();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [startTime, status, triggerGo]);

  // Reset when entering countdown
  useEffect(() => {
    if (status === 'countdown') {
      hasCalledGo.current = false;
    }
  }, [status]);

  // Clear GO display after race starts
  useEffect(() => {
    if (status === 'in_progress' && displayValue === 'GO') {
      const timeout = setTimeout(() => {
        setDisplayValue(0);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [status, displayValue]);

  if (status !== 'countdown' && displayValue !== 'GO') {
    return null;
  }

  const isGo = displayValue === 'GO';

  return (
    <div
      className="flex w-full flex-col items-center justify-center gap-3"
      data-testid="race-countdown"
    >
      <div
        className={`flex h-24 w-24 items-center justify-center rounded-full border-4 ${
          isGo
            ? 'border-green-500 bg-green-500/10'
            : 'border-purple-500 bg-purple-500/10'
        }`}
        data-testid="countdown-circle"
      >
        <span
          className={`font-mono font-bold ${
            isGo ? 'text-3xl text-green-400' : 'text-5xl text-purple-400'
          }`}
          data-testid="countdown-value"
        >
          {isGo ? 'GO!' : displayValue}
        </span>
      </div>
      <p
        className="text-sm text-zinc-400"
        data-testid="countdown-label"
      >
        {isGo ? 'Start typing!' : 'Get ready...'}
      </p>
    </div>
  );
}
