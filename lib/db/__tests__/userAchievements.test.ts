import { describe, it, expect } from 'vitest';
import {
  userAchievements,
  type UserAchievement,
  type NewUserAchievement,
} from '../schema';

describe('userAchievements schema', () => {
  describe('table structure', () => {
    it('should have the correct table name', () => {
      const tableName = (userAchievements as Record<symbol, { name: string }>)[
        Object.getOwnPropertySymbols(userAchievements).find(
          (s) => s.description === 'drizzle:Name'
        ) as symbol
      ];
      expect(tableName).toBe('user_achievements');
    });

    it('should have all required columns', () => {
      const columnNames = Object.keys(userAchievements);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('userId');
      expect(columnNames).toContain('achievementId');
      expect(columnNames).toContain('earnedAt');
    });

    it('should have id as primary key', () => {
      expect(userAchievements.id.primary).toBe(true);
    });
  });

  describe('column constraints', () => {
    it('should require userId', () => {
      expect(userAchievements.userId.notNull).toBe(true);
    });

    it('should require achievementId', () => {
      expect(userAchievements.achievementId.notNull).toBe(true);
    });

    it('should require earnedAt', () => {
      expect(userAchievements.earnedAt.notNull).toBe(true);
    });
  });

  describe('type inference', () => {
    it('should allow valid NewUserAchievement object', () => {
      const newUserAchievement: NewUserAchievement = {
        userId: 1,
        achievementId: 1,
      };

      expect(newUserAchievement.userId).toBe(1);
      expect(newUserAchievement.achievementId).toBe(1);
      expect(newUserAchievement.earnedAt).toBeUndefined();
    });

    it('should allow NewUserAchievement with explicit earnedAt', () => {
      const earnedDate = new Date('2025-01-15T10:30:00Z');
      const newUserAchievement: NewUserAchievement = {
        userId: 2,
        achievementId: 3,
        earnedAt: earnedDate,
      };

      expect(newUserAchievement.userId).toBe(2);
      expect(newUserAchievement.achievementId).toBe(3);
      expect(newUserAchievement.earnedAt).toEqual(earnedDate);
    });

    it('should infer UserAchievement type with all fields', () => {
      const userAchievement: UserAchievement = {
        id: 1,
        userId: 1,
        achievementId: 1,
        earnedAt: new Date(),
      };

      expect(userAchievement.id).toBe(1);
      expect(typeof userAchievement.earnedAt).toBe('object');
      expect(userAchievement.earnedAt instanceof Date).toBe(true);
    });
  });

  describe('practical use cases', () => {
    it('should support a collection of user achievements', () => {
      const earned: UserAchievement[] = [
        {
          id: 1,
          userId: 1,
          achievementId: 1,
          earnedAt: new Date('2025-01-01'),
        },
        {
          id: 2,
          userId: 1,
          achievementId: 2,
          earnedAt: new Date('2025-01-05'),
        },
        {
          id: 3,
          userId: 1,
          achievementId: 3,
          earnedAt: new Date('2025-01-10'),
        },
      ];

      expect(earned.length).toBe(3);
      expect(earned.every((ua) => ua.userId === 1)).toBe(true);
    });

    it('should support filtering achievements by user', () => {
      const allUserAchievements: UserAchievement[] = [
        { id: 1, userId: 1, achievementId: 1, earnedAt: new Date() },
        { id: 2, userId: 1, achievementId: 2, earnedAt: new Date() },
        { id: 3, userId: 2, achievementId: 1, earnedAt: new Date() },
        { id: 4, userId: 3, achievementId: 1, earnedAt: new Date() },
      ];

      const user1Achievements = allUserAchievements.filter(
        (ua) => ua.userId === 1
      );
      expect(user1Achievements.length).toBe(2);
    });

    it('should support sorting achievements by earned date', () => {
      const earned: UserAchievement[] = [
        {
          id: 1,
          userId: 1,
          achievementId: 3,
          earnedAt: new Date('2025-03-01'),
        },
        {
          id: 2,
          userId: 1,
          achievementId: 1,
          earnedAt: new Date('2025-01-01'),
        },
        {
          id: 3,
          userId: 1,
          achievementId: 2,
          earnedAt: new Date('2025-02-01'),
        },
      ];

      const sorted = [...earned].sort(
        (a, b) => a.earnedAt.getTime() - b.earnedAt.getTime()
      );

      expect(sorted[0].achievementId).toBe(1);
      expect(sorted[1].achievementId).toBe(2);
      expect(sorted[2].achievementId).toBe(3);
    });

    it('should support checking if user has a specific achievement', () => {
      const earned: UserAchievement[] = [
        { id: 1, userId: 1, achievementId: 1, earnedAt: new Date() },
        { id: 2, userId: 1, achievementId: 3, earnedAt: new Date() },
      ];

      const hasAchievement = (achievementId: number) =>
        earned.some((ua) => ua.achievementId === achievementId);

      expect(hasAchievement(1)).toBe(true);
      expect(hasAchievement(2)).toBe(false);
      expect(hasAchievement(3)).toBe(true);
    });

    it('should support counting achievements per user', () => {
      const allUserAchievements: UserAchievement[] = [
        { id: 1, userId: 1, achievementId: 1, earnedAt: new Date() },
        { id: 2, userId: 1, achievementId: 2, earnedAt: new Date() },
        { id: 3, userId: 1, achievementId: 3, earnedAt: new Date() },
        { id: 4, userId: 2, achievementId: 1, earnedAt: new Date() },
      ];

      const countByUser = allUserAchievements.reduce(
        (acc, ua) => {
          acc[ua.userId] = (acc[ua.userId] || 0) + 1;
          return acc;
        },
        {} as Record<number, number>
      );

      expect(countByUser[1]).toBe(3);
      expect(countByUser[2]).toBe(1);
    });
  });
});
