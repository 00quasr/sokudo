'use client';

import { useCallback, useState } from 'react';
import { TypingInput, TypingStats, KeystrokeEvent } from '@/components/typing/TypingInput';
import { type PersonalizedChallenge, type FocusArea } from '@/lib/practice/personalized';
import {
  Target,
  Zap,
  AlertTriangle,
  Clock,
  Shuffle,
  ChevronRight,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';

interface WeaknessSummaryData {
  weakKeyCount: number;
  typoCount: number;
  slowKeyCount: number;
  sequenceCount: number;
  topWeakness: string | null;
}

interface PersonalizedPracticeClientProps {
  initialChallenges: PersonalizedChallenge[];
  summary: string;
  weaknessReport: WeaknessSummaryData;
}

const focusAreaConfig: Record<FocusArea, { label: string; icon: typeof Target; color: string }> = {
  'weak-keys': { label: 'Weak Keys', icon: Target, color: 'text-red-500' },
  'common-typos': { label: 'Common Typos', icon: AlertTriangle, color: 'text-orange-500' },
  'slow-keys': { label: 'Slow Keys', icon: Clock, color: 'text-yellow-500' },
  'problem-sequences': { label: 'Problem Sequences', icon: Zap, color: 'text-purple-500' },
  mixed: { label: 'Mixed Practice', icon: Shuffle, color: 'text-blue-500' },
};

export function PersonalizedPracticeClient({
  initialChallenges,
  summary,
  weaknessReport,
}: PersonalizedPracticeClientProps) {
  const [challenges, setChallenges] = useState(initialChallenges);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionResults, setSessionResults] = useState<Array<{
    wpm: number;
    accuracy: number;
    errors: number;
    durationMs: number;
  }>>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [typingKey, setTypingKey] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const currentChallenge = challenges[currentIndex];
  const totalChallenges = challenges.length;

  const handleComplete = useCallback((stats: TypingStats, keystrokeLog: KeystrokeEvent[]) => {
    setSessionResults((prev) => [
      ...prev,
      {
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        errors: stats.errors,
        durationMs: stats.durationMs,
      },
    ]);

    // Save session results to update error tracking profile
    const challenge = challenges[currentIndex];
    if (challenge) {
      fetch('/api/practice/personalized/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wpm: stats.wpm,
          rawWpm: stats.rawWpm,
          accuracy: stats.accuracy,
          keystrokes: stats.keystrokes,
          errors: stats.errors,
          durationMs: stats.durationMs,
          focusArea: challenge.focusArea,
          keystrokeLogs: keystrokeLog.map((k) => ({
            timestamp: k.timestamp,
            expected: k.expected,
            actual: k.actual,
            isCorrect: k.isCorrect,
            latencyMs: k.latency,
          })),
        }),
      }).catch(() => {
        // Non-blocking: don't interrupt practice if save fails
      });
    }

    if (currentIndex >= totalChallenges - 1) {
      setIsComplete(true);
    }
  }, [currentIndex, totalChallenges, challenges]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalChallenges - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTypingKey((prev) => prev + 1);
    } else {
      setIsComplete(true);
    }
  }, [currentIndex, totalChallenges]);

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

  const handleLoadMore = useCallback(async () => {
    setIsLoadingMore(true);
    try {
      const response = await fetch('/api/practice/personalized?maxChallenges=5');
      if (response.ok) {
        const data = await response.json() as { challenges: PersonalizedChallenge[] };
        setChallenges(data.challenges);
        setCurrentIndex(0);
        setSessionResults([]);
        setIsComplete(false);
        setTypingKey((prev) => prev + 1);
      }
    } catch {
      // If fetch fails, just restart with existing challenges
      handleRestart();
    } finally {
      setIsLoadingMore(false);
    }
  }, [handleRestart]);

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
          <h2 className="text-xl font-semibold mb-2">Practice Session Complete</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {sessionResults.length} of {totalChallenges} challenges completed
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
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingMore ? 'animate-spin' : ''}`} />
              {isLoadingMore ? 'Generating...' : 'New Challenges'}
            </button>
          </div>
        </div>

        {/* Per-challenge results */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-medium mb-4">Challenge Results</h3>
          <div className="space-y-3">
            {sessionResults.map((result, i) => {
              const challenge = challenges[i];
              const config = challenge ? focusAreaConfig[challenge.focusArea] : null;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {config && (
                      <span className={`text-xs ${config.color}`}>{config.label}</span>
                    )}
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {challenge?.content.slice(0, 40)}...
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-mono">{result.wpm} WPM</span>
                    <span className="font-mono">{result.accuracy}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (!currentChallenge) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">No personalized challenges available.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Complete some typing sessions to build your error profile.
        </p>
      </div>
    );
  }

  const config = focusAreaConfig[currentChallenge.focusArea];
  const IconComponent = config.icon;

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{summary}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {weaknessReport.topWeakness && (
              <span className="text-orange-500">Top issue: {weaknessReport.topWeakness}</span>
            )}
          </div>
        </div>
      </div>

      {/* Challenge metadata */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 ${config.color}`}>
            <IconComponent className="h-4 w-4" />
            <span className="text-sm font-medium">{config.label}</span>
          </div>
          <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize bg-muted text-muted-foreground">
            {currentChallenge.difficulty}
          </span>
          {currentChallenge.targetKeys.length > 0 && (
            <span className="text-xs text-muted-foreground">
              Targets: {currentChallenge.targetKeys.slice(0, 5).join(', ')}
            </span>
          )}
        </div>
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {totalChallenges}
        </span>
      </div>

      {/* Hint */}
      {currentChallenge.hint && (
        <p className="text-sm text-muted-foreground">{currentChallenge.hint}</p>
      )}

      {/* Typing area */}
      <TypingInput
        key={typingKey}
        targetText={currentChallenge.content}
        syntaxType="plain"
        onComplete={handleComplete}
        onSkip={handleSkip}
        onNext={handleNext}
        showStats={true}
        autoFocus={true}
      />

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-1.5">
        <div
          className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalChallenges) * 100}%` }}
        />
      </div>
    </div>
  );
}
