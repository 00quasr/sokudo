/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PracticeCalendar, PracticeDay } from '../PracticeCalendar';

function createPracticeDay(
  date: string,
  sessionsCompleted: number,
  practiceTimeMs: number = sessionsCompleted * 120000
): PracticeDay {
  return { date, sessionsCompleted, practiceTimeMs };
}

function createPracticeData(days: number, baseSessions: number = 2): PracticeDay[] {
  const data: PracticeDay[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    data.push(createPracticeDay(dateStr, baseSessions, baseSessions * 120000));
  }

  return data;
}

describe('PracticeCalendar', () => {
  describe('rendering', () => {
    it('should render card with title', () => {
      render(<PracticeCalendar data={[]} />);
      expect(screen.getByText('Practice Calendar')).toBeTruthy();
    });

    it('should render SVG grid element', () => {
      const data = createPracticeData(7);
      const { container } = render(<PracticeCalendar data={data} />);
      expect(container.querySelector('svg')).toBeTruthy();
    });

    it('should render day cells as rects', () => {
      const data = createPracticeData(7);
      const { container } = render(<PracticeCalendar data={data} />);
      const rects = container.querySelectorAll('rect');
      // Should have many rects for the full year grid
      expect(rects.length).toBeGreaterThan(0);
    });

    it('should render legend with 5 levels', () => {
      render(<PracticeCalendar data={[]} />);
      expect(screen.getByText('Less')).toBeTruthy();
      expect(screen.getByText('More')).toBeTruthy();
      for (let i = 0; i <= 4; i++) {
        expect(screen.getByTestId(`legend-${i}`)).toBeTruthy();
      }
    });

    it('should render day labels (Mon, Wed, Fri)', () => {
      render(<PracticeCalendar data={[]} />);
      expect(screen.getByText('Mon')).toBeTruthy();
      expect(screen.getByText('Wed')).toBeTruthy();
      expect(screen.getByText('Fri')).toBeTruthy();
    });
  });

  describe('summary stats', () => {
    it('should show 0 active days with empty data', () => {
      render(<PracticeCalendar data={[]} />);
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(2); // 0 active days, 0 sessions
      expect(screen.getByText('active days')).toBeTruthy();
    });

    it('should show correct active day count', () => {
      const data = [
        createPracticeDay('2026-01-01', 3),
        createPracticeDay('2026-01-02', 0),
        createPracticeDay('2026-01-03', 1),
      ];
      render(<PracticeCalendar data={data} />);
      expect(screen.getByText('2')).toBeTruthy();
    });

    it('should show total sessions count', () => {
      const data = [
        createPracticeDay('2026-01-01', 3),
        createPracticeDay('2026-01-02', 5),
      ];
      render(<PracticeCalendar data={data} />);
      expect(screen.getByText('8')).toBeTruthy();
      expect(screen.getByText('sessions')).toBeTruthy();
    });
  });

  describe('intensity levels', () => {
    it('should set level 0 for days with no sessions', () => {
      const { container } = render(<PracticeCalendar data={[]} />);
      const rects = container.querySelectorAll('rect[data-level="0"]');
      expect(rects.length).toBeGreaterThan(0);
    });

    it('should assign higher levels to days with more sessions', () => {
      const data = [
        createPracticeDay('2026-01-01', 1),
        createPracticeDay('2026-01-02', 4),
        createPracticeDay('2026-01-03', 8),
        createPracticeDay('2026-01-04', 12),
      ];
      const { container } = render(<PracticeCalendar data={data} />);

      const level1 = container.querySelector('rect[data-date="2026-01-01"]');
      const level4 = container.querySelector('rect[data-date="2026-01-04"]');

      expect(level1).toBeTruthy();
      expect(level4).toBeTruthy();
      // The day with 12 sessions (the max) should have level 4
      expect(level4?.getAttribute('data-level')).toBe('4');
      // The day with 1 session (1/12 = 0.083, <= 0.25) should have level 1
      expect(level1?.getAttribute('data-level')).toBe('1');
    });
  });

  describe('tooltip interaction', () => {
    it('should show tooltip on hover with session data', () => {
      const today = new Date().toISOString().split('T')[0];
      const data = [createPracticeDay(today, 5, 600000)];
      const { container } = render(<PracticeCalendar data={data} />);

      const rect = container.querySelector(`rect[data-date="${today}"]`);
      expect(rect).toBeTruthy();

      fireEvent.mouseEnter(rect!);

      expect(screen.getByText('5 sessions')).toBeTruthy();
      expect(screen.getByText('10m')).toBeTruthy();
    });

    it('should show singular session text for 1 session', () => {
      const today = new Date().toISOString().split('T')[0];
      const data = [createPracticeDay(today, 1, 120000)];
      const { container } = render(<PracticeCalendar data={data} />);

      const rect = container.querySelector(`rect[data-date="${today}"]`);
      fireEvent.mouseEnter(rect!);

      expect(screen.getByText('1 session')).toBeTruthy();
    });

    it('should show "No practice" for days with 0 sessions', () => {
      const today = new Date().toISOString().split('T')[0];
      const { container } = render(<PracticeCalendar data={[]} />);

      const rect = container.querySelector(`rect[data-date="${today}"]`);
      expect(rect).toBeTruthy();

      fireEvent.mouseEnter(rect!);

      expect(screen.getByText('No practice')).toBeTruthy();
    });

    it('should hide tooltip on mouse leave', () => {
      const today = new Date().toISOString().split('T')[0];
      const data = [createPracticeDay(today, 3, 360000)];
      const { container } = render(<PracticeCalendar data={data} />);

      const rect = container.querySelector(`rect[data-date="${today}"]`);
      fireEvent.mouseEnter(rect!);
      expect(screen.getByText('3 sessions')).toBeTruthy();

      fireEvent.mouseLeave(rect!);
      expect(screen.queryByText('3 sessions')).toBeNull();
    });
  });

  describe('data handling', () => {
    it('should handle empty data array', () => {
      const { container } = render(<PracticeCalendar data={[]} />);
      expect(container.querySelector('svg')).toBeTruthy();
    });

    it('should handle single data point', () => {
      const today = new Date().toISOString().split('T')[0];
      const data = [createPracticeDay(today, 5)];
      const { container } = render(<PracticeCalendar data={data} />);
      const rect = container.querySelector(`rect[data-date="${today}"]`);
      expect(rect).toBeTruthy();
    });

    it('should handle full year of data', () => {
      const data = createPracticeData(365);
      const { container } = render(<PracticeCalendar data={data} />);
      const rects = container.querySelectorAll('rect');
      expect(rects.length).toBeGreaterThan(300);
    });

    it('should not render future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const { container } = render(<PracticeCalendar data={[]} />);
      const futureRect = container.querySelector(
        `rect[data-date="${tomorrowStr}"]`
      );
      expect(futureRect).toBeNull();
    });
  });

  describe('visual styling', () => {
    it('should use green color scheme for filled cells', () => {
      const today = new Date().toISOString().split('T')[0];
      const data = [createPracticeDay(today, 10)];
      const { container } = render(<PracticeCalendar data={data} />);

      const rect = container.querySelector(`rect[data-date="${today}"]`);
      const fill = rect?.getAttribute('fill');
      // Should use one of the green intensity colors
      expect(fill).toMatch(/#(0e4429|006d32|26a641|39d353)/);
    });

    it('should use dark background for empty cells', () => {
      const { container } = render(<PracticeCalendar data={[]} />);
      const rects = container.querySelectorAll('rect[data-level="0"]');
      expect(rects.length).toBeGreaterThan(0);
      expect(rects[0].getAttribute('fill')).toBe('#1f1f2e');
    });

    it('should have rounded corners on cells', () => {
      const { container } = render(<PracticeCalendar data={[]} />);
      const rects = container.querySelectorAll('rect');
      expect(rects.length).toBeGreaterThan(0);
      // jsdom may not fully support all SVG attributes; check rx is set
      expect(rects[0].getAttribute('rx')).toBe('2');
    });
  });
});
