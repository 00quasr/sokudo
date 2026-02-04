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
}));

// Mock the queries module
vi.mock('@/lib/db/queries', () => ({
  getCategoryWithChallenges: vi.fn(),
  getUser: vi.fn(),
  getUserProfile: vi.fn(),
}));

// Mock the limits module
vi.mock('@/lib/limits/constants', () => ({
  canAccessPremiumCategories: vi.fn(),
  hasUnlimitedPractice: vi.fn(),
}));

// Mock the RemainingTimeBar component
vi.mock('@/components/limits/RemainingTimeBar', () => ({
  RemainingTimeBar: () => null,
}));

import { notFound } from 'next/navigation';
import { getCategoryWithChallenges, getUser, getUserProfile } from '@/lib/db/queries';
import { canAccessPremiumCategories, hasUnlimitedPractice } from '@/lib/limits/constants';
import CategoryPage from '../page';
import { Category, Challenge } from '@/lib/db/schema';

type CategoryWithChallenges = Category & { challenges: Challenge[] };

const mockChallenges: Challenge[] = [
  {
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
  },
  {
    id: 2,
    categoryId: 1,
    content: 'git status',
    difficulty: 'beginner',
    syntaxType: 'bash',
    hint: 'Check working directory status',
    avgWpm: 50,
    timesCompleted: 150,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    categoryId: 1,
    content: 'git commit -m "initial commit"',
    difficulty: 'intermediate',
    syntaxType: 'bash',
    hint: 'Commit with a message',
    avgWpm: 40,
    timesCompleted: 80,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 4,
    categoryId: 1,
    content: 'git rebase -i HEAD~3',
    difficulty: 'advanced',
    syntaxType: 'bash',
    hint: null,
    avgWpm: 30,
    timesCompleted: 20,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockCategory: CategoryWithChallenges = {
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
  challenges: mockChallenges,
};

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

describe('CategoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: logged in free user
    vi.mocked(getUser).mockResolvedValue(mockUser);
    vi.mocked(getUserProfile).mockResolvedValue(mockFreeProfile);
    vi.mocked(canAccessPremiumCategories).mockReturnValue(false);
    vi.mocked(hasUnlimitedPractice).mockReturnValue(false);
  });

  describe('rendering', () => {
    it('should render the category name', async () => {
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(mockCategory);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'git-basics' }) });
      render(page);

      expect(screen.getByRole('heading', { name: 'Git Basics', level: 1 })).toBeTruthy();
    });

    it('should render the category description', async () => {
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(mockCategory);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'git-basics' }) });
      render(page);

      expect(screen.getByText('Essential git commands for version control')).toBeTruthy();
    });

    it('should render the back link to categories', async () => {
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(mockCategory);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'git-basics' }) });
      render(page);

      const backLink = screen.getByText('Back to categories').closest('a');
      expect(backLink?.getAttribute('href')).toBe('/practice');
    });

    it('should render the challenge count', async () => {
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(mockCategory);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'git-basics' }) });
      render(page);

      expect(screen.getByText('4 challenges')).toBeTruthy();
    });

    it('should render singular "challenge" when only one challenge', async () => {
      const singleChallenge: CategoryWithChallenges = {
        ...mockCategory,
        challenges: [mockChallenges[0]],
      };
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(singleChallenge);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'git-basics' }) });
      render(page);

      expect(screen.getByText('1 challenge')).toBeTruthy();
    });

    it('should render the category difficulty badge', async () => {
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(mockCategory);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'git-basics' }) });
      render(page);

      // Category difficulty badge appears in the header area
      const badges = screen.getAllByText('beginner');
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  describe('challenge cards', () => {
    it('should render all challenge content', async () => {
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(mockCategory);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'git-basics' }) });
      render(page);

      expect(screen.getByText('git init')).toBeTruthy();
      expect(screen.getByText('git status')).toBeTruthy();
      expect(screen.getByText('git commit -m "initial commit"')).toBeTruthy();
      expect(screen.getByText('git rebase -i HEAD~3')).toBeTruthy();
    });

    it('should render challenge hints when available', async () => {
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(mockCategory);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'git-basics' }) });
      render(page);

      expect(screen.getByText('Initialize a new repository')).toBeTruthy();
      expect(screen.getByText('Check working directory status')).toBeTruthy();
      expect(screen.getByText('Commit with a message')).toBeTruthy();
    });

    it('should render challenge index numbers', async () => {
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(mockCategory);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'git-basics' }) });
      render(page);

      expect(screen.getByText('1')).toBeTruthy();
      expect(screen.getByText('2')).toBeTruthy();
      expect(screen.getByText('3')).toBeTruthy();
      expect(screen.getByText('4')).toBeTruthy();
    });

    it('should render difficulty badges for challenges', async () => {
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(mockCategory);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'git-basics' }) });
      render(page);

      const beginnerBadges = screen.getAllByText('beginner');
      expect(beginnerBadges.length).toBeGreaterThanOrEqual(2); // category + challenges

      expect(screen.getByText('intermediate')).toBeTruthy();
      expect(screen.getByText('advanced')).toBeTruthy();
    });

    it('should link to correct challenge paths', async () => {
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(mockCategory);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'git-basics' }) });
      render(page);

      const gitInitLink = screen.getByText('git init').closest('a');
      expect(gitInitLink?.getAttribute('href')).toBe('/practice/git-basics/1');

      const rebaseLink = screen.getByText('git rebase -i HEAD~3').closest('a');
      expect(rebaseLink?.getAttribute('href')).toBe('/practice/git-basics/4');
    });
  });

  describe('difficulty styling', () => {
    it('should apply green styling to beginner difficulty', async () => {
      const beginnerCategory: CategoryWithChallenges = {
        ...mockCategory,
        challenges: [mockChallenges[0]],
      };
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(beginnerCategory);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'git-basics' }) });
      render(page);

      const badges = screen.getAllByText('beginner');
      badges.forEach((badge) => {
        expect(badge.className).toContain('bg-green-100');
        expect(badge.className).toContain('text-green-800');
      });
    });

    it('should apply yellow styling to intermediate difficulty', async () => {
      const intermediateCategory: CategoryWithChallenges = {
        ...mockCategory,
        difficulty: 'intermediate',
        challenges: [mockChallenges[2]],
      };
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(intermediateCategory);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'git-basics' }) });
      render(page);

      const badges = screen.getAllByText('intermediate');
      badges.forEach((badge) => {
        expect(badge.className).toContain('bg-yellow-100');
        expect(badge.className).toContain('text-yellow-800');
      });
    });

    it('should apply red styling to advanced difficulty', async () => {
      const advancedCategory: CategoryWithChallenges = {
        ...mockCategory,
        difficulty: 'advanced',
        challenges: [mockChallenges[3]],
      };
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(advancedCategory);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'git-basics' }) });
      render(page);

      const badges = screen.getAllByText('advanced');
      badges.forEach((badge) => {
        expect(badge.className).toContain('bg-red-100');
        expect(badge.className).toContain('text-red-800');
      });
    });
  });

  describe('empty state', () => {
    it('should show empty message when no challenges', async () => {
      const emptyCategory: CategoryWithChallenges = {
        ...mockCategory,
        challenges: [],
      };
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(emptyCategory);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'git-basics' }) });
      render(page);

      expect(screen.getByText('No challenges available for this category yet.')).toBeTruthy();
    });

    it('should show 0 challenges count when empty', async () => {
      const emptyCategory: CategoryWithChallenges = {
        ...mockCategory,
        challenges: [],
      };
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(emptyCategory);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'git-basics' }) });
      render(page);

      expect(screen.getByText('0 challenges')).toBeTruthy();
    });
  });

  describe('not found', () => {
    it('should call notFound when category does not exist', async () => {
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(undefined);
      vi.mocked(notFound).mockImplementation(() => {
        throw new Error('NEXT_NOT_FOUND');
      });

      await expect(
        CategoryPage({ params: Promise.resolve({ categorySlug: 'non-existent' }) })
      ).rejects.toThrow('NEXT_NOT_FOUND');

      expect(notFound).toHaveBeenCalled();
    });
  });

  describe('icon mapping', () => {
    it('should render icon for category with known icon', async () => {
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(mockCategory);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'git-basics' }) });
      const { container } = render(page);

      // Check that SVG icons are rendered (lucide icons render as SVGs)
      const svgIcons = container.querySelectorAll('svg');
      expect(svgIcons.length).toBeGreaterThan(0);
    });

    it('should fallback to Code icon for unknown icon names', async () => {
      const unknownIcon: CategoryWithChallenges = {
        ...mockCategory,
        icon: 'unknown-icon-name',
      };
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(unknownIcon);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'git-basics' }) });
      const { container } = render(page);

      // Should still render an icon (fallback to Code)
      const svgIcons = container.querySelectorAll('svg');
      expect(svgIcons.length).toBeGreaterThan(0);
    });

    it('should fallback to Code icon when icon is null', async () => {
      const nullIcon: CategoryWithChallenges = {
        ...mockCategory,
        icon: null,
      };
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(nullIcon);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'git-basics' }) });
      const { container } = render(page);

      // Should still render an icon (fallback to Code)
      const svgIcons = container.querySelectorAll('svg');
      expect(svgIcons.length).toBeGreaterThan(0);
    });
  });

  describe('no description', () => {
    it('should not render description paragraph when description is null', async () => {
      const noDescription: CategoryWithChallenges = {
        ...mockCategory,
        description: null,
      };
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(noDescription);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'git-basics' }) });
      render(page);

      expect(screen.queryByText('Essential git commands for version control')).toBeNull();
    });
  });

  describe('premium category locking', () => {
    const mockPremiumCategory: CategoryWithChallenges = {
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
      challenges: mockChallenges,
    };

    it('should show locked state for premium category when user is free tier', async () => {
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(mockPremiumCategory);
      vi.mocked(canAccessPremiumCategories).mockReturnValue(false);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'react-patterns' }) });
      render(page);

      expect(screen.getByText('Premium Category')).toBeTruthy();
      expect(screen.getByText('Upgrade to Pro')).toBeTruthy();
    });

    it('should show blurred challenge preview for locked premium category', async () => {
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(mockPremiumCategory);
      vi.mocked(canAccessPremiumCategories).mockReturnValue(false);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'react-patterns' }) });
      const { container } = render(page);

      // Check for blur class
      const blurredElements = container.querySelectorAll('.blur-sm');
      expect(blurredElements.length).toBeGreaterThan(0);
    });

    it('should link upgrade button to pricing page', async () => {
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(mockPremiumCategory);
      vi.mocked(canAccessPremiumCategories).mockReturnValue(false);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'react-patterns' }) });
      render(page);

      const upgradeLink = screen.getByText('Upgrade to Pro').closest('a');
      expect(upgradeLink?.getAttribute('href')).toBe('/pricing');
    });

    it('should show Pro badge on locked premium category', async () => {
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(mockPremiumCategory);
      vi.mocked(canAccessPremiumCategories).mockReturnValue(false);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'react-patterns' }) });
      render(page);

      expect(screen.getByText('Pro')).toBeTruthy();
    });

    it('should show category description in locked state', async () => {
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(mockPremiumCategory);
      vi.mocked(canAccessPremiumCategories).mockReturnValue(false);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'react-patterns' }) });
      render(page);

      expect(screen.getByText('Common React component patterns and hooks')).toBeTruthy();
    });

    it('should not show locked state for pro users on premium category', async () => {
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(mockPremiumCategory);
      vi.mocked(getUserProfile).mockResolvedValue(mockProProfile);
      vi.mocked(canAccessPremiumCategories).mockReturnValue(true);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'react-patterns' }) });
      render(page);

      expect(screen.queryByText('Premium Category')).toBeNull();
      expect(screen.queryByText('Upgrade to Pro')).toBeNull();
    });

    it('should show all challenges for pro users on premium category', async () => {
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(mockPremiumCategory);
      vi.mocked(getUserProfile).mockResolvedValue(mockProProfile);
      vi.mocked(canAccessPremiumCategories).mockReturnValue(true);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'react-patterns' }) });
      render(page);

      expect(screen.getByText('git init')).toBeTruthy();
      expect(screen.getByText('git status')).toBeTruthy();
    });

    it('should not show locked state for free category', async () => {
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(mockCategory);
      vi.mocked(canAccessPremiumCategories).mockReturnValue(false);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'git-basics' }) });
      render(page);

      expect(screen.queryByText('Premium Category')).toBeNull();
      expect(screen.queryByText('Upgrade to Pro')).toBeNull();
    });

    it('should handle unauthenticated users as free tier for premium category', async () => {
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(mockPremiumCategory);
      vi.mocked(getUser).mockResolvedValue(null);
      vi.mocked(canAccessPremiumCategories).mockReturnValue(false);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'react-patterns' }) });
      render(page);

      expect(screen.getByText('Premium Category')).toBeTruthy();
      expect(screen.getByText('Upgrade to Pro')).toBeTruthy();
    });

    it('should maintain back link in locked state', async () => {
      vi.mocked(getCategoryWithChallenges).mockResolvedValue(mockPremiumCategory);
      vi.mocked(canAccessPremiumCategories).mockReturnValue(false);

      const page = await CategoryPage({ params: Promise.resolve({ categorySlug: 'react-patterns' }) });
      render(page);

      const backLink = screen.getByText('Back to categories').closest('a');
      expect(backLink?.getAttribute('href')).toBe('/practice');
    });
  });
});
