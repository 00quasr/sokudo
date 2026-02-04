import { describe, it, expect } from 'vitest';
import { achievementDefinitions } from '../seed-achievements';

describe('achievementDefinitions', () => {
  it('should have the correct total number of achievements', () => {
    // 6 speed + 6 streak + 10 category mastery + 3 milestones + 3 accuracy = 28
    expect(achievementDefinitions.length).toBe(28);
  });

  it('should have unique slugs', () => {
    const slugs = achievementDefinitions.map((a) => a.slug);
    const uniqueSlugs = new Set(slugs);
    expect(slugs.length).toBe(uniqueSlugs.size);
  });

  it('should have unique names', () => {
    const names = achievementDefinitions.map((a) => a.name);
    const uniqueNames = new Set(names);
    expect(names.length).toBe(uniqueNames.size);
  });

  it('should have all required fields on every achievement', () => {
    for (const achievement of achievementDefinitions) {
      expect(achievement.slug).toBeTruthy();
      expect(achievement.name).toBeTruthy();
      expect(achievement.description).toBeTruthy();
      expect(achievement.icon).toBeTruthy();
      expect(achievement.criteria).toBeTruthy();
    }
  });

  it('should use kebab-case slugs', () => {
    const kebabCaseRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    for (const achievement of achievementDefinitions) {
      expect(achievement.slug).toMatch(kebabCaseRegex);
    }
  });

  describe('speed achievements', () => {
    const speedAchievements = achievementDefinitions.filter(
      (a) => (a.criteria as Record<string, unknown>).type === 'wpm'
    );

    it('should have 6 speed achievements', () => {
      expect(speedAchievements.length).toBe(6);
    });

    it('should cover WPM thresholds 50, 60, 70, 80, 90, 100', () => {
      const thresholds = speedAchievements.map(
        (a) => (a.criteria as Record<string, number>).threshold
      );
      expect(thresholds.sort((a, b) => a - b)).toEqual([50, 60, 70, 80, 90, 100]);
    });

    it('should have ascending thresholds matching slug order', () => {
      for (const achievement of speedAchievements) {
        const threshold = (achievement.criteria as Record<string, number>).threshold;
        expect(achievement.slug).toBe(`speed-${threshold}`);
      }
    });
  });

  describe('streak achievements', () => {
    const streakAchievements = achievementDefinitions.filter(
      (a) => (a.criteria as Record<string, unknown>).type === 'streak'
    );

    it('should have 6 streak achievements', () => {
      expect(streakAchievements.length).toBe(6);
    });

    it('should cover streak thresholds 3, 7, 14, 30, 60, 100', () => {
      const thresholds = streakAchievements.map(
        (a) => (a.criteria as Record<string, number>).threshold
      );
      expect(thresholds.sort((a, b) => a - b)).toEqual([3, 7, 14, 30, 60, 100]);
    });

    it('should all use the flame icon', () => {
      for (const achievement of streakAchievements) {
        expect(achievement.icon).toBe('flame');
      }
    });
  });

  describe('category mastery achievements', () => {
    const masteryAchievements = achievementDefinitions.filter(
      (a) => (a.criteria as Record<string, unknown>).type === 'category_mastery'
    );

    it('should have 10 category mastery achievements', () => {
      expect(masteryAchievements.length).toBe(10);
    });

    it('should cover all 10 category slugs', () => {
      const categorySlugs = masteryAchievements.map(
        (a) => (a.criteria as Record<string, string>).categorySlug
      );
      expect(categorySlugs.sort()).toEqual([
        'ai-prompts',
        'docker',
        'git-advanced',
        'git-basics',
        'nextjs',
        'package-managers',
        'react-patterns',
        'sql',
        'terminal-commands',
        'typescript',
      ]);
    });

    it('should require 90% minimum accuracy and all challenges', () => {
      for (const achievement of masteryAchievements) {
        const criteria = achievement.criteria as Record<string, unknown>;
        expect(criteria.minAccuracy).toBe(90);
        expect(criteria.allChallenges).toBe(true);
      }
    });

    it('should have slug matching mastery-{categorySlug}', () => {
      for (const achievement of masteryAchievements) {
        const categorySlug = (achievement.criteria as Record<string, string>).categorySlug;
        expect(achievement.slug).toBe(`mastery-${categorySlug}`);
      }
    });
  });

  describe('practice milestone achievements', () => {
    const milestoneAchievements = achievementDefinitions.filter(
      (a) => (a.criteria as Record<string, unknown>).type === 'sessions_completed'
    );

    it('should have 3 milestone achievements', () => {
      expect(milestoneAchievements.length).toBe(3);
    });

    it('should cover session thresholds 100, 500, 1000', () => {
      const thresholds = milestoneAchievements.map(
        (a) => (a.criteria as Record<string, number>).threshold
      );
      expect(thresholds.sort((a, b) => a - b)).toEqual([100, 500, 1000]);
    });

    it('should all use the trophy icon', () => {
      for (const achievement of milestoneAchievements) {
        expect(achievement.icon).toBe('trophy');
      }
    });
  });

  describe('accuracy achievements', () => {
    const accuracyAchievements = achievementDefinitions.filter(
      (a) => (a.criteria as Record<string, unknown>).type === 'accuracy'
    );

    it('should have 3 accuracy achievements', () => {
      expect(accuracyAchievements.length).toBe(3);
    });

    it('should cover accuracy thresholds 95, 98, 99', () => {
      const thresholds = accuracyAchievements.map(
        (a) => (a.criteria as Record<string, number>).threshold
      );
      expect(thresholds.sort((a, b) => a - b)).toEqual([95, 98, 99]);
    });

    it('should all use the target icon', () => {
      for (const achievement of accuracyAchievements) {
        expect(achievement.icon).toBe('target');
      }
    });
  });

  describe('data integrity', () => {
    it('should have slugs within varchar(100) limit', () => {
      for (const achievement of achievementDefinitions) {
        expect(achievement.slug.length).toBeLessThanOrEqual(100);
      }
    });

    it('should have names within varchar(100) limit', () => {
      for (const achievement of achievementDefinitions) {
        expect(achievement.name.length).toBeLessThanOrEqual(100);
      }
    });

    it('should have icons within varchar(50) limit', () => {
      for (const achievement of achievementDefinitions) {
        expect(achievement.icon.length).toBeLessThanOrEqual(50);
      }
    });

    it('should have criteria with a valid type field', () => {
      const validTypes = ['wpm', 'streak', 'category_mastery', 'sessions_completed', 'accuracy'];
      for (const achievement of achievementDefinitions) {
        const criteria = achievement.criteria as Record<string, unknown>;
        expect(validTypes).toContain(criteria.type);
      }
    });

    it('should have non-empty descriptions', () => {
      for (const achievement of achievementDefinitions) {
        expect(achievement.description.length).toBeGreaterThan(0);
      }
    });
  });
});
