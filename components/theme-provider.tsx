'use client';

import * as React from 'react';

// Create a context for high contrast mode (kept for accessibility)
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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
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
    <HighContrastContext.Provider value={{ highContrast, setHighContrast }}>
      {children}
    </HighContrastContext.Provider>
  );
}
