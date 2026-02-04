/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
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
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock the queries module
vi.mock('@/lib/db/queries', () => ({
  getChallengeById: vi.fn(),
  getCategoryBySlug: vi.fn(),
  getNextChallengeInCategory: vi.fn().mockResolvedValue(2),
  getUser: vi.fn().mockResolvedValue(null),
  getUserProfile: vi.fn().mockResolvedValue(null),
}));

// Mock the limits module
vi.mock('@/lib/limits/constants', () => ({
  hasUnlimitedPractice: vi.fn().mockReturnValue(false),
}));

// Mock the RemainingTimeBar component
vi.mock('@/components/limits/RemainingTimeBar', () => ({
  RemainingTimeBar: () => null,
}));

// Mock the TypingSession component to avoid complexity in page tests
vi.mock('../typing-session', () => ({
  TypingSession: ({
    challenge,
    categorySlug,
    nextChallengeId,
  }: {
    challenge: { content: string };
    categorySlug: string;
    nextChallengeId?: number;
  }) => (
    <div data-testid="typing-session">
      <span data-testid="challenge-content">{challenge.content}</span>
      <span data-testid="category-slug">{categorySlug}</span>
      <span data-testid="next-challenge-id">{nextChallengeId ?? 'none'}</span>
    </div>
  ),
}));

import { notFound } from 'next/navigation';
import { getChallengeById } from '@/lib/db/queries';
import ChallengePage from '../page';
import { Category, Challenge } from '@/lib/db/schema';

type ChallengeWithCategory = Challenge & { category: Category };

const mockCategory: Category = {
  id: 1,
  name: 'Git Basics',
  slug: 'git-basics',
  description: 'Essential git commands for version control',
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

describe('ChallengePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the back link to category page', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(mockChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      render(page);

      const backLink = screen.getByText(/Back to Git Basics/i).closest('a');
      expect(backLink?.getAttribute('href')).toBe('/practice/git-basics');
    });

    it('should render the challenge number', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(mockChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      render(page);

      expect(screen.getByText('Challenge #1')).toBeTruthy();
    });

    it('should render the category name', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(mockChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      render(page);

      expect(screen.getByText('Git Basics')).toBeTruthy();
    });

    it('should render the difficulty badge', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(mockChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      render(page);

      expect(screen.getByText('beginner')).toBeTruthy();
    });

    it('should render the hint when available', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(mockChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      render(page);

      expect(screen.getByText('Initialize a new repository')).toBeTruthy();
    });

    it('should not render hint when not available', async () => {
      const challengeWithoutHint: ChallengeWithCategory = {
        ...mockChallenge,
        hint: null,
      };
      vi.mocked(getChallengeById).mockResolvedValue(challengeWithoutHint);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      render(page);

      expect(screen.queryByText('Initialize a new repository')).toBeNull();
    });

    it('should render the TypingSession component with correct props', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(mockChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      render(page);

      expect(screen.getByTestId('typing-session')).toBeTruthy();
      expect(screen.getByTestId('challenge-content').textContent).toBe('git init');
      expect(screen.getByTestId('category-slug').textContent).toBe('git-basics');
    });

    it('should render keyboard shortcuts hint', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(mockChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      render(page);

      expect(screen.getByText('Esc')).toBeTruthy();
      expect(screen.getByText('Restart')).toBeTruthy();
      expect(screen.getByText('Tab')).toBeTruthy();
      expect(screen.getByText('Skip')).toBeTruthy();
      expect(screen.getByText('Enter')).toBeTruthy();
      expect(screen.getByText('Next')).toBeTruthy();
    });
  });

  describe('not found cases', () => {
    it('should call notFound when challengeId is not a valid number', async () => {
      vi.mocked(notFound).mockImplementation(() => {
        throw new Error('NEXT_NOT_FOUND');
      });

      await expect(
        ChallengePage({
          params: Promise.resolve({ categorySlug: 'git-basics', challengeId: 'invalid' }),
        })
      ).rejects.toThrow('NEXT_NOT_FOUND');

      expect(notFound).toHaveBeenCalled();
    });

    it('should call notFound when challenge does not exist', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(undefined);
      vi.mocked(notFound).mockImplementation(() => {
        throw new Error('NEXT_NOT_FOUND');
      });

      await expect(
        ChallengePage({
          params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '999' }),
        })
      ).rejects.toThrow('NEXT_NOT_FOUND');

      expect(notFound).toHaveBeenCalled();
    });

    it('should call notFound when challenge belongs to different category', async () => {
      const challengeWrongCategory: ChallengeWithCategory = {
        ...mockChallenge,
        category: {
          ...mockCategory,
          slug: 'docker-basics',
        },
      };
      vi.mocked(getChallengeById).mockResolvedValue(challengeWrongCategory);
      vi.mocked(notFound).mockImplementation(() => {
        throw new Error('NEXT_NOT_FOUND');
      });

      await expect(
        ChallengePage({
          params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
        })
      ).rejects.toThrow('NEXT_NOT_FOUND');

      expect(notFound).toHaveBeenCalled();
    });
  });

  describe('different difficulty levels', () => {
    it('should render intermediate difficulty', async () => {
      const intermediateChallenge: ChallengeWithCategory = {
        ...mockChallenge,
        difficulty: 'intermediate',
      };
      vi.mocked(getChallengeById).mockResolvedValue(intermediateChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      render(page);

      expect(screen.getByText('intermediate')).toBeTruthy();
    });

    it('should render advanced difficulty', async () => {
      const advancedChallenge: ChallengeWithCategory = {
        ...mockChallenge,
        difficulty: 'advanced',
      };
      vi.mocked(getChallengeById).mockResolvedValue(advancedChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      render(page);

      expect(screen.getByText('advanced')).toBeTruthy();
    });
  });
});
