'use server';

import { cookies } from 'next/headers';
import { type Locale, locales } from '@/i18n/config';

export async function setLocale(locale: Locale) {
  if (!locales.includes(locale)) {
    throw new Error(`Invalid locale: ${locale}`);
  }

  const cookieStore = await cookies();
  cookieStore.set('NEXT_LOCALE', locale, {
    httpOnly: false,
    secure: true,
    sameSite: 'lax',
    maxAge: 31536000 // 1 year
  });
}

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;

  return locale && locales.includes(locale) ? locale : 'en';
}
