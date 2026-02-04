/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  ProblemSequencesSection,
  SequenceErrorData,
} from '../ProblemSequencesSection';

const createSequenceData = (
  sequence: string,
  totalAttempts: number,
  errorCount: number,
  avgLatencyMs: number = 100
): SequenceErrorData => ({
  sequence,
  totalAttempts,
  errorCount,
  errorRate: Math.round((errorCount / totalAttempts) * 100),
  avgLatencyMs,
});

const mockSequenceData: SequenceErrorData[] = [
  createSequenceData('qu', 50, 25, 150),
  createSequenceData('th', 100, 10, 80),
  createSequenceData('gh', 40, 16, 140),
  createSequenceData('{}', 30, 15, 200),
  createSequenceData('=>', 35, 10, 180),
  createSequenceData('ng', 60, 6, 90),
];

describe('ProblemSequencesSection', () => {
  describe('rendering', () => {
    it('should not render when data is empty', () => {
      const { container } = render(<ProblemSequencesSection data={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when all data has insufficient attempts', () => {
      const data = [createSequenceData('th', 3, 1, 100)];
      const { container } = render(<ProblemSequencesSection data={data} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render card with title', () => {
      render(<ProblemSequencesSection data={mockSequenceData} />);
      expect(screen.getByText('Problem Sequences')).toBeTruthy();
    });

    it('should render subtitle description', () => {
      render(<ProblemSequencesSection data={mockSequenceData} />);
      expect(screen.getByText('Character pairs with high error rates')).toBeTruthy();
    });

    it('should render sequence list items', () => {
      const { container } = render(<ProblemSequencesSection data={mockSequenceData} />);
      // Default shows top 5, verify items rendered
      const items = container.querySelectorAll('.rounded-lg.border');
      expect(items.length).toBe(5);
      // Verify the sequence content exists (qu has 50% error rate, should be first)
      expect(container.textContent).toContain('qu');
      expect(container.textContent).toContain('50% errors');
    });
  });

  describe('summary stats', () => {
    it('should display sequences tracked count', () => {
      render(<ProblemSequencesSection data={mockSequenceData} />);
      expect(screen.getByText('Sequences Tracked')).toBeTruthy();
      const trackedLabel = screen.getByText('Sequences Tracked');
      const summarySection = trackedLabel.closest('.text-center');
      expect(summarySection?.textContent).toContain('6');
    });

    it('should display worst sequence', () => {
      render(<ProblemSequencesSection data={mockSequenceData} />);
      expect(screen.getByText('Worst Sequence')).toBeTruthy();
      // qu has 50% error rate, the highest
    });

    it('should display slowest sequence', () => {
      render(<ProblemSequencesSection data={mockSequenceData} />);
      expect(screen.getByText('Slowest Sequence')).toBeTruthy();
      // {} has 200ms latency, the highest
    });
  });

  describe('error rate display', () => {
    it('should show error percentage for each sequence', () => {
      const data = [createSequenceData('qu', 50, 25, 150)];
      render(<ProblemSequencesSection data={data} />);
      expect(screen.getByText('50% errors')).toBeTruthy();
    });

    it('should show attempts count', () => {
      const data = [createSequenceData('qu', 50, 25, 150)];
      render(<ProblemSequencesSection data={data} />);
      expect(screen.getByText(/25\/50 attempts/)).toBeTruthy();
    });

    it('should show latency', () => {
      const data = [createSequenceData('qu', 50, 25, 150)];
      render(<ProblemSequencesSection data={data} />);
      expect(screen.getByText(/150ms/)).toBeTruthy();
    });
  });

  describe('color coding', () => {
    it('should apply red text for error rate >= 50%', () => {
      const data = [createSequenceData('qu', 100, 60, 150)];
      const { container } = render(<ProblemSequencesSection data={data} />);
      const errorText = screen.getByText('60% errors');
      expect(errorText.className).toContain('text-red-500');
    });

    it('should apply orange-500 text for error rate 30-50%', () => {
      const data = [createSequenceData('qu', 100, 35, 150)];
      const { container } = render(<ProblemSequencesSection data={data} />);
      const errorText = screen.getByText('35% errors');
      expect(errorText.className).toContain('text-orange-500');
    });

    it('should apply orange-400 text for error rate 20-30%', () => {
      const data = [createSequenceData('qu', 100, 25, 150)];
      const { container } = render(<ProblemSequencesSection data={data} />);
      const errorText = screen.getByText('25% errors');
      expect(errorText.className).toContain('text-orange-400');
    });

    it('should apply yellow-400 text for error rate 10-20%', () => {
      const data = [createSequenceData('qu', 100, 15, 150)];
      const { container } = render(<ProblemSequencesSection data={data} />);
      const errorText = screen.getByText('15% errors');
      expect(errorText.className).toContain('text-yellow-400');
    });

    it('should apply green-400 text for error rate < 10%', () => {
      const data = [createSequenceData('qu', 100, 5, 150)];
      const { container } = render(<ProblemSequencesSection data={data} />);
      const errorText = screen.getByText('5% errors');
      expect(errorText.className).toContain('text-green-400');
    });
  });

  describe('sort toggle', () => {
    it('should render sort toggle buttons', () => {
      render(<ProblemSequencesSection data={mockSequenceData} />);
      expect(screen.getByText('Error Rate')).toBeTruthy();
      expect(screen.getByText('Latency')).toBeTruthy();
    });

    it('should sort by error rate by default', () => {
      const data = [
        createSequenceData('qu', 50, 25, 100),
        createSequenceData('th', 100, 10, 200),
      ];
      const { container } = render(<ProblemSequencesSection data={data} />);

      const items = container.querySelectorAll('.rounded-lg.border');
      expect(items[0].textContent).toContain('qu');
      expect(items[0].textContent).toContain('50%');
    });

    it('should switch to latency sort when clicking Latency button', () => {
      const data = [
        createSequenceData('qu', 50, 25, 100),
        createSequenceData('th', 100, 10, 200),
      ];
      render(<ProblemSequencesSection data={data} />);

      const latencyButton = screen.getByText('Latency');
      fireEvent.click(latencyButton);

      const items = document.querySelectorAll('.rounded-lg.border');
      expect(items[0].textContent).toContain('th');
      expect(items[0].textContent).toContain('200ms');
    });
  });

  describe('expand/collapse', () => {
    it('should show only 5 items by default', () => {
      const data = Array.from({ length: 10 }, (_, i) =>
        createSequenceData(`s${i}`, 50, 10, 100)
      );
      const { container } = render(<ProblemSequencesSection data={data} />);

      const items = container.querySelectorAll('.rounded-lg.border');
      expect(items.length).toBe(5);
    });

    it('should show expand button when more than 5 sequences', () => {
      const data = Array.from({ length: 10 }, (_, i) =>
        createSequenceData(`s${i}`, 50, 10, 100)
      );
      render(<ProblemSequencesSection data={data} />);

      expect(screen.getByText(/Show all 10 sequences/)).toBeTruthy();
    });

    it('should not show expand button when 5 or fewer sequences', () => {
      render(<ProblemSequencesSection data={mockSequenceData.slice(0, 5)} />);
      expect(screen.queryByText(/Show all/)).toBeNull();
    });

    it('should expand to show all items when clicked', () => {
      const data = Array.from({ length: 10 }, (_, i) =>
        createSequenceData(`s${i}`, 50, 10, 100)
      );
      const { container } = render(<ProblemSequencesSection data={data} />);

      const expandButton = screen.getByText(/Show all 10 sequences/);
      fireEvent.click(expandButton);

      const items = container.querySelectorAll('.rounded-lg.border');
      expect(items.length).toBe(10);
    });

    it('should show collapse button after expanding', () => {
      const data = Array.from({ length: 10 }, (_, i) =>
        createSequenceData(`s${i}`, 50, 10, 100)
      );
      render(<ProblemSequencesSection data={data} />);

      const expandButton = screen.getByText(/Show all 10 sequences/);
      fireEvent.click(expandButton);

      expect(screen.getByText('Show less')).toBeTruthy();
    });

    it('should collapse back to 5 items when collapse is clicked', () => {
      const data = Array.from({ length: 10 }, (_, i) =>
        createSequenceData(`s${i}`, 50, 10, 100)
      );
      const { container } = render(<ProblemSequencesSection data={data} />);

      const expandButton = screen.getByText(/Show all 10 sequences/);
      fireEvent.click(expandButton);

      const collapseButton = screen.getByText('Show less');
      fireEvent.click(collapseButton);

      const items = container.querySelectorAll('.rounded-lg.border');
      expect(items.length).toBe(5);
    });
  });

  describe('special character formatting', () => {
    it('should display space as symbol', () => {
      const data = [createSequenceData('t ', 50, 10, 100)];
      const { container } = render(<ProblemSequencesSection data={data} />);
      // Check that the formatted sequence with space symbol is present in the list item
      const listItem = container.querySelector('.rounded-lg.border');
      expect(listItem?.textContent).toContain('t␣');
    });

    it('should show sequence description for space', () => {
      const data = [createSequenceData('t ', 50, 10, 100)];
      render(<ProblemSequencesSection data={data} />);
      expect(screen.getByText('t → space')).toBeTruthy();
    });
  });

  describe('practice tip', () => {
    it('should show practice tip for high error rate sequence', () => {
      const data = [createSequenceData('qu', 50, 25, 150)];
      render(<ProblemSequencesSection data={data} />);
      expect(screen.getByText('Practice Tip')).toBeTruthy();
    });

    it('should not show practice tip for low error rate sequences', () => {
      const data = [createSequenceData('th', 100, 5, 80)];
      render(<ProblemSequencesSection data={data} />);
      expect(screen.queryByText('Practice Tip')).toBeNull();
    });

    it('should include sequence in practice tip', () => {
      const data = [createSequenceData('qu', 50, 25, 150)];
      render(<ProblemSequencesSection data={data} />);
      const tip = screen.getByText(/Focus on the "qu" sequence/);
      expect(tip).toBeTruthy();
    });
  });

  describe('minAttempts prop', () => {
    it('should use default minAttempts of 5', () => {
      const data = [createSequenceData('th', 4, 2, 100)];
      const { container } = render(<ProblemSequencesSection data={data} />);
      expect(container.firstChild).toBeNull();
    });

    it('should respect custom minAttempts value', () => {
      const data = [createSequenceData('xy', 4, 2, 100)];
      const { container } = render(<ProblemSequencesSection data={data} minAttempts={3} />);
      // Verify the sequence is rendered in the list item
      const listItem = container.querySelector('.rounded-lg.border');
      expect(listItem?.textContent).toContain('xy');
    });
  });

  describe('error bar visualization', () => {
    it('should render error bars for each sequence', () => {
      const { container } = render(
        <ProblemSequencesSection data={mockSequenceData} />
      );
      const errorBars = container.querySelectorAll('.h-1.bg-gray-700');
      expect(errorBars.length).toBeGreaterThan(0);
    });
  });

  describe('ranking', () => {
    it('should display sequence ranking', () => {
      render(<ProblemSequencesSection data={mockSequenceData} />);
      expect(screen.getByText('#1')).toBeTruthy();
      expect(screen.getByText('#2')).toBeTruthy();
    });
  });
});
