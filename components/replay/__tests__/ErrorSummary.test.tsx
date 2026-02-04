/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  ErrorSummary,
  computeErrorDetails,
  groupErrorPatterns,
} from '../ErrorSummary';
import type { KeystrokeLogEntry } from '../SessionReplay';

describe('computeErrorDetails', () => {
  it('should return empty array for no errors', () => {
    const logs: KeystrokeLogEntry[] = [
      { id: 1, timestamp: 100, expected: 'a', actual: 'a', isCorrect: true, latencyMs: 100 },
      { id: 2, timestamp: 200, expected: 'b', actual: 'b', isCorrect: true, latencyMs: 100 },
    ];

    const result = computeErrorDetails(logs, 'ab');
    expect(result).toHaveLength(0);
  });

  it('should identify errors with correct positions', () => {
    const logs: KeystrokeLogEntry[] = [
      { id: 1, timestamp: 100, expected: 'a', actual: 'a', isCorrect: true, latencyMs: 100 },
      { id: 2, timestamp: 200, expected: 'b', actual: 'x', isCorrect: false, latencyMs: 100 },
      { id: 3, timestamp: 300, expected: 'c', actual: 'c', isCorrect: true, latencyMs: 100 },
    ];

    const result = computeErrorDetails(logs, 'abc');
    expect(result).toHaveLength(1);
    expect(result[0].position).toBe(1);
    expect(result[0].expected).toBe('b');
    expect(result[0].actual).toBe('x');
    expect(result[0].timestamp).toBe(200);
  });

  it('should include surrounding context', () => {
    const logs: KeystrokeLogEntry[] = [
      { id: 1, timestamp: 100, expected: 'h', actual: 'h', isCorrect: true, latencyMs: 100 },
      { id: 2, timestamp: 200, expected: 'e', actual: 'e', isCorrect: true, latencyMs: 100 },
      { id: 3, timestamp: 300, expected: 'l', actual: 'e', isCorrect: true, latencyMs: 100 },
      { id: 4, timestamp: 400, expected: 'l', actual: 'l', isCorrect: true, latencyMs: 100 },
      { id: 5, timestamp: 500, expected: 'o', actual: 'x', isCorrect: false, latencyMs: 100 },
    ];

    const result = computeErrorDetails(logs, 'hello');
    expect(result).toHaveLength(1);
    // Context should include chars around position 4
    expect(result[0].context).toBe('ello');
  });

  it('should handle multiple errors', () => {
    const logs: KeystrokeLogEntry[] = [
      { id: 1, timestamp: 100, expected: 'a', actual: 'x', isCorrect: false, latencyMs: 100 },
      { id: 2, timestamp: 200, expected: 'b', actual: 'y', isCorrect: false, latencyMs: 100 },
    ];

    const result = computeErrorDetails(logs, 'ab');
    expect(result).toHaveLength(2);
    expect(result[0].expected).toBe('a');
    expect(result[1].expected).toBe('b');
  });

  it('should handle error at beginning of text', () => {
    const logs: KeystrokeLogEntry[] = [
      { id: 1, timestamp: 100, expected: 'a', actual: 'z', isCorrect: false, latencyMs: 100 },
    ];

    const result = computeErrorDetails(logs, 'abc');
    expect(result).toHaveLength(1);
    expect(result[0].position).toBe(0);
    expect(result[0].context).toBe('abc');
  });
});

