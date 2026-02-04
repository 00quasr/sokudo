import { describe, it, expect } from 'vitest';
import { generateRecommendations } from '../recommendations';
import type { RecommendationInput } from '../recommendations';

describe('Premium category filtering in recommendations', () => {
  const baseInput: RecommendationInput = {
    sessions: [],
    weaknessReport: null,
    categoryPerformance: [],
    allCategories: [],
    currentStreak: 0,
    totalSessions: 10,
    avgWpm: 40,
    avgAccuracy: 85,
    canAccessPremium: false,
  };

  describe('Unexplored category recommendations', () => {
    it('should not recommend premium categories to free users', () => {
      const input: RecommendationInput = {
        ...baseInput,
        canAccessPremium: false,
        allCategories: [
          {
            id: 1,
            name: 'Git Basics',
            slug: 'git-basics',
            difficulty: 'beginner',
            isPremium: false,
          },
          {
            id: 2,
            name: 'React Patterns',
            slug: 'react-patterns',
            difficulty: 'intermediate',
            isPremium: true,
          },
        ],
        categoryPerformance: [],
      };

      const recommendations = generateRecommendations(input);

      // Should only recommend free categories
      const unexploredRecs = recommendations.filter(
        (r) => r.type === 'unexplored_category'
      );
      expect(
        unexploredRecs.every((r) => !r.actionHref.includes('react-patterns'))
      ).toBe(true);
      expect(
        unexploredRecs.some((r) => r.actionHref.includes('git-basics'))
      ).toBe(true);
    });

    it('should recommend premium categories to pro users', () => {
      const input: RecommendationInput = {
        ...baseInput,
        canAccessPremium: true,
        allCategories: [
          {
            id: 1,
            name: 'Git Basics',
            slug: 'git-basics',
            difficulty: 'beginner',
            isPremium: false,
          },
          {
            id: 2,
            name: 'React Patterns',
            slug: 'react-patterns',
            difficulty: 'intermediate',
            isPremium: true,
          },
        ],
        categoryPerformance: [],
      };

      const recommendations = generateRecommendations(input);

      // Should recommend either free or premium categories
      const unexploredRecs = recommendations.filter(
        (r) => r.type === 'unexplored_category'
      );
      // At least one recommendation should exist (could be either)
      expect(unexploredRecs.length).toBeGreaterThan(0);
    });
  });

  describe('Weak category recommendations', () => {
    it('should not recommend premium categories with low accuracy to free users', () => {
      const input: RecommendationInput = {
        ...baseInput,
        canAccessPremium: false,
        allCategories: [
          {
            id: 1,
            name: 'Git Basics',
            slug: 'git-basics',
            difficulty: 'beginner',
            isPremium: false,
          },
          {
            id: 2,
            name: 'React Patterns',
            slug: 'react-patterns',
            difficulty: 'intermediate',
            isPremium: true,
          },
        ],
        categoryPerformance: [
          {
            categoryId: 1,
            categoryName: 'Git Basics',
            categorySlug: 'git-basics',
            isPremium: false,
            sessions: 5,
            avgWpm: 35,
            avgAccuracy: 75,
          },
          {
            categoryId: 2,
            categoryName: 'React Patterns',
            categorySlug: 'react-patterns',
            isPremium: true,
            sessions: 5,
            avgWpm: 30,
            avgAccuracy: 70, // Even lower accuracy, but should not be recommended
          },
        ],
      };

      const recommendations = generateRecommendations(input);

      // Should only recommend Git Basics, not React Patterns
      const weakCategoryRecs = recommendations.filter(
        (r) => r.type === 'weak_category'
      );
      expect(
        weakCategoryRecs.every((r) => !r.actionHref.includes('react-patterns'))
      ).toBe(true);
      expect(
        weakCategoryRecs.some((r) => r.actionHref.includes('git-basics'))
      ).toBe(true);
    });

    it('should recommend premium categories with low accuracy to pro users', () => {
      const input: RecommendationInput = {
        ...baseInput,
        canAccessPremium: true,
        allCategories: [
          {
            id: 1,
            name: 'Git Basics',
            slug: 'git-basics',
            difficulty: 'beginner',
            isPremium: false,
          },
          {
            id: 2,
            name: 'React Patterns',
            slug: 'react-patterns',
            difficulty: 'intermediate',
            isPremium: true,
          },
        ],
        categoryPerformance: [
          {
            categoryId: 1,
            categoryName: 'Git Basics',
            categorySlug: 'git-basics',
            isPremium: false,
            sessions: 5,
            avgWpm: 35,
            avgAccuracy: 75,
          },
          {
            categoryId: 2,
            categoryName: 'React Patterns',
            categorySlug: 'react-patterns',
            isPremium: true,
            sessions: 5,
            avgWpm: 30,
            avgAccuracy: 70, // Lower accuracy, should be recommended to pro users
          },
        ],
      };

      const recommendations = generateRecommendations(input);

      // Should recommend React Patterns since it's the weakest
      const weakCategoryRecs = recommendations.filter(
        (r) => r.type === 'weak_category'
      );
      expect(weakCategoryRecs.length).toBeGreaterThan(0);
      expect(
        weakCategoryRecs.some((r) => r.actionHref.includes('react-patterns'))
      ).toBe(true);
    });

    it('should not recommend slow premium categories to free users', () => {
      const input: RecommendationInput = {
        ...baseInput,
        avgWpm: 50,
        canAccessPremium: false,
        allCategories: [
          {
            id: 1,
            name: 'Git Basics',
            slug: 'git-basics',
            difficulty: 'beginner',
            isPremium: false,
          },
          {
            id: 2,
            name: 'React Patterns',
            slug: 'react-patterns',
            difficulty: 'intermediate',
            isPremium: true,
          },
        ],
        categoryPerformance: [
          {
            categoryId: 1,
            categoryName: 'Git Basics',
            categorySlug: 'git-basics',
            isPremium: false,
            sessions: 5,
            avgWpm: 35, // 30% below average
            avgAccuracy: 90,
          },
          {
            categoryId: 2,
            categoryName: 'React Patterns',
            categorySlug: 'react-patterns',
            isPremium: true,
            sessions: 5,
            avgWpm: 25, // 50% below average, even slower
            avgAccuracy: 90,
          },
        ],
      };

      const recommendations = generateRecommendations(input);

      // Should only recommend Git Basics for speed improvement
      const weakCategoryRecs = recommendations.filter(
        (r) => r.type === 'weak_category'
      );
      expect(
        weakCategoryRecs.every((r) => !r.actionHref.includes('react-patterns'))
      ).toBe(true);
      expect(
        weakCategoryRecs.some((r) => r.actionHref.includes('git-basics'))
      ).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle user downgrading from pro to free', () => {
      const input: RecommendationInput = {
        ...baseInput,
        canAccessPremium: false,
        allCategories: [
          {
            id: 1,
            name: 'React Patterns',
            slug: 'react-patterns',
            difficulty: 'intermediate',
            isPremium: true,
          },
        ],
        categoryPerformance: [
          {
            categoryId: 1,
            categoryName: 'React Patterns',
            categorySlug: 'react-patterns',
            isPremium: true,
            sessions: 10,
            avgWpm: 30,
            avgAccuracy: 70, // Poor performance, but user is now free tier
          },
        ],
      };

      const recommendations = generateRecommendations(input);

      // Should not recommend React Patterns even though they practiced it before
      const weakCategoryRecs = recommendations.filter(
        (r) => r.type === 'weak_category'
      );
      expect(
        weakCategoryRecs.every((r) => !r.actionHref.includes('react-patterns'))
      ).toBe(true);
    });

    it('should generate no weak category recommendations if all practiced categories are premium (free user)', () => {
      const input: RecommendationInput = {
        ...baseInput,
        canAccessPremium: false,
        allCategories: [
          {
            id: 1,
            name: 'React Patterns',
            slug: 'react-patterns',
            difficulty: 'intermediate',
            isPremium: true,
          },
          {
            id: 2,
            name: 'TypeScript',
            slug: 'typescript',
            difficulty: 'intermediate',
            isPremium: true,
          },
        ],
        categoryPerformance: [
          {
            categoryId: 1,
            categoryName: 'React Patterns',
            categorySlug: 'react-patterns',
            isPremium: true,
            sessions: 5,
            avgWpm: 30,
            avgAccuracy: 70,
          },
          {
            categoryId: 2,
            categoryName: 'TypeScript',
            categorySlug: 'typescript',
            isPremium: true,
            sessions: 5,
            avgWpm: 25,
            avgAccuracy: 65,
          },
        ],
      };

      const recommendations = generateRecommendations(input);

      // Should not recommend any weak category since all are premium
      const weakCategoryRecs = recommendations.filter(
        (r) => r.type === 'weak_category'
      );
      expect(weakCategoryRecs.length).toBe(0);
    });

    it('should only recommend accessible categories when mix of free and premium exist', () => {
      const input: RecommendationInput = {
        ...baseInput,
        canAccessPremium: false,
        allCategories: [
          {
            id: 1,
            name: 'Git Basics',
            slug: 'git-basics',
            difficulty: 'beginner',
            isPremium: false,
          },
          {
            id: 2,
            name: 'Terminal Commands',
            slug: 'terminal-commands',
            difficulty: 'beginner',
            isPremium: false,
          },
          {
            id: 3,
            name: 'React Patterns',
            slug: 'react-patterns',
            difficulty: 'intermediate',
            isPremium: true,
          },
          {
            id: 4,
            name: 'TypeScript',
            slug: 'typescript',
            difficulty: 'intermediate',
            isPremium: true,
          },
        ],
        categoryPerformance: [
          {
            categoryId: 1,
            categoryName: 'Git Basics',
            categorySlug: 'git-basics',
            isPremium: false,
            sessions: 5,
            avgWpm: 40,
            avgAccuracy: 88,
          },
          {
            categoryId: 3,
            categoryName: 'React Patterns',
            categorySlug: 'react-patterns',
            isPremium: true,
            sessions: 5,
            avgWpm: 30,
            avgAccuracy: 70, // Weakest, but premium
          },
        ],
      };

      const recommendations = generateRecommendations(input);

      // All recommendations should point to accessible categories only
      const allRecs = recommendations.filter(
        (r) => r.actionHref.startsWith('/practice/')
      );
      expect(
        allRecs.every(
          (r) =>
            !r.actionHref.includes('react-patterns') &&
            !r.actionHref.includes('typescript')
        )
      ).toBe(true);
    });
  });
});
