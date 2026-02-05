/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatsBar, StatsBarProps } from '../StatsBar';
import type { TypingStats } from '@/lib/hooks/useTypingEngine';
import type { LatencyStats } from '@/lib/typing/wpm';

const defaultLatencyStats: LatencyStats = {
  avgLatencyMs: 0,
  minLatencyMs: 0,
  maxLatencyMs: 0,
  stdDevLatencyMs: 0,
  p50LatencyMs: 0,
  p95LatencyMs: 0,
};

const createStats = (overrides: Partial<TypingStats> = {}): TypingStats => ({
  wpm: 0,
  rawWpm: 0,
  accuracy: 100,
  keystrokes: 0,
  errors: 0,
  durationMs: 0,
  latency: defaultLatencyStats,
  ...overrides,
});

describe('StatsBar', () => {
  describe('rendering', () => {
    it('should render WPM label and value', () => {
      render(<StatsBar stats={createStats({ wpm: 60 })} />);

      expect(screen.getByText('WPM')).toBeTruthy();
      expect(screen.getByTestId('stats-wpm').textContent).toBe('60');
    });

    it('should render Accuracy label and value', () => {
      render(<StatsBar stats={createStats({ accuracy: 95 })} />);

      expect(screen.getByText('Accuracy')).toBeTruthy();
      expect(screen.getByTestId('stats-accuracy').textContent).toBe('95%');
    });

    it('should render Time label and value', () => {
      render(<StatsBar stats={createStats({ durationMs: 65000 })} />);

      expect(screen.getByText('Time')).toBeTruthy();
      expect(screen.getByTestId('stats-time').textContent).toBe('1:05');
    });

    it('should render progress bar by default', () => {
      render(<StatsBar stats={createStats()} progress={50} />);

      expect(screen.getByRole('progressbar')).toBeTruthy();
      expect(screen.getByTestId('stats-progress-text').textContent).toBe('50%');
    });

    it('should hide progress bar when showProgress is false', () => {
      render(<StatsBar stats={createStats()} progress={50} showProgress={false} />);

      expect(screen.queryByRole('progressbar')).toBeNull();
      expect(screen.queryByTestId('stats-progress-text')).toBeNull();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <StatsBar stats={createStats()} className="custom-class" />
      );

      expect((container.firstChild as HTMLElement).className).toContain('custom-class');
    });
  });

  describe('WPM display', () => {
    it('should show 0 WPM for initial state', () => {
      render(<StatsBar stats={createStats({ wpm: 0 })} />);

      expect(screen.getByTestId('stats-wpm').textContent).toBe('0');
    });

    it('should show correct WPM values', () => {
      const { rerender } = render(<StatsBar stats={createStats({ wpm: 45 })} />);
      expect(screen.getByTestId('stats-wpm').textContent).toBe('45');

      rerender(<StatsBar stats={createStats({ wpm: 120 })} />);
      expect(screen.getByTestId('stats-wpm').textContent).toBe('120');
    });

    it('should update when stats change', () => {
      const { rerender } = render(<StatsBar stats={createStats({ wpm: 30 })} />);
      expect(screen.getByTestId('stats-wpm').textContent).toBe('30');

      rerender(<StatsBar stats={createStats({ wpm: 75 })} />);
      expect(screen.getByTestId('stats-wpm').textContent).toBe('75');
    });
  });

  describe('Accuracy display', () => {
    it('should show 100% accuracy for initial state', () => {
      render(<StatsBar stats={createStats({ accuracy: 100 })} />);

      expect(screen.getByTestId('stats-accuracy').textContent).toBe('100%');
    });

    it('should show correct accuracy values', () => {
      const { rerender } = render(<StatsBar stats={createStats({ accuracy: 98 })} />);
      expect(screen.getByTestId('stats-accuracy').textContent).toBe('98%');

      rerender(<StatsBar stats={createStats({ accuracy: 75 })} />);
      expect(screen.getByTestId('stats-accuracy').textContent).toBe('75%');
    });

    it('should show 0% accuracy when all errors', () => {
      render(<StatsBar stats={createStats({ accuracy: 0 })} />);

      expect(screen.getByTestId('stats-accuracy').textContent).toBe('0%');
    });
  });

  describe('Time display', () => {
    it('should show 0:00 for initial state', () => {
      render(<StatsBar stats={createStats({ durationMs: 0 })} />);

      expect(screen.getByTestId('stats-time').textContent).toBe('0:00');
    });

    it('should format seconds correctly', () => {
      render(<StatsBar stats={createStats({ durationMs: 5000 })} />);

      expect(screen.getByTestId('stats-time').textContent).toBe('0:05');
    });

    it('should format minutes and seconds correctly', () => {
      render(<StatsBar stats={createStats({ durationMs: 125000 })} />);

      expect(screen.getByTestId('stats-time').textContent).toBe('2:05');
    });

    it('should pad single digit seconds with leading zero', () => {
      render(<StatsBar stats={createStats({ durationMs: 61000 })} />);

      expect(screen.getByTestId('stats-time').textContent).toBe('1:01');
    });

    it('should handle longer durations', () => {
      render(<StatsBar stats={createStats({ durationMs: 600000 })} />);

      expect(screen.getByTestId('stats-time').textContent).toBe('10:00');
    });

    it('should round down milliseconds', () => {
      render(<StatsBar stats={createStats({ durationMs: 1999 })} />);

      expect(screen.getByTestId('stats-time').textContent).toBe('0:01');
    });
  });

  describe('Progress display', () => {
    it('should show 0% progress initially', () => {
      render(<StatsBar stats={createStats()} progress={0} />);

      expect(screen.getByTestId('stats-progress-text').textContent).toBe('0%');
    });

    it('should show correct progress percentage', () => {
      render(<StatsBar stats={createStats()} progress={75} />);

      expect(screen.getByTestId('stats-progress-text').textContent).toBe('75%');
    });

    it('should show 100% when complete', () => {
      render(<StatsBar stats={createStats()} progress={100} />);

      expect(screen.getByTestId('stats-progress-text').textContent).toBe('100%');
    });

    it('should round progress to nearest integer', () => {
      render(<StatsBar stats={createStats()} progress={33.33} />);

      expect(screen.getByTestId('stats-progress-text').textContent).toBe('33%');
    });

    it('should update progress bar width', () => {
      const { rerender } = render(<StatsBar stats={createStats()} progress={25} />);
      let progressFill = screen.getByTestId('stats-progress-fill');
      expect(progressFill.style.width).toBe('25%');

      rerender(<StatsBar stats={createStats()} progress={75} />);
      progressFill = screen.getByTestId('stats-progress-fill');
      expect(progressFill.style.width).toBe('75%');
    });

    it('should default to 0% when progress prop is not provided', () => {
      render(<StatsBar stats={createStats()} />);

      expect(screen.getByTestId('stats-progress-text').textContent).toBe('0%');
    });
  });

  describe('accessibility', () => {
    it('should have status role for live updates', () => {
      render(<StatsBar stats={createStats()} />);

      expect(screen.getByRole('status')).toBeTruthy();
    });

    it('should have aria-live polite for non-disruptive updates', () => {
      render(<StatsBar stats={createStats()} />);

      const statsBar = screen.getByRole('status');
      expect(statsBar.getAttribute('aria-live')).toBe('polite');
    });

    it('should have aria-label for stats container', () => {
      render(<StatsBar stats={createStats()} />);

      const statsBar = screen.getByRole('status');
      expect(statsBar.getAttribute('aria-label')).toBe('Typing statistics');
    });

    it('should have progressbar role for progress indicator', () => {
      render(<StatsBar stats={createStats()} progress={50} />);

      expect(screen.getByRole('progressbar')).toBeTruthy();
    });

    it('should have aria-valuenow on progressbar', () => {
      render(<StatsBar stats={createStats()} progress={50} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar.getAttribute('aria-valuenow')).toBe('50');
    });

    it('should have aria-valuemin and aria-valuemax on progressbar', () => {
      render(<StatsBar stats={createStats()} progress={50} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar.getAttribute('aria-valuemin')).toBe('0');
      expect(progressbar.getAttribute('aria-valuemax')).toBe('100');
    });

    it('should have aria-label on progressbar', () => {
      render(<StatsBar stats={createStats()} progress={50} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar.getAttribute('aria-label')).toBe('Typing progress');
    });
  });

  describe('styling', () => {
    it('should use monospace font for values', () => {
      render(<StatsBar stats={createStats({ wpm: 60, accuracy: 95 })} />);

      expect(screen.getByTestId('stats-wpm').className).toContain('font-mono');
      expect(screen.getByTestId('stats-accuracy').className).toContain('font-mono');
      expect(screen.getByTestId('stats-time').className).toContain('font-mono');
    });

    it('should use muted text for labels', () => {
      render(<StatsBar stats={createStats()} />);

      const container = screen.getByRole('status');
      expect(container.className).toContain('text-muted-foreground');
    });

    it('should use foreground text for values', () => {
      render(<StatsBar stats={createStats()} />);

      expect(screen.getByTestId('stats-wpm').className).toContain('text-foreground');
      expect(screen.getByTestId('stats-accuracy').className).toContain('text-foreground');
      expect(screen.getByTestId('stats-time').className).toContain('text-foreground');
    });

    it('should have transition on progress bar fill', () => {
      render(<StatsBar stats={createStats()} progress={50} />);

      const progressFill = screen.getByTestId('stats-progress-fill');
      expect(progressFill.className).toContain('transition-all');
    });

    it('should use uppercase tracking for labels', () => {
      render(<StatsBar stats={createStats()} />);

      const wpmLabel = screen.getByText('WPM');
      expect(wpmLabel.className).toContain('uppercase');
      expect(wpmLabel.className).toContain('tracking-wide');
    });
  });

  describe('edge cases', () => {
    it('should handle very high WPM values', () => {
      render(<StatsBar stats={createStats({ wpm: 999 })} />);

      expect(screen.getByTestId('stats-wpm').textContent).toBe('999');
    });

    it('should handle negative WPM gracefully', () => {
      // This shouldn't happen in practice but component should render
      render(<StatsBar stats={createStats({ wpm: -10 })} />);

      expect(screen.getByTestId('stats-wpm').textContent).toBe('-10');
    });

    it('should handle very long durations', () => {
      // 99 minutes and 59 seconds
      render(<StatsBar stats={createStats({ durationMs: 5999000 })} />);

      expect(screen.getByTestId('stats-time').textContent).toBe('99:59');
    });

    it('should handle progress greater than 100', () => {
      render(<StatsBar stats={createStats()} progress={150} />);

      expect(screen.getByTestId('stats-progress-text').textContent).toBe('150%');
    });

    it('should handle progress less than 0', () => {
      render(<StatsBar stats={createStats()} progress={-10} />);

      expect(screen.getByTestId('stats-progress-text').textContent).toBe('-10%');
    });

    it('should handle fractional milliseconds', () => {
      render(<StatsBar stats={createStats({ durationMs: 1500.75 })} />);

      expect(screen.getByTestId('stats-time').textContent).toBe('0:01');
    });
  });

  describe('live updates', () => {
    it('should update all stats when props change', () => {
      const initialStats = createStats({
        wpm: 30,
        accuracy: 90,
        durationMs: 30000,
      });

      const updatedStats = createStats({
        wpm: 60,
        accuracy: 95,
        durationMs: 60000,
      });

      const { rerender } = render(
        <StatsBar stats={initialStats} progress={25} />
      );

      expect(screen.getByTestId('stats-wpm').textContent).toBe('30');
      expect(screen.getByTestId('stats-accuracy').textContent).toBe('90%');
      expect(screen.getByTestId('stats-time').textContent).toBe('0:30');
      expect(screen.getByTestId('stats-progress-text').textContent).toBe('25%');

      rerender(<StatsBar stats={updatedStats} progress={75} />);

      expect(screen.getByTestId('stats-wpm').textContent).toBe('60');
      expect(screen.getByTestId('stats-accuracy').textContent).toBe('95%');
      expect(screen.getByTestId('stats-time').textContent).toBe('1:00');
      expect(screen.getByTestId('stats-progress-text').textContent).toBe('75%');
    });
  });

  describe('tablet optimizations', () => {
    it('should have responsive gap spacing for tablets', () => {
      const { container } = render(<StatsBar stats={createStats()} />);
      const statsContainer = container.firstChild as HTMLElement;

      // Check for md:gap-8 for tablet spacing
      expect(statsContainer.className).toMatch(/md:gap-8/);
    });

    it('should have responsive text size for tablets', () => {
      const { container } = render(<StatsBar stats={createStats()} />);
      const statsContainer = container.firstChild as HTMLElement;

      // Check for md:text-base for larger text on tablets
      expect(statsContainer.className).toMatch(/md:text-base/);
    });

    it('should have touch-target class on stat items', () => {
      render(<StatsBar stats={createStats({ wpm: 60 })} />);
      const wpmValue = screen.getByTestId('stats-wpm');
      const statItem = wpmValue.parentElement;

      // Check for touch-target class
      expect(statItem?.className).toContain('touch-target');
    });

    it('should have larger font size for stat values on tablets', () => {
      render(<StatsBar stats={createStats({ wpm: 60 })} />);

      // Check all stat values have md:text-lg for tablets
      expect(screen.getByTestId('stats-wpm').className).toMatch(/md:text-lg/);
      expect(screen.getByTestId('stats-accuracy').className).toMatch(/md:text-lg/);
      expect(screen.getByTestId('stats-time').className).toMatch(/md:text-lg/);
    });

    it('should have larger label font size on tablets', () => {
      render(<StatsBar stats={createStats()} />);
      const wpmLabel = screen.getByText('WPM');

      // Check for md:text-sm for labels on tablets
      expect(wpmLabel.className).toMatch(/md:text-sm/);
    });

    it('should have larger progress bar height on tablets', () => {
      render(<StatsBar stats={createStats()} progress={50} />);
      const progressbar = screen.getByRole('progressbar');

      // Check for md:h-1.5 for thicker progress bar on tablets
      expect(progressbar.className).toMatch(/md:h-1.5/);
    });

    it('should have wider progress bar on tablets', () => {
      render(<StatsBar stats={createStats()} progress={50} />);
      const progressbar = screen.getByRole('progressbar');

      // Check for md:w-32 for wider progress bar on tablets
      expect(progressbar.className).toMatch(/md:w-32/);
    });

    it('should have responsive gap in stat items for tablets', () => {
      render(<StatsBar stats={createStats({ wpm: 60 })} />);
      const wpmValue = screen.getByTestId('stats-wpm');
      const statItem = wpmValue.parentElement;

      // Check for md:gap-3 for larger spacing on tablets
      expect(statItem?.className).toMatch(/md:gap-3/);
    });

    it('should have larger progress text on tablets', () => {
      render(<StatsBar stats={createStats()} progress={50} />);
      const progressText = screen.getByTestId('stats-progress-text');

      // Check for md:text-sm for larger progress text on tablets
      expect(progressText.className).toMatch(/md:text-sm/);
    });
  });
});
