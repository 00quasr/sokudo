'use client';

import { useTransition } from 'react';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { useLocale } from 'next-intl';

export function LocaleSwitcher() {
  const [isPending, startTransition] = useTransition();
  const currentLocale = useLocale() as Locale;

  function onLocaleChange(locale: Locale) {
    startTransition(() => {
      // Set cookie and add small delay to ensure cookie is persisted before reload
      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
      setTimeout(() => window.location.reload(), 50);
    });
  }

  return (
    <div className="flex items-center gap-1">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => onLocaleChange(locale)}
          disabled={isPending || currentLocale === locale}
          className={`
            px-2.5 py-1 text-sm font-medium rounded-md transition-colors
            ${
              currentLocale === locale
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white hover:bg-white/5'
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
