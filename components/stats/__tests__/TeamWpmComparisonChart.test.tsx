/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TeamWpmComparisonChart } from '../TeamWpmComparisonChart';

const createMember = (
  userId: number,
  userName: string | null,
  userEmail: string,
  data: Array<{ date: string; avgWpm: number; sessions: number }>
) => ({
  userId,
  userName,
  userEmail,
  data,
});

const alice = createMember(1, 'Alice', 'alice@test.com', [
  { date: '2026-01-01', avgWpm: 60, sessions: 2 },
  { date: '2026-01-02', avgWpm: 65, sessions: 3 },
  { date: '2026-01-03', avgWpm: 70, sessions: 1 },
]);

const bob = createMember(2, 'Bob', 'bob@test.com', [
  { date: '2026-01-01', avgWpm: 50, sessions: 1 },
  { date: '2026-01-02', avgWpm: 55, sessions: 2 },
  { date: '2026-01-03', avgWpm: 58, sessions: 4 },
]);

const noNameMember = createMember(3, null, 'charlie@test.com', [
  { date: '2026-01-01', avgWpm: 45, sessions: 1 },
  { date: '2026-01-03', avgWpm: 48, sessions: 1 },
]);

/** Get the chart SVG by data-testid */
function getChartSvg(container: HTMLElement): SVGSVGElement {
  return container.querySelector('[data-testid="comparison-chart"]') as SVGSVGElement;
}

