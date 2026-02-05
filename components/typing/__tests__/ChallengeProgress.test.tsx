/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChallengeProgress } from '../ChallengeProgress';

describe('ChallengeProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('should not render when isTransitioning is false', () => {
      const { container } = render(
        <ChallengeProgress current={5} total={30} isTransitioning={false} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when isTransitioning is true', () => {
      render(<ChallengeProgress current={5} total={30} isTransitioning={true} />);

      expect(screen.getByText('Challenge 5/30 complete')).toBeTruthy();
      expect(screen.getByText('Next challenge loading...')).toBeTruthy();
    });

    it('should show spinner icon when not last challenge', () => {
      const { container } = render(
        <ChallengeProgress current={5} total={30} isTransitioning={true} />
      );

      // The Loader2 icon should be present (has animate-spin class)
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeTruthy();
    });

    it('should show check icon when completing last challenge', () => {
      render(<ChallengeProgress current={30} total={30} isTransitioning={true} />);

      expect(screen.getByText('Challenge 30/30 complete')).toBeTruthy();
      expect(screen.getByText('Category complete!')).toBeTruthy();
    });

    it('should display progress bar', () => {
      const { container } = render(
        <ChallengeProgress current={15} total={30} isTransitioning={true} />
      );

      // Progress bar container should have the muted background
      const progressContainer = container.querySelector('.bg-muted');
      expect(progressContainer).toBeTruthy();
    });

    it('should calculate progress bar width correctly', () => {
      const { container } = render(
        <ChallengeProgress current={15} total={30} isTransitioning={true} />
      );

      // 15/30 = 50%
      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar?.getAttribute('style')).toBeTruthy();
      expect(progressBar?.getAttribute('style')).toContain('50%');
    });

    it('should show 100% progress when last challenge is complete', () => {
      const { container } = render(
        <ChallengeProgress current={30} total={30} isTransitioning={true} />
      );

      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar?.getAttribute('style')).toBeTruthy();
      expect(progressBar?.getAttribute('style')).toContain('100%');
    });

    it('should show 25% progress for quarter completion', () => {
      const { container } = render(
        <ChallengeProgress current={5} total={20} isTransitioning={true} />
      );

      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar?.getAttribute('style')).toBeTruthy();
      expect(progressBar?.getAttribute('style')).toContain('25%');
    });
  });

  describe('auto-hide behavior', () => {
    it('should clear timeout on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const { unmount } = render(
        <ChallengeProgress current={5} total={30} isTransitioning={true} />
      );

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('backdrop styling', () => {
    it('should have backdrop blur and overlay', () => {
      render(<ChallengeProgress current={5} total={30} isTransitioning={true} />);

      const backdrop = screen.getByText('Challenge 5/30 complete')
        .closest('.fixed');

      expect(backdrop?.className).toContain('backdrop-blur-sm');
      expect(backdrop?.className).toContain('bg-background/80');
    });

    it('should be positioned fixed covering full screen', () => {
      render(<ChallengeProgress current={5} total={30} isTransitioning={true} />);

      const backdrop = screen.getByText('Challenge 5/30 complete')
        .closest('.fixed');

      expect(backdrop?.className).toContain('inset-0');
      expect(backdrop?.className).toContain('z-50');
    });

    it('should center content', () => {
      render(<ChallengeProgress current={5} total={30} isTransitioning={true} />);

      const backdrop = screen.getByText('Challenge 5/30 complete')
        .closest('.fixed');

      expect(backdrop?.className).toContain('items-center');
      expect(backdrop?.className).toContain('justify-center');
    });
  });

  describe('content card styling', () => {
    it('should have proper card styling', () => {
      render(<ChallengeProgress current={5} total={30} isTransitioning={true} />);

      const card = screen.getByText('Challenge 5/30 complete')
        .closest('.rounded-lg');

      expect(card?.className).toContain('border');
      expect(card?.className).toContain('bg-card');
      expect(card?.className).toContain('shadow-lg');
    });

    it('should have padding', () => {
      const { container } = render(<ChallengeProgress current={5} total={30} isTransitioning={true} />);

      // Find the card container by selecting the inner card div with border and shadow
      const card = container.querySelector('.border.bg-card.shadow-lg');

      expect(card).toBeTruthy();
      // Should have responsive padding classes
      expect(card?.className).toMatch(/p-3/);
      expect(card?.className).toMatch(/sm:p-4/);
      expect(card?.className).toMatch(/md:p-6/);
    });
  });

  describe('edge cases', () => {
    it('should handle first challenge (1/30)', () => {
      const { container } = render(
        <ChallengeProgress current={1} total={30} isTransitioning={true} />
      );

      expect(screen.getByText('Challenge 1/30 complete')).toBeTruthy();

      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar?.getAttribute('style')).toBeTruthy();
      // 1/30 ≈ 3.33%
      expect(progressBar?.getAttribute('style')).toContain('3.33');
    });

    it('should handle single challenge category (1/1)', () => {
      const { container } = render(
        <ChallengeProgress current={1} total={1} isTransitioning={true} />
      );

      expect(screen.getByText('Challenge 1/1 complete')).toBeTruthy();
      expect(screen.getByText('Category complete!')).toBeTruthy();

      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar?.getAttribute('style')).toBeTruthy();
      expect(progressBar?.getAttribute('style')).toContain('100%');
    });

    it('should handle large category (50/100)', () => {
      const { container } = render(
        <ChallengeProgress current={50} total={100} isTransitioning={true} />
      );

      expect(screen.getByText('Challenge 50/100 complete')).toBeTruthy();
      expect(screen.getByText('Next challenge loading...')).toBeTruthy();

      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar?.getAttribute('style')).toBeTruthy();
      expect(progressBar?.getAttribute('style')).toContain('50%');
    });
  });

  describe('message variations', () => {
    it('should show "Next challenge loading..." for in-progress category', () => {
      render(<ChallengeProgress current={10} total={30} isTransitioning={true} />);

      expect(screen.getByText('Next challenge loading...')).toBeTruthy();
    });

    it('should show "Category complete!" for last challenge', () => {
      render(<ChallengeProgress current={30} total={30} isTransitioning={true} />);

      expect(screen.getByText('Category complete!')).toBeTruthy();
      expect(screen.queryByText('Next challenge loading...')).toBeNull();
    });
  });
});
