'use client';

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import {
  useTypingEngine,
  TypingStats,
  KeystrokeEvent,
} from '@/lib/hooks/useTypingEngine';
import { cn } from '@/lib/utils';
import { SyntaxType, tokenize, flattenTokensToChars } from './TypingArea';
import { StatsBar } from './StatsBar';
import { useScreenReaderAnnouncement } from '@/components/a11y/ScreenReaderAnnouncer';

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
  const touchFeedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { announce } = useScreenReaderAnnouncement();

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

  // Announce typing session start
  useEffect(() => {
    if (isStarted && !isComplete) {
      announce('Typing session started', 'polite');
    }
  }, [isStarted, isComplete, announce]);

  // Announce completion with stats
  useEffect(() => {
    if (isComplete) {
      const wpm = Math.round(stats.wpm);
      const accuracy = Math.round(stats.accuracy);
      announce(
        `Challenge complete! ${wpm} words per minute with ${accuracy}% accuracy. Press Enter for next challenge or Escape to retry.`,
        'assertive'
      );
    }
  }, [isComplete, stats, announce]);

  // Announce progress milestones
  useEffect(() => {
    const progressPercent = Math.round(progress * 100);
    if (progressPercent === 50) {
      announce('Halfway there!', 'polite');
    } else if (progressPercent === 75) {
      announce('Almost done, keep going!', 'polite');
    }
  }, [progress, announce]);

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

  // Track if user is on touch device and device type
  const isTouchDeviceRef = useRef(false);
  const isTabletRef = useRef(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const initialViewportHeight = useRef<number>(0);

  // Detect tablet vs phone based on screen size
  useEffect(() => {
    const checkDeviceType = () => {
      // Check if window.matchMedia is available (not in test environment)
      if (typeof window !== 'undefined' && window.matchMedia) {
        // Detect tablet: touch device with screen width >= 768px (typical tablet breakpoint)
        const isTablet = window.matchMedia('(pointer: coarse) and (min-width: 768px)').matches;
        isTabletRef.current = isTablet;
      }
    };

    checkDeviceType();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkDeviceType);
      return () => window.removeEventListener('resize', checkDeviceType);
    }
  }, []);

  // Detect virtual keyboard visibility (for tablets)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Store initial viewport height
    if (initialViewportHeight.current === 0) {
      initialViewportHeight.current = window.visualViewport?.height || window.innerHeight;
    }

    const handleViewportChange = () => {
      if (!window.visualViewport) return;

      const currentHeight = window.visualViewport.height;
      const heightDifference = initialViewportHeight.current - currentHeight;

      // If viewport height decreased by more than 150px, keyboard is likely visible
      // This threshold works well for tablets (keyboards are typically 250-350px)
      const keyboardThreshold = isTabletRef.current ? 150 : 100;
      const keyboardVisible = heightDifference > keyboardThreshold;

      setIsKeyboardVisible(keyboardVisible);

      // Scroll typing area into view when keyboard appears
      if (keyboardVisible && containerRef.current && isTabletRef.current) {
        setTimeout(() => {
          containerRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }, 100);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);

      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
        window.visualViewport?.removeEventListener('scroll', handleViewportChange);
      };
    }
  }, []);

  // Handle touch events to show mobile keyboard
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isTouchDeviceRef.current = true;
    // Prevent default to avoid text selection on long press
    e.preventDefault();

    // Add visual feedback on touch for tablets
    if (containerRef.current && isTabletRef.current) {
      containerRef.current.classList.add('ring-2', 'ring-primary/30');

      // Remove feedback after a short duration
      if (touchFeedbackTimerRef.current) {
        clearTimeout(touchFeedbackTimerRef.current);
      }
      touchFeedbackTimerRef.current = setTimeout(() => {
        containerRef.current?.classList.remove('ring-2', 'ring-primary/30');
      }, 200);
    }

    // Focus the hidden input to show keyboard
    if (hiddenInputRef.current) {
      hiddenInputRef.current.focus();

      // On tablets, ensure keyboard stays open by preventing blur
      // during the touch interaction
      if (isTabletRef.current) {
        hiddenInputRef.current.setAttribute('data-touch-active', 'true');
      }
    }
  }, []);

  // Handle touch end to re-focus if needed
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();

    // Small delay to prevent keyboard flicker on tablets
    setTimeout(() => {
      if (hiddenInputRef.current) {
        hiddenInputRef.current.removeAttribute('data-touch-active');

        // Ensure focus is maintained on active sessions
        if (!isComplete && document.activeElement !== hiddenInputRef.current) {
          hiddenInputRef.current.focus();
        }
      }
    }, 50);
  }, [isComplete]);

  // Handle input from mobile keyboard
  const handleMobileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (!value) {
        // If the input is cleared, treat as backspace
        handleBackspace();
        return;
      }

      // Handle autocorrect/suggestions that might send multiple characters
      // On tablets, some keyboards send the entire word at once
      if (value.length > 1 && isTabletRef.current) {
        // Process each character sequentially with slight delay for better visual feedback
        // This helps users see what they're typing in real-time
        let charIndex = 0;
        const processNextChar = () => {
          if (charIndex < value.length) {
            const char = value[charIndex];
            if (char) {
              handleKeyPress(char);
              // Add visual feedback for each character on tablet
              if (containerRef.current) {
                containerRef.current.classList.add('ring-1', 'ring-primary/20');
                setTimeout(() => {
                  containerRef.current?.classList.remove('ring-1', 'ring-primary/20');
                }, 50);
              }
            }
            charIndex++;
            // Use RAF for smoother updates
            requestAnimationFrame(processNextChar);
          }
        };
        requestAnimationFrame(processNextChar);
      } else {
        // Get the last character typed
        const lastChar = value[value.length - 1];

        if (lastChar) {
          handleKeyPress(lastChar);
          // Add visual feedback for single character
          if (containerRef.current && isTabletRef.current) {
            containerRef.current.classList.add('ring-1', 'ring-primary/20');
            setTimeout(() => {
              containerRef.current?.classList.remove('ring-1', 'ring-primary/20');
            }, 50);
          }
        }
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

  // Cleanup touch feedback timer
  useEffect(() => {
    return () => {
      if (touchFeedbackTimerRef.current) {
        clearTimeout(touchFeedbackTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={cn('flex flex-col gap-3 sm:gap-4 typing-scroll-fix', className)}>
      {/* Stats bar - subtle, not prominent */}
      {showStats && <StatsBar stats={stats} progress={progress} />}

      {/* Typing area - the main focus */}
      <div
        ref={containerRef}
        tabIndex={0}
        className={cn(
          'relative rounded-lg border border-border bg-card p-3 sm:p-4 md:p-6 lg:p-8',
          'font-mono text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
          'cursor-text select-none',
          'touch-manipulation', // Prevent double-tap zoom on mobile
          'min-h-[160px] sm:min-h-[200px] md:min-h-[280px] lg:min-h-[320px]', // Responsive min-height
          'max-h-[70vh] sm:max-h-[75vh] overflow-y-auto', // Prevent overflow on small screens
          'typing-container-tablet typing-container-ipad-pro',
          'transition-all duration-200', // Smooth transitions for keyboard appearance
          isComplete && 'border-green-600/50 dark:border-green-400/50',
          // Add extra bottom margin when keyboard is visible on tablets
          isKeyboardVisible && isTabletRef.current && 'mb-8'
        )}
        role="textbox"
        aria-label="Typing input area"
        aria-readonly="true"
        aria-describedby="keyboard-shortcuts-hint"
        aria-invalid={errors.size > 0}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleContainerClick}
      >
        {/* Hidden input for mobile keyboard - optimized for tablets */}
        <input
          ref={hiddenInputRef}
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          data-form-type="other"
          data-lpignore="true"
          data-1p-ignore="true"
          enterKeyHint="next"
          // Additional attributes to prevent autocomplete on tablets
          name="typing-input-hidden"
          id="typing-input-hidden"
          aria-autocomplete="none"
          className="absolute opacity-0 pointer-events-none touch-manipulation"
          // Inline styles for better tablet compatibility
          style={{
            position: 'absolute',
            top: '-9999px',
            left: '-9999px',
            width: '1px',
            height: '1px',
            opacity: 0,
            pointerEvents: 'none',
            // Prevent input zoom on iOS
            fontSize: '16px',
          }}
          onChange={handleMobileInput}
          onKeyDown={handleMobileKeyDown}
          onBlur={(e) => {
            // Prevent blur during active touch interaction on tablets
            const isTouchActive = e.target.getAttribute('data-touch-active') === 'true';
            if (isTouchActive) {
              e.preventDefault();
              e.target.focus();
              return;
            }

            // Re-focus immediately if touch device and session is active
            // Use shorter delay for tablets (better responsiveness)
            if (isTouchDeviceRef.current && !isComplete) {
              const delay = isTabletRef.current ? 50 : 100;
              setTimeout(() => {
                if (hiddenInputRef.current && !isComplete) {
                  e.target.focus();
                }
              }, delay);
            }
          }}
          aria-hidden="true"
          tabIndex={-1}
        />
        {/* Character display */}
        <div className="flex flex-wrap gap-y-1 sm:gap-y-1.5 md:gap-y-2 lg:gap-y-3">
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
                aria-current={isCurrent ? 'location' : undefined}
                aria-invalid={hasError && isTyped ? 'true' : undefined}
              >
                {/* Cursor indicator with blink animation - larger for tablets */}
                {isCurrent && (
                  <span
                    className="absolute left-0 top-0 bottom-0 w-[2px] md:w-[3px] bg-primary animate-cursor-blink rounded-full"
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
          <div
            className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border text-center"
            role="status"
            aria-live="polite"
          >
            <p className="text-green-600 dark:text-green-400 font-medium text-base sm:text-lg md:text-xl">Complete!</p>
            <p className="hidden md:block text-sm text-muted-foreground mt-1">
              Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs" aria-hidden="true">Enter</kbd> for next challenge or <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs" aria-hidden="true">Esc</kbd> to try again
            </p>
            <p className="md:hidden text-xs sm:text-sm text-muted-foreground mt-2 px-4">
              Tap typing area to continue or restart
            </p>
          </div>
        )}

        {/* Instructions when not started */}
        {!isStarted && !isComplete && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border text-center">
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base px-4">
              {isTouchDeviceRef.current ? 'Tap to start typing...' : 'Start typing to begin...'}
            </p>
          </div>
        )}
      </div>

      {/* Keyboard shortcuts hint - hidden on touch devices for cleaner UI */}
      <div
        id="keyboard-shortcuts-hint"
        className="hidden md:flex items-center gap-4 text-xs text-muted-foreground"
        role="region"
        aria-label="Available keyboard shortcuts"
      >
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono" aria-hidden="true">Esc</kbd> Restart
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono" aria-hidden="true">Tab</kbd> Skip
        </span>
        {isComplete && (
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono" aria-hidden="true">Enter</kbd> Next
          </span>
        )}
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono" aria-hidden="true">⌫</kbd> Undo
        </span>
      </div>
    </div>
  );
}

export type { TypingStats, KeystrokeEvent };
