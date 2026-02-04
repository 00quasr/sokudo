/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChallengeCard } from '../ChallengeCard';
import { Challenge } from '@/lib/db/schema';

const createMockChallenge = (overrides: Partial<Challenge> = {}): Challenge => ({
  id: 1,
  categoryId: 1,
  content: 'git commit -m "test"',
  difficulty: 'beginner',
  syntaxType: 'git',
  hint: 'Stage your changes first',
  avgWpm: 45,
  timesCompleted: 10,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('ChallengeCard', () => {
  describe('rendering', () => {
    it('should render the challenge content as a preview', () => {
      const challenge = createMockChallenge();
      render(<ChallengeCard challenge={challenge} categorySlug="git-basics" />);

      expect(screen.getByText('git commit -m "test"')).toBeTruthy();
    });

    it('should render the hint when provided', () => {
      const challenge = createMockChallenge({ hint: 'Stage your changes first' });
      render(<ChallengeCard challenge={challenge} categorySlug="git-basics" />);

      expect(screen.getByText('Stage your changes first')).toBeTruthy();
    });

    it('should not render hint section when hint is null', () => {
      const challenge = createMockChallenge({ hint: null });
      render(<ChallengeCard challenge={challenge} categorySlug="git-basics" />);

      expect(screen.queryByText('Stage your changes first')).toBeNull();
    });

    it('should render the index when provided', () => {
      const challenge = createMockChallenge();
      render(<ChallengeCard challenge={challenge} categorySlug="git-basics" index={0} />);

      expect(screen.getByText('1')).toBeTruthy();
    });

    it('should not render index when not provided', () => {
      const challenge = createMockChallenge();
      render(<ChallengeCard challenge={challenge} categorySlug="git-basics" />);

      // Index number should not be present
      expect(screen.queryByText('1')).toBeNull();
    });

    it('should render correct index for various values', () => {
      const challenge = createMockChallenge();
      render(<ChallengeCard challenge={challenge} categorySlug="git-basics" index={4} />);

      expect(screen.getByText('5')).toBeTruthy();
    });
  });

  describe('difficulty badge', () => {
    it('should render beginner difficulty with green styling', () => {
      const challenge = createMockChallenge({ difficulty: 'beginner' });
      render(<ChallengeCard challenge={challenge} categorySlug="git-basics" />);

      const badge = screen.getByText('beginner');
      expect(badge.className).toContain('bg-green-100');
      expect(badge.className).toContain('text-green-800');
    });

    it('should render intermediate difficulty with yellow styling', () => {
      const challenge = createMockChallenge({ difficulty: 'intermediate' });
      render(<ChallengeCard challenge={challenge} categorySlug="git-basics" />);

      const badge = screen.getByText('intermediate');
      expect(badge.className).toContain('bg-yellow-100');
      expect(badge.className).toContain('text-yellow-800');
    });

    it('should render advanced difficulty with red styling', () => {
      const challenge = createMockChallenge({ difficulty: 'advanced' });
      render(<ChallengeCard challenge={challenge} categorySlug="git-basics" />);

      const badge = screen.getByText('advanced');
      expect(badge.className).toContain('bg-red-100');
      expect(badge.className).toContain('text-red-800');
    });

    it('should default to beginner styling for unknown difficulty', () => {
      const challenge = createMockChallenge({ difficulty: 'unknown' });
      render(<ChallengeCard challenge={challenge} categorySlug="git-basics" />);

      const badge = screen.getByText('unknown');
      expect(badge.className).toContain('bg-green-100');
      expect(badge.className).toContain('text-green-800');
    });
  });

  describe('average WPM display', () => {
    it('should display avg WPM when greater than 0', () => {
      const challenge = createMockChallenge({ avgWpm: 45 });
      render(<ChallengeCard challenge={challenge} categorySlug="git-basics" />);

      expect(screen.getByText('45 WPM')).toBeTruthy();
    });

    it('should not display avg WPM when 0', () => {
      const challenge = createMockChallenge({ avgWpm: 0 });
      render(<ChallengeCard challenge={challenge} categorySlug="git-basics" />);

      expect(screen.queryByText('0 WPM')).toBeNull();
    });

    it('should display high WPM values', () => {
      const challenge = createMockChallenge({ avgWpm: 120 });
      render(<ChallengeCard challenge={challenge} categorySlug="git-basics" />);

      expect(screen.getByText('120 WPM')).toBeTruthy();
    });
  });

  describe('link navigation', () => {
    it('should link to the correct practice URL', () => {
      const challenge = createMockChallenge({ id: 42 });
      render(<ChallengeCard challenge={challenge} categorySlug="docker-commands" />);

      const link = screen.getByRole('link');
      expect(link.getAttribute('href')).toBe('/practice/docker-commands/42');
    });

    it('should handle different category slugs', () => {
      const challenge = createMockChallenge({ id: 7 });
      render(<ChallengeCard challenge={challenge} categorySlug="react-patterns" />);

      const link = screen.getByRole('link');
      expect(link.getAttribute('href')).toBe('/practice/react-patterns/7');
    });
  });

  describe('styling', () => {
    it('should apply custom className', () => {
      const challenge = createMockChallenge();
      const { container } = render(
        <ChallengeCard
          challenge={challenge}
          categorySlug="git-basics"
          className="custom-class"
        />
      );

      const link = container.querySelector('a');
      expect(link?.className).toContain('custom-class');
    });

    it('should have base styling classes', () => {
      const challenge = createMockChallenge();
      const { container } = render(
        <ChallengeCard challenge={challenge} categorySlug="git-basics" />
      );

      const link = container.querySelector('a');
      expect(link?.className).toContain('rounded-lg');
      expect(link?.className).toContain('border');
      expect(link?.className).toContain('border-gray-200');
      expect(link?.className).toContain('bg-white');
    });

    it('should have hover styling classes', () => {
      const challenge = createMockChallenge();
      const { container } = render(
        <ChallengeCard challenge={challenge} categorySlug="git-basics" />
      );

      const link = container.querySelector('a');
      expect(link?.className).toContain('hover:border-orange-300');
      expect(link?.className).toContain('hover:shadow-md');
    });

    it('should use monospace font for content', () => {
      const challenge = createMockChallenge({ content: 'git status' });
      render(<ChallengeCard challenge={challenge} categorySlug="git-basics" />);

      const content = screen.getByText('git status');
      expect(content.className).toContain('font-mono');
    });
  });

  describe('content truncation', () => {
    it('should have line-clamp class for content', () => {
      const challenge = createMockChallenge({
        content: 'This is a very long command that might overflow the card container',
      });
      render(<ChallengeCard challenge={challenge} categorySlug="git-basics" />);

      const content = screen.getByText(
        'This is a very long command that might overflow the card container'
      );
      expect(content.className).toContain('line-clamp-1');
    });

    it('should have line-clamp class for hint', () => {
      const challenge = createMockChallenge({
        hint: 'This is a very long hint that provides detailed information about the challenge',
      });
      render(<ChallengeCard challenge={challenge} categorySlug="git-basics" />);

      const hint = screen.getByText(
        'This is a very long hint that provides detailed information about the challenge'
      );
      expect(hint.className).toContain('line-clamp-1');
    });
  });

  describe('icons', () => {
    it('should render chevron right icon', () => {
      const challenge = createMockChallenge();
      const { container } = render(
        <ChallengeCard challenge={challenge} categorySlug="git-basics" />
      );

      // ChevronRight icon should be present
      const chevron = container.querySelector('svg.lucide-chevron-right');
      expect(chevron).toBeTruthy();
    });

    it('should render gauge icon when avgWpm > 0', () => {
      const challenge = createMockChallenge({ avgWpm: 50 });
      const { container } = render(
        <ChallengeCard challenge={challenge} categorySlug="git-basics" />
      );

      // Gauge icon should be present
      const gauge = container.querySelector('svg.lucide-gauge');
      expect(gauge).toBeTruthy();
    });

    it('should not render gauge icon when avgWpm is 0', () => {
      const challenge = createMockChallenge({ avgWpm: 0 });
      const { container } = render(
        <ChallengeCard challenge={challenge} categorySlug="git-basics" />
      );

      // Gauge icon should not be present
      const gauge = container.querySelector('svg.lucide-gauge');
      expect(gauge).toBeNull();
    });
  });
});
