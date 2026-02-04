'use client';

import { useCallback, useState } from 'react';
import { TypingInput, TypingStats, KeystrokeEvent } from '@/components/typing/TypingInput';
import type { SmartChallenge } from '@/lib/practice/smart-practice';
import type { DifficultyLevel } from '@/lib/practice/adaptive-difficulty';
import {
  Brain,
  RotateCcw,
  RefreshCw,
  Target,
} from 'lucide-react';

interface SmartPracticeClientProps {
  initialChallenges: SmartChallenge[];
  adaptive: {
    recommendedDifficulty: DifficultyLevel;
    difficultyScore: number;
    confidence: number;
    reasons: string[];
  };
  summary: string;
}

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
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

export function SmartPracticeClient({
  initialChallenges,
  adaptive,
  summary,
}: SmartPracticeClientProps) {
  const [challenges, setChallenges] = useState(initialChallenges);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionResults, setSessionResults] = useState<Array<{
    wpm: number;
    accuracy: number;
    errors: number;
    durationMs: number;
    challengeId: number;
  }>>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [typingKey, setTypingKey] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const currentChallenge = challenges[currentIndex];
  const totalChallenges = challenges.length;

  const handleComplete = useCallback((stats: TypingStats, keystrokeLog: KeystrokeEvent[]) => {
    const challenge = challenges[currentIndex];
    setSessionResults((prev) => [
      ...prev,
      {
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        errors: stats.errors,
        durationMs: stats.durationMs,
        challengeId: challenge?.id ?? 0,
      },
    ]);

    // Save session results
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
          focusArea: 'mixed',
          keystrokeLogs: keystrokeLog.map((k) => ({
            timestamp: k.timestamp,
            expected: k.expected,
            actual: k.actual,
            isCorrect: k.isCorrect,
            latencyMs: k.latency,
          })),
        }),
      }).catch(() => {
        // Non-blocking
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
      const response = await fetch('/api/practice/smart?limit=5');
      if (response.ok) {
        const data = await response.json() as { challenges: SmartChallenge[] };
        setChallenges(data.challenges);
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
          <h2 className="text-xl font-semibold mb-2">Smart Practice Complete</h2>
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
              className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingMore ? 'animate-spin' : ''}`} />
              {isLoadingMore ? 'Picking...' : 'New Smart Set'}
            </button>
          </div>
        </div>

        {/* Per-challenge results */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-medium mb-4">Challenge Results</h3>
          <div className="space-y-3">
            {sessionResults.map((result, i) => {
              const challenge = challenges[i];
              return (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {challenge && (
                      <>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize border ${difficultyColors[challenge.difficulty] ?? ''}`}>
                          {challenge.difficulty}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {challenge.categoryName}
                        </span>
                      </>
                    )}
                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {challenge?.content.slice(0, 30)}...
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
        <p className="text-muted-foreground">No challenges available.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Add some practice categories to get started.
        </p>
      </div>
    );
  }

  const syntaxType = mapSyntaxType(currentChallenge.syntaxType);

  return (
    <div className="space-y-6">
      {/* Adaptive info bar */}
      <div className="rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-4 w-4 text-violet-500" />
            <span className="text-xs text-muted-foreground">{summary}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize border ${difficultyColors[adaptive.recommendedDifficulty] ?? ''}`}>
              {adaptive.recommendedDifficulty}
            </span>
            {adaptive.confidence > 0.5 && (
              <span className="text-xs text-muted-foreground">
                {Math.round(adaptive.confidence * 100)}% confident
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Challenge metadata */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize border ${difficultyColors[currentChallenge.difficulty] ?? ''}`}>
            {currentChallenge.difficulty}
          </span>
          <span className="text-sm text-muted-foreground">
            {currentChallenge.categoryName}
          </span>
          {currentChallenge.reasons.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-violet-500">
              <Target className="h-3 w-3" />
              {currentChallenge.reasons[0]}
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
          className="bg-violet-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalChallenges) * 100}%` }}
        />
      </div>
    </div>
  );
}
