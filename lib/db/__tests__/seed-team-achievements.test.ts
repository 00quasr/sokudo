import { describe, it, expect } from 'vitest';
import { teamAchievementDefinitions } from '../seed-team-achievements';

describe('teamAchievementDefinitions', () => {
  it('should have the correct total number of achievements', () => {
    // 3 sessions + 3 avg wpm + 1 all active + 3 practice time + 2 accuracy + 2 streak + 2 challenges = 16
    expect(teamAchievementDefinitions.length).toBe(16);
  });

  it('should have unique slugs', () => {
    const slugs = teamAchievementDefinitions.map((a) => a.slug);
    const uniqueSlugs = new Set(slugs);
    expect(slugs.length).toBe(uniqueSlugs.size);
  });

  it('should have unique names', () => {
    const names = teamAchievementDefinitions.map((a) => a.name);
    const uniqueNames = new Set(names);
    expect(names.length).toBe(uniqueNames.size);
  });

  it('should have all required fields on every achievement', () => {
    for (const achievement of teamAchievementDefinitions) {
      expect(achievement.slug).toBeTruthy();
      expect(achievement.name).toBeTruthy();
      expect(achievement.description).toBeTruthy();
      expect(achievement.icon).toBeTruthy();
      expect(achievement.criteria).toBeTruthy();
    }
  });

  it('should use kebab-case slugs', () => {
    const kebabCaseRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    for (const achievement of teamAchievementDefinitions) {
      expect(achievement.slug).toMatch(kebabCaseRegex);
    }
  });

  describe('team session achievements', () => {
    const sessionAchievements = teamAchievementDefinitions.filter(
      (a) => (a.criteria as Record<string, unknown>).type === 'team_sessions'
    );

    it('should have 3 session achievements', () => {
      expect(sessionAchievements.length).toBe(3);
    });

    it('should cover thresholds 50, 250, 1000', () => {
      const thresholds = sessionAchievements.map(
        (a) => (a.criteria as Record<string, number>).threshold
      );
      expect(thresholds.sort((a, b) => a - b)).toEqual([50, 250, 1000]);
    });
  });

  describe('team avg WPM achievements', () => {
    const wpmAchievements = teamAchievementDefinitions.filter(
      (a) => (a.criteria as Record<string, unknown>).type === 'team_avg_wpm'
    );

    it('should have 3 avg WPM achievements', () => {
      expect(wpmAchievements.length).toBe(3);
    });

    it('should cover thresholds 40, 60, 80', () => {
      const thresholds = wpmAchievements.map(
        (a) => (a.criteria as Record<string, number>).threshold
      );
      expect(thresholds.sort((a, b) => a - b)).toEqual([40, 60, 80]);
    });
  });

  describe('team all active achievement', () => {
    const allActiveAchievements = teamAchievementDefinitions.filter(
      (a) => (a.criteria as Record<string, unknown>).type === 'team_all_active'
    );

    it('should have 1 all-active achievement', () => {
      expect(allActiveAchievements.length).toBe(1);
    });
  });

  describe('team practice time achievements', () => {
    const timeAchievements = teamAchievementDefinitions.filter(
      (a) => (a.criteria as Record<string, unknown>).type === 'team_practice_time'
    );

    it('should have 3 practice time achievements', () => {
      expect(timeAchievements.length).toBe(3);
    });

    it('should cover 1h, 10h, 100h thresholds in ms', () => {
      const thresholds = timeAchievements.map(
        (a) => (a.criteria as Record<string, number>).thresholdMs
      );
      expect(thresholds.sort((a, b) => a - b)).toEqual([3600000, 36000000, 360000000]);
    });

    it('should all use the clock icon', () => {
      for (const achievement of timeAchievements) {
        expect(achievement.icon).toBe('clock');
      }
    });
  });

  describe('team accuracy achievements', () => {
    const accuracyAchievements = teamAchievementDefinitions.filter(
      (a) => (a.criteria as Record<string, unknown>).type === 'team_avg_accuracy'
    );

    it('should have 2 accuracy achievements', () => {
      expect(accuracyAchievements.length).toBe(2);
    });

    it('should cover thresholds 90, 95', () => {
      const thresholds = accuracyAchievements.map(
        (a) => (a.criteria as Record<string, number>).threshold
      );
      expect(thresholds.sort((a, b) => a - b)).toEqual([90, 95]);
    });
  });

  describe('team streak achievements', () => {
    const streakAchievements = teamAchievementDefinitions.filter(
      (a) => (a.criteria as Record<string, unknown>).type === 'team_min_streak'
    );

    it('should have 2 streak achievements', () => {
      expect(streakAchievements.length).toBe(2);
    });

    it('should cover thresholds 3, 7', () => {
      const thresholds = streakAchievements.map(
        (a) => (a.criteria as Record<string, number>).threshold
      );
      expect(thresholds.sort((a, b) => a - b)).toEqual([3, 7]);
    });

    it('should all use the flame icon', () => {
      for (const achievement of streakAchievements) {
        expect(achievement.icon).toBe('flame');
      }
    });
  });

  describe('team challenges achievements', () => {
    const challengeAchievements = teamAchievementDefinitions.filter(
      (a) => (a.criteria as Record<string, unknown>).type === 'team_challenges_completed'
    );

    it('should have 2 challenge achievements', () => {
      expect(challengeAchievements.length).toBe(2);
    });

    it('should cover thresholds 5, 25', () => {
      const thresholds = challengeAchievements.map(
        (a) => (a.criteria as Record<string, number>).threshold
      );
      expect(thresholds.sort((a, b) => a - b)).toEqual([5, 25]);
    });
  });

  describe('data integrity', () => {
    it('should have slugs within varchar(100) limit', () => {
      for (const achievement of teamAchievementDefinitions) {
        expect(achievement.slug.length).toBeLessThanOrEqual(100);
      }
    });

    it('should have names within varchar(100) limit', () => {
      for (const achievement of teamAchievementDefinitions) {
        expect(achievement.name.length).toBeLessThanOrEqual(100);
      }
    });

    it('should have icons within varchar(50) limit', () => {
      for (const achievement of teamAchievementDefinitions) {
        expect(achievement.icon.length).toBeLessThanOrEqual(50);
      }
    });

    it('should have criteria with a valid type field', () => {
      const validTypes = [
        'team_sessions',
        'team_avg_wpm',
        'team_all_active',
        'team_practice_time',
        'team_avg_accuracy',
        'team_min_streak',
        'team_challenges_completed',
      ];
      for (const achievement of teamAchievementDefinitions) {
        const criteria = achievement.criteria as Record<string, unknown>;
        expect(validTypes).toContain(criteria.type);
      }
    });

    it('should have non-empty descriptions', () => {
      for (const achievement of teamAchievementDefinitions) {
        expect(achievement.description.length).toBeGreaterThan(0);
      }
    });
  });
});
