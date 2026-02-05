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

// Mock the queries module
vi.mock('@/lib/db/queries', () => ({
  getCategories: vi.fn(),
  getUser: vi.fn(),
  getUserProfile: vi.fn(),
  getUserStatsOverview: vi.fn(),
  getCategoryPerformance: vi.fn(),
  getRecentSessionsForAdaptive: vi.fn(),
  getKeyAccuracyForUser: vi.fn(),
  getCharErrorPatternsForUser: vi.fn(),
  getProblemSequences: vi.fn(),
}));

// Mock the limits module
vi.mock('@/lib/limits/constants', () => ({
  canAccessPremiumCategories: vi.fn(),
  hasUnlimitedPractice: vi.fn(),
}));

// Mock the RemainingTimeBar component (it uses SWR which needs separate mocking)
vi.mock('@/components/limits/RemainingTimeBar', () => ({
  RemainingTimeBar: () => null,
}));

// Mock PracticeRecommendations component
vi.mock('@/components/practice/PracticeRecommendations', () => ({
  PracticeRecommendations: () => null,
}));

// Mock recommendations and weakness analysis
vi.mock('@/lib/practice/recommendations', () => ({
  generateRecommendations: vi.fn(() => []),
}));

vi.mock('@/lib/weakness/analyze', () => ({
  analyzeWeaknesses: vi.fn(() => null),
}));

import {
  getCategories,
  getUser,
  getUserProfile,
  getUserStatsOverview,
  getCategoryPerformance,
  getRecentSessionsForAdaptive,
  getKeyAccuracyForUser,
  getCharErrorPatternsForUser,
  getProblemSequences,
} from '@/lib/db/queries';
import { canAccessPremiumCategories, hasUnlimitedPractice } from '@/lib/limits/constants';
import PracticePage from '../page';
import { Category } from '@/lib/db/schema';

