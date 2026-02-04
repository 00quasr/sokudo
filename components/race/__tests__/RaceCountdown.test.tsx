/**
 * @vitest-environment jsdom
 */
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RaceCountdown } from '../RaceCountdown';

describe('RaceCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('should render countdown value during countdown', () => {
      render(
        <RaceCountdown countdownValue={3} status="countdown" />
      );

      expect(screen.getByTestId('race-countdown')).toBeTruthy();
      expect(screen.getByTestId('countdown-value').textContent).toBe('3');
    });

    it('should show "Get ready..." label during countdown', () => {
      render(
        <RaceCountdown countdownValue={3} status="countdown" />
      );

      expect(screen.getByTestId('countdown-label').textContent).toBe(
        'Get ready...'
      );
    });

    it('should return null when status is waiting', () => {
      const { container } = render(
        <RaceCountdown countdownValue={3} status="waiting" />
      );

      expect(container.innerHTML).toBe('');
    });

    it('should return null when status is finished', () => {
      const { container } = render(
        <RaceCountdown countdownValue={0} status="finished" />
      );

      expect(container.innerHTML).toBe('');
    });

    it('should render countdown circle', () => {
      render(
        <RaceCountdown countdownValue={2} status="countdown" />
      );

      expect(screen.getByTestId('countdown-circle')).toBeTruthy();
    });
  });

  describe('countdown progression', () => {
    it('should update display when countdownValue changes', () => {
      const { rerender } = render(
        <RaceCountdown countdownValue={3} status="countdown" />
      );

      expect(screen.getByTestId('countdown-value').textContent).toBe('3');

      rerender(
        <RaceCountdown countdownValue={2} status="countdown" />
      );

      expect(screen.getByTestId('countdown-value').textContent).toBe('2');

      rerender(
        <RaceCountdown countdownValue={1} status="countdown" />
      );

      expect(screen.getByTestId('countdown-value').textContent).toBe('1');
    });

    it('should show GO! when countdown reaches 0', () => {
      const { rerender } = render(
        <RaceCountdown countdownValue={1} status="countdown" />
      );

      rerender(
        <RaceCountdown countdownValue={0} status="countdown" />
      );

      expect(screen.getByTestId('countdown-value').textContent).toBe('GO!');
    });

    it('should show "Start typing!" label when GO', () => {
      render(
        <RaceCountdown countdownValue={0} status="countdown" />
      );

      expect(screen.getByTestId('countdown-label').textContent).toBe(
        'Start typing!'
      );
    });
  });

  describe('onGo callback', () => {
    it('should call onGo when countdown reaches 0', () => {
      const onGo = vi.fn();
      const { rerender } = render(
        <RaceCountdown countdownValue={1} status="countdown" onGo={onGo} />
      );

      rerender(
        <RaceCountdown countdownValue={0} status="countdown" onGo={onGo} />
      );

      expect(onGo).toHaveBeenCalledTimes(1);
    });

    it('should only call onGo once even if re-rendered', () => {
      const onGo = vi.fn();
      const { rerender } = render(
        <RaceCountdown countdownValue={0} status="countdown" onGo={onGo} />
      );

      rerender(
        <RaceCountdown countdownValue={0} status="countdown" onGo={onGo} />
      );

      rerender(
        <RaceCountdown countdownValue={0} status="countdown" onGo={onGo} />
      );

      expect(onGo).toHaveBeenCalledTimes(1);
    });
  });

  describe('startTime synchronization', () => {
    it('should use startTime for countdown when provided', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // startTime is 3 seconds from now
      const startTime = now + 3000;

      render(
        <RaceCountdown
          countdownValue={3}
          startTime={startTime}
          status="countdown"
        />
      );

      expect(screen.getByTestId('countdown-value').textContent).toBe('3');

      // Advance 1 second
      act(() => {
        vi.advanceTimersByTime(1100);
      });

      expect(screen.getByTestId('countdown-value').textContent).toBe('2');
    });

    it('should show GO! when startTime is reached', () => {
      const onGo = vi.fn();
      const now = Date.now();
      vi.setSystemTime(now);

      const startTime = now + 1000;

      render(
        <RaceCountdown
          countdownValue={1}
          startTime={startTime}
          status="countdown"
          onGo={onGo}
        />
      );

      act(() => {
        vi.advanceTimersByTime(1100);
      });

      expect(screen.getByTestId('countdown-value').textContent).toBe('GO!');
      expect(onGo).toHaveBeenCalledTimes(1);
    });

    it('should trigger GO immediately if startTime is in the past', () => {
      const onGo = vi.fn();
      const now = Date.now();
      vi.setSystemTime(now);

      // startTime already passed
      const startTime = now - 500;

      render(
        <RaceCountdown
          countdownValue={0}
          startTime={startTime}
          status="countdown"
          onGo={onGo}
        />
      );

      // Initial tick runs synchronously within useEffect
      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(onGo).toHaveBeenCalled();
    });
  });

  describe('visual styling', () => {
    it('should show purple border during countdown', () => {
      render(
        <RaceCountdown countdownValue={2} status="countdown" />
      );

      const circle = screen.getByTestId('countdown-circle');
      expect(circle.className).toContain('border-purple-500');
    });

    it('should show green border on GO', () => {
      render(
        <RaceCountdown countdownValue={0} status="countdown" />
      );

      const circle = screen.getByTestId('countdown-circle');
      expect(circle.className).toContain('border-green-500');
    });
  });
});
