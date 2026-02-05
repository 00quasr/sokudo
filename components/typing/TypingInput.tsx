'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';
import {
  useTypingEngine,
  TypingStats,
  KeystrokeEvent,
} from '@/lib/hooks/useTypingEngine';
import { cn } from '@/lib/utils';
import { SyntaxType, tokenize, flattenTokensToChars } from './TypingArea';
import { StatsBar } from './StatsBar';

export type { SyntaxType };

export interface TypingInputProps {
  targetText: string;
  syntaxType?: SyntaxType;
  onComplete?: (stats: TypingStats, keystrokeLog: KeystrokeEvent[]) => void;
  onKeystroke?: (event: KeystrokeEvent) => void;
  onSkip?: () => void;
  onNext?: () => void;
  className?: string;
  showStats?: boolean;
  autoFocus?: boolean;
}

export function TypingInput({
  targetText,
  syntaxType = 'plain',
  onComplete,
  onKeystroke,
  onSkip,
  onNext,
  className,
  showStats = true,
  autoFocus = true,
}: TypingInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const {
    cursorPosition,
    isStarted,
    isComplete,
    typedText,
    errors,
    stats,
    handleKeyPress,
    handleBackspace,
    handleEscape,
    reset,
    progress,
  } = useTypingEngine({
    targetText,
    onComplete,
    onKeystroke,
  });

  // Tokenize and flatten for character-by-character rendering
  const charStyles = useMemo(() => {
    const tokens = tokenize(targetText, syntaxType);
    return flattenTokensToChars(tokens);
  }, [targetText, syntaxType]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Prevent default for most keys we handle
      if (e.key === 'Tab') {
        e.preventDefault();
        // Tab = skip to next challenge
        if (onSkip) {
          onSkip();
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handleEscape();
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        // Enter = go to next challenge (only when complete)
        if (isComplete && onNext) {
          onNext();
        }
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
        return;
      }

      // Ignore modifier keys and special keys
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length !== 1) return;

      e.preventDefault();
      handleKeyPress(e.key);
    },
    [handleKeyPress, handleBackspace, handleEscape, isComplete, onSkip, onNext]
  );

  // Attach keyboard listener
  useEffect(() => {
    const container = containerRef.current;
    const hiddenInput = hiddenInputRef.current;
    if (!container) return;

    // Only attach to container, hidden input handles its own events
    const handleContainerKeyDown = (e: KeyboardEvent) => {
      // Ignore events from the hidden input
      if (e.target === hiddenInput) return;
      handleKeyDown(e);
    };

    container.addEventListener('keydown', handleContainerKeyDown);
    return () => container.removeEventListener('keydown', handleContainerKeyDown);
  }, [handleKeyDown]);

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && containerRef.current) {
      containerRef.current.focus();
    }
  }, [autoFocus]);

  // Handle touch events to show mobile keyboard
  const handleTouchStart = useCallback(() => {
    if (hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }
  }, []);

  // Handle input from mobile keyboard
  const handleMobileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (!value) {
        // If the input is cleared, treat as backspace
        handleBackspace();
        return;
      }

      // Get the last character typed
      const lastChar = value[value.length - 1];

      if (lastChar) {
        handleKeyPress(lastChar);
      }

      // Clear the input to allow continuous typing
      e.target.value = '';
    },
    [handleKeyPress, handleBackspace]
  );

  // Handle mobile keyboard special keys
  const handleMobileKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (isComplete && onNext) {
          onNext();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleEscape();
      }
    },
    [handleBackspace, handleEscape, isComplete, onNext]
  );

  // Keep hidden input focused when typing area is clicked
  const handleContainerClick = useCallback(() => {
    if (hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    } else if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  // Re-focus hidden input when session resets
  useEffect(() => {
    if (!isStarted && !isComplete && hiddenInputRef.current && autoFocus) {
      hiddenInputRef.current.focus();
    }
  }, [isStarted, isComplete, autoFocus]);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Stats bar - subtle, not prominent */}
      {showStats && <StatsBar stats={stats} progress={progress} />}

      {/* Typing area - the main focus */}
      <div
        ref={containerRef}
        tabIndex={0}
        className={cn(
          'relative rounded-lg border border-border bg-card p-6',
          'font-mono text-xl leading-relaxed',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
          'cursor-text select-none',
          isComplete && 'border-green-600/50 dark:border-green-400/50'
        )}
        role="textbox"
        aria-label="Typing input area"
        aria-readonly="true"
        onTouchStart={handleTouchStart}
        onClick={handleContainerClick}
      >
        {/* Hidden input for mobile keyboard */}
        <input
          ref={hiddenInputRef}
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          className="absolute opacity-0 pointer-events-none"
          onChange={handleMobileInput}
          onKeyDown={handleMobileKeyDown}
          aria-hidden="true"
          tabIndex={-1}
        />
        {/* Character display */}
        <div className="flex flex-wrap">
          {charStyles.map(({ char, style }, index) => {
            const isTyped = index < cursorPosition;
            const isCurrent = index === cursorPosition;
            const hasError = errors.has(index);

            // Determine character state
            let charClass = '';
            if (isTyped) {
              // Use theme-aware colors for errors and correct characters
              charClass = hasError ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
            } else if (isCurrent) {
              charClass = style.color;
            } else {
              // Upcoming text - slightly dimmed
              charClass = cn(style.color, 'opacity-50');
            }

            return (
              <span
                key={index}
                className={cn(
                  'relative whitespace-pre',
                  charClass,
                  style.fontWeight,
                  isCurrent && 'bg-primary/20'
                )}
              >
                {/* Cursor indicator with blink animation */}
                {isCurrent && (
                  <span
                    className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary animate-cursor-blink rounded-full"
                    aria-hidden="true"
                    data-testid="typing-cursor"
                  />
                )}
                {/* Show the character, handle special cases */}
                {char === ' ' ? '\u00A0' : char}
                {/* Error indicator - show what was typed */}
                {hasError && isTyped && (
                  <span
                    className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] text-red-500 dark:text-red-400"
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
          <div className="mt-4 pt-4 border-t border-border text-center">
            <p className="text-green-600 dark:text-green-400 font-medium">Complete!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Enter</kbd> for next challenge or <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Esc</kbd> to try again
            </p>
          </div>
        )}

        {/* Instructions when not started */}
        {!isStarted && !isComplete && (
          <div className="mt-4 pt-4 border-t border-border text-center">
            <p className="text-muted-foreground text-sm">Start typing to begin...</p>
          </div>
        )}
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Esc</kbd> Restart
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Tab</kbd> Skip
        </span>
        {isComplete && (
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Enter</kbd> Next
          </span>
        )}
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">⌫</kbd> Undo
        </span>
      </div>
    </div>
  );
}

export type { TypingStats, KeystrokeEvent };
