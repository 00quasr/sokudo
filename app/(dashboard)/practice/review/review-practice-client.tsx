'use client';

import { useCallback, useState } from 'react';
import { TypingInput, TypingStats, KeystrokeEvent } from '@/components/typing/TypingInput';
import {
  Clock,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface ReviewItem {
  id: number;
  challengeId: number;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: Date | string;
  lastReviewedAt: Date | string | null;
  lastQuality: number | null;
  challengeContent: string;
  challengeDifficulty: string;
  challengeSyntaxType: string;
  challengeHint: string | null;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
}

interface ReviewStats {
  totalItems: number;
  dueItems: number;
  avgEaseFactor: number;
  avgInterval: number;
}

interface ReviewPracticeClientProps {
  initialItems: ReviewItem[];
  stats: ReviewStats;
}

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const qualityLabels: Record<number, { label: string; color: string }> = {
  0: { label: 'Failed', color: 'text-red-500' },
  1: { label: 'Poor', color: 'text-red-400' },
  2: { label: 'Difficult', color: 'text-orange-500' },
  3: { label: 'Acceptable', color: 'text-yellow-500' },
  4: { label: 'Good', color: 'text-green-400' },
  5: { label: 'Excellent', color: 'text-green-500' },
};

function mapSyntaxType(syntaxType: string) {
  const validTypes = [
    'plain', 'git', 'shell', 'react', 'typescript',
    'docker', 'sql', 'npm', 'yarn', 'pnpm'
  ] as const;

  const syntaxMap: Record<string, typeof validTypes[number]> = {
    bash: 'shell',
    terminal: 'shell',
    ts: 'typescript',
    js: 'typescript',
    javascript: 'typescript',
    jsx: 'react',
    tsx: 'react',
  };

  const normalized = syntaxType.toLowerCase();
  if ((validTypes as readonly string[]).includes(normalized)) {
    return normalized as typeof validTypes[number];
  }
  return syntaxMap[normalized] ?? 'plain';
}

function formatInterval(days: number): string {
  if (days === 0) return 'New';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.round(days / 7)} weeks`;
  if (days < 365) return `${Math.round(days / 30)} months`;
  return `${Math.round(days / 365)} years`;
}

export function ReviewPracticeClient({
  initialItems,
  stats,
}: ReviewPracticeClientProps) {
  const [items, setItems] = useState(initialItems);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionResults, setSessionResults] = useState<Array<{
    wpm: number;
    accuracy: number;
    errors: number;
    durationMs: number;
    challengeId: number;
    quality: number;
    newInterval: number;
  }>>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [typingKey, setTypingKey] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const currentItem = items[currentIndex];
  const totalItems = items.length;

  const handleComplete = useCallback(async (typingStats: TypingStats, keystrokeLog: KeystrokeEvent[]) => {
    const item = items[currentIndex];
    if (!item) return;

    // Record the review via API
    try {
      const response = await fetch('/api/practice/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: item.challengeId,
          wpm: typingStats.wpm,
          accuracy: typingStats.accuracy,
        }),
      });

      if (response.ok) {
        const data = await response.json() as {
          quality: number;
          interval: number;
        };
        setSessionResults((prev) => [
          ...prev,
          {
            wpm: typingStats.wpm,
            accuracy: typingStats.accuracy,
            errors: typingStats.errors,
            durationMs: typingStats.durationMs,
            challengeId: item.challengeId,
            quality: data.quality,
            newInterval: data.interval,
          },
        ]);
      } else {
        setSessionResults((prev) => [
          ...prev,
          {
            wpm: typingStats.wpm,
            accuracy: typingStats.accuracy,
            errors: typingStats.errors,
            durationMs: typingStats.durationMs,
            challengeId: item.challengeId,
            quality: -1,
            newInterval: 0,
          },
        ]);
      }
    } catch {
      setSessionResults((prev) => [
        ...prev,
        {
          wpm: typingStats.wpm,
          accuracy: typingStats.accuracy,
          errors: typingStats.errors,
          durationMs: typingStats.durationMs,
          challengeId: item.challengeId,
          quality: -1,
          newInterval: 0,
        },
      ]);
    }

    // Also save as a regular session for stats tracking
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeId: item.challengeId,
        wpm: typingStats.wpm,
        rawWpm: typingStats.rawWpm,
        accuracy: typingStats.accuracy,
        keystrokes: typingStats.keystrokes,
        errors: typingStats.errors,
        durationMs: typingStats.durationMs,
        keystrokeLogs: keystrokeLog.map((k) => ({
          timestamp: k.timestamp,
          expected: k.expected,
          actual: k.actual,
          isCorrect: k.isCorrect,
          latencyMs: k.latency,
        })),
      }),
    }).catch(() => { /* non-blocking */ });

    if (currentIndex >= totalItems - 1) {
      setIsComplete(true);
    }
  }, [currentIndex, totalItems, items]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalItems - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTypingKey((prev) => prev + 1);
    } else {
      setIsComplete(true);
    }
  }, [currentIndex, totalItems]);

  const handleSkip = useCallback(() => {
    handleNext();
  }, [handleNext]);

  const handleRetry = useCallback(() => {
    setTypingKey((prev) => prev + 1);
  }, []);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setSessionResults([]);
    setIsComplete(false);
    setTypingKey((prev) => prev + 1);
  }, []);

  const handleRefreshQueue = useCallback(async () => {
    setIsLoadingMore(true);
    try {
      const response = await fetch('/api/practice/review?limit=10');
      if (response.ok) {
        const data = await response.json() as { items: ReviewItem[] };
        setItems(data.items);
        setCurrentIndex(0);
        setSessionResults([]);
        setIsComplete(false);
        setTypingKey((prev) => prev + 1);
      }
    } catch {
      handleRestart();
    } finally {
      setIsLoadingMore(false);
    }
  }, [handleRestart]);

  // Empty state - no due reviews
  if (items.length === 0 && !isComplete) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-cyan-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">All caught up!</h2>
          <p className="text-sm text-muted-foreground mb-4">
            No challenges are due for review right now.
            Complete more typing sessions to build your review queue.
          </p>

          {stats.totalItems > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-6 max-w-xs mx-auto">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground mb-1">Total Items</p>
                <p className="text-lg font-mono font-semibold">{stats.totalItems}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground mb-1">Avg Interval</p>
                <p className="text-lg font-mono font-semibold">{formatInterval(stats.avgInterval)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Session complete view
  if (isComplete) {
    const avgWpm = sessionResults.length > 0
      ? Math.round(sessionResults.reduce((sum, r) => sum + r.wpm, 0) / sessionResults.length)
      : 0;
    const avgAccuracy = sessionResults.length > 0
      ? Math.round(sessionResults.reduce((sum, r) => sum + r.accuracy, 0) / sessionResults.length)
      : 0;
    const totalErrors = sessionResults.reduce((sum, r) => sum + r.errors, 0);

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Review Session Complete</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {sessionResults.length} of {totalItems} reviews completed
          </p>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Avg WPM</p>
              <p className="text-3xl font-mono font-semibold">{avgWpm}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Avg Accuracy</p>
              <p className="text-3xl font-mono font-semibold">{avgAccuracy}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Errors</p>
              <p className="text-3xl font-mono font-semibold">{totalErrors}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <RotateCcw className="h-4 w-4" />
              Retry Same Set
            </button>
            <button
              onClick={handleRefreshQueue}
              disabled={isLoadingMore}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingMore ? 'animate-spin' : ''}`} />
              {isLoadingMore ? 'Loading...' : 'Check for More'}
            </button>
          </div>
        </div>

        {/* Per-challenge results */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-medium mb-4">Review Results</h3>
          <div className="space-y-3">
            {sessionResults.map((result, i) => {
              const item = items[i];
              const qInfo = qualityLabels[result.quality] ?? { label: '—', color: 'text-muted-foreground' };
              return (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {item && (
                      <>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize border ${difficultyColors[item.challengeDifficulty] ?? ''}`}>
                          {item.challengeDifficulty}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.categoryName}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-mono">{result.wpm} WPM</span>
                    <span className="font-mono">{result.accuracy}%</span>
                    <span className={`text-xs font-medium ${qInfo.color}`}>
                      {qInfo.label}
                    </span>
                    {result.newInterval > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatInterval(result.newInterval)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (!currentItem) {
    return null;
  }

  const syntaxType = mapSyntaxType(currentItem.challengeSyntaxType);

  return (
    <div className="space-y-6">
      {/* Review info bar */}
      <div className="rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-cyan-500" />
            <span className="text-xs text-muted-foreground">
              {stats.dueItems} item{stats.dueItems !== 1 ? 's' : ''} due for review
            </span>
          </div>
          <div className="flex items-center gap-3">
            {currentItem.repetitions > 0 && (
              <span className="text-xs text-muted-foreground">
                Reviewed {currentItem.repetitions} time{currentItem.repetitions !== 1 ? 's' : ''}
              </span>
            )}
            {currentItem.interval > 0 && (
              <span className="text-xs text-muted-foreground">
                Last interval: {formatInterval(currentItem.interval)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Challenge metadata */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize border ${difficultyColors[currentItem.challengeDifficulty] ?? ''}`}>
            {currentItem.challengeDifficulty}
          </span>
          <span className="text-sm text-muted-foreground">
            {currentItem.categoryName}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {totalItems}
        </span>
      </div>

      {/* Hint */}
      {currentItem.challengeHint && (
        <p className="text-sm text-muted-foreground">{currentItem.challengeHint}</p>
      )}

      {/* Typing area */}
      <TypingInput
        key={typingKey}
        targetText={currentItem.challengeContent}
        syntaxType={syntaxType}
        onComplete={handleComplete}
        onSkip={handleSkip}
        onNext={handleNext}
        showStats={true}
        autoFocus={true}
      />

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-1.5">
        <div
          className="bg-cyan-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalItems) * 100}%` }}
        />
      </div>
    </div>
  );
}
