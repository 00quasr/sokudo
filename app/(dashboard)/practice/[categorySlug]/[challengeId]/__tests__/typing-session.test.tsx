/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock SessionComplete to avoid Radix dialog complexity in tests
vi.mock('@/components/typing/SessionComplete', () => ({
  SessionComplete: ({
    open,
    result,
    categorySlug,
    nextChallengeId,
    onRetry,
    onClose,
  }: {
    open: boolean;
    result: { wpm: number; accuracy: number; durationMs: number; errors: number };
    categorySlug: string;
    nextChallengeId?: number;
    onRetry: () => void;
    onClose: () => void;
  }) => {
    if (!open) return null;
    const nextHref = nextChallengeId
      ? `/practice/${categorySlug}/${nextChallengeId}`
      : `/practice/${categorySlug}`;
    return (
      <div data-testid="session-complete-modal">
        <h2>Great job!</h2>
        <span data-testid="result-wpm">{result.wpm}</span>
        <span>WPM</span>
        <span data-testid="result-accuracy">{result.accuracy}%</span>
        <span>Accuracy</span>
        <span data-testid="result-time">{(result.durationMs / 1000).toFixed(1)}s</span>
        <span>Time</span>
        <span data-testid="result-errors">{result.errors}</span>
        <span>Errors</span>
        <button onClick={onRetry}>Try Again</button>
        <a href={nextHref}>{nextChallengeId ? 'Next Challenge' : 'More Challenges'}</a>
      </div>
    );
  },
}));

// Mock the TypingInput component
const mockOnComplete = vi.fn();
const mockOnSkip = vi.fn();
const mockOnNext = vi.fn();
vi.mock('@/components/typing/TypingInput', () => ({
  TypingInput: ({
    targetText,
    syntaxType,
    onComplete,
    onSkip,
    onNext,
    showStats,
    autoFocus,
  }: {
    targetText: string;
    syntaxType: string;
    onComplete: (stats: unknown, log: unknown[]) => void;
    onSkip?: () => void;
    onNext?: () => void;
    showStats: boolean;
    autoFocus: boolean;
  }) => {
    // Store the callbacks for testing
    mockOnComplete.mockImplementation(onComplete);
    if (onSkip) mockOnSkip.mockImplementation(onSkip);
    if (onNext) mockOnNext.mockImplementation(onNext);
    return (
      <div data-testid="typing-input">
        <span data-testid="target-text">{targetText}</span>
        <span data-testid="syntax-type">{syntaxType}</span>
        <span data-testid="show-stats">{showStats.toString()}</span>
        <span data-testid="auto-focus">{autoFocus.toString()}</span>
        <button
          data-testid="simulate-complete"
          onClick={() =>
            onComplete(
              {
                wpm: 60,
                rawWpm: 65,
                accuracy: 95,
                keystrokes: 50,
                errors: 3,
                durationMs: 5000,
              },
              []
            )
          }
        >
          Complete
        </button>
        <button
          data-testid="simulate-skip"
          onClick={() => onSkip?.()}
        >
          Skip
        </button>
        <button
          data-testid="simulate-next"
          onClick={() => onNext?.()}
        >
          Next
        </button>
      </div>
    );
  },
}));

import { TypingSession } from '../typing-session';
import { Category, Challenge } from '@/lib/db/schema';

type ChallengeWithCategory = Challenge & { category: Category };

