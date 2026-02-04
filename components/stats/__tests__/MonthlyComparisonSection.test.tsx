/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MonthlyComparisonSection } from '../MonthlyComparisonSection';
import type { MonthlyComparison, MonthlyStats } from '@/lib/db/queries';

const createMonthlyStats = (
  overrides: Partial<MonthlyStats> = {}
): MonthlyStats => ({
  month: 0,
  year: 2026,
  monthLabel: 'January 2026',
  totalSessions: 20,
  avgWpm: 65,
  avgAccuracy: 92,
  totalPracticeTimeMs: 3600000, // 1 hour
  bestWpm: 85,
  totalKeystrokes: 5000,
  totalErrors: 150,
  daysWithPractice: 15,
  ...overrides,
});

const createMonthlyComparison = (
  thisMonthOverrides: Partial<MonthlyStats> = {},
  lastMonthOverrides: Partial<MonthlyStats> = {},
  changesOverrides: Partial<MonthlyComparison['changes']> = {}
): MonthlyComparison => {
  const thisMonth = createMonthlyStats({
    month: 1,
    monthLabel: 'February 2026',
    ...thisMonthOverrides,
  });
  const lastMonth = createMonthlyStats({
    month: 0,
    monthLabel: 'January 2026',
    ...lastMonthOverrides,
  });

  return {
    thisMonth,
    lastMonth,
    changes: {
      sessions: 0,
      avgWpm: 0,
      avgAccuracy: 0,
      practiceTime: 0,
      bestWpm: 0,
      daysWithPractice: 0,
      ...changesOverrides,
    },
  };
};

