/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SessionComplete, SessionResult } from '../SessionComplete';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const createResult = (overrides: Partial<SessionResult> = {}): SessionResult => ({
  wpm: 60,
  rawWpm: 65,
  accuracy: 95,
  keystrokes: 100,
  errors: 5,
  durationMs: 60000,
  ...overrides,
});

describe('SessionComplete', () => {
  const defaultProps = {
    open: true,
    result: createResult(),
    categorySlug: 'git-basics',
    onRetry: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render when open is true', () => {
      render(<SessionComplete {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeTruthy();
    });

    it('should not render dialog content when open is false', () => {
      render(<SessionComplete {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('should render trophy icon', () => {
      render(<SessionComplete {...defaultProps} />);

      // Check for trophy container (green background circle)
      const container = document.querySelector('.bg-green-500\\/10');
      expect(container).toBeTruthy();
    });

    it('should render WPM stat', () => {
      render(<SessionComplete {...defaultProps} result={createResult({ wpm: 75 })} />);

      expect(screen.getByText('WPM')).toBeTruthy();
      expect(screen.getByText('75')).toBeTruthy();
    });

    it('should render Accuracy stat', () => {
      render(<SessionComplete {...defaultProps} result={createResult({ accuracy: 98 })} />);

      expect(screen.getByText('Accuracy')).toBeTruthy();
      expect(screen.getByText('98%')).toBeTruthy();
    });

    it('should render Time stat', () => {
      render(<SessionComplete {...defaultProps} result={createResult({ durationMs: 90000 })} />);

      expect(screen.getByText('Time')).toBeTruthy();
      expect(screen.getByText('1m 30s')).toBeTruthy();
    });

    it('should render Errors stat', () => {
      render(<SessionComplete {...defaultProps} result={createResult({ errors: 10 })} />);

      expect(screen.getByText('Errors')).toBeTruthy();
      expect(screen.getByText('10')).toBeTruthy();
    });

    it('should render Try Again button', () => {
      render(<SessionComplete {...defaultProps} />);

      expect(screen.getByText('Try Again')).toBeTruthy();
    });

    it('should render Next Challenge button when nextChallengeId is provided', () => {
      render(<SessionComplete {...defaultProps} nextChallengeId={5} />);

      expect(screen.getByText('Next Challenge')).toBeTruthy();
    });

    it('should render More Challenges button when nextChallengeId is not provided', () => {
      render(<SessionComplete {...defaultProps} nextChallengeId={undefined} />);

      expect(screen.getByText('More Challenges')).toBeTruthy();
    });

    it('should render keyboard hints', () => {
      render(<SessionComplete {...defaultProps} />);

      // Check that the keyboard hint text exists (the kbd elements contain these letters)
      const kbdElements = document.querySelectorAll('kbd');
      const kbdTexts = Array.from(kbdElements).map(el => el.textContent);
      expect(kbdTexts).toContain('R');
      expect(kbdTexts).toContain('N');
      expect(kbdTexts).toContain('Esc');
    });
  });

  describe('performance messages', () => {
    it('should show Excellent! for high WPM and accuracy', () => {
      render(<SessionComplete {...defaultProps} result={createResult({ wpm: 70, accuracy: 99 })} />);

      expect(screen.getByText('Excellent!')).toBeTruthy();
      expect(screen.getByText('Outstanding speed and accuracy!')).toBeTruthy();
    });

    it('should show Great job! for good WPM and accuracy', () => {
      render(<SessionComplete {...defaultProps} result={createResult({ wpm: 50, accuracy: 96 })} />);

      expect(screen.getByText('Great job!')).toBeTruthy();
      expect(screen.getByText("You're building solid muscle memory.")).toBeTruthy();
    });

    it('should show Good work! for decent accuracy', () => {
      render(<SessionComplete {...defaultProps} result={createResult({ wpm: 30, accuracy: 92 })} />);

      expect(screen.getByText('Good work!')).toBeTruthy();
      expect(screen.getByText('Focus on accuracy to improve further.')).toBeTruthy();
    });

    it('should show Keep practicing! for low accuracy but decent WPM', () => {
      render(<SessionComplete {...defaultProps} result={createResult({ wpm: 40, accuracy: 80 })} />);

      expect(screen.getByText('Keep practicing!')).toBeTruthy();
      expect(screen.getByText('Slow down to reduce errors.')).toBeTruthy();
    });

    it('should show Nice effort! for low WPM and accuracy', () => {
      render(<SessionComplete {...defaultProps} result={createResult({ wpm: 20, accuracy: 75 })} />);

      expect(screen.getByText('Nice effort!')).toBeTruthy();
      expect(screen.getByText('Practice makes perfect.')).toBeTruthy();
    });
  });

  describe('time formatting', () => {
    it('should format seconds correctly', () => {
      render(<SessionComplete {...defaultProps} result={createResult({ durationMs: 5000 })} />);

      expect(screen.getByText('5.0s')).toBeTruthy();
    });

    it('should format minutes and seconds correctly', () => {
      render(<SessionComplete {...defaultProps} result={createResult({ durationMs: 125000 })} />);

      expect(screen.getByText('2m 5s')).toBeTruthy();
    });

    it('should show decimal for sub-second precision', () => {
      render(<SessionComplete {...defaultProps} result={createResult({ durationMs: 1500 })} />);

      expect(screen.getByText('1.5s')).toBeTruthy();
    });
  });

  describe('navigation links', () => {
    it('should link to specific next challenge when nextChallengeId provided', () => {
      render(<SessionComplete {...defaultProps} nextChallengeId={42} />);

      const link = screen.getByRole('link', { name: /next challenge/i });
      expect(link.getAttribute('href')).toBe('/practice/git-basics/42');
    });

    it('should link to category page when no nextChallengeId', () => {
      render(<SessionComplete {...defaultProps} nextChallengeId={undefined} />);

      const link = screen.getByRole('link', { name: /more challenges/i });
      expect(link.getAttribute('href')).toBe('/practice/git-basics');
    });
  });

  describe('button interactions', () => {
    it('should call onRetry when Try Again is clicked', () => {
      const onRetry = vi.fn();
      render(<SessionComplete {...defaultProps} onRetry={onRetry} />);

      fireEvent.click(screen.getByText('Try Again'));

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Escape key is pressed via button', () => {
      const onClose = vi.fn();
      render(<SessionComplete {...defaultProps} onClose={onClose} />);

      // Press Escape which triggers onClose via keyboard handler
      fireEvent.keyDown(window, { key: 'Escape' });

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('keyboard shortcuts', () => {
    it('should call onRetry when R key is pressed', () => {
      const onRetry = vi.fn();
      render(<SessionComplete {...defaultProps} onRetry={onRetry} />);

      fireEvent.keyDown(window, { key: 'r' });

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry when R key (uppercase) is pressed', () => {
      const onRetry = vi.fn();
      render(<SessionComplete {...defaultProps} onRetry={onRetry} />);

      fireEvent.keyDown(window, { key: 'R' });

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Escape key is pressed', () => {
      const onClose = vi.fn();
      render(<SessionComplete {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not trigger shortcuts when modal is closed', () => {
      const onRetry = vi.fn();
      const onClose = vi.fn();
      render(<SessionComplete {...defaultProps} open={false} onRetry={onRetry} onClose={onClose} />);

      fireEvent.keyDown(window, { key: 'r' });
      fireEvent.keyDown(window, { key: 'Escape' });

      expect(onRetry).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('share progress buttons', () => {
    it('should render share buttons', () => {
      render(<SessionComplete {...defaultProps} />);

      expect(screen.getByText('Share')).toBeTruthy();
      expect(screen.getByText('X')).toBeTruthy();
      expect(screen.getByText('LinkedIn')).toBeTruthy();
    });

    it('should pass category name to share buttons', () => {
      render(<SessionComplete {...defaultProps} categoryName="Git Commands" />);

      const twitterLink = screen.getByLabelText('Share on X (Twitter)');
      const href = twitterLink.getAttribute('href') || '';
      const decodedUrl = decodeURIComponent(href);
      expect(decodedUrl).toContain('practicing Git Commands');
    });
  });

  describe('accessibility', () => {
    it('should have dialog role', () => {
      render(<SessionComplete {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeTruthy();
    });

    it('should have dialog title', () => {
      render(<SessionComplete {...defaultProps} result={createResult({ wpm: 70, accuracy: 99 })} />);

      expect(screen.getByRole('heading', { name: 'Excellent!' })).toBeTruthy();
    });

    it('should have dialog description', () => {
      render(<SessionComplete {...defaultProps} result={createResult({ wpm: 70, accuracy: 99 })} />);

      expect(screen.getByText('Outstanding speed and accuracy!')).toBeTruthy();
    });
  });

  describe('stats display', () => {
    it('should display all four stats', () => {
      const result = createResult({
        wpm: 55,
        accuracy: 92,
        durationMs: 45000,
        errors: 8,
      });
      render(<SessionComplete {...defaultProps} result={result} />);

      expect(screen.getByText('55')).toBeTruthy();
      expect(screen.getByText('92%')).toBeTruthy();
      expect(screen.getByText('45.0s')).toBeTruthy();
      expect(screen.getByText('8')).toBeTruthy();
    });

    it('should handle zero errors', () => {
      render(<SessionComplete {...defaultProps} result={createResult({ errors: 0 })} />);

      expect(screen.getByText('0')).toBeTruthy();
    });

    it('should handle 100% accuracy', () => {
      render(<SessionComplete {...defaultProps} result={createResult({ accuracy: 100 })} />);

      expect(screen.getByText('100%')).toBeTruthy();
    });

    it('should handle high WPM values', () => {
      render(<SessionComplete {...defaultProps} result={createResult({ wpm: 150 })} />);

      expect(screen.getByText('150')).toBeTruthy();
    });
  });

  describe('cleanup', () => {
    it('should remove event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = render(<SessionComplete {...defaultProps} />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });
  });
});