const mockCategories: Category[] = [
  {
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
  },
  {
    id: 2,
    name: 'Terminal Commands',
    slug: 'terminal-commands',
    description: 'Common terminal and shell commands',
    icon: 'terminal',
    difficulty: 'beginner',
    isPremium: false,
    displayOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    name: 'React Patterns',
    slug: 'react-patterns',
    description: 'Common React component patterns and hooks',
    icon: 'code',
    difficulty: 'intermediate',
    isPremium: true,
    displayOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 4,
    name: 'Docker',
    slug: 'docker',
    description: 'Docker commands and Dockerfile patterns',
    icon: 'container',
    difficulty: 'advanced',
    isPremium: true,
    displayOrder: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@test.com',
  passwordHash: 'hash',
  role: 'member',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockFreeProfile = {
  id: 1,
  userId: 1,
  subscriptionTier: 'free',
  currentStreak: 0,
  longestStreak: 0,
  totalPracticeTimeMs: 0,
  preferences: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockProProfile = {
  ...mockFreeProfile,
  subscriptionTier: 'pro',
};

describe('PracticePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: logged in free user
    vi.mocked(getUser).mockResolvedValue(mockUser);
    vi.mocked(getUserProfile).mockResolvedValue(mockFreeProfile);
    vi.mocked(canAccessPremiumCategories).mockReturnValue(false);
    vi.mocked(hasUnlimitedPractice).mockReturnValue(false);

    // Mock additional functions for recommendations
    vi.mocked(getUserStatsOverview).mockResolvedValue({
      totalSessions: 10,
      avgWpm: 45,
      avgAccuracy: 95,
      bestWpm: 60,
    });
    vi.mocked(getCategoryPerformance).mockResolvedValue([]);
    vi.mocked(getRecentSessionsForAdaptive).mockResolvedValue([]);
    vi.mocked(getKeyAccuracyForUser).mockResolvedValue([]);
    vi.mocked(getCharErrorPatternsForUser).mockResolvedValue([]);
    vi.mocked(getProblemSequences).mockResolvedValue([]);
  });

  describe('rendering', () => {
    it('should render the page title', async () => {
      vi.mocked(getCategories).mockResolvedValue(mockCategories);

      const page = await PracticePage();
      render(page);

      expect(screen.getByText('Choose a Category')).toBeTruthy();
    });

    it('should render the page description', async () => {
      vi.mocked(getCategories).mockResolvedValue(mockCategories);

      const page = await PracticePage();
      render(page);

      expect(
        screen.getByText(
          'Build muscle memory for commands and patterns you use every day'
        )
      ).toBeTruthy();
    });

    it('should render free categories section', async () => {
      vi.mocked(getCategories).mockResolvedValue(mockCategories);

      const page = await PracticePage();
      render(page);

      expect(screen.getByRole('heading', { name: 'Free', level: 2 })).toBeTruthy();
    });

    it('should render pro categories section', async () => {
      vi.mocked(getCategories).mockResolvedValue(mockCategories);

      const page = await PracticePage();
      render(page);

      expect(screen.getByRole('heading', { name: 'Pro', level: 2 })).toBeTruthy();
    });
  });

  describe('category cards', () => {
    it('should render all category names', async () => {
      vi.mocked(getCategories).mockResolvedValue(mockCategories);

      const page = await PracticePage();
      render(page);

      expect(screen.getByText('Git Basics')).toBeTruthy();
      expect(screen.getByText('Terminal Commands')).toBeTruthy();
      expect(screen.getByText('React Patterns')).toBeTruthy();
      expect(screen.getByText('Docker')).toBeTruthy();
    });

    it('should render category descriptions', async () => {
      vi.mocked(getCategories).mockResolvedValue(mockCategories);

      const page = await PracticePage();
      render(page);

      expect(
        screen.getByText('Essential git commands for version control')
      ).toBeTruthy();
      expect(
        screen.getByText('Common terminal and shell commands')
      ).toBeTruthy();
    });

    it('should render difficulty badges', async () => {
      vi.mocked(getCategories).mockResolvedValue(mockCategories);

      const page = await PracticePage();
      render(page);

      const beginnerBadges = screen.getAllByText('beginner');
      expect(beginnerBadges.length).toBe(2);

      expect(screen.getByText('intermediate')).toBeTruthy();
      expect(screen.getByText('advanced')).toBeTruthy();
    });

    it('should render Pro badges for premium categories', async () => {
      vi.mocked(getCategories).mockResolvedValue(mockCategories);

      const page = await PracticePage();
      const { container } = render(page);

      // Pro badges are in spans with specific styling, exclude the h2 section header
      const proBadges = container.querySelectorAll('span:not(h2)');
      const proBadgeCount = Array.from(proBadges).filter(
        (el) => el.textContent === 'Pro'
      ).length;
      expect(proBadgeCount).toBe(2);
    });

    it('should link free categories to correct practice paths', async () => {
      vi.mocked(getCategories).mockResolvedValue(mockCategories);

      const page = await PracticePage();
      render(page);

      const gitBasicsLink = screen
        .getByText('Git Basics')
        .closest('a');
      expect(gitBasicsLink?.getAttribute('href')).toBe('/practice/git-basics');

      const terminalLink = screen.getByText('Terminal Commands').closest('a');
      expect(terminalLink?.getAttribute('href')).toBe('/practice/terminal-commands');
    });
  });

  describe('category separation', () => {
    it('should separate free and premium categories correctly', async () => {
      vi.mocked(getCategories).mockResolvedValue(mockCategories);

      const page = await PracticePage();
      render(page);

      // Free categories: Git Basics, Terminal Commands
      // Premium categories: React Patterns, Docker
      // Use getByRole to find section headers (h2)
      const freeHeader = screen.getByRole('heading', { name: 'Free', level: 2 });
      const proHeader = screen.getByRole('heading', { name: 'Pro', level: 2 });

      expect(freeHeader).toBeTruthy();
      expect(proHeader).toBeTruthy();
    });

    it('should not render free section when no free categories', async () => {
      const premiumOnly = mockCategories.filter((c) => c.isPremium);
      vi.mocked(getCategories).mockResolvedValue(premiumOnly);

      const page = await PracticePage();
      render(page);

      expect(screen.queryByRole('heading', { name: 'Free', level: 2 })).toBeNull();
      expect(screen.getByRole('heading', { name: 'Pro', level: 2 })).toBeTruthy();
    });

    it('should not render pro section when no premium categories', async () => {
      const freeOnly = mockCategories.filter((c) => !c.isPremium);
      vi.mocked(getCategories).mockResolvedValue(freeOnly);

      const page = await PracticePage();
      render(page);

      expect(screen.getByRole('heading', { name: 'Free', level: 2 })).toBeTruthy();
      expect(screen.queryByRole('heading', { name: 'Pro', level: 2 })).toBeNull();
    });
  });

  describe('empty state', () => {
    it('should show empty message when no categories', async () => {
      vi.mocked(getCategories).mockResolvedValue([]);

      const page = await PracticePage();
      render(page);

      expect(screen.getByText('No categories available yet.')).toBeTruthy();
    });

    it('should not show section headers when no categories', async () => {
      vi.mocked(getCategories).mockResolvedValue([]);

      const page = await PracticePage();
      render(page);

      expect(screen.queryByRole('heading', { name: 'Free', level: 2 })).toBeNull();
      expect(screen.queryByRole('heading', { name: 'Pro', level: 2 })).toBeNull();
    });
  });

  describe('difficulty styling', () => {
    it('should apply green styling to beginner difficulty', async () => {
      const beginnerOnly: Category[] = [
        {
          id: 1,
          name: 'Beginner Category',
          slug: 'beginner',
          description: 'Test',
          icon: 'code',
          difficulty: 'beginner',
          isPremium: false,
          displayOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      vi.mocked(getCategories).mockResolvedValue(beginnerOnly);

      const page = await PracticePage();
      render(page);

      const badge = screen.getByText('beginner');
      expect(badge.className).toContain('bg-green-100');
      expect(badge.className).toContain('text-green-800');
    });

    it('should apply yellow styling to intermediate difficulty', async () => {
      const intermediateOnly: Category[] = [
        {
          id: 1,
          name: 'Intermediate Category',
          slug: 'intermediate',
          description: 'Test',
          icon: 'code',
          difficulty: 'intermediate',
          isPremium: false,
          displayOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      vi.mocked(getCategories).mockResolvedValue(intermediateOnly);

      const page = await PracticePage();
      render(page);

      const badge = screen.getByText('intermediate');
      expect(badge.className).toContain('bg-yellow-100');
      expect(badge.className).toContain('text-yellow-800');
    });

    it('should apply red styling to advanced difficulty', async () => {
      const advancedOnly: Category[] = [
        {
          id: 1,
          name: 'Advanced Category',
          slug: 'advanced',
          description: 'Test',
          icon: 'code',
          difficulty: 'advanced',
          isPremium: false,
          displayOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      vi.mocked(getCategories).mockResolvedValue(advancedOnly);

      const page = await PracticePage();
      render(page);

      const badge = screen.getByText('advanced');
      expect(badge.className).toContain('bg-red-100');
      expect(badge.className).toContain('text-red-800');
    });
  });

  describe('icon mapping', () => {
    it('should render icons for categories with known icons', async () => {
      vi.mocked(getCategories).mockResolvedValue(mockCategories);

      const page = await PracticePage();
      const { container } = render(page);

      // Check that SVG icons are rendered (lucide icons render as SVGs)
      const svgIcons = container.querySelectorAll('svg');
      expect(svgIcons.length).toBeGreaterThan(0);
    });

    it('should fallback to Code icon for unknown icon names', async () => {
      const unknownIcon: Category[] = [
        {
          id: 1,
          name: 'Unknown Icon',
          slug: 'unknown',
          description: 'Test',
          icon: 'unknown-icon-name',
          difficulty: 'beginner',
          isPremium: false,
          displayOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      vi.mocked(getCategories).mockResolvedValue(unknownIcon);

      const page = await PracticePage();
      const { container } = render(page);

      // Should still render an icon (fallback to Code)
      const svgIcons = container.querySelectorAll('svg');
      expect(svgIcons.length).toBeGreaterThan(0);
    });

    it('should fallback to Code icon when icon is null', async () => {
      const nullIcon: Category[] = [
        {
          id: 1,
          name: 'Null Icon',
          slug: 'null-icon',
          description: 'Test',
          icon: null,
          difficulty: 'beginner',
          isPremium: false,
          displayOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      vi.mocked(getCategories).mockResolvedValue(nullIcon);

      const page = await PracticePage();
      const { container } = render(page);

      // Should still render an icon (fallback to Code)
      const svgIcons = container.querySelectorAll('svg');
      expect(svgIcons.length).toBeGreaterThan(0);
    });
  });

  describe('premium category locking', () => {
    it('should show locked premium categories with blurred preview for free users', async () => {
      vi.mocked(getCategories).mockResolvedValue(mockCategories);
      vi.mocked(canAccessPremiumCategories).mockReturnValue(false);

      const page = await PracticePage();
      const { container } = render(page);

      // Check for blur class on premium category cards
      const blurredElements = container.querySelectorAll('.blur-\\[2px\\]');
      expect(blurredElements.length).toBe(2); // React Patterns and Docker
    });

    it('should show upgrade button on locked premium categories', async () => {
      vi.mocked(getCategories).mockResolvedValue(mockCategories);
      vi.mocked(canAccessPremiumCategories).mockReturnValue(false);

      const page = await PracticePage();
      render(page);

      const upgradeButtons = screen.getAllByText('Upgrade to Unlock');
      expect(upgradeButtons.length).toBe(2);
    });

    it('should link upgrade button to pricing page', async () => {
      vi.mocked(getCategories).mockResolvedValue(mockCategories);
      vi.mocked(canAccessPremiumCategories).mockReturnValue(false);

      const page = await PracticePage();
      render(page);

      const upgradeLinks = screen.getAllByText('Upgrade to Unlock');
      upgradeLinks.forEach((link) => {
        const anchor = link.closest('a');
        expect(anchor?.getAttribute('href')).toBe('/pricing');
      });
    });

    it('should not lock premium categories for pro users', async () => {
      vi.mocked(getCategories).mockResolvedValue(mockCategories);
      vi.mocked(getUserProfile).mockResolvedValue(mockProProfile);
      vi.mocked(canAccessPremiumCategories).mockReturnValue(true);

      const page = await PracticePage();
      const { container } = render(page);

      // No blurred elements
      const blurredElements = container.querySelectorAll('.blur-\\[2px\\]');
      expect(blurredElements.length).toBe(0);

      // No upgrade buttons
      expect(screen.queryByText('Upgrade to Unlock')).toBeNull();
    });

    it('should allow clicking through to premium categories for pro users', async () => {
      vi.mocked(getCategories).mockResolvedValue(mockCategories);
      vi.mocked(getUserProfile).mockResolvedValue(mockProProfile);
      vi.mocked(canAccessPremiumCategories).mockReturnValue(true);

      const page = await PracticePage();
      render(page);

      const reactLink = screen.getByText('React Patterns').closest('a');
      expect(reactLink?.getAttribute('href')).toBe('/practice/react-patterns');
    });

    it('should not link locked premium categories directly', async () => {
      vi.mocked(getCategories).mockResolvedValue(mockCategories);
      vi.mocked(canAccessPremiumCategories).mockReturnValue(false);

      const page = await PracticePage();
      render(page);

      // Premium category names should not be inside direct links to practice pages
      const reactPatterns = screen.getByText('React Patterns');
      const directLink = reactPatterns.closest('a[href="/practice/react-patterns"]');
      expect(directLink).toBeNull();
    });

    it('should always allow clicking through to free categories', async () => {
      vi.mocked(getCategories).mockResolvedValue(mockCategories);
      vi.mocked(canAccessPremiumCategories).mockReturnValue(false);

      const page = await PracticePage();
      render(page);

      const gitBasicsLink = screen.getByText('Git Basics').closest('a');
      expect(gitBasicsLink?.getAttribute('href')).toBe('/practice/git-basics');
    });

    it('should handle unauthenticated users as free tier', async () => {
      vi.mocked(getCategories).mockResolvedValue(mockCategories);
      vi.mocked(getUser).mockResolvedValue(null);
      vi.mocked(canAccessPremiumCategories).mockReturnValue(false);

      const page = await PracticePage();
      const { container } = render(page);

      // Should show locked premium categories
      const blurredElements = container.querySelectorAll('.blur-\\[2px\\]');
      expect(blurredElements.length).toBe(2);
    });
  });
});
