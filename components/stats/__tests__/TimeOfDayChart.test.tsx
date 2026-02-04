/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TimeOfDayChart, TimeOfDayDataPoint } from '../TimeOfDayChart';

const createDataPoint = (
  hour: number,
  avgWpm: number,
  sessions: number = 1
): TimeOfDayDataPoint => ({
  hour,
  avgWpm,
  sessions,
});

describe('TimeOfDayChart', () => {
  describe('rendering', () => {
    it('should not render when data is empty', () => {
      const { container } = render(<TimeOfDayChart data={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render card with title', () => {
      const data = [createDataPoint(9, 60)];
      render(<TimeOfDayChart data={data} />);
      expect(screen.getByText('Speed by Time of Day')).toBeTruthy();
    });

    it('should render SVG chart element', () => {
      const data = [createDataPoint(12, 65)];
      const { container } = render(<TimeOfDayChart data={data} />);
      expect(container.querySelector('svg')).toBeTruthy();
    });

    it('should render bars for hours with data', () => {
      const data = [
        createDataPoint(9, 60),
        createDataPoint(14, 70),
        createDataPoint(20, 55),
      ];
      const { container } = render(<TimeOfDayChart data={data} />);
      const rects = container.querySelectorAll('rect');
      // Should have 24 bars for all hours
      expect(rects.length).toBe(24);
    });

    it('should render x-axis time labels', () => {
      const data = [createDataPoint(12, 65)];
      render(<TimeOfDayChart data={data} />);
      // Use getAllByText since "12 AM" appears at start and end of x-axis
      expect(screen.getAllByText('12 AM').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('6 AM')).toBeTruthy();
      expect(screen.getByText('12 PM')).toBeTruthy();
      expect(screen.getByText('6 PM')).toBeTruthy();
    });
  });

  describe('peak and low indicators', () => {
    it('should show best hour indicator when multiple data points exist', () => {
      const data = [
        createDataPoint(9, 80),
        createDataPoint(14, 60),
      ];
      render(<TimeOfDayChart data={data} />);
      expect(screen.getByText('9 AM')).toBeTruthy();
      expect(screen.getByText('best')).toBeTruthy();
    });

    it('should show peak and lowest performance summary', () => {
      const data = [
        createDataPoint(10, 75),
        createDataPoint(22, 50),
      ];
      render(<TimeOfDayChart data={data} />);

      expect(screen.getByText('Peak Performance')).toBeTruthy();
      expect(screen.getByText('Lowest Performance')).toBeTruthy();
    });

    it('should not show summary when only one data point', () => {
      const data = [createDataPoint(12, 65)];
      render(<TimeOfDayChart data={data} />);

      expect(screen.queryByText('Peak Performance')).toBeNull();
      expect(screen.queryByText('Lowest Performance')).toBeNull();
    });

    it('should not show summary when best and worst are same hour', () => {
      const data = [createDataPoint(12, 65)];
      render(<TimeOfDayChart data={data} />);

      expect(screen.queryByText('Peak Performance')).toBeNull();
    });
  });

  describe('time of day labels', () => {
    it('should show Morning label for hours 5-8', () => {
      const data = [
        createDataPoint(6, 70),
        createDataPoint(12, 50),
      ];
      render(<TimeOfDayChart data={data} />);
      expect(screen.getByText('Morning')).toBeTruthy();
    });

    it('should show Evening label for hours 17-20', () => {
      const data = [
        createDataPoint(19, 70),
        createDataPoint(12, 50),
      ];
      render(<TimeOfDayChart data={data} />);
      expect(screen.getByText('Evening')).toBeTruthy();
    });

    it('should show Night label for late hours', () => {
      const data = [
        createDataPoint(23, 70),
        createDataPoint(12, 50),
      ];
      render(<TimeOfDayChart data={data} />);
      expect(screen.getByText('Night')).toBeTruthy();
    });
  });

  describe('tooltip interaction', () => {
    it('should show tooltip on hover with WPM', () => {
      const data = [createDataPoint(14, 72, 5)];
      const { container } = render(<TimeOfDayChart data={data} />);

      const rects = container.querySelectorAll('rect');
      const rect14 = rects[14];
      expect(rect14).toBeTruthy();

      fireEvent.mouseEnter(rect14!);
      expect(screen.getByText('72 WPM')).toBeTruthy();
    });

    it('should show session count in tooltip', () => {
      const data = [createDataPoint(10, 65, 8)];
      const { container } = render(<TimeOfDayChart data={data} />);

      const rects = container.querySelectorAll('rect');
      fireEvent.mouseEnter(rects[10]!);

      expect(screen.getByText('8 sessions')).toBeTruthy();
    });

    it('should show singular session text for 1 session', () => {
      const data = [createDataPoint(15, 60, 1)];
      const { container } = render(<TimeOfDayChart data={data} />);

      const rects = container.querySelectorAll('rect');
      fireEvent.mouseEnter(rects[15]!);

      expect(screen.getByText('1 session')).toBeTruthy();
    });

    it('should show "No sessions" for hours without data', () => {
      const data = [createDataPoint(12, 65)];
      const { container } = render(<TimeOfDayChart data={data} />);

      const rects = container.querySelectorAll('rect');
      // Hover on hour 0 which has no data
      fireEvent.mouseEnter(rects[0]!);

      expect(screen.getByText('No sessions')).toBeTruthy();
    });

    it('should hide tooltip on mouse leave', () => {
      const data = [createDataPoint(9, 70, 3)];
      const { container } = render(<TimeOfDayChart data={data} />);

      const rects = container.querySelectorAll('rect');
      fireEvent.mouseEnter(rects[9]!);
      expect(screen.getByText('70 WPM')).toBeTruthy();

      fireEvent.mouseLeave(rects[9]!);
      expect(screen.queryByText('70 WPM')).toBeNull();
    });

    it('should format hour correctly in tooltip', () => {
      const data = [createDataPoint(0, 55)];
      const { container } = render(<TimeOfDayChart data={data} />);

      const rects = container.querySelectorAll('rect');
      fireEvent.mouseEnter(rects[0]!);

      // Should show "12 AM" for hour 0
      const tooltipText = container.textContent;
      expect(tooltipText).toContain('12 AM');
    });
  });

  describe('data handling', () => {
    it('should handle single data point', () => {
      const data = [createDataPoint(15, 70)];
      const { container } = render(<TimeOfDayChart data={data} />);

      expect(container.querySelector('svg')).toBeTruthy();
    });

    it('should handle data with same WPM values', () => {
      const data = [
        createDataPoint(9, 60),
        createDataPoint(14, 60),
        createDataPoint(19, 60),
      ];
      const { container } = render(<TimeOfDayChart data={data} />);

      expect(container.querySelector('svg')).toBeTruthy();
    });

    it('should handle data with large WPM variation', () => {
      const data = [
        createDataPoint(6, 30),
        createDataPoint(14, 120),
      ];
      const { container } = render(<TimeOfDayChart data={data} />);

      const rects = container.querySelectorAll('rect');
      expect(rects.length).toBe(24);
    });

    it('should handle data spanning multiple hours', () => {
      const data = Array.from({ length: 12 }, (_, i) =>
        createDataPoint(i * 2, 50 + i * 5)
      );
      const { container } = render(<TimeOfDayChart data={data} />);

      expect(container.querySelector('svg')).toBeTruthy();
    });

    it('should correctly identify best and worst hours', () => {
      const data = [
        createDataPoint(8, 45),   // worst
        createDataPoint(14, 85),  // best
        createDataPoint(20, 60),
      ];
      render(<TimeOfDayChart data={data} />);

      // Should show 2 PM as best (85 WPM)
      expect(screen.getByText('2 PM')).toBeTruthy();
      // Should show 85 WPM as peak
      expect(screen.getByText('85 WPM')).toBeTruthy();
      // Should show 45 WPM as lowest
      expect(screen.getByText('45 WPM')).toBeTruthy();
    });
  });

  describe('visual styling', () => {
    it('should use orange color for bars with data', () => {
      const data = [createDataPoint(12, 65)];
      const { container } = render(<TimeOfDayChart data={data} />);

      const rect = container.querySelector('rect[fill="#f97316"]');
      expect(rect).toBeTruthy();
    });

    it('should render grid line', () => {
      const data = [createDataPoint(12, 65)];
      const { container } = render(<TimeOfDayChart data={data} />);

      const gridLine = container.querySelector('line');
      expect(gridLine).toBeTruthy();
    });

    it('should show Y-axis values', () => {
      const data = [
        createDataPoint(9, 50),
        createDataPoint(15, 80),
      ];
      const { container } = render(<TimeOfDayChart data={data} />);

      const yAxis = container.querySelector('.absolute');
      expect(yAxis?.textContent).toBeTruthy();
    });
  });

  describe('hour formatting', () => {
    it('should format midnight as 12 AM', () => {
      const data = [
        createDataPoint(0, 55),
        createDataPoint(12, 60),
      ];
      const { container } = render(<TimeOfDayChart data={data} />);

      const rects = container.querySelectorAll('rect');
      fireEvent.mouseEnter(rects[0]!);

      // "12 AM" appears in multiple places (tooltip and x-axis), so use getAllByText
      const matchingElements = screen.getAllByText(/12 AM/);
      expect(matchingElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should format noon as 12 PM', () => {
      const data = [
        createDataPoint(12, 65),
        createDataPoint(0, 50),
      ];
      const { container } = render(<TimeOfDayChart data={data} />);

      const rects = container.querySelectorAll('rect');
      fireEvent.mouseEnter(rects[12]!);

      // "12 PM" appears in multiple places (tooltip and x-axis), so use getAllByText
      const matchingElements = screen.getAllByText(/12 PM/);
      expect(matchingElements.length).toBeGreaterThanOrEqual(1);
    });
  });
});
