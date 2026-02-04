/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ErrorTimeline, ErrorMarker } from '../ErrorTimeline';

describe('ErrorTimeline', () => {
  const defaultMarkers: ErrorMarker[] = [
    { timestamp: 1000, position: 10, expected: 'a', actual: 'b' },
    { timestamp: 5000, position: 50, expected: 'c', actual: 'd' },
    { timestamp: 9000, position: 90, expected: 'e', actual: 'f' },
  ];

  describe('rendering', () => {
    it('should render error markers', () => {
      render(
        <ErrorTimeline
          errorMarkers={defaultMarkers}
          totalDuration={10000}
          currentTime={0}
        />
      );

      expect(screen.getByTestId('error-timeline')).toBeTruthy();
      expect(screen.getByTestId('error-marker-0')).toBeTruthy();
      expect(screen.getByTestId('error-marker-1')).toBeTruthy();
      expect(screen.getByTestId('error-marker-2')).toBeTruthy();
    });

    it('should render nothing when there are no errors', () => {
      const { container } = render(
        <ErrorTimeline
          errorMarkers={[]}
          totalDuration={10000}
          currentTime={0}
        />
      );

      expect(container.innerHTML).toBe('');
    });

    it('should render nothing when totalDuration is 0', () => {
      const { container } = render(
        <ErrorTimeline
          errorMarkers={defaultMarkers}
          totalDuration={0}
          currentTime={0}
        />
      );

      // Should render nothing when totalDuration is 0
      expect(container.innerHTML).toBe('');
    });

    it('should have aria-hidden attribute', () => {
      render(
        <ErrorTimeline
          errorMarkers={defaultMarkers}
          totalDuration={10000}
          currentTime={0}
        />
      );

      const timeline = screen.getByTestId('error-timeline');
      expect(timeline.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('marker positioning', () => {
    it('should position markers based on timestamp position', () => {
      render(
        <ErrorTimeline
          errorMarkers={[
            { timestamp: 5000, position: 50, expected: 'a', actual: 'b' },
          ]}
          totalDuration={10000}
          currentTime={0}
        />
      );

      const marker = screen.getByTestId('error-marker-0');
      expect(marker.style.left).toBe('50%');
    });
  });

  describe('clustering', () => {
    it('should cluster nearby error markers', () => {
      const closeMarkers: ErrorMarker[] = [
        { timestamp: 1000, position: 10, expected: 'a', actual: 'b' },
        { timestamp: 1100, position: 11, expected: 'c', actual: 'd' },
        { timestamp: 1200, position: 11.5, expected: 'e', actual: 'f' },
      ];

      render(
        <ErrorTimeline
          errorMarkers={closeMarkers}
          totalDuration={10000}
          currentTime={0}
        />
      );

      // Should cluster into 1 marker since all are within 1.5% threshold
      expect(screen.getByTestId('error-marker-0')).toBeTruthy();
      expect(screen.queryByTestId('error-marker-1')).toBeNull();
    });

    it('should not cluster distant error markers', () => {
      const distantMarkers: ErrorMarker[] = [
        { timestamp: 1000, position: 10, expected: 'a', actual: 'b' },
        { timestamp: 5000, position: 50, expected: 'c', actual: 'd' },
      ];

      render(
        <ErrorTimeline
          errorMarkers={distantMarkers}
          totalDuration={10000}
          currentTime={0}
        />
      );

      expect(screen.getByTestId('error-marker-0')).toBeTruthy();
      expect(screen.getByTestId('error-marker-1')).toBeTruthy();
    });
  });

  describe('past/future markers', () => {
    it('should show past markers as fully opaque', () => {
      render(
        <ErrorTimeline
          errorMarkers={[
            { timestamp: 1000, position: 10, expected: 'a', actual: 'b' },
          ]}
          totalDuration={10000}
          currentTime={5000}
        />
      );

      const markerContainer = screen.getByTestId('error-marker-0');
      const dot = markerContainer.firstElementChild as HTMLElement;
      expect(dot.className).toContain('bg-red-500');
      expect(dot.className).not.toContain('bg-red-500/40');
    });

    it('should show future markers as semi-transparent', () => {
      render(
        <ErrorTimeline
          errorMarkers={[
            { timestamp: 9000, position: 90, expected: 'a', actual: 'b' },
          ]}
          totalDuration={10000}
          currentTime={1000}
        />
      );

      const markerContainer = screen.getByTestId('error-marker-0');
      const dot = markerContainer.firstElementChild as HTMLElement;
      expect(dot.className).toContain('bg-red-500/40');
    });
  });

  describe('single marker', () => {
    it('should render a single error marker correctly', () => {
      render(
        <ErrorTimeline
          errorMarkers={[
            { timestamp: 5000, position: 50, expected: 'x', actual: 'y' },
          ]}
          totalDuration={10000}
          currentTime={0}
        />
      );

      expect(screen.getByTestId('error-marker-0')).toBeTruthy();
      expect(screen.queryByTestId('error-marker-1')).toBeNull();
    });
  });
});
