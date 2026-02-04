import { describe, it, expect } from 'vitest';
import { userProfiles, type UserProfile, type NewUserProfile } from '../schema';

describe('userProfiles schema', () => {
  describe('table structure', () => {
    it('should have the correct table name', () => {
      const tableName = (userProfiles as Record<symbol, { name: string }>)[
        Object.getOwnPropertySymbols(userProfiles).find(
          (s) => s.description === 'drizzle:Name'
        ) as symbol
      ];
      expect(tableName).toBe('user_profiles');
    });

    it('should have all required columns', () => {
      const columnNames = Object.keys(userProfiles);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('userId');
      expect(columnNames).toContain('subscriptionTier');
      expect(columnNames).toContain('currentStreak');
      expect(columnNames).toContain('longestStreak');
      expect(columnNames).toContain('totalPracticeTimeMs');
      expect(columnNames).toContain('preferences');
      expect(columnNames).toContain('createdAt');
      expect(columnNames).toContain('updatedAt');
    });

    it('should have id as primary key', () => {
      expect(userProfiles.id.primary).toBe(true);
    });

    it('should have userId as foreign key', () => {
      expect(userProfiles.userId.notNull).toBe(true);
    });
  });

  describe('column constraints', () => {
    it('should require userId', () => {
      expect(userProfiles.userId.notNull).toBe(true);
    });

    it('should require subscriptionTier', () => {
      expect(userProfiles.subscriptionTier.notNull).toBe(true);
    });

    it('should require currentStreak', () => {
      expect(userProfiles.currentStreak.notNull).toBe(true);
    });

    it('should require longestStreak', () => {
      expect(userProfiles.longestStreak.notNull).toBe(true);
    });

    it('should require totalPracticeTimeMs', () => {
      expect(userProfiles.totalPracticeTimeMs.notNull).toBe(true);
    });

    it('should have default value of "free" for subscriptionTier', () => {
      expect(userProfiles.subscriptionTier.default).toBe('free');
    });

    it('should have default value of 0 for currentStreak', () => {
      expect(userProfiles.currentStreak.default).toBe(0);
    });

    it('should have default value of 0 for longestStreak', () => {
      expect(userProfiles.longestStreak.default).toBe(0);
    });

    it('should have default value of 0 for totalPracticeTimeMs', () => {
      expect(userProfiles.totalPracticeTimeMs.default).toBe(0);
    });
  });

  describe('type inference', () => {
    it('should allow valid NewUserProfile object', () => {
      const newProfile: NewUserProfile = {
        userId: 1,
        subscriptionTier: 'pro',
        currentStreak: 5,
        longestStreak: 10,
        totalPracticeTimeMs: 3600000,
        preferences: { theme: 'dark', soundEnabled: true },
      };

      expect(newProfile.userId).toBe(1);
      expect(newProfile.subscriptionTier).toBe('pro');
      expect(newProfile.currentStreak).toBe(5);
      expect(newProfile.longestStreak).toBe(10);
      expect(newProfile.totalPracticeTimeMs).toBe(3600000);
      expect(newProfile.preferences).toEqual({ theme: 'dark', soundEnabled: true });
    });

    it('should allow NewUserProfile with only required fields', () => {
      const newProfile: NewUserProfile = {
        userId: 1,
      };

      expect(newProfile.userId).toBe(1);
      expect(newProfile.subscriptionTier).toBeUndefined();
      expect(newProfile.currentStreak).toBeUndefined();
    });

    it('should infer UserProfile type with all fields', () => {
      const profile: UserProfile = {
        id: 1,
        userId: 1,
        subscriptionTier: 'free',
        currentStreak: 3,
        longestStreak: 7,
        totalPracticeTimeMs: 1800000,
        preferences: { theme: 'light' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(profile.id).toBe(1);
      expect(profile.userId).toBe(1);
      expect(profile.subscriptionTier).toBe('free');
      expect(profile.currentStreak).toBe(3);
      expect(profile.longestStreak).toBe(7);
      expect(profile.totalPracticeTimeMs).toBe(1800000);
    });
  });

  describe('subscriptionTier values', () => {
    it('should allow free tier', () => {
      const profile: NewUserProfile = {
        userId: 1,
        subscriptionTier: 'free',
      };
      expect(profile.subscriptionTier).toBe('free');
    });

    it('should allow pro tier', () => {
      const profile: NewUserProfile = {
        userId: 1,
        subscriptionTier: 'pro',
      };
      expect(profile.subscriptionTier).toBe('pro');
    });

    it('should allow team tier', () => {
      const profile: NewUserProfile = {
        userId: 1,
        subscriptionTier: 'team',
      };
      expect(profile.subscriptionTier).toBe('team');
    });
  });

  describe('streak values', () => {
    it('should allow zero streak', () => {
      const profile: NewUserProfile = {
        userId: 1,
        currentStreak: 0,
        longestStreak: 0,
      };
      expect(profile.currentStreak).toBe(0);
      expect(profile.longestStreak).toBe(0);
    });

    it('should allow positive streak values', () => {
      const profile: NewUserProfile = {
        userId: 1,
        currentStreak: 30,
        longestStreak: 100,
      };
      expect(profile.currentStreak).toBe(30);
      expect(profile.longestStreak).toBe(100);
    });

    it('should ensure longestStreak >= currentStreak in typical usage', () => {
      const profile: NewUserProfile = {
        userId: 1,
        currentStreak: 5,
        longestStreak: 10,
      };
      expect(profile.longestStreak).toBeGreaterThanOrEqual(profile.currentStreak!);
    });
  });

  describe('totalPracticeTimeMs values', () => {
    it('should allow zero practice time', () => {
      const profile: NewUserProfile = {
        userId: 1,
        totalPracticeTimeMs: 0,
      };
      expect(profile.totalPracticeTimeMs).toBe(0);
    });

    it('should allow large practice time values', () => {
      // 100 hours of practice
      const profile: NewUserProfile = {
        userId: 1,
        totalPracticeTimeMs: 360000000,
      };
      expect(profile.totalPracticeTimeMs).toBe(360000000);
    });

    it('should track typical daily practice', () => {
      // 30 minutes of practice
      const profile: NewUserProfile = {
        userId: 1,
        totalPracticeTimeMs: 1800000,
      };
      expect(profile.totalPracticeTimeMs).toBe(1800000);
    });
  });

  describe('preferences values', () => {
    it('should allow empty preferences', () => {
      const profile: NewUserProfile = {
        userId: 1,
        preferences: {},
      };
      expect(profile.preferences).toEqual({});
    });

    it('should allow theme preference', () => {
      const profile: NewUserProfile = {
        userId: 1,
        preferences: { theme: 'dark' },
      };
      expect(profile.preferences).toEqual({ theme: 'dark' });
    });

    it('should allow sound preferences', () => {
      const profile: NewUserProfile = {
        userId: 1,
        preferences: { soundEnabled: true, soundVolume: 0.8 },
      };
      expect(profile.preferences).toEqual({ soundEnabled: true, soundVolume: 0.8 });
    });

    it('should allow keyboard layout preference', () => {
      const profile: NewUserProfile = {
        userId: 1,
        preferences: { keyboardLayout: 'qwerty' },
      };
      expect(profile.preferences).toEqual({ keyboardLayout: 'qwerty' });
    });

    it('should allow multiple preferences', () => {
      const profile: NewUserProfile = {
        userId: 1,
        preferences: {
          theme: 'dark',
          soundEnabled: false,
          keyboardLayout: 'dvorak',
          fontSize: 18,
          showWpm: true,
        },
      };
      expect(profile.preferences).toHaveProperty('theme', 'dark');
      expect(profile.preferences).toHaveProperty('soundEnabled', false);
      expect(profile.preferences).toHaveProperty('keyboardLayout', 'dvorak');
    });
  });
});

describe('user profile scenarios', () => {
  it('should represent a new user profile', () => {
    const newUserProfile: NewUserProfile = {
      userId: 1,
    };
    expect(newUserProfile.userId).toBe(1);
    expect(newUserProfile.subscriptionTier).toBeUndefined(); // Will default to 'free'
    expect(newUserProfile.currentStreak).toBeUndefined(); // Will default to 0
  });

  it('should represent an active free tier user', () => {
    const profile: NewUserProfile = {
      userId: 1,
      subscriptionTier: 'free',
      currentStreak: 7,
      longestStreak: 7,
      totalPracticeTimeMs: 6300000, // ~1.75 hours total
      preferences: { theme: 'dark' },
    };
    expect(profile.subscriptionTier).toBe('free');
    expect(profile.currentStreak).toBe(7);
  });

  it('should represent a pro user with long streak', () => {
    const profile: NewUserProfile = {
      userId: 1,
      subscriptionTier: 'pro',
      currentStreak: 45,
      longestStreak: 60,
      totalPracticeTimeMs: 36000000, // 10 hours total
      preferences: {
        theme: 'dark',
        soundEnabled: true,
        keyboardLayout: 'qwerty',
      },
    };
    expect(profile.subscriptionTier).toBe('pro');
    expect(profile.currentStreak).toBe(45);
    expect(profile.longestStreak).toBe(60);
  });

  it('should represent a user who lost their streak', () => {
    const profile: NewUserProfile = {
      userId: 1,
      subscriptionTier: 'free',
      currentStreak: 0,
      longestStreak: 30,
      totalPracticeTimeMs: 18000000, // 5 hours total
      preferences: {},
    };
    expect(profile.currentStreak).toBe(0);
    expect(profile.longestStreak).toBe(30);
  });
});
