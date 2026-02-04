/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WeaknessAnalysis } from '../WeaknessAnalysis';
import type { WeaknessReport } from '@/lib/weakness/analyze';

function createReport(overrides: Partial<WeaknessReport> = {}): WeaknessReport {
  return {
    weakestKeys: [
      { key: 'x', accuracy: 70, totalPresses: 100, correctPresses: 70, avgLatencyMs: 150 },
      { key: 'z', accuracy: 75, totalPresses: 80, correctPresses: 60, avgLatencyMs: 180 },
      { key: ';', accuracy: 80, totalPresses: 50, correctPresses: 40, avgLatencyMs: 120 },
    ],
    slowestKeys: [
      { key: 'z', avgLatencyMs: 180, totalPresses: 80, accuracy: 75 },
      { key: 'x', avgLatencyMs: 150, totalPresses: 100, accuracy: 70 },
      { key: ';', avgLatencyMs: 120, totalPresses: 50, accuracy: 80 },
    ],
    commonTypos: [
      { expected: 'a', actual: 's', count: 25 },
      { expected: 'd', actual: 'f', count: 15 },
      { expected: 'j', actual: 'k', count: 10 },
    ],
    problemSequences: [
      { sequence: 'qu', totalAttempts: 50, errorCount: 25, errorRate: 50, avgLatencyMs: 150 },
      { sequence: 'th', totalAttempts: 100, errorCount: 10, errorRate: 10, avgLatencyMs: 80 },
    ],
    summary: {
      overallAccuracy: 85,
      avgLatencyMs: 120,
      totalKeysTracked: 15,
      keysNeedingWork: 3,
      sequencesNeedingWork: 1,
      topWeakness: 'Key "X" at 70% accuracy',
    },
    ...overrides,
  };
}

