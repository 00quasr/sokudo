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
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => <a href={href} className={className}>{children}</a>,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
  redirect: vi.fn(),
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
  getChallengePosition: vi.fn().mockResolvedValue({ position: 1, total: 10 }),
  getUser: vi.fn().mockResolvedValue(null),
  getUserProfile: vi.fn().mockResolvedValue(null),
}));

// Mock the limits module
vi.mock('@/lib/limits/constants', () => ({
  hasUnlimitedPractice: vi.fn().mockReturnValue(false),
  canAccessPremiumCategories: vi.fn().mockReturnValue(false),
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

describe('ChallengePage Mobile Responsiveness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('responsive layout classes', () => {
    it('should have safe-area padding classes on main element', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(mockChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      const { container } = render(page);

      const mainElement = container.querySelector('main');
      expect(mainElement).toBeTruthy();
      expect(mainElement?.className).toMatch(/pb-safe/);
    });

    it('should have safe-area padding on header', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(mockChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      const { container } = render(page);

      const headerElement = container.querySelector('header');
      expect(headerElement).toBeTruthy();
      expect(headerElement?.className).toMatch(/safe-top/);
    });

    it('should have responsive padding on main content area', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(mockChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      const { container } = render(page);

      // Find the main typing area container
      const mainContent = container.querySelector('.max-w-4xl');
      expect(mainContent).toBeTruthy();
      // Check for mobile-friendly padding (px-3 for mobile, px-6 for larger screens)
      expect(mainContent?.className).toMatch(/px-3|sm:px-6/);
    });

    it('should hide keyboard shortcuts on mobile', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(mockChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      const { container } = render(page);

      // Find the navigation hint section (the parent div should have the hidden class)
      const navHintSection = Array.from(container.querySelectorAll('div')).find((div) =>
        div.className?.includes('hidden') && div.className?.includes('md:block') &&
        div.textContent?.includes('Restart')
      );

      expect(navHintSection).toBeTruthy();
      // Should have hidden class for mobile (hidden md:block)
      expect(navHintSection?.className).toMatch(/hidden/);
      expect(navHintSection?.className).toMatch(/md:block/);
    });
  });

  describe('header responsiveness', () => {
    it('should have responsive padding in header container', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(mockChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      const { container } = render(page);

      const headerContainer = container.querySelector('header > div');
      expect(headerContainer).toBeTruthy();
      expect(headerContainer?.className).toMatch(/px-4|sm:px-6|lg:px-8/);
      expect(headerContainer?.className).toMatch(/py-3|sm:py-4/);
    });

    it('should show abbreviated back text on mobile', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(mockChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      render(page);

      // Check for full and abbreviated versions
      const backLinkFull = screen.queryByText(/Back to Git Basics/i);
      const backLinkShort = screen.queryByText(/^Back$/i);

      expect(backLinkFull).toBeTruthy();
      expect(backLinkShort).toBeTruthy();
    });

    it('should have responsive icon sizes', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(mockChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      const { container } = render(page);

      // Find the ArrowLeft icon (lucide icons have specific classes)
      const icon = container.querySelector('svg');
      expect(icon).toBeTruthy();
      // SVG icons have className as an object (SVGAnimatedString), convert to string
      const iconClass = icon?.className?.baseVal || icon?.getAttribute('class') || '';
      expect(iconClass).toBeTruthy();
    });
  });

  describe('challenge info responsiveness', () => {
    it('should have responsive spacing for challenge info', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(mockChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      const { container } = render(page);

      // Find challenge info section
      const challengeInfo = Array.from(container.querySelectorAll('div')).find((div) =>
        div.className?.includes('mb-4') || div.className?.includes('sm:mb-6')
      );

      expect(challengeInfo).toBeTruthy();
    });

    it('should have responsive text sizes for hint', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(mockChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      render(page);

      const hint = screen.getByText('Initialize a new repository');
      expect(hint.className).toMatch(/text-xs|sm:text-sm/);
    });

    it('should have responsive gap for category and difficulty badge', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(mockChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      const { container } = render(page);

      const categoryInfo = Array.from(container.querySelectorAll('div')).find((div) =>
        div.className?.includes('flex-wrap') && div.textContent?.includes('Git Basics')
      );

      expect(categoryInfo).toBeTruthy();
      expect(categoryInfo?.className).toMatch(/gap-2|sm:gap-3/);
    });
  });

  describe('touch-friendly targets', () => {
    it('should render back link as touch-friendly', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(mockChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      render(page);

      const backLink = screen.getByText(/Back to Git Basics/i).closest('a');
      expect(backLink).toBeTruthy();
      // Should have proper gap for touch targets (gap-1.5 sm:gap-2)
      expect(backLink?.className).toMatch(/gap/);
      expect(backLink?.className).toMatch(/inline-flex/);
    });

    it('should have responsive font sizes for better readability', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(mockChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      render(page);

      const challengeNumber = screen.getByText('Challenge #1');
      expect(challengeNumber.className).toMatch(/text-xs|sm:text-sm/);
    });
  });

  describe('viewport handling', () => {
    it('should use mobile-friendly padding in main container', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(mockChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      const { container } = render(page);

      // Find the main content container (either header or typing area container)
      const mainContainers = container.querySelectorAll('.max-w-4xl');
      expect(mainContainers.length).toBeGreaterThan(0);

      // Check that at least one container has responsive padding
      const hasResponsivePadding = Array.from(mainContainers).some((el) =>
        el.className?.includes('px-3') || el.className?.includes('px-4')
      );
      expect(hasResponsivePadding).toBe(true);
    });

    it('should constrain max width for optimal reading', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(mockChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      const { container } = render(page);

      const mainContainer = container.querySelector('.max-w-4xl');
      expect(mainContainer).toBeTruthy();
      expect(mainContainer?.className).toMatch(/max-w-4xl/);
      expect(mainContainer?.className).toMatch(/mx-auto/);
    });
  });

  describe('keyboard shortcuts section', () => {
    it('should not be visible on mobile screens', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(mockChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      const { container } = render(page);

      // Find the keyboard shortcuts section (should have hidden md:block classes)
      const keyboardSection = Array.from(container.querySelectorAll('div')).find((div) =>
        div.className?.includes('hidden') && div.className?.includes('md:block') &&
        div.textContent?.includes('Restart')
      );

      expect(keyboardSection).toBeTruthy();
      // Should be hidden on mobile, visible on medium screens and up
      expect(keyboardSection?.className).toMatch(/hidden/);
      expect(keyboardSection?.className).toMatch(/md:block/);
    });

    it('should have responsive layout when visible', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(mockChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      const { container } = render(page);

      const navHintSection = Array.from(container.querySelectorAll('div')).find((div) =>
        div.className?.includes('hidden') && div.className?.includes('md:block') &&
        div.textContent?.includes('Restart')
      );

      expect(navHintSection).toBeTruthy();
      // Should have responsive flex layout inside
      const flexContainer = navHintSection?.querySelector('.flex');
      expect(flexContainer).toBeTruthy();
    });
  });

  describe('accessibility on mobile', () => {
    it('should maintain semantic HTML structure', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(mockChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      const { container } = render(page);

      const main = container.querySelector('main');
      const header = container.querySelector('header');

      expect(main).toBeTruthy();
      expect(header).toBeTruthy();
    });

    it('should have proper link structure for navigation', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(mockChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      render(page);

      const backLink = screen.getByText(/Back to Git Basics/i).closest('a');
      expect(backLink).toBeTruthy();
      expect(backLink?.getAttribute('href')).toBe('/practice/git-basics');
    });

    it('should maintain readable text sizes on mobile', async () => {
      vi.mocked(getChallengeById).mockResolvedValue(mockChallenge);

      const page = await ChallengePage({
        params: Promise.resolve({ categorySlug: 'git-basics', challengeId: '1' }),
      });
      const { container } = render(page);

      // Check for minimum text sizes (text-xs is the smallest used)
      const textElements = container.querySelectorAll('[class*="text-"]');
      expect(textElements.length).toBeGreaterThan(0);

      // Verify no text is smaller than text-xs
      textElements.forEach((element) => {
        const className = element.className;
        // Should not have text-[8px] or similar very small sizes
        expect(className).not.toMatch(/text-\[8px\]/);
        expect(className).not.toMatch(/text-\[9px\]/);
      });
    });
  });
});
