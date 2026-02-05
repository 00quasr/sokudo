'use client';

import { useState, useEffect } from 'react';
import { KeyboardLayout, detectKeyboardLayout } from '@/lib/typing/keyboard-layouts';

/**
 * Hook to manage keyboard layout preference
 * Loads from user preferences and provides state management
 */
export function useKeyboardLayout() {
  const [layout, setLayout] = useState<KeyboardLayout>('qwerty');
  const [isLoading, setIsLoading] = useState(true);

  // Load layout from user preferences
  useEffect(() => {
    async function loadLayout() {
      try {
        const response = await fetch('/api/user/preferences');
        if (response.ok) {
          const data = await response.json();
          const userLayout = data.keyboardLayout as KeyboardLayout;
          setLayout(userLayout || detectKeyboardLayout());
        } else {
          // Not logged in or error - use detected layout
          setLayout(detectKeyboardLayout());
        }
      } catch (error) {
        console.error('Failed to load keyboard layout preference:', error);
        setLayout(detectKeyboardLayout());
      } finally {
        setIsLoading(false);
      }
    }

    loadLayout();
  }, []);

  // Update layout preference
  const updateLayout = async (newLayout: KeyboardLayout) => {
    setLayout(newLayout);

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyboardLayout: newLayout,
        }),
      });

      if (!response.ok) {
        console.error('Failed to save keyboard layout preference');
      }
    } catch (error) {
      console.error('Error saving keyboard layout preference:', error);
    }
  };

  return {
    layout,
    setLayout: updateLayout,
    isLoading,
  };
}
