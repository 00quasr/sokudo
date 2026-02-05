'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';

function ThemeSync() {
  const { theme, setTheme } = useTheme();
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [highContrast, setHighContrast] = React.useState(false);

  // Load theme and high contrast preference from user preferences on mount
  React.useEffect(() => {
    async function loadThemePreference() {
      try {
        const response = await fetch('/api/user/preferences');
        if (response.ok) {
          const data = await response.json();
          if (data.theme && data.theme !== theme) {
            setTheme(data.theme);
          }
          if (data.highContrast !== undefined) {
            setHighContrast(data.highContrast);
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

  // Apply high contrast class to document
  React.useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

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

// Create a context for high contrast mode
const HighContrastContext = React.createContext<{
  highContrast: boolean;
  setHighContrast: (value: boolean) => void;
}>({
  highContrast: false,
  setHighContrast: () => {},
});

export function useHighContrast() {
  return React.useContext(HighContrastContext);
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [highContrast, setHighContrast] = React.useState(false);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Load high contrast preference from user preferences on mount
  React.useEffect(() => {
    async function loadHighContrastPreference() {
      try {
        const response = await fetch('/api/user/preferences');
        if (response.ok) {
          const data = await response.json();
          if (data.highContrast !== undefined) {
            setHighContrast(data.highContrast);
          }
        }
      } catch (error) {
        console.debug('Could not load high contrast preference:', error);
      } finally {
        setIsInitialized(true);
      }
    }

    loadHighContrastPreference();
  }, []);

  // Apply high contrast class to document
  React.useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  // Sync high contrast changes to database
  React.useEffect(() => {
    if (!isInitialized) return;

    async function syncHighContrastPreference() {
      try {
        await fetch('/api/user/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ highContrast }),
        });
      } catch (error) {
        console.debug('Could not sync high contrast preference:', error);
      }
    }

    syncHighContrastPreference();
  }, [highContrast, isInitialized]);

  return (
    <NextThemesProvider {...props}>
      <HighContrastContext.Provider value={{ highContrast, setHighContrast }}>
        <ThemeSync />
        {children}
      </HighContrastContext.Provider>
    </NextThemesProvider>
  );
}
