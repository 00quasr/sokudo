import { describe, it, expect } from 'vitest';
import { locales, defaultLocale, localeNames } from '@/i18n/config';

describe('i18n configuration', () => {
  it('should export an array of locales', () => {
    expect(locales).toBeDefined();
    expect(Array.isArray(locales)).toBe(true);
    expect(locales.length).toBeGreaterThan(0);
  });

  it('should include en and ja locales', () => {
    expect(locales).toContain('en');
    expect(locales).toContain('ja');
  });

  it('should have a default locale', () => {
    expect(defaultLocale).toBeDefined();
    expect(locales).toContain(defaultLocale);
  });

  it('should have locale names for all locales', () => {
    locales.forEach((locale) => {
      expect(localeNames[locale]).toBeDefined();
      expect(typeof localeNames[locale]).toBe('string');
    });
  });

  it('should have English as default locale', () => {
    expect(defaultLocale).toBe('en');
  });
});
