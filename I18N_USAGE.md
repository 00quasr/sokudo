# i18n Implementation Guide

This project now includes internationalization (i18n) support using `next-intl`.

## Features

- Multi-language support (English and Japanese)
- Cookie-based locale persistence
- Locale switcher component
- Server and client-side translation support
- Automatic locale detection

## Configuration

### Supported Locales

- `en` - English (default)
- `ja` - Japanese (日本語)

Configuration is in `i18n/config.ts`.

### Message Files

Translation messages are stored in JSON files:
- `messages/en.json` - English translations
- `messages/ja.json` - Japanese translations

## Usage

### In Server Components

```typescript
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('common');

  return (
    <div>
      <h1>{t('loading')}</h1>
      <p>{t('error')}</p>
    </div>
  );
}
```

### In Client Components

```typescript
'use client';

import { useTranslations } from 'next-intl';

export default function MyClientComponent() {
  const t = useTranslations('nav');

  return (
    <nav>
      <a href="/dashboard">{t('dashboard')}</a>
      <a href="/practice">{t('practice')}</a>
    </nav>
  );
}
```

### Locale Switcher

Add the locale switcher to your layout:

```typescript
import { LocaleSwitcher } from '@/components/locale-switcher';

export default function Layout() {
  return (
    <div>
      <header>
        <LocaleSwitcher />
      </header>
      {/* rest of layout */}
    </div>
  );
}
```

### Server Actions

```typescript
import { setLocale, getLocale } from '@/lib/i18n/actions';

// Get current locale
const locale = await getLocale();

// Set locale
await setLocale('ja');
```

## Adding New Translations

1. Add keys to `messages/en.json`
2. Add corresponding translations to `messages/ja.json`
3. Use the new keys in your components with `useTranslations()`

Example:

```json
// messages/en.json
{
  "mySection": {
    "title": "My Title",
    "description": "My Description"
  }
}

// messages/ja.json
{
  "mySection": {
    "title": "私のタイトル",
    "description": "私の説明"
  }
}
```

Then in your component:

```typescript
const t = useTranslations('mySection');
return <h1>{t('title')}</h1>;
```

## Adding New Locales

1. Add the locale code to `i18n/config.ts`:
   ```typescript
   export const locales: Locale[] = ['en', 'ja', 'es'];
   ```

2. Add the locale name:
   ```typescript
   export const localeNames: Record<Locale, string> = {
     en: 'English',
     ja: '日本語',
     es: 'Español'
   };
   ```

3. Create a new message file: `messages/es.json`

4. Copy and translate all keys from `messages/en.json`

## Testing

Tests are located in `__tests__/i18n/`:
- `config.test.ts` - Configuration tests
- `messages.test.ts` - Message structure validation
- `locale-switcher.test.tsx` - Component tests
- `actions.test.ts` - Server action tests

Run tests:
```bash
pnpm test __tests__/i18n
```

## How It Works

1. **Middleware** (`middleware.ts`): Detects and sets locale cookie
2. **Request Config** (`i18n/request.ts`): Loads appropriate messages for each request
3. **Next.js Plugin** (`next.config.ts`): Integrates next-intl with Next.js
4. **Components**: Use `useTranslations()` hook to access messages

## Best Practices

1. Always keep all locale files in sync (same keys)
2. Use semantic keys (e.g., `nav.dashboard` not `navDashboard`)
3. Group related translations in namespaces
4. Test translations with the `messages.test.ts` structure validator
5. Provide context in key names for translators
