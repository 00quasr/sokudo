/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CategoryMasterySection, CategoryMasteryData } from '../CategoryMasterySection';

const createCategoryData = (
  overrides: Partial<CategoryMasteryData> = {}
): CategoryMasteryData => ({
  categoryId: 1,
  categoryName: 'Git Commands',
  categorySlug: 'git-commands',
  totalChallenges: 10,
  completedChallenges: 5,
  percentComplete: 50,
  avgWpm: 65,
  avgAccuracy: 92,
  accuracyTrend: 3,
  sessions: 15,
  ...overrides,
});

describe('CategoryMasterySection', () => {
  describe('rendering', () => {
    it('should not render when all categories have no challenges', () => {
      const data = [
        createCategoryData({ totalChallenges: 0, completedChallenges: 0 }),
      ];
      const { container } = render(<CategoryMasterySection data={data} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render card with title', () => {
      const data = [createCategoryData()];
      render(<CategoryMasterySection data={data} />);
      expect(screen.getByText('Category Mastery')).toBeTruthy();
    });

    it('should render category name', () => {
      const data = [createCategoryData({ categoryName: 'Docker Commands' })];
      render(<CategoryMasterySection data={data} />);
      expect(screen.getByText('Docker Commands')).toBeTruthy();
    });

    it('should render challenge count', () => {
      const data = [createCategoryData({ completedChallenges: 7, totalChallenges: 12 })];
      render(<CategoryMasterySection data={data} />);
      expect(screen.getByText(/7\/12 challenges/)).toBeTruthy();
    });

    it('should render session count', () => {
      const data = [createCategoryData({ sessions: 25 })];
      render(<CategoryMasterySection data={data} />);
      expect(screen.getByText(/25 sessions/)).toBeTruthy();
    });

    it('should use singular session text for 1 session', () => {
      const data = [createCategoryData({ sessions: 1 })];
      const { container } = render(<CategoryMasterySection data={data} />);
      // Check that "1 session" appears (not "1 sessions")
      expect(container.textContent).toMatch(/1 session(?!s)/);
    });

    it('should render WPM value', () => {
      const data = [createCategoryData({ avgWpm: 78 })];
      render(<CategoryMasterySection data={data} />);
      expect(screen.getByText('78')).toBeTruthy();
    });

    it('should render accuracy value', () => {
      const data = [createCategoryData({ avgAccuracy: 95 })];
      render(<CategoryMasterySection data={data} />);
      expect(screen.getByText('95%')).toBeTruthy();
    });
  });

  describe('progress bar', () => {
    it('should render progress bar element', () => {
      const data = [createCategoryData({ percentComplete: 60 })];
      const { container } = render(<CategoryMasterySection data={data} />);
      const progressBar = container.querySelector('.bg-gray-200');
      expect(progressBar).toBeTruthy();
    });

    it('should set progress bar width based on percent', () => {
      const data = [createCategoryData({ percentComplete: 75 })];
      const { container } = render(<CategoryMasterySection data={data} />);
      const progressFill = container.querySelector('[style*="width: 75%"]');
      expect(progressFill).toBeTruthy();
    });
  });

  describe('complete badge', () => {
    it('should show Complete badge when 100% complete', () => {
      const data = [createCategoryData({
        percentComplete: 100,
        completedChallenges: 10,
        totalChallenges: 10,
      })];
      render(<CategoryMasterySection data={data} />);
      expect(screen.getByText('Complete')).toBeTruthy();
    });

    it('should not show Complete badge when less than 100%', () => {
      const data = [createCategoryData({ percentComplete: 99 })];
      render(<CategoryMasterySection data={data} />);
      expect(screen.queryByText('Complete')).toBeNull();
    });
  });

  describe('accuracy trend indicator', () => {
    it('should show positive trend indicator', () => {
      const data = [createCategoryData({ accuracyTrend: 5 })];
      render(<CategoryMasterySection data={data} />);
      expect(screen.getByText('+5%')).toBeTruthy();
    });

    it('should show negative trend indicator', () => {
      const data = [createCategoryData({ accuracyTrend: -3 })];
      render(<CategoryMasterySection data={data} />);
      expect(screen.getByText('-3%')).toBeTruthy();
    });

    it('should not show trend indicator when trend is 0', () => {
      const data = [createCategoryData({ accuracyTrend: 0 })];
      const { container } = render(<CategoryMasterySection data={data} />);
      // Should not have trend percentage text
      const trendText = container.textContent;
      expect(trendText).not.toMatch(/[+-]\d+%/);
    });
  });

  describe('sorting', () => {
    it('should sort categories by percent complete descending', () => {
      const data = [
        createCategoryData({ categoryId: 1, categoryName: 'Low', percentComplete: 25, sessions: 5, accuracyTrend: 0 }),
        createCategoryData({ categoryId: 2, categoryName: 'High', percentComplete: 80, sessions: 5, accuracyTrend: 0 }),
        createCategoryData({ categoryId: 3, categoryName: 'Medium', percentComplete: 50, sessions: 5, accuracyTrend: 0 }),
      ];
      const { container } = render(<CategoryMasterySection data={data} />);
      // Get the category name elements (first .font-medium.text-gray-900 in each category block)
      const categoryNames = Array.from(container.querySelectorAll('.font-medium.text-gray-900'))
        .map((el) => el.textContent?.trim());
      expect(categoryNames).toEqual(['High', 'Medium', 'Low']);
    });

    it('should sort by sessions when percent is equal', () => {
      const data = [
        createCategoryData({ categoryId: 1, categoryName: 'Few Sessions', percentComplete: 50, sessions: 5, accuracyTrend: 0 }),
        createCategoryData({ categoryId: 2, categoryName: 'Many Sessions', percentComplete: 50, sessions: 20, accuracyTrend: 0 }),
      ];
      const { container } = render(<CategoryMasterySection data={data} />);
      const categoryNames = Array.from(container.querySelectorAll('.font-medium.text-gray-900'))
        .map((el) => el.textContent?.trim());
      expect(categoryNames).toEqual(['Many Sessions', 'Few Sessions']);
    });
  });

  describe('filtering', () => {
    it('should filter out categories with no challenges', () => {
      const data = [
        createCategoryData({ categoryId: 1, categoryName: 'Has Challenges', totalChallenges: 10 }),
        createCategoryData({ categoryId: 2, categoryName: 'No Challenges', totalChallenges: 0 }),
      ];
      render(<CategoryMasterySection data={data} />);
      expect(screen.getByText('Has Challenges')).toBeTruthy();
      expect(screen.queryByText('No Challenges')).toBeNull();
    });
  });

  describe('empty states', () => {
    it('should handle category with no sessions', () => {
      const data = [createCategoryData({
        sessions: 0,
        avgWpm: 0,
        avgAccuracy: 0,
        completedChallenges: 0,
        percentComplete: 0,
      })];
      render(<CategoryMasterySection data={data} />);
      // Should still render the category name
      expect(screen.getByText('Git Commands')).toBeTruthy();
      // Should show 0/10 challenges
      expect(screen.getByText('0/10 challenges')).toBeTruthy();
    });

    it('should not show WPM/accuracy stats when no sessions', () => {
      const data = [createCategoryData({
        sessions: 0,
        avgWpm: 0,
        avgAccuracy: 0,
      })];
      render(<CategoryMasterySection data={data} />);
      // WPM label should not appear when sessions is 0
      expect(screen.queryByText('WPM')).toBeNull();
    });
  });

  describe('multiple categories', () => {
    it('should render all categories with challenges', () => {
      const data = [
        createCategoryData({ categoryId: 1, categoryName: 'Git' }),
        createCategoryData({ categoryId: 2, categoryName: 'Docker' }),
        createCategoryData({ categoryId: 3, categoryName: 'React' }),
      ];
      render(<CategoryMasterySection data={data} />);
      expect(screen.getByText('Git')).toBeTruthy();
      expect(screen.getByText('Docker')).toBeTruthy();
      expect(screen.getByText('React')).toBeTruthy();
    });

    it('should render progress bars for each category', () => {
      const data = [
        createCategoryData({ categoryId: 1, percentComplete: 30 }),
        createCategoryData({ categoryId: 2, percentComplete: 60 }),
        createCategoryData({ categoryId: 3, percentComplete: 90 }),
      ];
      const { container } = render(<CategoryMasterySection data={data} />);
      const progressBars = container.querySelectorAll('.bg-gray-200');
      expect(progressBars.length).toBe(3);
    });
  });

  describe('progress bar colors', () => {
    it('should use green color for high progress (>=80%)', () => {
      const data = [createCategoryData({ percentComplete: 85 })];
      const { container } = render(<CategoryMasterySection data={data} />);
      const greenBar = container.querySelector('.bg-green-500');
      expect(greenBar).toBeTruthy();
    });

    it('should use orange color for medium progress (50-79%)', () => {
      const data = [createCategoryData({ percentComplete: 65 })];
      const { container } = render(<CategoryMasterySection data={data} />);
      const orangeBar = container.querySelector('.bg-orange-500');
      expect(orangeBar).toBeTruthy();
    });

    it('should use yellow color for low-medium progress (25-49%)', () => {
      const data = [createCategoryData({ percentComplete: 35 })];
      const { container } = render(<CategoryMasterySection data={data} />);
      const yellowBar = container.querySelector('.bg-yellow-500');
      expect(yellowBar).toBeTruthy();
    });

    it('should use gray color for low progress (<25%)', () => {
      const data = [createCategoryData({ percentComplete: 15 })];
      const { container } = render(<CategoryMasterySection data={data} />);
      const grayBar = container.querySelector('.bg-gray-400');
      expect(grayBar).toBeTruthy();
    });
  });
});
