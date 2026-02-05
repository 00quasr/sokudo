export type Locale = 'en' | 'ja';

export const locales: Locale[] = ['en', 'ja'];
export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ja: '日本語'
};
