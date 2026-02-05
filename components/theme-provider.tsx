'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';

function ThemeSync() {
  const { theme, setTheme } = useTheme();
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Load theme from user preferences on mount
  React.useEffect(() => {
    async function loadThemePreference() {
      try {
        const response = await fetch('/api/user/preferences');
        if (response.ok) {
          const data = await response.json();
          if (data.theme && data.theme !== theme) {
            setTheme(data.theme);
          }
        }
      } catch (error) {
        // Silently fail - user might not be logged in
        console.debug('Could not load theme preference:', error);
      } finally {
        setIsInitialized(true);
      }
    }

    loadThemePreference();
  }, [setTheme, theme]);

  // Sync theme changes to database
  React.useEffect(() => {
    if (!isInitialized || !theme) return;

    async function syncThemePreference() {
      try {
        await fetch('/api/user/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme }),
        });
      } catch (error) {
        // Silently fail - localStorage will still work
        console.debug('Could not sync theme preference:', error);
      }
    }

    syncThemePreference();
  }, [theme, isInitialized]);

  return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ThemeSync />
      {children}
    </NextThemesProvider>
  );
}
