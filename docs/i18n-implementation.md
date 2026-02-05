# i18n Implementation Guide

## Overview

The Sokudo typing trainer now includes full internationalization (i18n) support using `next-intl`. The framework is configured and ready to use throughout the application.

## What's Implemented

### 1. Configuration (`i18n/config.ts`)
- Supported locales: English (`en`) and Japanese (`ja`)
- Default locale: English
- Locale display names for UI

### 2. Request Configuration (`i18n/request.ts`)
- Automatic locale detection from cookies
- Message loading per locale
- Integration with Next.js 15 App Router

### 3. Middleware (`middleware.ts`)
- Locale detection and cookie management
- Seamless integration with existing auth middleware
- Cookie-based locale persistence

### 4. Translation Files
- `messages/en.json` - English translations
- `messages/ja.json` - Japanese translations

Both files include translations for:
- Common UI elements (buttons, labels)
- Navigation
- Authentication
- Practice mode
- Dashboard
- Settings
- Pricing
- Metadata (for SEO)

### 5. Locale Switcher Component (`components/locale-switcher.tsx`)
- Client-side locale switching
- Visual indication of current locale
- Accessible with proper ARIA labels
- Smooth transition between languages

### 6. Server Actions (`lib/i18n/actions.ts`)
- `setLocale(locale)` - Set user's preferred locale
- `getLocale()` - Get current locale from cookies

### 7. Next.js Configuration (`next.config.ts`)
- `next-intl` plugin configured
- Automatic routing setup

## How to Use

### In Server Components

```tsx
import { useTranslations } from 'next-intl';

export default function MyPage() {
  const t = useTranslations('common');

  return (
    <div>
      <h1>{t('loading')}</h1>
      <button>{t('save')}</button>
    </div>
  );
}
```

### In Client Components

```tsx
'use client';

import { useTranslations } from 'next-intl';

export function MyClientComponent() {
  const t = useTranslations('practice');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('selectCategory')}</p>
    </div>
  );
}
```

### Adding the Locale Switcher

Add to any layout or page:

```tsx
import { LocaleSwitcher } from '@/components/locale-switcher';

export default function MyLayout() {
  return (
    <div>
      <header>
        <LocaleSwitcher />
      </header>
      {/* rest of your content */}
    </div>
  );
}
```

### Using Server Actions

```tsx
'use client';

import { setLocale } from '@/lib/i18n/actions';

export function MyComponent() {
  async function handleLanguageChange() {
    await setLocale('ja');
    // Optionally reload or update UI
  }

  return <button onClick={handleLanguageChange}>Switch to Japanese</button>;
}
```

## Adding New Translations

1. Add the key to `messages/en.json`:
```json
{
  "mySection": {
    "newKey": "Hello World"
  }
}
```

2. Add the corresponding translation to `messages/ja.json`:
```json
{
  "mySection": {
    "newKey": "こんにちは世界"
  }
}
```

3. Use in your components:
```tsx
const t = useTranslations('mySection');
t('newKey'); // Returns "Hello World" or "こんにちは世界"
```

## Adding New Languages

1. Update `i18n/config.ts`:
```ts
export type Locale = 'en' | 'ja' | 'es'; // Add 'es' for Spanish

export const locales: Locale[] = ['en', 'ja', 'es'];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ja: '日本語',
  es: 'Español' // Add Spanish
};
```

2. Create `messages/es.json` with all translations

3. The LocaleSwitcher will automatically show the new language

## Testing

All i18n functionality is covered by tests in `__tests__/i18n/`:

- `config.test.ts` - Configuration validation
- `messages.test.ts` - Message file structure and consistency
- `locale-switcher.test.tsx` - UI component behavior
- `actions.test.ts` - Server action functionality

Run tests:
```bash
pnpm test:run __tests__/i18n/
```

## Technical Details

- **Cookie-based**: Locale preference stored in `NEXT_LOCALE` cookie (1 year expiry)
- **No URL routing**: We use cookie-based localization, not URL prefixes (/en, /ja)
- **SSR-friendly**: Works with Next.js 15 App Router and PPR
- **Type-safe**: Full TypeScript support for locale keys

## Next Steps

To integrate i18n into your app:

1. Add `<LocaleSwitcher />` to your main layout (e.g., in navigation header)
2. Replace hardcoded strings with `t()` calls using `useTranslations`
3. Add new translation keys as needed to both `en.json` and `ja.json`

## Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Next.js i18n Guide](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- Project translation files: `/messages/`
