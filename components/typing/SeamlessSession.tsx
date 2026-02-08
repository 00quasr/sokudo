'use client';

import React, { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { TypingStats, KeystrokeEvent } from '@/lib/hooks/useTypingEngine';
import { cn } from '@/lib/utils';
import { tokenize, flattenTokensToChars, SyntaxType } from './TypingArea';
import { useTypingEngine } from '@/lib/hooks/useTypingEngine';
import { useOfflineSession } from '@/lib/hooks/useOfflineSession';
import { useScreenReaderAnnouncement } from '@/components/a11y/ScreenReaderAnnouncer';
import { useKeyboardLayout } from '@/lib/hooks/useKeyboardLayout';
import { translateKey, KeyboardLayout } from '@/lib/typing/keyboard-layouts';
import { Challenge, Category } from '@/lib/db/schema';

interface SessionStats {
  totalWpm: number;
  totalAccuracy: number;
  totalKeystrokes: number;
  totalErrors: number;
  totalDurationMs: number;
  challengeResults: Array<{
    challengeId: number;
    wpm: number;
    accuracy: number;
    durationMs: number;
  }>;
}

interface SeamlessSessionProps {
  challenges: (Challenge & { category: Category })[];
  categorySlug: string;
  categoryName: string;
}

function mapSyntaxType(syntaxType: string): SyntaxType {
  const validTypes: SyntaxType[] = [
    'plain', 'git', 'shell', 'react', 'typescript',
    'docker', 'sql', 'npm', 'yarn', 'pnpm'
  ];
  const syntaxMap: Record<string, SyntaxType> = {
    'bash': 'shell',
    'terminal': 'shell',
    'ts': 'typescript',
    'js': 'typescript',
    'javascript': 'typescript',
    'jsx': 'react',
    'tsx': 'react',
  };
  const normalized = syntaxType.toLowerCase();
  if (validTypes.includes(normalized as SyntaxType)) {
    return normalized as SyntaxType;
  }
  if (syntaxMap[normalized]) {
    return syntaxMap[normalized];
  }
  return 'plain';
}

export function SeamlessSession({ challenges, categorySlug, categoryName }: SeamlessSessionProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalWpm: 0,
    totalAccuracy: 0,
    totalKeystrokes: 0,
    totalErrors: 0,
    totalDurationMs: 0,
    challengeResults: [],
  });
  const [key, setKey] = useState(0);

  const currentChallenge = challenges[currentIndex];
  const { announce } = useScreenReaderAnnouncement();
  const { layout } = useKeyboardLayout();

  const { saveSession, isOnline } = useOfflineSession({
    challengeId: currentChallenge?.id ?? 0,
    enableAutoSync: true,
  });

  const syntaxType = useMemo(() =>
    currentChallenge ? mapSyntaxType(currentChallenge.syntaxType) : 'plain',
    [currentChallenge]
  );

  const handleChallengeComplete = useCallback((stats: TypingStats, keystrokeLog: KeystrokeEvent[]) => {
    // Save this challenge's session
    const result = {
      wpm: stats.wpm,
      rawWpm: stats.rawWpm,
      accuracy: stats.accuracy,
      keystrokes: stats.keystrokes,
      errors: stats.errors,
      durationMs: stats.durationMs,
    };

    saveSession(result, keystrokeLog).catch((error) => {
      console.error('Failed to save session:', error);
    });

    // Update cumulative stats
    setSessionStats(prev => {
      const newResults = [...prev.challengeResults, {
        challengeId: currentChallenge.id,
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        durationMs: stats.durationMs,
      }];

      const totalKeystrokes = prev.totalKeystrokes + stats.keystrokes;
      const totalErrors = prev.totalErrors + stats.errors;
      const totalDurationMs = prev.totalDurationMs + stats.durationMs;

      // Calculate weighted average WPM based on duration
      const weightedWpmSum = newResults.reduce((sum, r) => sum + (r.wpm * r.durationMs), 0);
      const totalWpm = totalDurationMs > 0 ? weightedWpmSum / totalDurationMs : 0;

      // Calculate overall accuracy
      const totalAccuracy = totalKeystrokes > 0
        ? ((totalKeystrokes - totalErrors) / totalKeystrokes) * 100
        : 100;

      return {
        totalWpm,
        totalAccuracy,
        totalKeystrokes,
        totalErrors,
        totalDurationMs,
        challengeResults: newResults,
      };
    });

    // Move to next challenge or complete session
    if (currentIndex < challenges.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setKey(prev => prev + 1);
    } else {
      setSessionComplete(true);
      announce('Session complete! Great work.', 'assertive');
    }
  }, [currentChallenge, currentIndex, challenges.length, saveSession, announce]);

  const handleRetry = useCallback(() => {
    setCurrentIndex(0);
    setSessionComplete(false);
    setSessionStats({
      totalWpm: 0,
      totalAccuracy: 0,
      totalKeystrokes: 0,
      totalErrors: 0,
      totalDurationMs: 0,
      challengeResults: [],
    });
    setKey(prev => prev + 1);
  }, []);

  const handleBackToCategories = useCallback(() => {
    router.push('/practice');
  }, [router]);

  if (sessionComplete) {
    return (
      <SessionResults
        stats={sessionStats}
        categoryName={categoryName}
        challengeCount={challenges.length}
        onRetry={handleRetry}
        onBack={handleBackToCategories}
      />
    );
  }

  if (!currentChallenge) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress indicator - minimal */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-white/40 mb-2">
          <span>{currentIndex + 1} of {challenges.length}</span>
          <span>{Math.round((currentIndex / challenges.length) * 100)}%</span>
        </div>
        <div className="h-0.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-white/30 transition-all duration-300"
            style={{ width: `${(currentIndex / challenges.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Typing area */}
      <SeamlessTypingInput
        key={key}
        targetText={currentChallenge.content}
        syntaxType={syntaxType}
        onComplete={handleChallengeComplete}
        layout={layout}
        cumulativeStats={sessionStats}
      />

      {/* Minimal hint */}
      <div className="mt-6 text-center">
        <p className="text-xs text-white/30">
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 font-mono text-white/50">Esc</kbd> to restart current challenge
        </p>
      </div>
    </div>
  );
}

// Format time helper
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Simplified typing input for seamless flow
function SeamlessTypingInput({
  targetText,
  syntaxType,
  onComplete,
  layout,
  cumulativeStats,
}: {
  targetText: string;
  syntaxType: SyntaxType;
  onComplete: (stats: TypingStats, keystrokeLog: KeystrokeEvent[]) => void;
  layout: KeyboardLayout;
  cumulativeStats: SessionStats;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);

  const handleCompleteInternal = useCallback((stats: TypingStats, keystrokeLog: KeystrokeEvent[]) => {
    // Prevent double-firing
    if (completedRef.current) return;
    completedRef.current = true;

    // Small delay for visual feedback then advance
    setTimeout(() => {
      onComplete(stats, keystrokeLog);
    }, 300);
  }, [onComplete]);

  const {
    cursorPosition,
    isComplete,
    errors,
    stats,
    handleKeyPress,
    handleBackspace,
    handleEscape,
    progress,
  } = useTypingEngine({
    targetText,
    onComplete: handleCompleteInternal,
  });

  const charStyles = useMemo(() => {
    const tokens = tokenize(targetText, syntaxType);
    return flattenTokensToChars(tokens);
  }, [targetText, syntaxType]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleEscape();
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
      return;
    }

    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key.length !== 1) return;

    e.preventDefault();
    const translatedKey = translateKey(e.key, layout);
    handleKeyPress(translatedKey);
  }, [handleKeyPress, handleBackspace, handleEscape, layout]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    container.focus();

    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Calculate combined stats (cumulative + current challenge)
  const totalKeystrokes = cumulativeStats.totalKeystrokes + stats.keystrokes;
  const totalErrors = cumulativeStats.totalErrors + stats.errors;
  const totalDurationMs = cumulativeStats.totalDurationMs + stats.durationMs;

  // Calculate combined WPM (weighted by time)
  const combinedWpm = totalDurationMs > 0
    ? ((cumulativeStats.totalWpm * cumulativeStats.totalDurationMs) + (stats.wpm * stats.durationMs)) / totalDurationMs
    : stats.wpm;

  // Calculate combined accuracy
  const combinedAccuracy = totalKeystrokes > 0
    ? ((totalKeystrokes - totalErrors) / totalKeystrokes) * 100
    : stats.accuracy;

  return (
    <div className="flex flex-col gap-4">
      {/* Stats bar - above typing area (cumulative for entire session) */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-white/40 uppercase tracking-wide">WPM</span>
          <span className="font-mono font-medium text-white">{Math.round(combinedWpm)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-white/40 uppercase tracking-wide">ACC</span>
          <span className="font-mono font-medium text-white">{Math.round(combinedAccuracy)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-white/40 uppercase tracking-wide">TIME</span>
          <span className="font-mono font-medium text-white">{formatTime(totalDurationMs)}</span>
        </div>
        <div className="ml-auto text-xs text-white/40">
          {Math.round(progress * 100)}%
        </div>
      </div>

      {/* Typing area */}
      <div
        ref={containerRef}
        tabIndex={0}
        className={cn(
          'relative rounded-2xl bg-white/[0.02] border border-white/[0.08] p-6 md:p-8',
          'font-mono text-lg md:text-xl lg:text-2xl leading-relaxed',
          'focus:outline-none focus:ring-2 focus:ring-white/20',
          'cursor-text select-none min-h-[200px]',
          isComplete && 'border-green-500/30'
        )}
      >
        <div className="flex flex-wrap gap-y-3">
          {charStyles.map(({ char, style }, index) => {
            const isTyped = index < cursorPosition;
            const isCurrent = index === cursorPosition;
            const hasError = errors.has(index);

            let charClass = '';
            if (isTyped) {
              charClass = hasError ? 'text-red-400' : 'text-green-400';
            } else if (isCurrent) {
              charClass = 'text-white';
            } else {
              charClass = 'text-white/30';
            }

            return (
              <span
                key={index}
                className={cn(
                  'relative whitespace-pre',
                  charClass,
                  style.fontWeight,
                  isCurrent && 'bg-white/10'
                )}
              >
                {isCurrent && (
                  <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-white animate-pulse rounded-full" />
                )}
                {char === ' ' ? '\u00A0' : char}
                {/* Error indicator - show what was typed wrong */}
                {hasError && isTyped && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] text-red-400/80"
                    aria-hidden="true"
                  >
                    {errors.get(index)}
                  </span>
                )}
              </span>
            );
          })}
        </div>

        {/* Completion message */}
        {isComplete && (
          <div className="mt-6 pt-4 border-t border-white/[0.08] text-center">
            <p className="text-green-400 font-medium">Complete!</p>
          </div>
        )}

        {/* Start typing hint */}
        {cursorPosition === 0 && !isComplete && (
          <div className="mt-6 pt-4 border-t border-white/[0.08] text-center">
            <p className="text-white/30 text-sm">Start typing to begin...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Session results component
function SessionResults({
  stats,
  categoryName,
  challengeCount,
  onRetry,
  onBack,
}: {
  stats: SessionStats;
  categoryName: string;
  challengeCount: number;
  onRetry: () => void;
  onBack: () => void;
}) {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${seconds}s`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-medium text-white mb-2">
          Session complete
        </h1>
        <p className="text-sm text-white/50">
          {challengeCount} challenges in {categoryName}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 w-full max-w-2xl">
        <div className="rounded-xl bg-white/[0.03] p-4">
          <p className="text-2xl font-medium text-white">
            {Math.round(stats.totalWpm)}
          </p>
          <p className="text-xs text-white/40 mt-1">WPM</p>
        </div>
        <div className="rounded-xl bg-white/[0.03] p-4">
          <p className="text-2xl font-medium text-white">
            {Math.round(stats.totalAccuracy)}%
          </p>
          <p className="text-xs text-white/40 mt-1">Accuracy</p>
        </div>
        <div className="rounded-xl bg-white/[0.03] p-4">
          <p className="text-2xl font-medium text-white">
            {stats.totalKeystrokes}
          </p>
          <p className="text-xs text-white/40 mt-1">Keystrokes</p>
        </div>
        <div className="rounded-xl bg-white/[0.03] p-4">
          <p className="text-2xl font-medium text-white">
            {formatTime(stats.totalDurationMs)}
          </p>
          <p className="text-xs text-white/40 mt-1">Time</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={onRetry}
          className="px-6 py-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          Try again
        </button>
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-full bg-white text-black hover:bg-white/90 transition-colors font-medium"
        >
          Back to categories
        </button>
      </div>
    </div>
  );
}
