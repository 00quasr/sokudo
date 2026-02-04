/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { KeyboardHeatmap, KeyAccuracyData } from '../KeyboardHeatmap';

const createKeyData = (
  key: string,
  totalPresses: number,
  correctPresses: number,
  avgLatencyMs: number = 100
): KeyAccuracyData => ({
  key,
  totalPresses,
  correctPresses,
  avgLatencyMs,
});

const mockKeyData: KeyAccuracyData[] = [
  createKeyData('a', 100, 98, 80),
  createKeyData('s', 100, 95, 90),
  createKeyData('d', 100, 90, 100),
  createKeyData('f', 100, 85, 110),
  createKeyData('j', 100, 80, 120),
  createKeyData('k', 100, 75, 130),
];

describe('KeyboardHeatmap', () => {
  describe('rendering', () => {
    it('should not render when data is empty', () => {
      const { container } = render(<KeyboardHeatmap data={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render card with title', () => {
      render(<KeyboardHeatmap data={mockKeyData} />);
      expect(screen.getByText('Keyboard Heatmap')).toBeTruthy();
    });

    it('should render all keyboard rows', () => {
      const { container } = render(<KeyboardHeatmap data={mockKeyData} />);
      // Keyboard has 5 rows
      const keyElements = container.querySelectorAll('.rounded-md.h-10');
      expect(keyElements.length).toBeGreaterThan(0);
    });

    it('should render the legend', () => {
      render(<KeyboardHeatmap data={mockKeyData} />);
      expect(screen.getByText('<80%')).toBeTruthy();
      expect(screen.getByText('80-85%')).toBeTruthy();
      expect(screen.getByText('85-90%')).toBeTruthy();
      expect(screen.getByText('90-95%')).toBeTruthy();
      expect(screen.getByText('95-98%')).toBeTruthy();
    });
  });

  describe('color coding', () => {
    it('should apply green-500 for accuracy >= 98%', () => {
      const data = [createKeyData('a', 100, 100, 80)];
      const { container } = render(<KeyboardHeatmap data={data} />);
      const keyElement = container.querySelector('[title="A"]');
      expect(keyElement?.className).toContain('bg-green-500');
    });

    it('should apply green-400 for accuracy 95-98%', () => {
      const data = [createKeyData('a', 100, 96, 80)];
      const { container } = render(<KeyboardHeatmap data={data} />);
      const keyElement = container.querySelector('[title="A"]');
      expect(keyElement?.className).toContain('bg-green-400');
    });

    it('should apply yellow-400 for accuracy 90-95%', () => {
      const data = [createKeyData('a', 100, 92, 80)];
      const { container } = render(<KeyboardHeatmap data={data} />);
      const keyElement = container.querySelector('[title="A"]');
      expect(keyElement?.className).toContain('bg-yellow-400');
    });

    it('should apply orange-400 for accuracy 85-90%', () => {
      const data = [createKeyData('a', 100, 87, 80)];
      const { container } = render(<KeyboardHeatmap data={data} />);
      const keyElement = container.querySelector('[title="A"]');
      expect(keyElement?.className).toContain('bg-orange-400');
    });

    it('should apply orange-500 for accuracy 80-85%', () => {
      const data = [createKeyData('a', 100, 82, 80)];
      const { container } = render(<KeyboardHeatmap data={data} />);
      const keyElement = container.querySelector('[title="A"]');
      expect(keyElement?.className).toContain('bg-orange-500');
    });

    it('should apply red-500 for accuracy < 80%', () => {
      const data = [createKeyData('a', 100, 75, 80)];
      const { container } = render(<KeyboardHeatmap data={data} />);
      const keyElement = container.querySelector('[title="A"]');
      expect(keyElement?.className).toContain('bg-red-500');
    });

    it('should apply gray-800 for keys with insufficient data', () => {
      const data = [createKeyData('a', 3, 3, 80)];
      const { container } = render(<KeyboardHeatmap data={data} />);
      const keyElement = container.querySelector('[title="A"]');
      expect(keyElement?.className).toContain('bg-gray-800');
    });
  });

  describe('hover interaction', () => {
    it('should show detail panel on hover', () => {
      const data = [createKeyData('a', 100, 95, 80)];
      const { container } = render(<KeyboardHeatmap data={data} />);

      const keyElement = container.querySelector('[title="A"]');
      expect(keyElement).toBeTruthy();

      fireEvent.mouseEnter(keyElement!);

      expect(screen.getByText('95% accuracy')).toBeTruthy();
    });

    it('should show correct/total presses on hover', () => {
      const data = [createKeyData('a', 100, 95, 80)];
      const { container } = render(<KeyboardHeatmap data={data} />);

      const keyElement = container.querySelector('[title="A"]');
      fireEvent.mouseEnter(keyElement!);

      expect(screen.getByText('95 / 100 correct')).toBeTruthy();
    });

    it('should show average latency on hover', () => {
      const data = [createKeyData('a', 100, 95, 80)];
      const { container } = render(<KeyboardHeatmap data={data} />);

      const keyElement = container.querySelector('[title="A"]');
      fireEvent.mouseEnter(keyElement!);

      expect(screen.getByText('80ms avg latency')).toBeTruthy();
    });

    it('should show insufficient data message for low press count', () => {
      const data = [createKeyData('a', 3, 3, 80)];
      const { container } = render(<KeyboardHeatmap data={data} />);

      const keyElement = container.querySelector('[title="A"]');
      fireEvent.mouseEnter(keyElement!);

      expect(screen.getByText(/Not enough data/)).toBeTruthy();
    });

    it('should show no data message for keys without data', () => {
      const data = [createKeyData('z', 100, 95, 80)];
      const { container } = render(<KeyboardHeatmap data={data} />);

      const keyElement = container.querySelector('[title="A"]');
      fireEvent.mouseEnter(keyElement!);

      expect(screen.getByText('No data yet')).toBeTruthy();
    });

    it('should hide detail panel on mouse leave', () => {
      const data = [createKeyData('a', 100, 95, 80)];
      const { container } = render(<KeyboardHeatmap data={data} />);

      const keyElement = container.querySelector('[title="A"]');
      fireEvent.mouseEnter(keyElement!);
      expect(screen.getByText('95% accuracy')).toBeTruthy();

      fireEvent.mouseLeave(keyElement!);
      expect(screen.queryByText('95% accuracy')).toBeNull();
    });
  });

  describe('summary stats', () => {
    it('should display weakest key', () => {
      render(<KeyboardHeatmap data={mockKeyData} />);
      expect(screen.getByText('Weakest Key')).toBeTruthy();
      // k has 75% accuracy, the lowest - verify it's in the summary section
      const weakestKeyLabel = screen.getByText('Weakest Key');
      const summarySection = weakestKeyLabel.closest('.text-center');
      expect(summarySection?.textContent).toContain('K');
    });

    it('should display keys tracked count', () => {
      render(<KeyboardHeatmap data={mockKeyData} />);
      expect(screen.getByText('Keys Tracked')).toBeTruthy();
      // Check that the count is displayed in the summary section
      const keysTrackedLabel = screen.getByText('Keys Tracked');
      const summarySection = keysTrackedLabel.closest('.text-center');
      expect(summarySection?.textContent).toContain('6');
    });

    it('should display slowest key', () => {
      render(<KeyboardHeatmap data={mockKeyData} />);
      expect(screen.getByText('Slowest Key')).toBeTruthy();
      // k has 130ms latency, the highest
    });

    it('should not display summary stats when no significant keys', () => {
      const data = [createKeyData('a', 3, 3, 80)];
      render(<KeyboardHeatmap data={data} />);
      expect(screen.queryByText('Weakest Key')).toBeNull();
    });
  });

  describe('minPresses prop', () => {
    it('should use default minPresses of 5', () => {
      const data = [createKeyData('a', 4, 4, 80)];
      const { container } = render(<KeyboardHeatmap data={data} />);

      const keyElement = container.querySelector('[title="A"]');
      // Should be gray (insufficient data)
      expect(keyElement?.className).toContain('bg-gray-800');
    });

    it('should respect custom minPresses value', () => {
      const data = [createKeyData('a', 4, 4, 80)];
      const { container } = render(<KeyboardHeatmap data={data} minPresses={3} />);

      const keyElement = container.querySelector('[title="A"]');
      // Should have color (100% accuracy with minPresses=3)
      expect(keyElement?.className).toContain('bg-green-500');
    });
  });

  describe('special keys', () => {
    it('should display Space key with correct label', () => {
      const data = [createKeyData(' ', 100, 95, 80)];
      const { container } = render(<KeyboardHeatmap data={data} />);

      const spaceKey = container.querySelector('[title="Space"]');
      expect(spaceKey).toBeTruthy();
      expect(spaceKey?.textContent).toBe('Space');
    });

    it('should display special character labels', () => {
      const data = [createKeyData(';', 100, 95, 80)];
      const { container } = render(<KeyboardHeatmap data={data} />);

      const keyElement = container.querySelector('[title=":"]');
      expect(keyElement).toBeTruthy();
    });

    it('should handle case-insensitive key matching', () => {
      const data = [createKeyData('A', 100, 95, 80)];
      const { container } = render(<KeyboardHeatmap data={data} />);

      const keyElement = container.querySelector('[title="A"]');
      expect(keyElement?.className).toContain('bg-green-400');
    });
  });

  describe('keyboard layout', () => {
    it('should render all standard keyboard keys', () => {
      const { container } = render(<KeyboardHeatmap data={mockKeyData} />);

      // Check for some specific keys
      expect(container.querySelector('[title="Q"]')).toBeTruthy();
      expect(container.querySelector('[title="A"]')).toBeTruthy();
      expect(container.querySelector('[title="Z"]')).toBeTruthy();
      expect(container.querySelector('[title="Space"]')).toBeTruthy();
    });

    it('should render number row', () => {
      const { container } = render(<KeyboardHeatmap data={mockKeyData} />);

      for (let i = 0; i <= 9; i++) {
        expect(container.querySelector(`[title="${i}"]`)).toBeTruthy();
      }
    });
  });
});
