'use client';

import { useCallback, useState } from 'react';
import { TypingInput, TypingStats, KeystrokeEvent } from '@/components/typing/TypingInput';
import { type PersonalizedChallenge, type FocusArea } from '@/lib/practice/personalized';
import { RotateCcw, RefreshCw } from 'lucide-react';

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

const focusAreaLabels: Record<FocusArea, string> = {
  'weak-keys': 'Weak keys',
  'common-typos': 'Common typos',
  'slow-keys': 'Slow keys',
  'problem-sequences': 'Sequences',
  mixed: 'Mixed',
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="mb-10">
          <h1 className="text-2xl font-medium text-white mb-2">Session complete</h1>
          <p className="text-sm text-white/50">
            {sessionResults.length} of {totalChallenges} challenges
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-10 w-full max-w-md">
          <div className="rounded-xl bg-white/[0.03] p-4">
            <p className="text-2xl font-medium text-white">{avgWpm}</p>
            <p className="text-xs text-white/40 mt-1">Avg WPM</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-4">
            <p className="text-2xl font-medium text-white">{avgAccuracy}%</p>
            <p className="text-xs text-white/40 mt-1">Accuracy</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-4">
            <p className="text-2xl font-medium text-white">{totalErrors}</p>
            <p className="text-xs text-white/40 mt-1">Errors</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleRestart}
            className="px-6 py-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="px-6 py-3 rounded-full bg-white text-black hover:bg-white/90 transition-colors font-medium disabled:opacity-50"
          >
            {isLoadingMore ? 'Generating...' : 'New challenges'}
          </button>
        </div>
      </div>
    );
  }

  if (!currentChallenge) {
    return (
      <div className="text-center py-16">
        <p className="text-white/50">No personalized challenges available.</p>
        <p className="text-sm text-white/30 mt-2">
          Complete some typing sessions to build your error profile.
        </p>
      </div>
    );
  }

  const focusLabel = focusAreaLabels[currentChallenge.focusArea];

  return (
    <div className="flex flex-col h-full">
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-white/40 mb-2">
          <span>{currentIndex + 1} of {totalChallenges}</span>
          <span>{Math.round(((currentIndex) / totalChallenges) * 100)}%</span>
        </div>
        <div className="h-0.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-white/30 transition-all duration-300"
            style={{ width: `${(currentIndex / totalChallenges) * 100}%` }}
          />
        </div>
      </div>

      {/* Focus area label - subtle */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-white/40">{focusLabel}</span>
        {currentChallenge.targetKeys.length > 0 && (
          <span className="text-xs text-white/30">
            {currentChallenge.targetKeys.slice(0, 3).join(', ')}
          </span>
        )}
      </div>

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

      {/* Hint - minimal */}
      <div className="mt-6 text-center">
        <p className="text-xs text-white/30">
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 font-mono text-white/50">Esc</kbd> to restart
        </p>
      </div>
    </div>
  );
}
