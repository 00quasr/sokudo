import { describe, it, expect } from 'vitest';
import {
  achievements,
  type Achievement,
  type NewAchievement,
} from '../schema';

describe('achievements schema', () => {
  describe('table structure', () => {
    it('should have the correct table name', () => {
      const tableName = (achievements as Record<symbol, { name: string }>)[
        Object.getOwnPropertySymbols(achievements).find(
          (s) => s.description === 'drizzle:Name'
        ) as symbol
      ];
      expect(tableName).toBe('achievements');
    });

    it('should have all required columns', () => {
      const columnNames = Object.keys(achievements);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('slug');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('description');
      expect(columnNames).toContain('icon');
      expect(columnNames).toContain('criteria');
      expect(columnNames).toContain('createdAt');
      expect(columnNames).toContain('updatedAt');
    });

    it('should have id as primary key', () => {
      expect(achievements.id.primary).toBe(true);
    });

    it('should have slug as unique', () => {
      expect(achievements.slug.isUnique).toBe(true);
    });
  });

  describe('column constraints', () => {
    it('should require slug', () => {
      expect(achievements.slug.notNull).toBe(true);
    });

    it('should require name', () => {
      expect(achievements.name.notNull).toBe(true);
    });

    it('should require description', () => {
      expect(achievements.description.notNull).toBe(true);
    });

    it('should require icon', () => {
      expect(achievements.icon.notNull).toBe(true);
    });

    it('should require criteria', () => {
      expect(achievements.criteria.notNull).toBe(true);
    });
  });

  describe('type inference', () => {
    it('should allow valid NewAchievement object', () => {
      const newAchievement: NewAchievement = {
        slug: 'first-session',
        name: 'First Steps',
        description: 'Complete your first typing session',
        icon: 'rocket',
        criteria: { type: 'sessions_completed', threshold: 1 },
      };

      expect(newAchievement.slug).toBe('first-session');
      expect(newAchievement.name).toBe('First Steps');
      expect(newAchievement.description).toBe('Complete your first typing session');
      expect(newAchievement.icon).toBe('rocket');
      expect(newAchievement.criteria).toEqual({ type: 'sessions_completed', threshold: 1 });
    });

    it('should allow NewAchievement with only required fields', () => {
      const minimal: NewAchievement = {
        slug: 'speed-demon',
        name: 'Speed Demon',
        description: 'Reach 100 WPM',
        icon: 'zap',
        criteria: { type: 'wpm', threshold: 100 },
      };

      expect(minimal.slug).toBe('speed-demon');
      expect(minimal.createdAt).toBeUndefined();
      expect(minimal.updatedAt).toBeUndefined();
    });

    it('should infer Achievement type with all fields', () => {
      const achievement: Achievement = {
        id: 1,
        slug: 'streak-master',
        name: 'Streak Master',
        description: 'Maintain a 7-day practice streak',
        icon: 'flame',
        criteria: { type: 'streak', threshold: 7 },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(achievement.id).toBe(1);
      expect(typeof achievement.createdAt).toBe('object');
      expect(achievement.createdAt instanceof Date).toBe(true);
    });
  });

  describe('criteria JSONB field', () => {
    it('should accept session count criteria', () => {
      const achievement: NewAchievement = {
        slug: 'centurion',
        name: 'Centurion',
        description: 'Complete 100 typing sessions',
        icon: 'trophy',
        criteria: { type: 'sessions_completed', threshold: 100 },
      };
      expect(achievement.criteria).toEqual({ type: 'sessions_completed', threshold: 100 });
    });

    it('should accept WPM threshold criteria', () => {
      const achievement: NewAchievement = {
        slug: 'speed-demon',
        name: 'Speed Demon',
        description: 'Reach 100 WPM in any session',
        icon: 'zap',
        criteria: { type: 'wpm', threshold: 100 },
      };
      expect(achievement.criteria).toEqual({ type: 'wpm', threshold: 100 });
    });

    it('should accept accuracy criteria', () => {
      const achievement: NewAchievement = {
        slug: 'perfectionist',
        name: 'Perfectionist',
        description: 'Achieve 100% accuracy in a session',
        icon: 'target',
        criteria: { type: 'accuracy', threshold: 100 },
      };
      expect(achievement.criteria).toEqual({ type: 'accuracy', threshold: 100 });
    });

    it('should accept streak criteria', () => {
      const achievement: NewAchievement = {
        slug: 'on-fire',
        name: 'On Fire',
        description: 'Practice for 30 consecutive days',
        icon: 'flame',
        criteria: { type: 'streak', threshold: 30 },
      };
      expect(achievement.criteria).toEqual({ type: 'streak', threshold: 30 });
    });

    it('should accept complex nested criteria', () => {
      const achievement: NewAchievement = {
        slug: 'git-guru',
        name: 'Git Guru',
        description: 'Complete all git challenges with 90%+ accuracy',
        icon: 'git-branch',
        criteria: {
          type: 'category_mastery',
          categorySlug: 'git-basics',
          minAccuracy: 90,
          allChallenges: true,
        },
      };
      const criteria = achievement.criteria as Record<string, unknown>;
      expect(criteria.type).toBe('category_mastery');
      expect(criteria.categorySlug).toBe('git-basics');
      expect(criteria.minAccuracy).toBe(90);
      expect(criteria.allChallenges).toBe(true);
    });
  });

  describe('slug values', () => {
    it('should accept kebab-case slugs', () => {
      const achievement: NewAchievement = {
        slug: 'first-session',
        name: 'First Session',
        description: 'Complete your first session',
        icon: 'star',
        criteria: { type: 'sessions_completed', threshold: 1 },
      };
      expect(achievement.slug).toBe('first-session');
    });

    it('should accept multi-word slugs', () => {
      const achievement: NewAchievement = {
        slug: 'late-night-coder',
        name: 'Late Night Coder',
        description: 'Practice after midnight',
        icon: 'moon',
        criteria: { type: 'time_of_day', hour: 0 },
      };
      expect(achievement.slug).toBe('late-night-coder');
    });
  });
});

describe('achievements practical use cases', () => {
  it('should support a collection of achievements', () => {
    const allAchievements: Achievement[] = [
      {
        id: 1,
        slug: 'first-session',
        name: 'First Steps',
        description: 'Complete your first typing session',
        icon: 'rocket',
        criteria: { type: 'sessions_completed', threshold: 1 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        slug: 'speed-demon',
        name: 'Speed Demon',
        description: 'Reach 100 WPM',
        icon: 'zap',
        criteria: { type: 'wpm', threshold: 100 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        slug: 'perfectionist',
        name: 'Perfectionist',
        description: 'Achieve 100% accuracy',
        icon: 'target',
        criteria: { type: 'accuracy', threshold: 100 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    expect(allAchievements.length).toBe(3);
    const slugs = allAchievements.map((a) => a.slug);
    const uniqueSlugs = new Set(slugs);
    expect(slugs.length).toBe(uniqueSlugs.size);
  });

  it('should filter achievements by criteria type', () => {
    const allAchievements: Achievement[] = [
      {
        id: 1,
        slug: 'speed-50',
        name: 'Getting Fast',
        description: 'Reach 50 WPM',
        icon: 'zap',
        criteria: { type: 'wpm', threshold: 50 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        slug: 'speed-100',
        name: 'Speed Demon',
        description: 'Reach 100 WPM',
        icon: 'zap',
        criteria: { type: 'wpm', threshold: 100 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        slug: 'streak-7',
        name: 'Week Warrior',
        description: '7-day streak',
        icon: 'flame',
        criteria: { type: 'streak', threshold: 7 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const wpmAchievements = allAchievements.filter(
      (a) => (a.criteria as Record<string, unknown>).type === 'wpm'
    );

    expect(wpmAchievements.length).toBe(2);
    expect(wpmAchievements.every((a) => a.icon === 'zap')).toBe(true);
  });

  it('should look up an achievement by slug', () => {
    const allAchievements: Achievement[] = [
      {
        id: 1,
        slug: 'first-session',
        name: 'First Steps',
        description: 'Complete your first typing session',
        icon: 'rocket',
        criteria: { type: 'sessions_completed', threshold: 1 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const found = allAchievements.find((a) => a.slug === 'first-session');
    expect(found).toBeDefined();
    expect(found!.name).toBe('First Steps');
  });

  it('should sort achievements by criteria threshold', () => {
    const wpmAchievements: Achievement[] = [
      {
        id: 1,
        slug: 'speed-100',
        name: 'Speed Demon',
        description: 'Reach 100 WPM',
        icon: 'zap',
        criteria: { type: 'wpm', threshold: 100 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        slug: 'speed-50',
        name: 'Getting Fast',
        description: 'Reach 50 WPM',
        icon: 'zap',
        criteria: { type: 'wpm', threshold: 50 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        slug: 'speed-75',
        name: 'Quick Fingers',
        description: 'Reach 75 WPM',
        icon: 'zap',
        criteria: { type: 'wpm', threshold: 75 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const sorted = [...wpmAchievements].sort(
      (a, b) =>
        ((a.criteria as Record<string, number>).threshold) -
        ((b.criteria as Record<string, number>).threshold)
    );

    expect(sorted[0].slug).toBe('speed-50');
    expect(sorted[1].slug).toBe('speed-75');
    expect(sorted[2].slug).toBe('speed-100');
  });
});
