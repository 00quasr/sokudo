import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCurrentDateInTimezone,
  isValidTimezone,
  getTimezoneFromPreferences,
  DEFAULT_TIMEZONE,
} from '../timezone';

describe('timezone utilities', () => {
  describe('DEFAULT_TIMEZONE', () => {
    it('should be UTC', () => {
      expect(DEFAULT_TIMEZONE).toBe('UTC');
    });
  });

  describe('isValidTimezone', () => {
    it('should return true for valid IANA timezones', () => {
      expect(isValidTimezone('UTC')).toBe(true);
      expect(isValidTimezone('America/New_York')).toBe(true);
      expect(isValidTimezone('Europe/London')).toBe(true);
      expect(isValidTimezone('Asia/Tokyo')).toBe(true);
      expect(isValidTimezone('Australia/Sydney')).toBe(true);
      expect(isValidTimezone('Pacific/Auckland')).toBe(true);
    });

    it('should return false for invalid timezones', () => {
      expect(isValidTimezone('Invalid/Timezone')).toBe(false);
      expect(isValidTimezone('')).toBe(false);
      expect(isValidTimezone('Not_A_Timezone')).toBe(false);
      expect(isValidTimezone('Foo/Bar/Baz')).toBe(false);
    });
  });

  describe('getTimezoneFromPreferences', () => {
    it('should return null for null/undefined preferences', () => {
      expect(getTimezoneFromPreferences(null)).toBeNull();
      expect(getTimezoneFromPreferences(undefined)).toBeNull();
    });

    it('should return null for non-object preferences', () => {
      expect(getTimezoneFromPreferences('string' as unknown as Record<string, unknown>)).toBeNull();
    });

    it('should return null if no timezone in preferences', () => {
      expect(getTimezoneFromPreferences({})).toBeNull();
      expect(getTimezoneFromPreferences({ theme: 'dark' })).toBeNull();
    });

    it('should return null for invalid timezone in preferences', () => {
      expect(getTimezoneFromPreferences({ timezone: 'Invalid/Tz' })).toBeNull();
      expect(getTimezoneFromPreferences({ timezone: 123 })).toBeNull();
      expect(getTimezoneFromPreferences({ timezone: null })).toBeNull();
    });

    it('should return valid timezone from preferences', () => {
      expect(getTimezoneFromPreferences({ timezone: 'America/New_York' })).toBe('America/New_York');
      expect(getTimezoneFromPreferences({ timezone: 'UTC' })).toBe('UTC');
      expect(getTimezoneFromPreferences({ timezone: 'Europe/London' })).toBe('Europe/London');
    });

    it('should return timezone even with other preferences present', () => {
      expect(
        getTimezoneFromPreferences({
          theme: 'dark',
          timezone: 'Asia/Tokyo',
          soundEnabled: true,
        })
      ).toBe('Asia/Tokyo');
    });
  });

  describe('getCurrentDateInTimezone', () => {
    // Use a fixed date for testing
    const fixedDate = new Date('2024-06-15T14:30:00Z'); // 2:30 PM UTC

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(fixedDate);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return UTC date for null/undefined timezone', () => {
      // At 2:30 PM UTC on June 15, the UTC date is 2024-06-15
      expect(getCurrentDateInTimezone(null)).toBe('2024-06-15');
      expect(getCurrentDateInTimezone(undefined)).toBe('2024-06-15');
    });

    it('should return date in specified timezone', () => {
      // At 2:30 PM UTC:
      // - New York (UTC-4 in June): 10:30 AM -> same day (2024-06-15)
      // - Tokyo (UTC+9): 11:30 PM -> same day (2024-06-15)
      expect(getCurrentDateInTimezone('America/New_York')).toBe('2024-06-15');
      expect(getCurrentDateInTimezone('Asia/Tokyo')).toBe('2024-06-15');
    });

    it('should handle timezone where it is already next day', () => {
      // Set time to 11 PM UTC
      vi.setSystemTime(new Date('2024-06-15T23:00:00Z'));

      // At 11 PM UTC:
      // - UTC: June 15
      // - Tokyo (UTC+9): 8 AM June 16 (next day)
      expect(getCurrentDateInTimezone('UTC')).toBe('2024-06-15');
      expect(getCurrentDateInTimezone('Asia/Tokyo')).toBe('2024-06-16');
    });

    it('should handle timezone where it is still previous day', () => {
      // Set time to 3 AM UTC
      vi.setSystemTime(new Date('2024-06-15T03:00:00Z'));

      // At 3 AM UTC:
      // - UTC: June 15
      // - Los Angeles (UTC-7 in June): 8 PM June 14 (previous day)
      expect(getCurrentDateInTimezone('UTC')).toBe('2024-06-15');
      expect(getCurrentDateInTimezone('America/Los_Angeles')).toBe('2024-06-14');
    });

    it('should fall back to UTC for invalid timezone', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = getCurrentDateInTimezone('Invalid/Timezone');
      expect(result).toBe('2024-06-15'); // UTC date
      expect(warnSpy).toHaveBeenCalledWith(
        'Invalid timezone "Invalid/Timezone", falling back to UTC'
      );

      warnSpy.mockRestore();
    });

    it('should return date in YYYY-MM-DD format', () => {
      const result = getCurrentDateInTimezone('UTC');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('daily limit reset behavior', () => {
    // Test scenarios for daily limit reset at midnight

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should track same day practice correctly before midnight', () => {
      // User in New York timezone, 11:30 PM
      // This is 3:30 AM UTC next day
      vi.setSystemTime(new Date('2024-06-16T03:30:00Z'));

      const nyDate = getCurrentDateInTimezone('America/New_York');
      expect(nyDate).toBe('2024-06-15'); // Still June 15 in NY

      // Practice done at 11:30 PM should count toward June 15
    });

    it('should reset limits at midnight in user timezone', () => {
      // 11:59 PM in New York (3:59 AM UTC June 16)
      vi.setSystemTime(new Date('2024-06-16T03:59:00Z'));
      expect(getCurrentDateInTimezone('America/New_York')).toBe('2024-06-15');

      // 12:01 AM in New York (4:01 AM UTC June 16)
      vi.setSystemTime(new Date('2024-06-16T04:01:00Z'));
      expect(getCurrentDateInTimezone('America/New_York')).toBe('2024-06-16');

      // Limits reset! New day in user's timezone
    });

    it('should handle users in different timezones independently', () => {
      // Set time to 5 AM UTC on June 16
      vi.setSystemTime(new Date('2024-06-16T05:00:00Z'));

      // At this time:
      // - UTC: June 16, 5 AM (new day)
      // - New York (UTC-4): June 16, 1 AM (new day)
      // - Los Angeles (UTC-7): June 15, 10 PM (still previous day!)
      // - Tokyo (UTC+9): June 16, 2 PM (new day)

      expect(getCurrentDateInTimezone('UTC')).toBe('2024-06-16');
      expect(getCurrentDateInTimezone('America/New_York')).toBe('2024-06-16');
      expect(getCurrentDateInTimezone('America/Los_Angeles')).toBe('2024-06-15');
      expect(getCurrentDateInTimezone('Asia/Tokyo')).toBe('2024-06-16');

      // User in LA still has their June 15 limit
      // Users in NY and Tokyo have fresh June 16 limits
    });
  });
});
