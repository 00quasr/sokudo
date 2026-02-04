'use client';

import { useMemo } from 'react';
import type { KeystrokeLogEntry } from './SessionReplay';
import { formatTime } from './SessionReplay';

interface ErrorSummaryProps {
  keystrokeLogs: KeystrokeLogEntry[];
  challengeContent: string;
  onSeekToTime: (timestamp: number) => void;
}

export interface ErrorDetail {
  position: number;
  timestamp: number;
  expected: string;
  actual: string;
  context: string;
}

export interface ErrorPatternGroup {
  expected: string;
  actual: string;
  count: number;
  positions: number[];
  timestamps: number[];
}

export function computeErrorDetails(
  keystrokeLogs: KeystrokeLogEntry[],
  challengeContent: string
): ErrorDetail[] {
  const errors: ErrorDetail[] = [];
  let position = 0;

  for (const log of keystrokeLogs) {
    if (!log.isCorrect) {
      // Get surrounding context (up to 3 chars before and after)
      const contextStart = Math.max(0, position - 3);
      const contextEnd = Math.min(challengeContent.length, position + 4);
      const context = challengeContent.slice(contextStart, contextEnd);

      errors.push({
        position,
        timestamp: log.timestamp,
        expected: log.expected,
        actual: log.actual,
        context,
      });
    }
    position++;
  }

  return errors;
}

export function groupErrorPatterns(errors: ErrorDetail[]): ErrorPatternGroup[] {
  const patternMap = new Map<string, ErrorPatternGroup>();

  for (const error of errors) {
    const key = `${error.expected}->${error.actual}`;
    const existing = patternMap.get(key);
    if (existing) {
      existing.count++;
      existing.positions.push(error.position);
      existing.timestamps.push(error.timestamp);
    } else {
      patternMap.set(key, {
        expected: error.expected,
        actual: error.actual,
        count: 1,
        positions: [error.position],
        timestamps: [error.timestamp],
      });
    }
  }

  return Array.from(patternMap.values()).sort((a, b) => b.count - a.count);
}

function displayChar(char: string): string {
  if (char === ' ') return 'Space';
  if (char === '\n') return 'Enter';
  if (char === '\t') return 'Tab';
  return char;
}

export function ErrorSummary({ keystrokeLogs, challengeContent, onSeekToTime }: ErrorSummaryProps) {
  const errorDetails = useMemo(
    () => computeErrorDetails(keystrokeLogs, challengeContent),
    [keystrokeLogs, challengeContent]
  );

  const errorPatterns = useMemo(
    () => groupErrorPatterns(errorDetails),
    [errorDetails]
  );

  if (errorDetails.length === 0) {
    return (
      <div
        className="border-b border-border bg-green-500/5 p-4 text-center"
        data-testid="error-summary-empty"
      >
        <p className="text-sm text-green-400">Perfect session - no errors!</p>
      </div>
    );
  }

  return (
    <div
      className="border-b border-border bg-muted/20 overflow-hidden"
      data-testid="error-summary"
    >
      <div className="p-4 max-h-64 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Error Patterns */}
          <div>
            <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Error Patterns
            </h3>
            <div className="space-y-1.5">
              {errorPatterns.slice(0, 8).map((pattern, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-sm"
                  data-testid={`error-pattern-${idx}`}
                >
                  <span className="font-mono text-red-400">
                    {displayChar(pattern.expected)}
                  </span>
                  <span className="text-muted-foreground">&rarr;</span>
                  <span className="font-mono text-muted-foreground">
                    {displayChar(pattern.actual)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {pattern.count}x
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Error List */}
          <div>
            <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Error Timeline
            </h3>
            <div className="space-y-1">
              {errorDetails.slice(0, 10).map((error, idx) => (
                <button
                  key={idx}
                  onClick={() => onSeekToTime(error.timestamp)}
                  className="flex items-center gap-2 text-sm w-full text-left hover:bg-muted/50 rounded px-1.5 py-0.5 transition-colors"
                  data-testid={`error-detail-${idx}`}
                >
                  <span className="text-xs font-mono text-muted-foreground w-12">
                    {formatTime(error.timestamp)}
                  </span>
                  <span className="font-mono text-muted-foreground truncate">
                    &ldquo;
                    <span className="text-foreground">
                      {error.context.slice(0, error.position > 2 ? 3 : error.position)}
                    </span>
                    <span className="text-red-400 underline">
                      {displayChar(error.expected)}
                    </span>
                    <span className="text-foreground">
                      {error.context.slice(
                        (error.position > 2 ? 3 : error.position) + 1
                      )}
                    </span>
                    &rdquo;
                  </span>
                  <span className="text-xs text-red-400 ml-auto whitespace-nowrap">
                    typed &ldquo;{displayChar(error.actual)}&rdquo;
                  </span>
                </button>
              ))}
              {errorDetails.length > 10 && (
                <p className="text-xs text-muted-foreground px-1.5">
                  +{errorDetails.length - 10} more errors
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
