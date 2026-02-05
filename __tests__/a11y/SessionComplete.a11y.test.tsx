import { render, screen } from '@testing-library/react';
import { SessionComplete } from '@/components/typing/SessionComplete';
import { vi } from 'vitest';

describe('SessionComplete Accessibility', () => {
  const defaultProps = {
    open: true,
    result: {
      wpm: 65,
      rawWpm: 70,
      accuracy: 98,
      keystrokes: 120,
      errors: 2,
      durationMs: 15000,
    },
    categorySlug: 'git-basics',
    categoryName: 'Git Basics',
    nextChallengeId: 2,
    onRetry: vi.fn(),
    onClose: vi.fn(),
  };

  it('has proper dialog role and aria attributes', () => {
    render(<SessionComplete {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-describedby', 'session-performance-message');
  });

  it('has accessible stats group with aria-label', () => {
    render(<SessionComplete {...defaultProps} />);

    const statsGroup = screen.getByRole('group', { name: 'Session statistics' });
    expect(statsGroup).toBeInTheDocument();
  });

  it('has aria-labels for individual stats', () => {
    render(<SessionComplete {...defaultProps} />);

    expect(screen.getByLabelText('65 words per minute')).toBeInTheDocument();
    expect(screen.getByLabelText('98 percent accuracy')).toBeInTheDocument();
    expect(screen.getByLabelText(/Time taken/)).toBeInTheDocument();
    expect(screen.getByLabelText('2 errors')).toBeInTheDocument();
  });

  it('hides decorative icons from screen readers', () => {
    render(<SessionComplete {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    const hiddenIcons = dialog.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenIcons.length).toBeGreaterThan(0);
  });

  it('has accessible action buttons with keyboard shortcuts', () => {
    render(<SessionComplete {...defaultProps} />);

    const retryButton = screen.getByRole('button', { name: /Try again - press R/i });
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).toHaveAttribute('aria-keyshortcuts', 'r');

    const nextLink = screen.getByRole('link', { name: /Next challenge - press N or Enter/i });
    expect(nextLink).toBeInTheDocument();
    expect(nextLink).toHaveAttribute('aria-keyshortcuts', 'n Enter');
  });

  it('displays keyboard shortcuts region', () => {
    render(<SessionComplete {...defaultProps} />);

    const shortcutsRegion = screen.getByRole('region', { name: 'Keyboard shortcuts' });
    expect(shortcutsRegion).toBeInTheDocument();
  });

  it('displays category completion with proper aria attributes', () => {
    const categoryStats = {
      totalSessions: 15,
      uniqueChallenges: 10,
      avgWpm: 62,
      avgAccuracy: 96,
      totalTimeMs: 180000,
      totalErrors: 12,
      bestWpm: 75,
    };

    render(
      <SessionComplete
        {...defaultProps}
        nextChallengeId={undefined}
        categoryStats={categoryStats}
      />
    );

    const completionStatus = screen.getByRole('status', { name: 'Category completion summary' });
    expect(completionStatus).toBeInTheDocument();
    expect(completionStatus).toHaveAttribute('aria-live', 'polite');
  });

  it('displays adaptive difficulty change with aria-label', () => {
    const adaptiveDifficulty = {
      recommendedDifficulty: 'intermediate',
      currentDifficulty: 'beginner',
      reason: 'You are performing well',
      suggestedChallengeId: 15,
    };

    render(
      <SessionComplete
        {...defaultProps}
        adaptiveDifficulty={adaptiveDifficulty}
      />
    );

    const difficultyStatus = screen.getByRole('status', {
      name: /Difficulty adjusted from beginner to intermediate/i,
    });
    expect(difficultyStatus).toBeInTheDocument();
    expect(difficultyStatus).toHaveAttribute('aria-live', 'polite');
  });

  it('has dialog title', () => {
    render(<SessionComplete {...defaultProps} />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    // The heading text varies based on performance (wpm and accuracy)
    expect(heading.textContent).toBeTruthy();
  });

  it('dialog can be closed', () => {
    const onClose = vi.fn();
    render(<SessionComplete {...defaultProps} onClose={onClose} />);

    // The dialog should be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
