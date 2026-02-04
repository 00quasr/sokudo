'use client';

import { useEffect, useCallback } from 'react';
import { RotateCcw, Trophy, Target, Clock, Zap, XCircle, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface SessionResult {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  keystrokes: number;
  errors: number;
  durationMs: number;
}

interface CommunitySessionCompleteProps {
  open: boolean;
  result: SessionResult;
  onRetry: () => void;
  onClose: () => void;
  onBack: () => void;
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}.${Math.floor((ms % 1000) / 100)}s`;
}

function getPerformanceMessage(wpm: number, accuracy: number): { title: string; message: string } {
  if (accuracy >= 98 && wpm >= 60) {
    return { title: 'Excellent!', message: 'Outstanding speed and accuracy!' };
  }
  if (accuracy >= 95 && wpm >= 45) {
    return { title: 'Great job!', message: "You're building solid muscle memory." };
  }
  if (accuracy >= 90) {
    return { title: 'Good work!', message: 'Focus on accuracy to improve further.' };
  }
  if (wpm >= 30) {
    return { title: 'Keep practicing!', message: 'Slow down to reduce errors.' };
  }
  return { title: 'Nice effort!', message: 'Practice makes perfect.' };
}

export function CommunitySessionComplete({
  open,
  result,
  onRetry,
  onClose,
  onBack,
}: CommunitySessionCompleteProps) {
  const { title, message } = getPerformanceMessage(result.wpm, result.accuracy);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onRetry();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        onBack();
      }
    },
    [open, onRetry, onClose, onBack]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <Trophy className="h-8 w-8 text-green-500" />
          </div>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-4 text-center">
            <div className="mb-1 flex items-center justify-center gap-1.5 text-muted-foreground">
              <Zap className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">WPM</span>
            </div>
            <div className="text-3xl font-bold text-foreground">{result.wpm}</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-4 text-center">
            <div className="mb-1 flex items-center justify-center gap-1.5 text-muted-foreground">
              <Target className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Accuracy</span>
            </div>
            <div className="text-3xl font-bold text-foreground">{result.accuracy}%</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-4 text-center">
            <div className="mb-1 flex items-center justify-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Time</span>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {formatTime(result.durationMs)}
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-4 text-center">
            <div className="mb-1 flex items-center justify-center gap-1.5 text-muted-foreground">
              <XCircle className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Errors</span>
            </div>
            <div className="text-3xl font-bold text-foreground">{result.errors}</div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 transition-colors hover:bg-muted"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
            <kbd className="ml-1 hidden rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground sm:inline-block">
              R
            </kbd>
          </button>
          <button
            onClick={onBack}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4" />
            Browse More
            <kbd className="ml-1 hidden rounded bg-primary-foreground/20 px-1.5 py-0.5 text-xs font-medium text-primary-foreground sm:inline-block">
              B
            </kbd>
          </button>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          Press <kbd className="rounded bg-muted px-1 py-0.5 font-medium">R</kbd> to retry,{' '}
          <kbd className="rounded bg-muted px-1 py-0.5 font-medium">B</kbd> to browse more,{' '}
          <kbd className="rounded bg-muted px-1 py-0.5 font-medium">Esc</kbd> to close
        </div>
      </DialogContent>
    </Dialog>
  );
}
