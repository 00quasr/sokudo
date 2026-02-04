'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { calculateLatencyStats, LatencyStats } from '../typing/wpm';

export type { LatencyStats };

export interface KeystrokeEvent {
  timestamp: number;
  expected: string;
  actual: string;
  isCorrect: boolean;
  latency: number;
}

export interface TypingStats {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  keystrokes: number;
  errors: number;
  durationMs: number;
  latency: LatencyStats;
}

export interface TypingEngineState {
  cursorPosition: number;
  isStarted: boolean;
  isComplete: boolean;
  typedText: string;
  errors: Map<number, string>;
  keystrokeLog: KeystrokeEvent[];
  stats: TypingStats;
}

export interface TypingEngineActions {
  handleKeyPress: (key: string) => void;
  handleBackspace: () => void;
  handleEscape: () => void;
  handleTab: () => string | null;
  reset: () => void;
  start: () => void;
}

export interface UseTypingEngineOptions {
  targetText: string;
  onComplete?: (stats: TypingStats, keystrokeLog: KeystrokeEvent[]) => void;
  onKeystroke?: (event: KeystrokeEvent) => void;
}

export interface UseTypingEngineReturn extends TypingEngineState, TypingEngineActions {
  targetText: string;
  currentChar: string | null;
  isCorrectSoFar: boolean;
  progress: number;
  hintUsed: boolean;
}

const CHARS_PER_WORD = 5;

function calculateWpm(chars: number, durationMs: number): number {
  if (durationMs <= 0) return 0;
  const minutes = durationMs / 60000;
  return Math.round((chars / CHARS_PER_WORD) / minutes);
}

function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 100;
  return Math.round((correct / total) * 100);
}

const initialLatencyStats: LatencyStats = {
  avgLatencyMs: 0,
  minLatencyMs: 0,
  maxLatencyMs: 0,
  stdDevLatencyMs: 0,
  p50LatencyMs: 0,
  p95LatencyMs: 0,
};

const initialStats: TypingStats = {
  wpm: 0,
  rawWpm: 0,
  accuracy: 100,
  keystrokes: 0,
  errors: 0,
  durationMs: 0,
  latency: initialLatencyStats,
};

