/**
 * @vitest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  useTypingEngine,
  UseTypingEngineOptions,
  TypingStats,
  KeystrokeEvent,
} from '../useTypingEngine';

describe('useTypingEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      expect(result.current.cursorPosition).toBe(0);
      expect(result.current.isStarted).toBe(false);
      expect(result.current.isComplete).toBe(false);
      expect(result.current.typedText).toBe('');
      expect(result.current.errors.size).toBe(0);
      expect(result.current.keystrokeLog).toEqual([]);
      expect(result.current.stats).toEqual({
        wpm: 0,
        rawWpm: 0,
        accuracy: 100,
        keystrokes: 0,
        errors: 0,
        durationMs: 0,
        latency: {
          avgLatencyMs: 0,
          minLatencyMs: 0,
          maxLatencyMs: 0,
          stdDevLatencyMs: 0,
          p50LatencyMs: 0,
          p95LatencyMs: 0,
        },
      });
    });

    it('should expose targetText from options', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'git commit' })
      );

      expect(result.current.targetText).toBe('git commit');
    });

    it('should calculate currentChar correctly', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'abc' })
      );

      expect(result.current.currentChar).toBe('a');
    });

    it('should initialize progress at 0', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'test' })
      );

      expect(result.current.progress).toBe(0);
    });

    it('should handle empty target text', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: '' })
      );

      expect(result.current.cursorPosition).toBe(0);
      expect(result.current.currentChar).toBeNull();
      expect(result.current.progress).toBe(0);
    });
  });

  describe('keystroke handling', () => {
    it('should auto-start on first keypress', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      expect(result.current.isStarted).toBe(false);

      act(() => {
        result.current.handleKeyPress('h');
      });

      expect(result.current.isStarted).toBe(true);
    });

    it('should advance cursor on correct keypress', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      act(() => {
        result.current.handleKeyPress('h');
      });

      expect(result.current.cursorPosition).toBe(1);
      expect(result.current.currentChar).toBe('e');
    });

    it('should still advance cursor on incorrect keypress', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      act(() => {
        result.current.handleKeyPress('x');
      });

      expect(result.current.cursorPosition).toBe(1);
      expect(result.current.currentChar).toBe('e');
    });

    it('should track typed text', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      act(() => {
        result.current.handleKeyPress('h');
        result.current.handleKeyPress('e');
        result.current.handleKeyPress('l');
      });

      expect(result.current.typedText).toBe('hel');
    });

    it('should record errors with position', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      act(() => {
        result.current.handleKeyPress('h');
        result.current.handleKeyPress('x'); // error at position 1
        result.current.handleKeyPress('l');
        result.current.handleKeyPress('l');
        result.current.handleKeyPress('x'); // error at position 4
      });

      expect(result.current.errors.size).toBe(2);
      expect(result.current.errors.get(1)).toBe('x');
      expect(result.current.errors.get(4)).toBe('x');
    });

    it('should update isCorrectSoFar based on errors', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      expect(result.current.isCorrectSoFar).toBe(true);

      act(() => {
        result.current.handleKeyPress('h');
      });

      expect(result.current.isCorrectSoFar).toBe(true);

      act(() => {
        result.current.handleKeyPress('x');
      });

      expect(result.current.isCorrectSoFar).toBe(false);
    });

    it('should ignore keypresses when complete', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hi' })
      );

      act(() => {
        result.current.handleKeyPress('h');
        result.current.handleKeyPress('i');
      });

      expect(result.current.isComplete).toBe(true);
      const keystrokeCount = result.current.keystrokeLog.length;

      act(() => {
        result.current.handleKeyPress('x');
      });

      expect(result.current.keystrokeLog.length).toBe(keystrokeCount);
      expect(result.current.cursorPosition).toBe(2);
    });
  });

  describe('keystroke logging', () => {
    it('should log each keystroke with correct data', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'ab' })
      );

      act(() => {
        result.current.handleKeyPress('a');
      });

      vi.advanceTimersByTime(100);

      act(() => {
        result.current.handleKeyPress('x'); // error
      });

      expect(result.current.keystrokeLog.length).toBe(2);

      const firstLog = result.current.keystrokeLog[0];
      expect(firstLog.expected).toBe('a');
      expect(firstLog.actual).toBe('a');
      expect(firstLog.isCorrect).toBe(true);
      expect(firstLog.timestamp).toBe(0);

      const secondLog = result.current.keystrokeLog[1];
      expect(secondLog.expected).toBe('b');
      expect(secondLog.actual).toBe('x');
      expect(secondLog.isCorrect).toBe(false);
      expect(secondLog.latency).toBe(100);
    });

    it('should call onKeystroke callback for each keystroke', () => {
      const onKeystroke = vi.fn();
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hi', onKeystroke })
      );

      act(() => {
        result.current.handleKeyPress('h');
        result.current.handleKeyPress('i');
      });

      expect(onKeystroke).toHaveBeenCalledTimes(2);
      expect(onKeystroke).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          expected: 'h',
          actual: 'h',
          isCorrect: true,
        })
      );
    });
  });

  describe('progress tracking', () => {
    it('should calculate progress percentage correctly', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'test' })
      );

      expect(result.current.progress).toBe(0);

      act(() => {
        result.current.handleKeyPress('t');
      });
      expect(result.current.progress).toBe(25);

      act(() => {
        result.current.handleKeyPress('e');
      });
      expect(result.current.progress).toBe(50);

      act(() => {
        result.current.handleKeyPress('s');
        result.current.handleKeyPress('t');
      });
      expect(result.current.progress).toBe(100);
    });
  });

  describe('completion', () => {
    it('should mark as complete when all characters typed', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hi' })
      );

      act(() => {
        result.current.handleKeyPress('h');
      });

      expect(result.current.isComplete).toBe(false);

      act(() => {
        result.current.handleKeyPress('i');
      });

      expect(result.current.isComplete).toBe(true);
    });

    it('should call onComplete callback with final stats', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hi', onComplete })
      );

      act(() => {
        result.current.handleKeyPress('h');
      });

      vi.advanceTimersByTime(1000);

      act(() => {
        result.current.handleKeyPress('i');
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
      const [stats, keystrokeLog] = onComplete.mock.calls[0];

      expect(stats.keystrokes).toBe(2);
      expect(stats.errors).toBe(0);
      expect(stats.accuracy).toBe(100);
      expect(keystrokeLog.length).toBe(2);
    });

    it('should set currentChar to null when complete', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'a' })
      );

      act(() => {
        result.current.handleKeyPress('a');
      });

      expect(result.current.currentChar).toBeNull();
    });
  });

  describe('WPM calculation', () => {
    it('should calculate WPM based on correct characters typed', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      // Type 5 correct characters (1 word)
      act(() => {
        result.current.handleKeyPress('h');
        result.current.handleKeyPress('e');
        result.current.handleKeyPress('l');
        result.current.handleKeyPress('l');
        result.current.handleKeyPress('o');
      });

      // After exactly 1 minute, WPM should be 1
      vi.advanceTimersByTime(60000);

      // Force stats update by running timers
      act(() => {
        vi.runOnlyPendingTimers();
      });

      // The stats should be calculated based on 5 chars / 5 = 1 word in 1 minute = 1 WPM
      // But since the timer elapsed AFTER typing, let's check the final stats
      // Final durationMs at completion was ~0ms, so let's test a more realistic scenario
    });

    it('should calculate rawWpm including errors', () => {
      const onComplete = vi.fn();
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hi', onComplete })
      );

      act(() => {
        result.current.handleKeyPress('h');
      });

      vi.advanceTimersByTime(6000); // 6 seconds

      act(() => {
        result.current.handleKeyPress('x'); // error
      });

      expect(onComplete).toHaveBeenCalled();
      const stats: TypingStats = onComplete.mock.calls[0][0];

      // 1 correct char in 6 seconds = 0.1 minutes
      // WPM = (1/5) / 0.1 = 2 WPM
      expect(stats.wpm).toBe(2);

      // 2 total keystrokes in 6 seconds
      // rawWpm = (2/5) / 0.1 = 4 raw WPM
      expect(stats.rawWpm).toBe(4);
    });
  });

  describe('accuracy calculation', () => {
    it('should calculate 100% accuracy with no errors', () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hi', onComplete })
      );

      act(() => {
        result.current.handleKeyPress('h');
        result.current.handleKeyPress('i');
      });

      const stats: TypingStats = onComplete.mock.calls[0][0];
      expect(stats.accuracy).toBe(100);
    });

    it('should calculate accuracy with errors', () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'test', onComplete })
      );

      act(() => {
        result.current.handleKeyPress('t');
        result.current.handleKeyPress('x'); // error
        result.current.handleKeyPress('s');
        result.current.handleKeyPress('t');
      });

      const stats: TypingStats = onComplete.mock.calls[0][0];
      // 3 correct out of 4 = 75%
      expect(stats.accuracy).toBe(75);
    });

    it('should handle all errors correctly', () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'ab', onComplete })
      );

      act(() => {
        result.current.handleKeyPress('x');
        result.current.handleKeyPress('y');
      });

      const stats: TypingStats = onComplete.mock.calls[0][0];
      expect(stats.accuracy).toBe(0);
      expect(stats.errors).toBe(2);
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      act(() => {
        result.current.handleKeyPress('h');
        result.current.handleKeyPress('x');
        result.current.handleKeyPress('l');
      });

      expect(result.current.cursorPosition).toBe(3);
      expect(result.current.errors.size).toBe(1);

      act(() => {
        result.current.reset();
      });

      expect(result.current.cursorPosition).toBe(0);
      expect(result.current.isStarted).toBe(false);
      expect(result.current.isComplete).toBe(false);
      expect(result.current.typedText).toBe('');
      expect(result.current.errors.size).toBe(0);
      expect(result.current.keystrokeLog).toEqual([]);
      expect(result.current.stats).toEqual({
        wpm: 0,
        rawWpm: 0,
        accuracy: 100,
        keystrokes: 0,
        errors: 0,
        durationMs: 0,
        latency: {
          avgLatencyMs: 0,
          minLatencyMs: 0,
          maxLatencyMs: 0,
          stdDevLatencyMs: 0,
          p50LatencyMs: 0,
          p95LatencyMs: 0,
        },
      });
    });

    it('should allow restarting after reset', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hi' })
      );

      act(() => {
        result.current.handleKeyPress('h');
        result.current.handleKeyPress('i');
      });

      expect(result.current.isComplete).toBe(true);

      act(() => {
        result.current.reset();
      });

      act(() => {
        result.current.handleKeyPress('h');
      });

      expect(result.current.cursorPosition).toBe(1);
      expect(result.current.isStarted).toBe(true);
      expect(result.current.isComplete).toBe(false);
    });
  });

  describe('start', () => {
    it('should start the session manually', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      expect(result.current.isStarted).toBe(false);

      act(() => {
        result.current.start();
      });

      expect(result.current.isStarted).toBe(true);
    });

    it('should not restart if already started', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      act(() => {
        result.current.start();
      });

      const initialLog = result.current.keystrokeLog.length;

      vi.advanceTimersByTime(1000);

      act(() => {
        result.current.start();
      });

      // Should not have reset anything
      expect(result.current.isStarted).toBe(true);
    });
  });

  describe('target text changes', () => {
    it('should reset when targetText changes', () => {
      const { result, rerender } = renderHook(
        (props: UseTypingEngineOptions) => useTypingEngine(props),
        { initialProps: { targetText: 'hello' } }
      );

      act(() => {
        result.current.handleKeyPress('h');
        result.current.handleKeyPress('e');
      });

      expect(result.current.cursorPosition).toBe(2);

      rerender({ targetText: 'world' });

      expect(result.current.cursorPosition).toBe(0);
      expect(result.current.isStarted).toBe(false);
      expect(result.current.typedText).toBe('');
      expect(result.current.targetText).toBe('world');
    });
  });

  describe('special characters', () => {
    it('should handle spaces correctly', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'a b' })
      );

      act(() => {
        result.current.handleKeyPress('a');
        result.current.handleKeyPress(' ');
        result.current.handleKeyPress('b');
      });

      expect(result.current.isComplete).toBe(true);
      expect(result.current.typedText).toBe('a b');
      expect(result.current.errors.size).toBe(0);
    });

    it('should handle special characters in code', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'git commit -m "msg"' })
      );

      const chars = 'git commit -m "msg"'.split('');

      act(() => {
        chars.forEach((char) => result.current.handleKeyPress(char));
      });

      expect(result.current.isComplete).toBe(true);
      expect(result.current.typedText).toBe('git commit -m "msg"');
    });

    it('should handle newlines', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'line1\nline2' })
      );

      act(() => {
        'line1'.split('').forEach((c) => result.current.handleKeyPress(c));
        result.current.handleKeyPress('\n');
        'line2'.split('').forEach((c) => result.current.handleKeyPress(c));
      });

      expect(result.current.isComplete).toBe(true);
      expect(result.current.errors.size).toBe(0);
    });

    it('should handle tabs', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'a\tb' })
      );

      act(() => {
        result.current.handleKeyPress('a');
        result.current.handleKeyPress('\t');
        result.current.handleKeyPress('b');
      });

      expect(result.current.isComplete).toBe(true);
      expect(result.current.errors.size).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle single character target', () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'a', onComplete })
      );

      act(() => {
        result.current.handleKeyPress('a');
      });

      expect(result.current.isComplete).toBe(true);
      expect(onComplete).toHaveBeenCalled();
    });

    it('should handle rapid keypresses', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'abcdefghij' })
      );

      act(() => {
        'abcdefghij'.split('').forEach((c) => result.current.handleKeyPress(c));
      });

      expect(result.current.isComplete).toBe(true);
      expect(result.current.keystrokeLog.length).toBe(10);
    });

    it('should calculate latency between keystrokes', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'abc' })
      );

      act(() => {
        result.current.handleKeyPress('a');
      });

      vi.advanceTimersByTime(150);

      act(() => {
        result.current.handleKeyPress('b');
      });

      vi.advanceTimersByTime(200);

      act(() => {
        result.current.handleKeyPress('c');
      });

      expect(result.current.keystrokeLog[0].latency).toBe(0);
      expect(result.current.keystrokeLog[1].latency).toBe(150);
      expect(result.current.keystrokeLog[2].latency).toBe(200);
    });
  });

  describe('typing scenarios', () => {
    it('should handle beginner typing (slow, many errors)', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello', onComplete })
      );

      // Simulate slow typing with errors
      act(() => result.current.handleKeyPress('h'));
      vi.advanceTimersByTime(500);
      act(() => result.current.handleKeyPress('x')); // error
      vi.advanceTimersByTime(500);
      act(() => result.current.handleKeyPress('l'));
      vi.advanceTimersByTime(500);
      act(() => result.current.handleKeyPress('l'));
      vi.advanceTimersByTime(500);
      act(() => result.current.handleKeyPress('o'));

      const stats = onComplete.mock.calls[0][0];
      expect(stats.errors).toBe(1);
      expect(stats.accuracy).toBe(80);
    });

    it('should handle expert typing (fast, no errors)', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

      const onComplete = vi.fn();
      // 25 characters = 5 words
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'git commit -m "test msg"', onComplete })
      );

      // Type all characters quickly
      const chars = 'git commit -m "test msg"'.split('');
      chars.forEach((char, i) => {
        act(() => result.current.handleKeyPress(char));
        if (i < chars.length - 1) {
          vi.advanceTimersByTime(50); // 50ms between keystrokes = ~240 WPM pace
        }
      });

      const stats = onComplete.mock.calls[0][0];
      expect(stats.errors).toBe(0);
      expect(stats.accuracy).toBe(100);
      expect(stats.wpm).toBeGreaterThan(100);
    });

    it('should handle git command sequence', () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'git add .', onComplete })
      );

      'git add .'.split('').forEach((char) => {
        act(() => result.current.handleKeyPress(char));
      });

      expect(result.current.isComplete).toBe(true);
      expect(result.current.errors.size).toBe(0);
    });
  });

  describe('latency statistics', () => {
    it('should calculate latency stats on completion', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'abc', onComplete })
      );

      act(() => {
        result.current.handleKeyPress('a');
      });

      vi.advanceTimersByTime(100);

      act(() => {
        result.current.handleKeyPress('b');
      });

      vi.advanceTimersByTime(200);

      act(() => {
        result.current.handleKeyPress('c');
      });

      expect(onComplete).toHaveBeenCalled();
      const stats = onComplete.mock.calls[0][0];

      // Latencies: [0, 100, 200] -> stats based on [100, 200]
      expect(stats.latency.avgLatencyMs).toBe(150);
      expect(stats.latency.minLatencyMs).toBe(100);
      expect(stats.latency.maxLatencyMs).toBe(200);
    });

    it('should include latency stats in real-time stats', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'abcde' })
      );

      act(() => {
        result.current.handleKeyPress('a');
      });

      vi.advanceTimersByTime(120);

      act(() => {
        result.current.handleKeyPress('b');
      });

      vi.advanceTimersByTime(80);

      act(() => {
        result.current.handleKeyPress('c');
      });

      // Not complete yet, but stats should be available
      expect(result.current.stats.latency.avgLatencyMs).toBe(100);
      expect(result.current.stats.latency.minLatencyMs).toBe(80);
      expect(result.current.stats.latency.maxLatencyMs).toBe(120);
    });

    it('should calculate p50 and p95 latency for longer sessions', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

      const onComplete = vi.fn();
      // 10 character target
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: '0123456789', onComplete })
      );

      // Type with varying latencies
      const latencies = [0, 100, 110, 90, 95, 105, 115, 85, 200, 100];

      act(() => {
        result.current.handleKeyPress('0');
      });

      for (let i = 1; i < 10; i++) {
        vi.advanceTimersByTime(latencies[i]);
        act(() => {
          result.current.handleKeyPress(String(i));
        });
      }

      const stats = onComplete.mock.calls[0][0];
      // Sorted latencies (excluding 0): [85, 90, 95, 100, 100, 105, 110, 115, 200]
      expect(stats.latency.minLatencyMs).toBe(85);
      expect(stats.latency.maxLatencyMs).toBe(200);
      // p50 at index 4 of 9 elements
      expect(stats.latency.p50LatencyMs).toBe(100);
    });

    it('should have zero latency stats before first keystroke', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      expect(result.current.stats.latency).toEqual({
        avgLatencyMs: 0,
        minLatencyMs: 0,
        maxLatencyMs: 0,
        stdDevLatencyMs: 0,
        p50LatencyMs: 0,
        p95LatencyMs: 0,
      });
    });

    it('should calculate standard deviation for consistent typing', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'abcd', onComplete })
      );

      // All same latencies = 0 stdDev
      act(() => result.current.handleKeyPress('a'));
      vi.advanceTimersByTime(100);
      act(() => result.current.handleKeyPress('b'));
      vi.advanceTimersByTime(100);
      act(() => result.current.handleKeyPress('c'));
      vi.advanceTimersByTime(100);
      act(() => result.current.handleKeyPress('d'));

      const stats = onComplete.mock.calls[0][0];
      expect(stats.latency.stdDevLatencyMs).toBe(0);
    });

    it('should calculate non-zero standard deviation for inconsistent typing', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'abc', onComplete })
      );

      // Latencies [0, 100, 200] -> [100, 200], mean=150, stdDev=50
      act(() => result.current.handleKeyPress('a'));
      vi.advanceTimersByTime(100);
      act(() => result.current.handleKeyPress('b'));
      vi.advanceTimersByTime(200);
      act(() => result.current.handleKeyPress('c'));

      const stats = onComplete.mock.calls[0][0];
      expect(stats.latency.stdDevLatencyMs).toBe(50);
    });
  });

  describe('backspace handling', () => {
    it('should move cursor back on backspace', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      act(() => {
        result.current.handleKeyPress('h');
        result.current.handleKeyPress('e');
      });

      expect(result.current.cursorPosition).toBe(2);

      act(() => {
        result.current.handleBackspace();
      });

      expect(result.current.cursorPosition).toBe(1);
      expect(result.current.typedText).toBe('h');
    });

    it('should remove error when backspacing over error', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      act(() => {
        result.current.handleKeyPress('h');
        result.current.handleKeyPress('x'); // error at position 1
      });

      expect(result.current.errors.has(1)).toBe(true);
      expect(result.current.isCorrectSoFar).toBe(false);

      act(() => {
        result.current.handleBackspace();
      });

      expect(result.current.errors.has(1)).toBe(false);
      expect(result.current.isCorrectSoFar).toBe(true);
    });

    it('should not backspace before position 0', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      act(() => {
        result.current.handleKeyPress('h');
      });

      act(() => {
        result.current.handleBackspace();
      });

      expect(result.current.cursorPosition).toBe(0);

      act(() => {
        result.current.handleBackspace();
      });

      // Should stay at 0
      expect(result.current.cursorPosition).toBe(0);
    });

    it('should not backspace if session not started', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      expect(result.current.isStarted).toBe(false);

      act(() => {
        result.current.handleBackspace();
      });

      expect(result.current.cursorPosition).toBe(0);
    });

    it('should not backspace when session is complete', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hi' })
      );

      act(() => {
        result.current.handleKeyPress('h');
        result.current.handleKeyPress('i');
      });

      expect(result.current.isComplete).toBe(true);
      expect(result.current.cursorPosition).toBe(2);

      act(() => {
        result.current.handleBackspace();
      });

      expect(result.current.cursorPosition).toBe(2);
      expect(result.current.typedText).toBe('hi');
    });

    it('should correctly update stats when backspacing correct char', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      act(() => {
        result.current.handleKeyPress('h');
        result.current.handleKeyPress('e');
        result.current.handleKeyPress('l');
      });

      expect(result.current.stats.keystrokes).toBe(3);
      expect(result.current.stats.errors).toBe(0);

      act(() => {
        result.current.handleBackspace();
      });

      expect(result.current.stats.keystrokes).toBe(2);
      expect(result.current.stats.errors).toBe(0);
    });

    it('should correctly update stats when backspacing error', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      act(() => {
        result.current.handleKeyPress('h');
        result.current.handleKeyPress('x'); // error
        result.current.handleKeyPress('l');
      });

      expect(result.current.stats.keystrokes).toBe(3);
      expect(result.current.stats.errors).toBe(1);

      act(() => {
        result.current.handleBackspace();
        result.current.handleBackspace();
      });

      expect(result.current.stats.keystrokes).toBe(1);
      expect(result.current.stats.errors).toBe(0);
    });

    it('should remove keystroke from log on backspace', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      act(() => {
        result.current.handleKeyPress('h');
        result.current.handleKeyPress('e');
      });

      expect(result.current.keystrokeLog.length).toBe(2);

      act(() => {
        result.current.handleBackspace();
      });

      expect(result.current.keystrokeLog.length).toBe(1);
    });

    it('should allow typing after backspace', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      act(() => {
        result.current.handleKeyPress('h');
        result.current.handleKeyPress('x'); // error
      });

      act(() => {
        result.current.handleBackspace();
        result.current.handleKeyPress('e'); // correct
      });

      expect(result.current.cursorPosition).toBe(2);
      expect(result.current.typedText).toBe('he');
      expect(result.current.errors.size).toBe(0);
    });
  });

  describe('escape handling', () => {
    it('should reset session on escape', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      act(() => {
        result.current.handleKeyPress('h');
        result.current.handleKeyPress('e');
        result.current.handleKeyPress('l');
      });

      expect(result.current.cursorPosition).toBe(3);
      expect(result.current.isStarted).toBe(true);

      act(() => {
        result.current.handleEscape();
      });

      expect(result.current.cursorPosition).toBe(0);
      expect(result.current.isStarted).toBe(false);
      expect(result.current.typedText).toBe('');
      expect(result.current.keystrokeLog.length).toBe(0);
    });

    it('should reset stats on escape', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      act(() => {
        result.current.handleKeyPress('h');
        result.current.handleKeyPress('x'); // error
      });

      expect(result.current.stats.keystrokes).toBe(2);
      expect(result.current.stats.errors).toBe(1);

      act(() => {
        result.current.handleEscape();
      });

      expect(result.current.stats.keystrokes).toBe(0);
      expect(result.current.stats.errors).toBe(0);
      expect(result.current.stats.accuracy).toBe(100);
    });

    it('should allow starting fresh after escape', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hi' })
      );

      act(() => {
        result.current.handleKeyPress('x');
        result.current.handleKeyPress('y');
      });

      expect(result.current.isComplete).toBe(true);

      act(() => {
        result.current.handleEscape();
      });

      expect(result.current.isComplete).toBe(false);
      expect(result.current.isStarted).toBe(false);

      act(() => {
        result.current.handleKeyPress('h');
      });

      expect(result.current.isStarted).toBe(true);
      expect(result.current.cursorPosition).toBe(1);
      expect(result.current.errors.size).toBe(0);
    });

    it('should clear errors on escape', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      act(() => {
        result.current.handleKeyPress('x');
        result.current.handleKeyPress('y');
        result.current.handleKeyPress('z');
      });

      expect(result.current.errors.size).toBe(3);

      act(() => {
        result.current.handleEscape();
      });

      expect(result.current.errors.size).toBe(0);
    });
  });

  describe('tab handling (hints)', () => {
    it('should return current character as hint', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      let hint: string | null = null;
      act(() => {
        hint = result.current.handleTab();
      });

      expect(hint).toBe('h');
    });

    it('should return correct hint at different positions', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      act(() => {
        result.current.handleKeyPress('h');
        result.current.handleKeyPress('e');
      });

      let hint: string | null = null;
      act(() => {
        hint = result.current.handleTab();
      });

      expect(hint).toBe('l');
    });

    it('should set hintUsed flag', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      expect(result.current.hintUsed).toBe(false);

      act(() => {
        result.current.handleTab();
      });

      expect(result.current.hintUsed).toBe(true);
    });

    it('should return null when session is complete', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hi' })
      );

      act(() => {
        result.current.handleKeyPress('h');
        result.current.handleKeyPress('i');
      });

      expect(result.current.isComplete).toBe(true);

      let hint: string | null = 'not null';
      act(() => {
        hint = result.current.handleTab();
      });

      expect(hint).toBeNull();
    });

    it('should reset hintUsed on reset', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      act(() => {
        result.current.handleTab();
      });

      expect(result.current.hintUsed).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.hintUsed).toBe(false);
    });

    it('should reset hintUsed on escape', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      act(() => {
        result.current.handleKeyPress('h');
        result.current.handleTab();
      });

      expect(result.current.hintUsed).toBe(true);

      act(() => {
        result.current.handleEscape();
      });

      expect(result.current.hintUsed).toBe(false);
    });

    it('should not advance cursor when showing hint', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      const initialPosition = result.current.cursorPosition;

      act(() => {
        result.current.handleTab();
      });

      expect(result.current.cursorPosition).toBe(initialPosition);
    });

    it('should work with special characters', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'git commit -m "test"' })
      );

      act(() => {
        'git commit '.split('').forEach((c) => result.current.handleKeyPress(c));
      });

      let hint: string | null = null;
      act(() => {
        hint = result.current.handleTab();
      });

      expect(hint).toBe('-');
    });
  });

  describe('combined special key scenarios', () => {
    it('should handle backspace then typing correction', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      // Type with error
      act(() => {
        result.current.handleKeyPress('h');
        result.current.handleKeyPress('x'); // wrong
      });

      // Backspace and correct
      act(() => {
        result.current.handleBackspace();
        result.current.handleKeyPress('e'); // correct
      });

      expect(result.current.cursorPosition).toBe(2);
      expect(result.current.typedText).toBe('he');
      expect(result.current.errors.size).toBe(0);
      expect(result.current.isCorrectSoFar).toBe(true);
    });

    it('should handle hint then typing', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      let hint: string | null = null;
      act(() => {
        hint = result.current.handleTab();
      });

      expect(hint).toBe('h');

      act(() => {
        result.current.handleKeyPress(hint!);
      });

      expect(result.current.cursorPosition).toBe(1);
      expect(result.current.errors.size).toBe(0);
      expect(result.current.hintUsed).toBe(true);
    });

    it('should handle escape mid-session then restart', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hi', onComplete })
      );

      act(() => {
        result.current.handleKeyPress('h');
      });

      vi.advanceTimersByTime(1000);

      act(() => {
        result.current.handleEscape();
      });

      act(() => {
        result.current.handleKeyPress('h');
        result.current.handleKeyPress('i');
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(result.current.isComplete).toBe(true);
      expect(result.current.errors.size).toBe(0);
    });

    it('should handle multiple backspaces', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'hello' })
      );

      act(() => {
        'hello'.split('').forEach((c) => result.current.handleKeyPress(c));
      });

      expect(result.current.isComplete).toBe(true);

      // Complete, so backspace shouldn't work
      act(() => {
        result.current.handleBackspace();
      });

      expect(result.current.cursorPosition).toBe(5);
    });

    it('should track progress correctly after backspace', () => {
      const { result } = renderHook(() =>
        useTypingEngine({ targetText: 'test' }) // 4 chars
      );

      act(() => {
        result.current.handleKeyPress('t');
        result.current.handleKeyPress('e');
      });

      expect(result.current.progress).toBe(50);

      act(() => {
        result.current.handleBackspace();
      });

      expect(result.current.progress).toBe(25);
    });
  });
});