describe('MonthlyComparisonSection', () => {
  describe('rendering', () => {
    it('should not render when both months have no sessions', () => {
      const data = createMonthlyComparison(
        { totalSessions: 0 },
        { totalSessions: 0 }
      );
      const { container } = render(<MonthlyComparisonSection data={data} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render when this month has sessions', () => {
      const data = createMonthlyComparison(
        { totalSessions: 10 },
        { totalSessions: 0 }
      );
      render(<MonthlyComparisonSection data={data} />);
      expect(screen.getByText('Monthly Comparison')).toBeTruthy();
    });

    it('should render when last month has sessions', () => {
      const data = createMonthlyComparison(
        { totalSessions: 0 },
        { totalSessions: 10 }
      );
      render(<MonthlyComparisonSection data={data} />);
      expect(screen.getByText('Monthly Comparison')).toBeTruthy();
    });

    it('should render card with title', () => {
      const data = createMonthlyComparison();
      render(<MonthlyComparisonSection data={data} />);
      expect(screen.getByText('Monthly Comparison')).toBeTruthy();
    });

    it('should show month labels in header', () => {
      const data = createMonthlyComparison();
      render(<MonthlyComparisonSection data={data} />);
      expect(screen.getByText(/February 2026 vs January 2026/)).toBeTruthy();
    });
  });

  describe('sessions stat', () => {
    it('should display sessions for both months', () => {
      const data = createMonthlyComparison(
        { totalSessions: 25 },
        { totalSessions: 20 }
      );
      render(<MonthlyComparisonSection data={data} />);
      expect(screen.getByText('25')).toBeTruthy();
      expect(screen.getByText('20')).toBeTruthy();
    });

    it('should display sessions label', () => {
      const data = createMonthlyComparison();
      render(<MonthlyComparisonSection data={data} />);
      expect(screen.getByText('Sessions')).toBeTruthy();
    });
  });

  describe('WPM stat', () => {
    it('should display avg WPM for both months', () => {
      const data = createMonthlyComparison(
        { avgWpm: 72 },
        { avgWpm: 65 }
      );
      render(<MonthlyComparisonSection data={data} />);
      expect(screen.getByText('72')).toBeTruthy();
      expect(screen.getByText('65')).toBeTruthy();
    });

    it('should display avg WPM label', () => {
      const data = createMonthlyComparison();
      render(<MonthlyComparisonSection data={data} />);
      expect(screen.getByText('Avg WPM')).toBeTruthy();
    });
  });

  describe('accuracy stat', () => {
    it('should display avg accuracy with percentage for both months', () => {
      const data = createMonthlyComparison(
        { avgAccuracy: 95 },
        { avgAccuracy: 90 }
      );
      render(<MonthlyComparisonSection data={data} />);
      expect(screen.getByText('95%')).toBeTruthy();
      expect(screen.getByText('90%')).toBeTruthy();
    });

    it('should display avg accuracy label', () => {
      const data = createMonthlyComparison();
      render(<MonthlyComparisonSection data={data} />);
      expect(screen.getByText('Avg Accuracy')).toBeTruthy();
    });
  });

  describe('practice time stat', () => {
    it('should format practice time in hours and minutes', () => {
      const data = createMonthlyComparison(
        { totalPracticeTimeMs: 7200000 }, // 2 hours
        { totalPracticeTimeMs: 3600000 }  // 1 hour
      );
      render(<MonthlyComparisonSection data={data} />);
      expect(screen.getByText('2h 0m')).toBeTruthy();
      expect(screen.getByText('1h 0m')).toBeTruthy();
    });

    it('should format practice time in minutes when less than an hour', () => {
      const data = createMonthlyComparison(
        { totalPracticeTimeMs: 1800000 }, // 30 minutes
        { totalPracticeTimeMs: 900000 }   // 15 minutes
      );
      render(<MonthlyComparisonSection data={data} />);
      expect(screen.getByText('30m')).toBeTruthy();
      expect(screen.getByText('15m')).toBeTruthy();
    });

    it('should display practice time label', () => {
      const data = createMonthlyComparison();
      render(<MonthlyComparisonSection data={data} />);
      expect(screen.getByText('Practice Time')).toBeTruthy();
    });
  });

  describe('best WPM stat', () => {
    it('should display best WPM for both months', () => {
      const data = createMonthlyComparison(
        { bestWpm: 95 },
        { bestWpm: 85 }
      );
      render(<MonthlyComparisonSection data={data} />);
      expect(screen.getByText('95')).toBeTruthy();
      expect(screen.getByText('85')).toBeTruthy();
    });

    it('should display best WPM label', () => {
      const data = createMonthlyComparison();
      render(<MonthlyComparisonSection data={data} />);
      expect(screen.getByText('Best WPM')).toBeTruthy();
    });
  });

  describe('days practiced stat', () => {
    it('should display days with practice for both months', () => {
      const data = createMonthlyComparison(
        { daysWithPractice: 20 },
        { daysWithPractice: 15 }
      );
      render(<MonthlyComparisonSection data={data} />);
      // These values appear as text in the component
      const container = render(<MonthlyComparisonSection data={data} />);
      expect(container.container.textContent).toContain('20');
      expect(container.container.textContent).toContain('15');
    });

    it('should display days practiced label', () => {
      const data = createMonthlyComparison();
      render(<MonthlyComparisonSection data={data} />);
      expect(screen.getByText('Days Practiced')).toBeTruthy();
    });
  });

  describe('trend indicators', () => {
    it('should show positive trend with green color', () => {
      const data = createMonthlyComparison(
        { avgWpm: 75 },
        { avgWpm: 60 },
        { avgWpm: 25 }
      );
      const { container } = render(<MonthlyComparisonSection data={data} />);
      expect(screen.getByText('+25%')).toBeTruthy();
      expect(container.querySelector('.text-green-600')).toBeTruthy();
    });

    it('should show negative trend with red color', () => {
      const data = createMonthlyComparison(
        { avgWpm: 55 },
        { avgWpm: 70 },
        { avgWpm: -21 }
      );
      const { container } = render(<MonthlyComparisonSection data={data} />);
      expect(screen.getByText('-21%')).toBeTruthy();
      expect(container.querySelector('.text-red-500')).toBeTruthy();
    });

    it('should show neutral trend with gray color', () => {
      const data = createMonthlyComparison(
        { avgWpm: 65 },
        { avgWpm: 65 },
        { avgWpm: 0 }
      );
      const { container } = render(<MonthlyComparisonSection data={data} />);
      // Multiple 0% elements exist since all changes are 0
      const zeroPercentElements = screen.getAllByText('0%');
      expect(zeroPercentElements.length).toBeGreaterThan(0);
      expect(container.querySelector('.text-gray-500')).toBeTruthy();
    });

    it('should not show trend indicator when both values are 0', () => {
      const data = createMonthlyComparison(
        { avgWpm: 0 },
        { avgWpm: 0 },
        { avgWpm: 0 }
      );
      const { container } = render(<MonthlyComparisonSection data={data} />);
      // Find the Avg WPM row and check it doesn't have a trend indicator
      const rows = container.querySelectorAll('.py-3');
      // The trend indicator should not appear for rows where both values are 0
      expect(container.textContent).not.toMatch(/Avg WPM.*[+-]\d+%/);
    });
  });

  describe('this/last month labels', () => {
    it('should show "this month" label', () => {
      const data = createMonthlyComparison();
      render(<MonthlyComparisonSection data={data} />);
      const thisMonthLabels = screen.getAllByText('this month');
      expect(thisMonthLabels.length).toBeGreaterThan(0);
    });

    it('should show "last month" label', () => {
      const data = createMonthlyComparison();
      render(<MonthlyComparisonSection data={data} />);
      const lastMonthLabels = screen.getAllByText('last month');
      expect(lastMonthLabels.length).toBeGreaterThan(0);
    });
  });

  describe('all stats rendered', () => {
    it('should render all 6 stat rows', () => {
      const data = createMonthlyComparison();
      const { container } = render(<MonthlyComparisonSection data={data} />);
      // Each stat row has py-3 class
      const statRows = container.querySelectorAll('.py-3');
      expect(statRows.length).toBe(6);
    });
  });

  describe('edge cases', () => {
    it('should handle zero values gracefully', () => {
      const data = createMonthlyComparison(
        {
          totalSessions: 0,
          avgWpm: 0,
          avgAccuracy: 0,
          totalPracticeTimeMs: 0,
          bestWpm: 0,
          daysWithPractice: 0,
        },
        { totalSessions: 10 }
      );
      render(<MonthlyComparisonSection data={data} />);
      expect(screen.getByText('Monthly Comparison')).toBeTruthy();
    });

    it('should handle very large values', () => {
      const data = createMonthlyComparison(
        {
          totalSessions: 1000,
          avgWpm: 200,
          totalPracticeTimeMs: 36000000, // 10 hours
          totalKeystrokes: 1000000,
        }
      );
      render(<MonthlyComparisonSection data={data} />);
      expect(screen.getByText('1000')).toBeTruthy();
      expect(screen.getByText('200')).toBeTruthy();
      expect(screen.getByText('10h 0m')).toBeTruthy();
    });
  });
});