export function useTypingEngine(options: UseTypingEngineOptions): UseTypingEngineReturn {
  const { targetText, onComplete, onKeystroke } = options;

  // Use refs for values that need to be read synchronously in handleKeyPress
  const cursorPositionRef = useRef(0);
  const isStartedRef = useRef(false);
  const isCompleteRef = useRef(false);
  const typedTextRef = useRef('');
  const errorsRef = useRef<Map<number, string>>(new Map());
  const keystrokeLogRef = useRef<KeystrokeEvent[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const lastKeystrokeTimeRef = useRef<number | null>(null);
  const correctCharsRef = useRef(0);
  const totalKeystrokesRef = useRef(0);
  const totalErrorsRef = useRef(0);
  const hintUsedRef = useRef(false);

  // State for triggering re-renders
  const [renderTrigger, setRenderTrigger] = useState(0);

  // Store callbacks in refs to avoid stale closures
  const onCompleteRef = useRef(onComplete);
  const onKeystrokeRef = useRef(onKeystroke);
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onKeystrokeRef.current = onKeystroke;
  }, [onComplete, onKeystroke]);

  const forceUpdate = useCallback(() => {
    setRenderTrigger((prev) => prev + 1);
  }, []);

  const updateStats = useCallback(() => {
    if (!startTimeRef.current) return;
    forceUpdate();
  }, [forceUpdate]);

  const start = useCallback(() => {
    if (isStartedRef.current) return;
    isStartedRef.current = true;
    startTimeRef.current = Date.now();
    lastKeystrokeTimeRef.current = Date.now();
    forceUpdate();
  }, [forceUpdate]);

  const reset = useCallback(() => {
    cursorPositionRef.current = 0;
    isStartedRef.current = false;
    isCompleteRef.current = false;
    typedTextRef.current = '';
    errorsRef.current = new Map();
    keystrokeLogRef.current = [];
    startTimeRef.current = null;
    lastKeystrokeTimeRef.current = null;
    correctCharsRef.current = 0;
    totalKeystrokesRef.current = 0;
    totalErrorsRef.current = 0;
    hintUsedRef.current = false;
    forceUpdate();
  }, [forceUpdate]);

  const handleKeyPress = useCallback((key: string) => {
    if (isCompleteRef.current) return;
    if (cursorPositionRef.current >= targetText.length) return;

    // Auto-start on first keypress
    if (!isStartedRef.current) {
      isStartedRef.current = true;
      startTimeRef.current = Date.now();
      lastKeystrokeTimeRef.current = Date.now();
    }

    const now = Date.now();
    const timestamp = startTimeRef.current ? now - startTimeRef.current : 0;
    const latency = lastKeystrokeTimeRef.current ? now - lastKeystrokeTimeRef.current : 0;
    lastKeystrokeTimeRef.current = now;

    const currentPos = cursorPositionRef.current;
    const expectedChar = targetText[currentPos];
    const isCorrect = key === expectedChar;

    // Update refs
    totalKeystrokesRef.current += 1;
    if (isCorrect) {
      correctCharsRef.current += 1;
    } else {
      totalErrorsRef.current += 1;
    }

    // Create keystroke event
    const keystrokeEvent: KeystrokeEvent = {
      timestamp,
      expected: expectedChar,
      actual: key,
      isCorrect,
      latency,
    };

    // Update keystroke log
    keystrokeLogRef.current = [...keystrokeLogRef.current, keystrokeEvent];

    // Notify callback
    if (onKeystrokeRef.current) {
      onKeystrokeRef.current(keystrokeEvent);
    }

    // Update errors map
    if (!isCorrect) {
      const newErrors = new Map(errorsRef.current);
      newErrors.set(currentPos, key);
      errorsRef.current = newErrors;
    }

    // Update typed text
    typedTextRef.current = typedTextRef.current + key;

    // Move cursor forward
    const newPosition = currentPos + 1;
    cursorPositionRef.current = newPosition;

    // Check for completion
    if (newPosition >= targetText.length) {
      isCompleteRef.current = true;
      const finalDurationMs = startTimeRef.current ? now - startTimeRef.current : 0;
      const latencies = keystrokeLogRef.current.map((k) => k.latency);
      const finalStats: TypingStats = {
        wpm: calculateWpm(correctCharsRef.current, finalDurationMs),
        rawWpm: calculateWpm(totalKeystrokesRef.current, finalDurationMs),
        accuracy: calculateAccuracy(
          totalKeystrokesRef.current - totalErrorsRef.current,
          totalKeystrokesRef.current
        ),
        keystrokes: totalKeystrokesRef.current,
        errors: totalErrorsRef.current,
        durationMs: finalDurationMs,
        latency: calculateLatencyStats(latencies),
      };

      if (onCompleteRef.current) {
        onCompleteRef.current(finalStats, keystrokeLogRef.current);
      }
    }

    // Trigger re-render
    forceUpdate();
  }, [targetText, forceUpdate]);

  const handleBackspace = useCallback(() => {
    // Cannot backspace before session starts or when already complete
    if (!isStartedRef.current || isCompleteRef.current) return;
    // Cannot backspace at position 0
    if (cursorPositionRef.current <= 0) return;

    const now = Date.now();
    lastKeystrokeTimeRef.current = now;

    const prevPosition = cursorPositionRef.current - 1;

    // Check if the character at prev position was correct or an error
    const lastTypedChar = typedTextRef.current[prevPosition];
    const expectedChar = targetText[prevPosition];
    const wasCorrect = lastTypedChar === expectedChar;

    // Undo the stats for the character we're removing
    totalKeystrokesRef.current = Math.max(0, totalKeystrokesRef.current - 1);
    if (wasCorrect) {
      correctCharsRef.current = Math.max(0, correctCharsRef.current - 1);
    } else {
      totalErrorsRef.current = Math.max(0, totalErrorsRef.current - 1);
    }

    // Remove the last keystroke from the log
    if (keystrokeLogRef.current.length > 0) {
      keystrokeLogRef.current = keystrokeLogRef.current.slice(0, -1);
    }

    // Remove error at this position if it exists
    if (errorsRef.current.has(prevPosition)) {
      const newErrors = new Map(errorsRef.current);
      newErrors.delete(prevPosition);
      errorsRef.current = newErrors;
    }

    // Update typed text (remove last character)
    typedTextRef.current = typedTextRef.current.slice(0, -1);

    // Move cursor back
    cursorPositionRef.current = prevPosition;

    forceUpdate();
  }, [targetText, forceUpdate]);

  const handleEscape = useCallback(() => {
    // Reset the session (restart)
    reset();
  }, [reset]);

  const handleTab = useCallback((): string | null => {
    // Cannot use hint if session is complete or no characters left
    if (isCompleteRef.current) return null;
    if (cursorPositionRef.current >= targetText.length) return null;

    // Mark that hint was used
    hintUsedRef.current = true;

    // Return the current character as a hint
    const hintChar = targetText[cursorPositionRef.current];

    forceUpdate();

    return hintChar;
  }, [targetText, forceUpdate]);

  // Update stats periodically while typing
  useEffect(() => {
    if (!isStartedRef.current || isCompleteRef.current) return;

    const interval = setInterval(updateStats, 500);
    return () => clearInterval(interval);
  }, [renderTrigger, updateStats]);

  // Reset when target text changes
  useEffect(() => {
    reset();
  }, [targetText, reset]);

  // Compute derived values from refs
  const cursorPosition = cursorPositionRef.current;
  const isStarted = isStartedRef.current;
  const isComplete = isCompleteRef.current;
  const typedText = typedTextRef.current;
  const errors = errorsRef.current;
  const keystrokeLog = keystrokeLogRef.current;
  const hintUsed = hintUsedRef.current;

  // Calculate stats from refs
  const stats = useMemo((): TypingStats => {
    if (!startTimeRef.current) return initialStats;

    const now = Date.now();
    const durationMs = now - startTimeRef.current;
    const correctChars = correctCharsRef.current;
    const totalKeystrokes = totalKeystrokesRef.current;
    const totalErrors = totalErrorsRef.current;
    const latencies = keystrokeLogRef.current.map((k) => k.latency);

    return {
      wpm: calculateWpm(correctChars, durationMs),
      rawWpm: calculateWpm(totalKeystrokes, durationMs),
      accuracy: calculateAccuracy(totalKeystrokes - totalErrors, totalKeystrokes),
      keystrokes: totalKeystrokes,
      errors: totalErrors,
      durationMs,
      latency: calculateLatencyStats(latencies),
    };
  }, [renderTrigger]);

  const currentChar = cursorPosition < targetText.length ? targetText[cursorPosition] : null;
  const isCorrectSoFar = errors.size === 0;
  const progress = targetText.length > 0 ? (cursorPosition / targetText.length) * 100 : 0;

  return {
    // State
    cursorPosition,
    isStarted,
    isComplete,
    typedText,
    errors,
    keystrokeLog,
    stats,
    // Actions
    handleKeyPress,
    handleBackspace,
    handleEscape,
    handleTab,
    reset,
    start,
    // Derived values
    targetText,
    currentChar,
    isCorrectSoFar,
    progress,
    hintUsed,
  };
}