describe('groupErrorPatterns', () => {
  it('should group identical error patterns', () => {
    const errors = [
      { position: 0, timestamp: 100, expected: 'a', actual: 'b', context: 'abc' },
      { position: 5, timestamp: 500, expected: 'a', actual: 'b', context: 'abc' },
      { position: 10, timestamp: 1000, expected: 'a', actual: 'b', context: 'abc' },
    ];

    const result = groupErrorPatterns(errors);
    expect(result).toHaveLength(1);
    expect(result[0].expected).toBe('a');
    expect(result[0].actual).toBe('b');
    expect(result[0].count).toBe(3);
  });

  it('should separate different error patterns', () => {
    const errors = [
      { position: 0, timestamp: 100, expected: 'a', actual: 'b', context: 'abc' },
      { position: 5, timestamp: 500, expected: 'c', actual: 'd', context: 'cde' },
    ];

    const result = groupErrorPatterns(errors);
    expect(result).toHaveLength(2);
  });

  it('should sort by count descending', () => {
    const errors = [
      { position: 0, timestamp: 100, expected: 'x', actual: 'y', context: 'xyz' },
      { position: 1, timestamp: 200, expected: 'a', actual: 'b', context: 'abc' },
      { position: 2, timestamp: 300, expected: 'a', actual: 'b', context: 'abc' },
      { position: 3, timestamp: 400, expected: 'a', actual: 'b', context: 'abc' },
    ];

    const result = groupErrorPatterns(errors);
    expect(result[0].expected).toBe('a');
    expect(result[0].count).toBe(3);
    expect(result[1].expected).toBe('x');
    expect(result[1].count).toBe(1);
  });

  it('should return empty array for no errors', () => {
    const result = groupErrorPatterns([]);
    expect(result).toHaveLength(0);
  });
});

describe('ErrorSummary component', () => {
  const mockOnSeekToTime = vi.fn();

  const logsWithErrors: KeystrokeLogEntry[] = [
    { id: 1, timestamp: 100, expected: 'g', actual: 'g', isCorrect: true, latencyMs: 100 },
    { id: 2, timestamp: 200, expected: 'i', actual: 'i', isCorrect: true, latencyMs: 100 },
    { id: 3, timestamp: 300, expected: 't', actual: 'r', isCorrect: false, latencyMs: 100 },
    { id: 4, timestamp: 400, expected: ' ', actual: '.', isCorrect: false, latencyMs: 100 },
    { id: 5, timestamp: 500, expected: 'a', actual: 'a', isCorrect: true, latencyMs: 100 },
  ];

  const logsWithoutErrors: KeystrokeLogEntry[] = [
    { id: 1, timestamp: 100, expected: 'a', actual: 'a', isCorrect: true, latencyMs: 100 },
    { id: 2, timestamp: 200, expected: 'b', actual: 'b', isCorrect: true, latencyMs: 100 },
  ];

  it('should render error summary with errors', () => {
    render(
      <ErrorSummary
        keystrokeLogs={logsWithErrors}
        challengeContent="git a"
        onSeekToTime={mockOnSeekToTime}
      />
    );

    expect(screen.getByTestId('error-summary')).toBeTruthy();
  });

  it('should render perfect session message when no errors', () => {
    render(
      <ErrorSummary
        keystrokeLogs={logsWithoutErrors}
        challengeContent="ab"
        onSeekToTime={mockOnSeekToTime}
      />
    );

    expect(screen.getByTestId('error-summary-empty')).toBeTruthy();
    expect(screen.getByText('Perfect session - no errors!')).toBeTruthy();
  });

  it('should display error patterns', () => {
    render(
      <ErrorSummary
        keystrokeLogs={logsWithErrors}
        challengeContent="git a"
        onSeekToTime={mockOnSeekToTime}
      />
    );

    expect(screen.getByTestId('error-pattern-0')).toBeTruthy();
  });

  it('should display error details with timestamps', () => {
    render(
      <ErrorSummary
        keystrokeLogs={logsWithErrors}
        challengeContent="git a"
        onSeekToTime={mockOnSeekToTime}
      />
    );

    expect(screen.getByTestId('error-detail-0')).toBeTruthy();
    expect(screen.getByTestId('error-detail-1')).toBeTruthy();
  });

  it('should call onSeekToTime when clicking an error detail', () => {
    render(
      <ErrorSummary
        keystrokeLogs={logsWithErrors}
        challengeContent="git a"
        onSeekToTime={mockOnSeekToTime}
      />
    );

    const errorButton = screen.getByTestId('error-detail-0');
    fireEvent.click(errorButton);

    // Should seek to 500ms before the error (300 - 500 = capped at 0)
    expect(mockOnSeekToTime).toHaveBeenCalledWith(300);
  });

  it('should show Space for space character errors', () => {
    render(
      <ErrorSummary
        keystrokeLogs={logsWithErrors}
        challengeContent="git a"
        onSeekToTime={mockOnSeekToTime}
      />
    );

    // The error pattern for ' ' -> '.' should show "Space"
    const summary = screen.getByTestId('error-summary');
    expect(summary.textContent).toContain('Space');
  });
});
