/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WpmTrendChart, WpmTrendDataPoint } from '../WpmTrendChart';

const createDataPoint = (
  date: string,
  avgWpm: number,
  sessions: number = 1
): WpmTrendDataPoint => ({
  date,
  avgWpm,
  sessions,
});

const createTrendData = (days: number, baseWpm: number = 60): WpmTrendDataPoint[] => {
  const data: WpmTrendDataPoint[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push(
      createDataPoint(date.toISOString().split('T')[0], baseWpm + (days - 1 - i), 1)
    );
  }

  return data;
};

describe('WpmTrendChart', () => {
  describe('rendering', () => {
    it('should not render when data is empty', () => {
      const { container } = render(<WpmTrendChart data={[]} period="7" />);
      expect(container.firstChild).toBeNull();
    });

    it('should render card with title', () => {
      const data = createTrendData(7);
      render(<WpmTrendChart data={data} period="7" />);
      expect(screen.getByText('WPM Trend')).toBeTruthy();
    });

    it('should show period label for 7 days', () => {
      const data = createTrendData(7);
      render(<WpmTrendChart data={data} period="7" />);
      expect(screen.getByText('(Last 7 days)')).toBeTruthy();
    });

    it('should show period label for 30 days', () => {
      const data = createTrendData(30);
      render(<WpmTrendChart data={data} period="30" />);
      expect(screen.getByText('(Last 30 days)')).toBeTruthy();
    });

    it('should render SVG chart element', () => {
      const data = createTrendData(7);
      const { container } = render(<WpmTrendChart data={data} period="7" />);
      expect(container.querySelector('svg')).toBeTruthy();
    });

    it('should render data points as circles', () => {
      const data = createTrendData(5);
      const { container } = render(<WpmTrendChart data={data} period="7" />);
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBe(5);
    });

    it('should render line path', () => {
      const data = createTrendData(5);
      const { container } = render(<WpmTrendChart data={data} period="7" />);
      const paths = container.querySelectorAll('path');
      // Should have area path and line path
      expect(paths.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('trend indicator', () => {
    it('should show positive trend when WPM increases', () => {
      // First half: 50, 51, 52 (avg ~51)
      // Second half: 60, 61, 62 (avg ~61)
      const data = [
        createDataPoint('2026-01-01', 50),
        createDataPoint('2026-01-02', 51),
        createDataPoint('2026-01-03', 52),
        createDataPoint('2026-01-04', 60),
        createDataPoint('2026-01-05', 61),
        createDataPoint('2026-01-06', 62),
      ];
      render(<WpmTrendChart data={data} period="7" />);

      // Should show positive percentage
      expect(screen.getByText(/\+\d+%/)).toBeTruthy();
    });

    it('should show negative trend when WPM decreases', () => {
      // First half: 70, 71, 72 (avg ~71)
      // Second half: 50, 51, 52 (avg ~51)
      const data = [
        createDataPoint('2026-01-01', 70),
        createDataPoint('2026-01-02', 71),
        createDataPoint('2026-01-03', 72),
        createDataPoint('2026-01-04', 50),
        createDataPoint('2026-01-05', 51),
        createDataPoint('2026-01-06', 52),
      ];
      render(<WpmTrendChart data={data} period="7" />);

      // Should show negative percentage (without + prefix)
      expect(screen.getByText(/-\d+%/)).toBeTruthy();
    });

    it('should not show trend indicator when trend is 0', () => {
      const data = [
        createDataPoint('2026-01-01', 50),
        createDataPoint('2026-01-02', 50),
        createDataPoint('2026-01-03', 50),
        createDataPoint('2026-01-04', 50),
      ];
      const { container } = render(<WpmTrendChart data={data} period="7" />);

      // Should not show trend percentage when exactly 0
      expect(container.textContent).not.toMatch(/[+-]\d+%/);
    });
  });

  describe('axis labels', () => {
    it('should show start and end date labels', () => {
      const data = [
        createDataPoint('2026-01-01', 50),
        createDataPoint('2026-01-07', 60),
      ];
      render(<WpmTrendChart data={data} period="7" />);

      // Should format dates as "Jan 1", "Jan 7"
      expect(screen.getByText('Jan 1')).toBeTruthy();
      expect(screen.getByText('Jan 7')).toBeTruthy();
    });

    it('should show middle date label when more than 2 points', () => {
      const data = [
        createDataPoint('2026-01-01', 50),
        createDataPoint('2026-01-04', 55),
        createDataPoint('2026-01-07', 60),
      ];
      render(<WpmTrendChart data={data} period="7" />);

      expect(screen.getByText('Jan 4')).toBeTruthy();
    });

    it('should show Y-axis min and max values', () => {
      const data = [
        createDataPoint('2026-01-01', 40),
        createDataPoint('2026-01-02', 80),
      ];
      const { container } = render(<WpmTrendChart data={data} period="7" />);

      // Y-axis should show values around the data range
      const yAxisText = container.querySelector('.absolute')?.textContent;
      expect(yAxisText).toBeTruthy();
    });
  });

  describe('tooltip interaction', () => {
    it('should show tooltip on hover', () => {
      const data = [
        createDataPoint('2026-01-15', 65, 3),
      ];
      const { container } = render(<WpmTrendChart data={data} period="7" />);

      const circle = container.querySelector('circle');
      expect(circle).toBeTruthy();

      fireEvent.mouseEnter(circle!);

      // Tooltip should show WPM value
      expect(screen.getByText('65 WPM')).toBeTruthy();
    });

    it('should show session count in tooltip', () => {
      const data = [
        createDataPoint('2026-01-15', 65, 5),
      ];
      const { container } = render(<WpmTrendChart data={data} period="7" />);

      const circle = container.querySelector('circle');
      fireEvent.mouseEnter(circle!);

      expect(screen.getByText('5 sessions')).toBeTruthy();
    });

    it('should show singular session text for 1 session', () => {
      const data = [
        createDataPoint('2026-01-15', 65, 1),
      ];
      const { container } = render(<WpmTrendChart data={data} period="7" />);

      const circle = container.querySelector('circle');
      fireEvent.mouseEnter(circle!);

      expect(screen.getByText('1 session')).toBeTruthy();
    });

    it('should hide tooltip on mouse leave', () => {
      const data = [
        createDataPoint('2026-01-15', 65, 3),
      ];
      const { container } = render(<WpmTrendChart data={data} period="7" />);

      const circle = container.querySelector('circle');
      fireEvent.mouseEnter(circle!);
      expect(screen.getByText('65 WPM')).toBeTruthy();

      fireEvent.mouseLeave(circle!);
      expect(screen.queryByText('65 WPM')).toBeNull();
    });
  });

  describe('data handling', () => {
    it('should handle single data point', () => {
      const data = [createDataPoint('2026-01-15', 70)];
      const { container } = render(<WpmTrendChart data={data} period="7" />);

      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBe(1);
    });

    it('should handle data with same WPM values', () => {
      const data = [
        createDataPoint('2026-01-01', 60),
        createDataPoint('2026-01-02', 60),
        createDataPoint('2026-01-03', 60),
      ];
      const { container } = render(<WpmTrendChart data={data} period="7" />);

      // Should still render chart
      expect(container.querySelector('svg')).toBeTruthy();
    });

    it('should handle data with large WPM variation', () => {
      const data = [
        createDataPoint('2026-01-01', 20),
        createDataPoint('2026-01-02', 150),
      ];
      const { container } = render(<WpmTrendChart data={data} period="7" />);

      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBe(2);
    });

    it('should handle many data points', () => {
      const data = createTrendData(30);
      const { container } = render(<WpmTrendChart data={data} period="30" />);

      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBe(30);
    });
  });

  describe('visual styling', () => {
    it('should use orange color for line stroke', () => {
      const data = createTrendData(3);
      const { container } = render(<WpmTrendChart data={data} period="7" />);

      const linePath = container.querySelector('path[stroke="#f97316"]');
      expect(linePath).toBeTruthy();
    });

    it('should have gradient fill for area', () => {
      const data = createTrendData(3);
      const { container } = render(<WpmTrendChart data={data} period="7" />);

      const gradient = container.querySelector('#wpmGradient');
      expect(gradient).toBeTruthy();
    });

    it('should render grid line', () => {
      const data = createTrendData(3);
      const { container } = render(<WpmTrendChart data={data} period="7" />);

      const gridLine = container.querySelector('line');
      expect(gridLine).toBeTruthy();
    });
  });
});
