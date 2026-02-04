'use client';

import { useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight, RotateCcw, Trophy, Target, Clock, Zap, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ShareProgressButtons } from '@/components/typing/ShareProgressButtons';
import { AIHintTip } from '@/components/typing/AIHintTip';

export interface SessionResult {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  keystrokes: number;
  errors: number;
  durationMs: number;
}

export interface CategoryAggregateStats {
  totalSessions: number;
  uniqueChallenges: number;
  avgWpm: number;
  avgAccuracy: number;
  totalTimeMs: number;
  totalErrors: number;
  bestWpm: number;
}

export interface AdaptiveDifficultyInfo {
  recommendedDifficulty: string;
  currentDifficulty: string;
  reason: string;
  suggestedChallengeId?: number;
}

export interface ChallengeInfo {
  content: string;
  syntaxType: string;
  difficulty: string;
  hint?: string | null;
}

interface SessionCompleteProps {
  open: boolean;
  result: SessionResult;
  categorySlug: string;
  categoryName?: string;
  nextChallengeId?: number;
  adaptiveDifficulty?: AdaptiveDifficultyInfo | null;
  challengeInfo?: ChallengeInfo;
  categoryStats?: CategoryAggregateStats | null;
  onRetry: () => void;
  onClose: () => void;
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
    return { title: 'Great job!', message: 'You\'re building solid muscle memory.' };
  }
  if (accuracy >= 90) {
    return { title: 'Good work!', message: 'Focus on accuracy to improve further.' };
  }
  if (wpm >= 30) {
    return { title: 'Keep practicing!', message: 'Slow down to reduce errors.' };
  }
  return { title: 'Nice effort!', message: 'Practice makes perfect.' };
}

const difficultyColors: Record<string, string> = {
  beginner: 'text-green-400',
  intermediate: 'text-yellow-400',
  advanced: 'text-red-400',
};

const difficultyBgColors: Record<string, string> = {
  beginner: 'bg-green-500/10 border-green-500/20',
  intermediate: 'bg-yellow-500/10 border-yellow-500/20',
  advanced: 'bg-red-500/10 border-red-500/20',
};

export function SessionComplete({
  open,
  result,
  categorySlug,
  categoryName,
  nextChallengeId,
  adaptiveDifficulty,
  challengeInfo,
  categoryStats,
  onRetry,
  onClose,
}: SessionCompleteProps) {
  const { title, message } = getPerformanceMessage(result.wpm, result.accuracy);
  const isCategoryComplete = !nextChallengeId && categoryStats;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onRetry();
      } else if (e.key === 'Enter' || e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        // Let the link handle navigation if next challenge exists
        const nextButton = document.querySelector('[data-next-challenge]') as HTMLAnchorElement;
        if (nextButton) {
          nextButton.click();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [open, onRetry, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Use adaptive difficulty suggestion if available, otherwise fall back to sequential next
  const adaptiveChallengeId = adaptiveDifficulty?.suggestedChallengeId;
  const effectiveNextId = adaptiveChallengeId ?? nextChallengeId;
  const nextChallengeHref = effectiveNextId
    ? `/practice/${categorySlug}/${effectiveNextId}`
    : `/practice/${categorySlug}`;

  const showDifficultyChange =
    adaptiveDifficulty &&
    adaptiveDifficulty.recommendedDifficulty !== adaptiveDifficulty.currentDifficulty;

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

        {/* Stats grid */}
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

        {/* Category completion summary */}
        {isCategoryComplete && categoryStats && (
          <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
            <div className="mb-3 flex items-center gap-2 text-center justify-center">
              <Trophy className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-semibold text-foreground">Category Complete!</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Avg WPM</div>
                <div className="text-xl font-bold text-foreground">{categoryStats.avgWpm}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Best WPM</div>
                <div className="text-xl font-bold text-green-400">{categoryStats.bestWpm}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Avg Accuracy</div>
                <div className="text-xl font-bold text-foreground">{categoryStats.avgAccuracy}%</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Challenges</div>
                <div className="text-xl font-bold text-foreground">{categoryStats.uniqueChallenges}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Sessions</div>
                <div className="text-xl font-bold text-foreground">{categoryStats.totalSessions}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Time</div>
                <div className="text-xl font-bold text-foreground">{formatTime(categoryStats.totalTimeMs)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Adaptive difficulty indicator */}
        {showDifficultyChange && adaptiveDifficulty && (
          <div
            className={`rounded-lg border p-3 text-center text-sm ${
              difficultyBgColors[adaptiveDifficulty.recommendedDifficulty] ?? 'bg-muted/50'
            }`}
          >
            <span className="text-muted-foreground">Difficulty adjusted: </span>
            <span className={difficultyColors[adaptiveDifficulty.currentDifficulty] ?? ''}>
              {adaptiveDifficulty.currentDifficulty}
            </span>
            <span className="text-muted-foreground"> → </span>
            <span
              className={`font-medium ${
                difficultyColors[adaptiveDifficulty.recommendedDifficulty] ?? ''
              }`}
            >
              {adaptiveDifficulty.recommendedDifficulty}
            </span>
          </div>
        )}

        {/* AI Hints & Tips */}
        {challengeInfo && categoryName && (
          <AIHintTip
            challengeContent={challengeInfo.content}
            syntaxType={challengeInfo.syntaxType}
            difficulty={challengeInfo.difficulty}
            categoryName={categoryName}
            existingHint={challengeInfo.hint ?? undefined}
            userWpm={result.wpm}
            userAccuracy={result.accuracy}
          />
        )}

        {/* Actions */}
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
          <Link
            href={nextChallengeHref}
            data-next-challenge
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {effectiveNextId ? 'Next Challenge' : 'More Challenges'}
            <ChevronRight className="h-4 w-4" />
            <kbd className="ml-1 hidden rounded bg-primary-foreground/20 px-1.5 py-0.5 text-xs font-medium text-primary-foreground sm:inline-block">
              N
            </kbd>
          </Link>
        </div>

        {/* Share Progress */}
        <ShareProgressButtons
          wpm={result.wpm}
          accuracy={result.accuracy}
          categoryName={categoryName}
        />

        {/* Keyboard hints */}
        <div className="text-center text-xs text-muted-foreground">
          Press <kbd className="rounded bg-muted px-1 py-0.5 font-medium">R</kbd> to retry,{' '}
          <kbd className="rounded bg-muted px-1 py-0.5 font-medium">N</kbd> for next challenge,{' '}
          <kbd className="rounded bg-muted px-1 py-0.5 font-medium">Esc</kbd> to close
        </div>
      </DialogContent>
    </Dialog>
  );
}
