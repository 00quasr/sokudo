/**
 * Timezone utilities for daily limit reset
 *
 * Daily limits reset at midnight in the user's configured timezone.
 * If no timezone is set, defaults to UTC.
 */

/**
 * Default timezone when user has not set a preference
 */
export const DEFAULT_TIMEZONE = 'UTC';

/**
 * Get the current date string (YYYY-MM-DD) in the user's timezone
 *
 * @param timezone - IANA timezone string (e.g., 'America/New_York', 'Europe/London')
 * @returns Date string in YYYY-MM-DD format for the user's local date
 */
export function getCurrentDateInTimezone(timezone: string | null | undefined): string {
  const tz = timezone || DEFAULT_TIMEZONE;

  try {
    // Use Intl.DateTimeFormat to get the date parts in the target timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    // en-CA format gives us YYYY-MM-DD directly
    return formatter.format(new Date());
  } catch {
    // Invalid timezone - fall back to UTC
    console.warn(`Invalid timezone "${tz}", falling back to UTC`);
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Validate if a timezone string is a valid IANA timezone
 *
 * @param timezone - Timezone string to validate
 * @returns true if the timezone is valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the timezone from user preferences
 *
 * @param preferences - User preferences object (may be null or contain a timezone)
 * @returns The timezone string or null if not set
 */
export function getTimezoneFromPreferences(
  preferences: Record<string, unknown> | null | undefined
): string | null {
  if (!preferences || typeof preferences !== 'object') {
    return null;
  }

  const timezone = preferences.timezone;
  if (typeof timezone === 'string' && isValidTimezone(timezone)) {
    return timezone;
  }

  return null;
}