const mockCategory: Category = {
  id: 1,
  name: 'Git Basics',
  slug: 'git-basics',
  description: 'Essential git commands',
  icon: 'git-branch',
  difficulty: 'beginner',
  isPremium: false,
  displayOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockChallenge: ChallengeWithCategory = {
  id: 1,
  categoryId: 1,
  content: 'git init',
  difficulty: 'beginner',
  syntaxType: 'bash',
  hint: 'Initialize a new repository',
  avgWpm: 45,
  timesCompleted: 100,
  createdAt: new Date(),
  updatedAt: new Date(),
  category: mockCategory,
};

describe('TypingSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    mockOnSkip.mockClear();
    mockOnNext.mockClear();
  });

  describe('initial render', () => {
    it('should render the TypingInput component', () => {
      render(
        <TypingSession challenge={mockChallenge} categorySlug="git-basics" />
      );

      expect(screen.getByTestId('typing-input')).toBeTruthy();
    });

    it('should pass the challenge content to TypingInput', () => {
      render(
        <TypingSession challenge={mockChallenge} categorySlug="git-basics" />
      );

      expect(screen.getByTestId('target-text').textContent).toBe('git init');
    });

    it('should map bash syntaxType to shell', () => {
      render(
        <TypingSession challenge={mockChallenge} categorySlug="git-basics" />
      );

      expect(screen.getByTestId('syntax-type').textContent).toBe('shell');
    });

    it('should pass showStats as true', () => {
      render(
        <TypingSession challenge={mockChallenge} categorySlug="git-basics" />
      );

      expect(screen.getByTestId('show-stats').textContent).toBe('true');
    });

    it('should pass autoFocus as true', () => {
      render(
        <TypingSession challenge={mockChallenge} categorySlug="git-basics" />
      );

      expect(screen.getByTestId('auto-focus').textContent).toBe('true');
    });
  });

  describe('syntax type mapping', () => {
    it('should map git syntaxType correctly', () => {
      const gitChallenge: ChallengeWithCategory = {
        ...mockChallenge,
        syntaxType: 'git',
      };
      render(
        <TypingSession challenge={gitChallenge} categorySlug="git-basics" />
      );

      expect(screen.getByTestId('syntax-type').textContent).toBe('git');
    });

    it('should map typescript syntaxType correctly', () => {
      const tsChallenge: ChallengeWithCategory = {
        ...mockChallenge,
        syntaxType: 'typescript',
      };
      render(<TypingSession challenge={tsChallenge} categorySlug="typescript" />);

      expect(screen.getByTestId('syntax-type').textContent).toBe('typescript');
    });

    it('should map ts to typescript', () => {
      const tsChallenge: ChallengeWithCategory = {
        ...mockChallenge,
        syntaxType: 'ts',
      };
      render(<TypingSession challenge={tsChallenge} categorySlug="typescript" />);

      expect(screen.getByTestId('syntax-type').textContent).toBe('typescript');
    });

    it('should map terminal to shell', () => {
      const terminalChallenge: ChallengeWithCategory = {
        ...mockChallenge,
        syntaxType: 'terminal',
      };
      render(
        <TypingSession
          challenge={terminalChallenge}
          categorySlug="terminal-commands"
        />
      );

      expect(screen.getByTestId('syntax-type').textContent).toBe('shell');
    });

    it('should map jsx to react', () => {
      const jsxChallenge: ChallengeWithCategory = {
        ...mockChallenge,
        syntaxType: 'jsx',
      };
      render(<TypingSession challenge={jsxChallenge} categorySlug="react" />);

      expect(screen.getByTestId('syntax-type').textContent).toBe('react');
    });

    it('should fallback to plain for unknown types', () => {
      const unknownChallenge: ChallengeWithCategory = {
        ...mockChallenge,
        syntaxType: 'unknown',
      };
      render(
        <TypingSession challenge={unknownChallenge} categorySlug="unknown" />
      );

      expect(screen.getByTestId('syntax-type').textContent).toBe('plain');
    });
  });

  describe('completion flow', () => {
    it('should show modal after completion', async () => {
      render(
        <TypingSession challenge={mockChallenge} categorySlug="git-basics" />
      );

      // Simulate completion
      fireEvent.click(screen.getByTestId('simulate-complete'));

      await waitFor(() => {
        expect(screen.getByTestId('session-complete-modal')).toBeTruthy();
      });
    });

    it('should display WPM stat after completion', async () => {
      render(
        <TypingSession challenge={mockChallenge} categorySlug="git-basics" />
      );

      fireEvent.click(screen.getByTestId('simulate-complete'));

      await waitFor(() => {
        expect(screen.getByTestId('result-wpm').textContent).toBe('60');
        expect(screen.getByText('WPM')).toBeTruthy();
      });
    });

    it('should display accuracy stat after completion', async () => {
      render(
        <TypingSession challenge={mockChallenge} categorySlug="git-basics" />
      );

      fireEvent.click(screen.getByTestId('simulate-complete'));

      await waitFor(() => {
        expect(screen.getByTestId('result-accuracy').textContent).toBe('95%');
        expect(screen.getByText('Accuracy')).toBeTruthy();
      });
    });

    it('should display time stat after completion', async () => {
      render(
        <TypingSession challenge={mockChallenge} categorySlug="git-basics" />
      );

      fireEvent.click(screen.getByTestId('simulate-complete'));

      await waitFor(() => {
        expect(screen.getByTestId('result-time').textContent).toBe('5.0s');
        expect(screen.getByText('Time')).toBeTruthy();
      });
    });

    it('should display errors stat after completion', async () => {
      render(
        <TypingSession challenge={mockChallenge} categorySlug="git-basics" />
      );

      fireEvent.click(screen.getByTestId('simulate-complete'));

      await waitFor(() => {
        expect(screen.getByTestId('result-errors').textContent).toBe('3');
        expect(screen.getByText('Errors')).toBeTruthy();
      });
    });

    it('should show Try Again button after completion', async () => {
      render(
        <TypingSession challenge={mockChallenge} categorySlug="git-basics" />
      );

      fireEvent.click(screen.getByTestId('simulate-complete'));

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeTruthy();
      });
    });

    it('should show More Challenges link when no nextChallengeId', async () => {
      render(
        <TypingSession challenge={mockChallenge} categorySlug="git-basics" />
      );

      fireEvent.click(screen.getByTestId('simulate-complete'));

      await waitFor(() => {
        const link = screen.getByText('More Challenges').closest('a');
        expect(link?.getAttribute('href')).toBe('/practice/git-basics');
      });
    });

    it('should show Next Challenge link when nextChallengeId provided', async () => {
      render(
        <TypingSession
          challenge={mockChallenge}
          categorySlug="git-basics"
          nextChallengeId={5}
        />
      );

      fireEvent.click(screen.getByTestId('simulate-complete'));

      await waitFor(() => {
        const link = screen.getByText('Next Challenge').closest('a');
        expect(link?.getAttribute('href')).toBe('/practice/git-basics/5');
      });
    });
  });

  describe('retry functionality', () => {
    it('should close modal and reset when Try Again is clicked', async () => {
      render(
        <TypingSession challenge={mockChallenge} categorySlug="git-basics" />
      );

      // Complete the challenge
      fireEvent.click(screen.getByTestId('simulate-complete'));

      await waitFor(() => {
        expect(screen.getByTestId('session-complete-modal')).toBeTruthy();
      });

      // Click Try Again
      fireEvent.click(screen.getByText('Try Again'));

      await waitFor(() => {
        expect(screen.getByTestId('typing-input')).toBeTruthy();
        expect(screen.queryByTestId('session-complete-modal')).toBeNull();
      });
    });
  });

  describe('keyboard shortcuts', () => {
    it('should navigate to next challenge when skip is triggered with nextChallengeId', () => {
      render(
        <TypingSession
          challenge={mockChallenge}
          categorySlug="git-basics"
          nextChallengeId={5}
        />
      );

      // Simulate skip via Tab key
      fireEvent.click(screen.getByTestId('simulate-skip'));

      expect(mockPush).toHaveBeenCalledWith('/practice/git-basics/5');
    });

    it('should navigate to category page when skip is triggered without nextChallengeId', () => {
      render(
        <TypingSession challenge={mockChallenge} categorySlug="git-basics" />
      );

      // Simulate skip via Tab key
      fireEvent.click(screen.getByTestId('simulate-skip'));

      expect(mockPush).toHaveBeenCalledWith('/practice/git-basics');
    });

    it('should navigate to next challenge when next is triggered with nextChallengeId', () => {
      render(
        <TypingSession
          challenge={mockChallenge}
          categorySlug="git-basics"
          nextChallengeId={5}
        />
      );

      // Simulate next via Enter key (after completion)
      fireEvent.click(screen.getByTestId('simulate-next'));

      expect(mockPush).toHaveBeenCalledWith('/practice/git-basics/5');
    });

    it('should navigate to category page when next is triggered without nextChallengeId', () => {
      render(
        <TypingSession challenge={mockChallenge} categorySlug="git-basics" />
      );

      // Simulate next via Enter key
      fireEvent.click(screen.getByTestId('simulate-next'));

      expect(mockPush).toHaveBeenCalledWith('/practice/git-basics');
    });
  });
});
