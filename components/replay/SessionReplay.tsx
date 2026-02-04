'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw, FastForward, Rewind, ChevronLeft, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { TypingArea, SyntaxType } from '@/components/typing/TypingArea';
import { StatsBar } from '@/components/typing/StatsBar';
import { cn } from '@/lib/utils';
import { ErrorTimeline } from './ErrorTimeline';
import { ErrorSummary } from './ErrorSummary';

export interface KeystrokeLogEntry {
  id: number;
  timestamp: number;
  expected: string;
  actual: string;
  isCorrect: boolean;
  latencyMs: number;
}

export interface SessionReplayData {
  id: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  keystrokes: number;
  errors: number;
  durationMs: number;
  completedAt: Date;
  challenge: {
    id: number;
    content: string;
    difficulty: string;
    syntaxType: string;
    category: {
      id: number;
      name: string;
      slug: string;
    };
  };
  keystrokeLogs: KeystrokeLogEntry[];
}

interface SessionReplayProps {
  session: SessionReplayData;
}

type PlaybackSpeed = 0.5 | 1 | 1.5 | 2 | 4;

const PLAYBACK_SPEEDS: PlaybackSpeed[] = [0.5, 1, 1.5, 2, 4];

export function mapSyntaxType(syntaxType: string): SyntaxType {
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

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((ms % 1000) / 100);

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`;
  }
  return `${seconds}.${tenths}s`;
}

export function SessionReplay({ session }: SessionReplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);

  const { keystrokeLogs, challenge } = session;
  const syntaxType = mapSyntaxType(challenge.syntaxType);
  const totalDuration = session.durationMs;

  // Pre-compute error positions on the timeline (doesn't change)
  const errorMarkers = useMemo(() => {
    return keystrokeLogs
      .filter((log) => !log.isCorrect)
      .map((log) => ({
        timestamp: log.timestamp,
        position: totalDuration > 0 ? (log.timestamp / totalDuration) * 100 : 0,
        expected: log.expected,
        actual: log.actual,
      }));
  }, [keystrokeLogs, totalDuration]);

  // Calculate the current cursor position and errors based on current time
  const { cursorPosition, errors, currentStats, progress } = useMemo(() => {
    let position = 0;
    const errorMap = new Map<number, string>();
    let correctCount = 0;
    let errorCount = 0;

    for (const log of keystrokeLogs) {
      if (log.timestamp <= currentTime) {
        if (!log.isCorrect) {
          errorMap.set(position, log.actual);
          errorCount++;
        } else {
          correctCount++;
        }
        position++;
      } else {
        break;
      }
    }

    const elapsed = Math.max(currentTime, 1);
    const wpm = Math.round((correctCount / 5) / (elapsed / 60000));
    const accuracy = position > 0 ? Math.round(((position - errorCount) / position) * 100) : 100;
    const progressPercent = challenge.content.length > 0
      ? (position / challenge.content.length) * 100
      : 0;

    return {
      cursorPosition: position,
      errors: errorMap,
      currentStats: {
        wpm,
        rawWpm: wpm,
        accuracy,
        keystrokes: position,
        errors: errorCount,
        durationMs: elapsed,
        latency: {
          avgLatencyMs: 0,
          minLatencyMs: 0,
          maxLatencyMs: 0,
          stdDevLatencyMs: 0,
          p50LatencyMs: 0,
          p95LatencyMs: 0,
        },
      },
      progress: progressPercent,
    };
  }, [keystrokeLogs, currentTime, challenge.content.length]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      lastFrameTimeRef.current = null;
      return;
    }

    const animate = (frameTime: number) => {
      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = frameTime;
      }

      const delta = (frameTime - lastFrameTimeRef.current) * speed;
      lastFrameTimeRef.current = frameTime;

      setCurrentTime((prev) => {
        const next = prev + delta;
        if (next >= totalDuration) {
          setIsPlaying(false);
          return totalDuration;
        }
        return next;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, speed, totalDuration]);

  // Auto-show error summary when replay completes
  useEffect(() => {
    if (currentTime >= totalDuration && totalDuration > 0 && errorMarkers.length > 0) {
      setShowErrorSummary(true);
    }
  }, [currentTime, totalDuration, errorMarkers.length]);

  const handlePlayPause = useCallback(() => {
    if (currentTime >= totalDuration) {
      setCurrentTime(0);
      setShowErrorSummary(false);
    }
    setIsPlaying((prev) => !prev);
  }, [currentTime, totalDuration]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setShowErrorSummary(false);
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setCurrentTime(value);
  }, []);

  const handleSeekToTime = useCallback((timestamp: number) => {
    setCurrentTime(Math.max(0, timestamp - 500));
    setIsPlaying(false);
  }, []);

  const handleSpeedChange = useCallback(() => {
    setSpeed((prev) => {
      const currentIndex = PLAYBACK_SPEEDS.indexOf(prev);
      const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
      return PLAYBACK_SPEEDS[nextIndex];
    });
  }, []);

  const handleSkipBack = useCallback(() => {
    setCurrentTime((prev) => Math.max(0, prev - 2000));
  }, []);

  const handleSkipForward = useCallback(() => {
    setCurrentTime((prev) => Math.min(totalDuration, prev + 2000));
  }, [totalDuration]);

  const toggleErrorSummary = useCallback(() => {
    setShowErrorSummary((prev) => !prev);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          handleReset();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSkipBack();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSkipForward();
          break;
        case 's':
        case 'S':
          e.preventDefault();
          handleSpeedChange();
          break;
        case 'e':
        case 'E':
          e.preventDefault();
          toggleErrorSummary();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, handleReset, handleSkipBack, handleSkipForward, handleSpeedChange, toggleErrorSummary]);

  const timeProgress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
  const isComplete = currentTime >= totalDuration;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/history"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to History
          </Link>
          <div className="h-4 w-px bg-border" />
          <div>
            <h1 className="font-medium">{challenge.category.name}</h1>
            <p className="text-xs text-muted-foreground">
              Session Replay - {new Date(session.completedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {errorMarkers.length > 0 && (
            <button
              onClick={toggleErrorSummary}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm',
                showErrorSummary
                  ? 'bg-red-500/10 text-red-400'
                  : 'hover:bg-muted text-muted-foreground'
              )}
              title="Toggle Error Summary (E)"
              data-testid="toggle-error-summary"
            >
              <AlertTriangle className="h-4 w-4" />
              {errorMarkers.length} {errorMarkers.length === 1 ? 'error' : 'errors'}
              {showErrorSummary ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Final:</span>
            <span className="font-mono font-semibold">{session.wpm} WPM</span>
            <span className="text-muted-foreground">&bull;</span>
            <span className="font-mono font-semibold">{session.accuracy}%</span>
          </div>
        </div>
      </div>

      {/* Error Summary Panel (collapsible) */}
      {showErrorSummary && (
        <ErrorSummary
          keystrokeLogs={keystrokeLogs}
          challengeContent={challenge.content}
          onSeekToTime={handleSeekToTime}
        />
      )}

      {/* Typing Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
        <div className="w-full max-w-3xl">
          <TypingArea
            text={challenge.content}
            syntaxType={syntaxType}
            cursorPosition={cursorPosition}
            errors={errors}
            showCursor={!isComplete}
            fontSize="xl"
          />
        </div>
      </div>

      {/* Stats Bar */}
      <div className="border-t border-border p-4">
        <StatsBar
          stats={currentStats}
          progress={progress}
          showProgress={true}
        />
      </div>

      {/* Playback Controls */}
      <div className="border-t border-border bg-muted/30 p-4">
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Progress Bar with Error Timeline */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground w-14 text-right">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 relative">
              <ErrorTimeline
                errorMarkers={errorMarkers}
                totalDuration={totalDuration}
                currentTime={currentTime}
              />
              <input
                type="range"
                min={0}
                max={totalDuration}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer relative z-10
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-primary
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-background
                  [&::-webkit-slider-thumb]:shadow-sm"
                style={{
                  background: `linear-gradient(to right, hsl(var(--primary)) ${timeProgress}%, hsl(var(--muted)) ${timeProgress}%)`,
                }}
                data-testid="replay-seek-bar"
              />
            </div>
            <span className="text-xs font-mono text-muted-foreground w-14">
              {formatTime(totalDuration)}
            </span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleReset}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Reset (R)"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            <button
              onClick={handleSkipBack}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Skip Back 2s (←)"
            >
              <Rewind className="h-5 w-5" />
            </button>
            <button
              onClick={handlePlayPause}
              className={cn(
                'p-3 rounded-full transition-colors',
                isPlaying ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
              )}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-0.5" />
              )}
            </button>
            <button
              onClick={handleSkipForward}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Skip Forward 2s (→)"
            >
              <FastForward className="h-5 w-5" />
            </button>
            <button
              onClick={handleSpeedChange}
              className="px-3 py-1.5 rounded-lg hover:bg-muted transition-colors font-mono text-sm min-w-[4rem]"
              title="Change Speed (S)"
            >
              {speed}x
            </button>
          </div>

          {/* Keyboard Hints */}
          <div className="text-center text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 bg-muted rounded font-medium">Space</kbd> play/pause
            <span className="mx-2">&bull;</span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded font-medium">R</kbd> reset
            <span className="mx-2">&bull;</span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded font-medium">&larr;</kbd>
            <kbd className="px-1.5 py-0.5 bg-muted rounded font-medium">&rarr;</kbd> seek
            <span className="mx-2">&bull;</span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded font-medium">S</kbd> speed
            <span className="mx-2">&bull;</span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded font-medium">E</kbd> errors
          </div>
        </div>
      </div>
    </div>
  );
}
