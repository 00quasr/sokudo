'use client';

import { useCallback, useState } from 'react';
import { TypingInput, TypingStats, KeystrokeEvent } from '@/components/typing/TypingInput';
import type { SmartChallenge } from '@/lib/practice/smart-practice';
import type { DifficultyLevel } from '@/lib/practice/adaptive-difficulty';

interface SessionStats {
  totalWpm: number;
  totalAccuracy: number;
  totalKeystrokes: number;
  totalErrors: number;
  totalDurationMs: number;
}

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

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function SmartPracticeClient({
  initialChallenges,
  adaptive,
  summary,
}: SmartPracticeClientProps) {
  const [challenges, setChallenges] = useState(initialChallenges);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalWpm: 0,
    totalAccuracy: 0,
    totalKeystrokes: 0,
    totalErrors: 0,
    totalDurationMs: 0,
  });
  const [isComplete, setIsComplete] = useState(false);
  const [typingKey, setTypingKey] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const currentChallenge = challenges[currentIndex];
  const totalChallenges = challenges.length;

  const handleComplete = useCallback((stats: TypingStats, keystrokeLog: KeystrokeEvent[]) => {
    const challenge = challenges[currentIndex];

    // Update cumulative stats
    setSessionStats((prev) => {
      const totalKeystrokes = prev.totalKeystrokes + stats.keystrokes;
      const totalErrors = prev.totalErrors + stats.errors;
      const totalDurationMs = prev.totalDurationMs + stats.durationMs;

      const weightedWpmSum = (prev.totalWpm * prev.totalDurationMs) + (stats.wpm * stats.durationMs);
      const totalWpm = totalDurationMs > 0 ? weightedWpmSum / totalDurationMs : stats.wpm;

      const totalAccuracy = totalKeystrokes > 0
        ? ((totalKeystrokes - totalErrors) / totalKeystrokes) * 100
        : 100;

      return {
        totalWpm,
        totalAccuracy,
        totalKeystrokes,
        totalErrors,
        totalDurationMs,
      };
    });

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
    } else {
      setCurrentIndex((prev) => prev + 1);
      setTypingKey((prev) => prev + 1);
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

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setSessionStats({
      totalWpm: 0,
      totalAccuracy: 0,
      totalKeystrokes: 0,
      totalErrors: 0,
      totalDurationMs: 0,
    });
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
        setSessionStats({
          totalWpm: 0,
          totalAccuracy: 0,
          totalKeystrokes: 0,
          totalErrors: 0,
          totalDurationMs: 0,
        });
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
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="mb-10">
          <h1 className="text-2xl font-medium text-white mb-2">Session complete</h1>
          <p className="text-sm text-white/50">
            {totalChallenges} challenges
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 w-full max-w-lg">
          <div className="rounded-xl bg-white/[0.03] p-4">
            <p className="text-2xl font-medium text-white">{Math.round(sessionStats.totalWpm)}</p>
            <p className="text-xs text-white/40 mt-1">WPM</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-4">
            <p className="text-2xl font-medium text-white">{Math.round(sessionStats.totalAccuracy)}%</p>
            <p className="text-xs text-white/40 mt-1">Accuracy</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-4">
            <p className="text-2xl font-medium text-white">{sessionStats.totalKeystrokes}</p>
            <p className="text-xs text-white/40 mt-1">Keystrokes</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-4">
            <p className="text-2xl font-medium text-white">{formatTime(sessionStats.totalDurationMs)}</p>
            <p className="text-xs text-white/40 mt-1">Time</p>
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
            {isLoadingMore ? 'Loading...' : 'New challenges'}
          </button>
        </div>
      </div>
    );
  }

  if (!currentChallenge) {
    return (
      <div className="text-center py-16">
        <p className="text-white/50">No challenges available.</p>
        <p className="text-sm text-white/30 mt-2">
          Add some practice categories to get started.
        </p>
      </div>
    );
  }

  const syntaxType = mapSyntaxType(currentChallenge.syntaxType);

  return (
    <div className="flex flex-col gap-4">
      {/* Progress indicator */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-sm text-white/40 mb-2">
          <span>{currentIndex + 1} of {totalChallenges}</span>
          <span>{Math.round((currentIndex / totalChallenges) * 100)}%</span>
        </div>
        <div className="h-0.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-white/30 transition-all duration-300"
            style={{ width: `${(currentIndex / totalChallenges) * 100}%` }}
          />
        </div>
      </div>

      {/* Category label - subtle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40">{currentChallenge.categoryName}</span>
        <span className="text-xs text-white/30">{currentChallenge.difficulty}</span>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-white/40 uppercase tracking-wide">WPM</span>
          <span className="font-mono font-medium text-white">{Math.round(sessionStats.totalWpm)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-white/40 uppercase tracking-wide">ACC</span>
          <span className="font-mono font-medium text-white">{Math.round(sessionStats.totalAccuracy || 100)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-white/40 uppercase tracking-wide">TIME</span>
          <span className="font-mono font-medium text-white">{formatTime(sessionStats.totalDurationMs)}</span>
        </div>
      </div>

      {/* Typing area */}
      <TypingInput
        key={typingKey}
        targetText={currentChallenge.content}
        syntaxType={syntaxType}
        onComplete={handleComplete}
        onSkip={handleSkip}
        onNext={handleNext}
        showStats={false}
        autoFocus={true}
      />

      {/* Hint - minimal */}
      <div className="mt-2 text-center">
        <p className="text-xs text-white/30">
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 font-mono text-white/50">Esc</kbd> to restart
        </p>
      </div>
    </div>
  );
}