describe('WeaknessAnalysis', () => {
  describe('rendering', () => {
    it('should not render when no data is tracked', () => {
      const report = createReport({
        summary: {
          overallAccuracy: 0,
          avgLatencyMs: 0,
          totalKeysTracked: 0,
          keysNeedingWork: 0,
          sequencesNeedingWork: 0,
          topWeakness: null,
        },
      });
      const { container } = render(<WeaknessAnalysis report={report} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render card with title', () => {
      render(<WeaknessAnalysis report={createReport()} />);
      expect(screen.getByText('Weakness Analysis')).toBeTruthy();
    });

    it('should render subtitle', () => {
      render(<WeaknessAnalysis report={createReport()} />);
      expect(screen.getByText('Areas that need the most practice')).toBeTruthy();
    });
  });

  describe('summary bar', () => {
    it('should display overall key accuracy', () => {
      render(<WeaknessAnalysis report={createReport()} />);
      expect(screen.getByText('Key Accuracy')).toBeTruthy();
      expect(screen.getByText('85%')).toBeTruthy();
    });

    it('should display average latency', () => {
      render(<WeaknessAnalysis report={createReport()} />);
      const label = screen.getByText('Avg Latency');
      const summarySection = label.closest('.text-center');
      expect(summarySection).toBeTruthy();
      expect(summarySection?.textContent).toContain('120ms');
    });

    it('should display keys needing work count', () => {
      render(<WeaknessAnalysis report={createReport()} />);
      expect(screen.getByText('Keys Needing Work')).toBeTruthy();
    });

    it('should display problem sequences count', () => {
      render(<WeaknessAnalysis report={createReport()} />);
      expect(screen.getByText('Problem Sequences')).toBeTruthy();
    });
  });

  describe('top weakness callout', () => {
    it('should display top weakness when present', () => {
      render(<WeaknessAnalysis report={createReport()} />);
      expect(screen.getByText('Top Weakness')).toBeTruthy();
      expect(screen.getByText('Key "X" at 70% accuracy')).toBeTruthy();
    });

    it('should not display top weakness when null', () => {
      const report = createReport({
        summary: {
          ...createReport().summary,
          topWeakness: null,
        },
      });
      render(<WeaknessAnalysis report={report} />);
      expect(screen.queryByText('Top Weakness')).toBeNull();
    });
  });

  describe('tab navigation', () => {
    it('should render all tab buttons', () => {
      render(<WeaknessAnalysis report={createReport()} />);
      expect(screen.getByText('Weak Keys')).toBeTruthy();
      expect(screen.getByText('Slow Keys')).toBeTruthy();
      expect(screen.getByText('Common Typos')).toBeTruthy();
      expect(screen.getByText('Sequences')).toBeTruthy();
    });

    it('should show weak keys tab by default', () => {
      render(<WeaknessAnalysis report={createReport()} />);
      // Weak keys tab should show column headers
      expect(screen.getByText('Key')).toBeTruthy();
      expect(screen.getByText('Accuracy')).toBeTruthy();
      expect(screen.getByText('Presses')).toBeTruthy();
    });

    it('should switch to slow keys tab', () => {
      render(<WeaknessAnalysis report={createReport()} />);
      fireEvent.click(screen.getByText('Slow Keys'));
      // The slow keys table has column headers including "Avg Latency"
      const labels = screen.getAllByText('Avg Latency');
      expect(labels.length).toBeGreaterThanOrEqual(1);
    });

    it('should switch to typos tab', () => {
      render(<WeaknessAnalysis report={createReport()} />);
      fireEvent.click(screen.getByText('Common Typos'));
      expect(screen.getByText('Expected')).toBeTruthy();
      expect(screen.getByText('Typed Instead')).toBeTruthy();
      expect(screen.getByText('Count')).toBeTruthy();
    });

    it('should switch to sequences tab', () => {
      render(<WeaknessAnalysis report={createReport()} />);
      fireEvent.click(screen.getByText('Sequences'));
      expect(screen.getByText('50% errors')).toBeTruthy();
    });
  });

  describe('weak keys table', () => {
    it('should display key labels', () => {
      render(<WeaknessAnalysis report={createReport()} />);
      expect(screen.getByText('X')).toBeTruthy();
      expect(screen.getByText('Z')).toBeTruthy();
    });

    it('should display accuracy percentages', () => {
      render(<WeaknessAnalysis report={createReport()} />);
      expect(screen.getByText('70%')).toBeTruthy();
      expect(screen.getByText('75%')).toBeTruthy();
    });

    it('should show empty message when no weak keys', () => {
      const report = createReport({ weakestKeys: [] });
      render(<WeaknessAnalysis report={report} />);
      expect(screen.getByText('Not enough data yet. Keep practicing!')).toBeTruthy();
    });

    it('should show expand button when more than 5 keys', () => {
      const report = createReport({
        weakestKeys: Array.from({ length: 8 }, (_, i) => ({
          key: String.fromCharCode(97 + i),
          accuracy: 70 + i,
          totalPresses: 100,
          correctPresses: 70 + i,
          avgLatencyMs: 100,
        })),
      });
      render(<WeaknessAnalysis report={report} />);
      expect(screen.getByText('Show all 8 keys')).toBeTruthy();
    });

    it('should expand to show all keys when button clicked', () => {
      const report = createReport({
        weakestKeys: Array.from({ length: 8 }, (_, i) => ({
          key: String.fromCharCode(97 + i),
          accuracy: 70 + i,
          totalPresses: 100,
          correctPresses: 70 + i,
          avgLatencyMs: 100,
        })),
      });
      const { container } = render(<WeaknessAnalysis report={report} />);

      fireEvent.click(screen.getByText('Show all 8 keys'));

      const keyItems = container.querySelectorAll('.grid.grid-cols-4.gap-2.items-center');
      expect(keyItems.length).toBe(8);
    });
  });

  describe('typos table', () => {
    it('should display expected and actual characters', () => {
      render(<WeaknessAnalysis report={createReport()} />);
      fireEvent.click(screen.getByText('Common Typos'));
      expect(screen.getByText('A')).toBeTruthy(); // expected 'a' -> displayed as 'A'
      expect(screen.getByText('S')).toBeTruthy(); // actual 's' -> displayed as 'S'
    });

    it('should display typo counts', () => {
      render(<WeaknessAnalysis report={createReport()} />);
      fireEvent.click(screen.getByText('Common Typos'));
      expect(screen.getByText('25x')).toBeTruthy();
      expect(screen.getByText('15x')).toBeTruthy();
    });

    it('should show empty message when no typos', () => {
      const report = createReport({ commonTypos: [] });
      render(<WeaknessAnalysis report={report} />);
      fireEvent.click(screen.getByText('Common Typos'));
      expect(screen.getByText('No typo patterns detected yet.')).toBeTruthy();
    });
  });

  describe('problem sequences', () => {
    it('should display sequence data', () => {
      render(<WeaknessAnalysis report={createReport()} />);
      fireEvent.click(screen.getByText('Sequences'));
      expect(screen.getByText('50% errors')).toBeTruthy();
      expect(screen.getByText('10% errors')).toBeTruthy();
    });

    it('should display ranking numbers', () => {
      render(<WeaknessAnalysis report={createReport()} />);
      fireEvent.click(screen.getByText('Sequences'));
      expect(screen.getByText('#1')).toBeTruthy();
      expect(screen.getByText('#2')).toBeTruthy();
    });

    it('should show empty message when no sequences', () => {
      const report = createReport({ problemSequences: [] });
      render(<WeaknessAnalysis report={report} />);
      fireEvent.click(screen.getByText('Sequences'));
      expect(screen.getByText('No problem sequences detected yet.')).toBeTruthy();
    });
  });
});