describe('TeamWpmComparisonChart', () => {
  describe('rendering', () => {
    it('should not render when members array is empty', () => {
      const { container } = render(
        <TeamWpmComparisonChart members={[]} period="7" />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should not render when all members have empty data', () => {
      const emptyMember = createMember(1, 'Alice', 'alice@test.com', []);
      const { container } = render(
        <TeamWpmComparisonChart members={[emptyMember]} period="7" />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render card with title', () => {
      render(
        <TeamWpmComparisonChart members={[alice, bob]} period="7" />
      );
      expect(screen.getByText('Member WPM Comparison')).toBeTruthy();
    });

    it('should show period label for 7 days', () => {
      render(
        <TeamWpmComparisonChart members={[alice, bob]} period="7" />
      );
      expect(screen.getByText('(Last 7 days)')).toBeTruthy();
    });

    it('should show period label for 30 days', () => {
      render(
        <TeamWpmComparisonChart members={[alice, bob]} period="30" />
      );
      expect(screen.getByText('(Last 30 days)')).toBeTruthy();
    });

    it('should render SVG chart element', () => {
      const { container } = render(
        <TeamWpmComparisonChart members={[alice, bob]} period="7" />
      );
      expect(getChartSvg(container)).toBeTruthy();
    });

    it('should render data points for all members', () => {
      const { container } = render(
        <TeamWpmComparisonChart members={[alice, bob]} period="7" />
      );
      const circles = getChartSvg(container).querySelectorAll('circle');
      // alice has 3 points + bob has 3 points = 6
      expect(circles.length).toBe(6);
    });

    it('should render line paths for members with more than one point', () => {
      const { container } = render(
        <TeamWpmComparisonChart members={[alice, bob]} period="7" />
      );
      const paths = getChartSvg(container).querySelectorAll('path[fill="none"]');
      // Both alice and bob have >1 data point, so both should have a line
      expect(paths.length).toBe(2);
    });
  });

  describe('legend', () => {
    it('should show member names in legend', () => {
      render(
        <TeamWpmComparisonChart members={[alice, bob]} period="7" />
      );
      expect(screen.getByText('Alice')).toBeTruthy();
      expect(screen.getByText('Bob')).toBeTruthy();
    });

    it('should use email prefix when name is null', () => {
      render(
        <TeamWpmComparisonChart members={[noNameMember]} period="7" />
      );
      expect(screen.getByText('charlie')).toBeTruthy();
    });

    it('should render color indicators in legend', () => {
      const { container } = render(
        <TeamWpmComparisonChart members={[alice, bob]} period="7" />
      );
      const colorDots = container.querySelectorAll('.w-3.h-3.rounded-full');
      expect(colorDots.length).toBe(2);
    });
  });

  describe('axis labels', () => {
    it('should show start and end date labels', () => {
      render(
        <TeamWpmComparisonChart members={[alice]} period="7" />
      );
      expect(screen.getByText('Jan 1')).toBeTruthy();
      expect(screen.getByText('Jan 3')).toBeTruthy();
    });

    it('should show middle date label when more than 2 dates', () => {
      render(
        <TeamWpmComparisonChart members={[alice]} period="7" />
      );
      expect(screen.getByText('Jan 2')).toBeTruthy();
    });

    it('should show Y-axis min and max values', () => {
      const { container } = render(
        <TeamWpmComparisonChart members={[alice, bob]} period="7" />
      );
      const yAxisDiv = container.querySelector('.absolute.left-0');
      expect(yAxisDiv).toBeTruthy();
      expect(yAxisDiv?.textContent).toBeTruthy();
    });
  });

  describe('tooltip interaction', () => {
    it('should show tooltip on hover', () => {
      const { container } = render(
        <TeamWpmComparisonChart members={[alice]} period="7" />
      );
      const circles = getChartSvg(container).querySelectorAll('circle');
      fireEvent.mouseEnter(circles[0]);

      expect(screen.getByText('60 WPM')).toBeTruthy();
    });

    it('should show session count in tooltip', () => {
      const { container } = render(
        <TeamWpmComparisonChart members={[alice]} period="7" />
      );
      const circles = getChartSvg(container).querySelectorAll('circle');
      fireEvent.mouseEnter(circles[0]);

      expect(screen.getByText('2 sessions')).toBeTruthy();
    });

    it('should show singular session text for 1 session', () => {
      const singleSession = createMember(1, 'Alice', 'alice@test.com', [
        { date: '2026-01-01', avgWpm: 60, sessions: 1 },
      ]);
      const { container } = render(
        <TeamWpmComparisonChart members={[singleSession]} period="7" />
      );
      const circle = getChartSvg(container).querySelector('circle');
      fireEvent.mouseEnter(circle!);

      expect(screen.getByText('1 session')).toBeTruthy();
    });

    it('should hide tooltip on mouse leave', () => {
      const { container } = render(
        <TeamWpmComparisonChart members={[alice]} period="7" />
      );
      const circles = getChartSvg(container).querySelectorAll('circle');
      fireEvent.mouseEnter(circles[0]);
      expect(screen.getByText('60 WPM')).toBeTruthy();

      fireEvent.mouseLeave(circles[0]);
      expect(screen.queryByText('60 WPM')).toBeNull();
    });
  });

  describe('data handling', () => {
    it('should handle single member', () => {
      const { container } = render(
        <TeamWpmComparisonChart members={[alice]} period="7" />
      );
      const circles = getChartSvg(container).querySelectorAll('circle');
      expect(circles.length).toBe(3);
    });

    it('should handle members with different date ranges', () => {
      const { container } = render(
        <TeamWpmComparisonChart members={[alice, noNameMember]} period="7" />
      );
      // alice has 3 points, noNameMember has 2 points
      const circles = getChartSvg(container).querySelectorAll('circle');
      expect(circles.length).toBe(5);
    });

    it('should handle many members', () => {
      const members = Array.from({ length: 8 }, (_, i) =>
        createMember(i + 1, `Member ${i + 1}`, `m${i + 1}@test.com`, [
          { date: '2026-01-01', avgWpm: 50 + i * 5, sessions: 1 },
          { date: '2026-01-02', avgWpm: 55 + i * 5, sessions: 1 },
        ])
      );
      const { container } = render(
        <TeamWpmComparisonChart members={members} period="7" />
      );
      const circles = getChartSvg(container).querySelectorAll('circle');
      expect(circles.length).toBe(16); // 8 members * 2 points
    });

    it('should use distinct colors for different members', () => {
      const { container } = render(
        <TeamWpmComparisonChart members={[alice, bob]} period="7" />
      );
      const paths = getChartSvg(container).querySelectorAll('path[fill="none"]');
      const colors = Array.from(paths).map((p) => p.getAttribute('stroke'));
      expect(colors[0]).not.toBe(colors[1]);
    });
  });

  describe('visual styling', () => {
    it('should render grid lines', () => {
      const { container } = render(
        <TeamWpmComparisonChart members={[alice]} period="7" />
      );
      const gridLines = getChartSvg(container).querySelectorAll('line');
      expect(gridLines.length).toBeGreaterThanOrEqual(1);
    });

    it('should use orange as first member color', () => {
      const { container } = render(
        <TeamWpmComparisonChart members={[alice]} period="7" />
      );
      const linePath = getChartSvg(container).querySelector('path[stroke="#f97316"]');
      expect(linePath).toBeTruthy();
    });

    it('should use blue as second member color', () => {
      const { container } = render(
        <TeamWpmComparisonChart members={[alice, bob]} period="7" />
      );
      const linePath = getChartSvg(container).querySelector('path[stroke="#3b82f6"]');
      expect(linePath).toBeTruthy();
    });
  });
});
