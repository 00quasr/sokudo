'use client';

import { useTransition } from 'react';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { useLocale } from 'next-intl';

export function LocaleSwitcher() {
  const [isPending, startTransition] = useTransition();
  const currentLocale = useLocale() as Locale;

  function onLocaleChange(locale: Locale) {
    startTransition(() => {
      // Set cookie and reload to apply new locale
      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
      window.location.reload();
    });
  }

  return (
    <div className="flex items-center gap-2">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => onLocaleChange(locale)}
          disabled={isPending || currentLocale === locale}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-md transition-colors
            ${
              currentLocale === locale
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          aria-label={`Switch to ${localeNames[locale]}`}
        >
          {localeNames[locale]}
        </button>
      ))}
    </div>
  );
}
