'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Check } from 'lucide-react';
import {
  KeyboardLayout,
  getAvailableLayouts,
  getLayoutDisplayName,
} from '@/lib/typing/keyboard-layouts';

export function KeyboardLayoutSelector() {
  const [currentLayout, setCurrentLayout] = useState<KeyboardLayout>('qwerty');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const availableLayouts = getAvailableLayouts();

  // Load current layout
  useEffect(() => {
    async function loadLayout() {
      try {
        const response = await fetch('/api/user/preferences');
        if (response.ok) {
          const data = await response.json();
          setCurrentLayout(data.keyboardLayout || 'qwerty');
        }
      } catch (error) {
        console.error('Failed to load keyboard layout:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadLayout();
  }, []);

  const handleLayoutChange = async (newLayout: KeyboardLayout) => {
    if (newLayout === currentLayout) return;

    setIsSaving(true);
    setMessage(null);

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
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to update keyboard layout' });
        return;
      }

      setCurrentLayout(newLayout);
      setMessage({ type: 'success', text: 'Keyboard layout updated successfully' });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage((prev) => (prev?.type === 'success' ? null : prev));
      }, 3000);
    } catch (error) {
      console.error('Failed to update keyboard layout:', error);
      setMessage({ type: 'error', text: 'Failed to update keyboard layout' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading keyboard layout...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2">Keyboard Layout</Label>
        <p className="text-xs text-muted-foreground mb-3">
          Select your keyboard layout. This ensures the typing trainer correctly recognizes your key presses.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {availableLayouts.map((layout) => {
          const isSelected = layout === currentLayout;
          const displayName = getLayoutDisplayName(layout);

          return (
            <Button
              key={layout}
              type="button"
              variant={isSelected ? 'default' : 'outline'}
              className={`relative justify-start h-auto py-4 px-4 ${
                isSelected ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500' : ''
              }`}
              onClick={() => handleLayoutChange(layout)}
              disabled={isSaving}
            >
              <div className="flex items-center gap-2 w-full">
                <div className="flex-1 text-left">
                  <div className="font-medium">{displayName}</div>
                  <div className="text-xs opacity-80">
                    {layout === 'qwerty' && 'Standard US keyboard'}
                    {layout === 'dvorak' && 'Simplified dvorak layout'}
                    {layout === 'colemak' && 'Modern ergonomic layout'}
                  </div>
                </div>
                {isSelected && <Check className="h-4 w-4 flex-shrink-0" />}
              </div>
            </Button>
          );
        })}
      </div>

      {message && (
        <p
          className={`text-sm ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}
          role="alert"
        >
          {message.text}
        </p>
      )}

      <div className="rounded-lg bg-muted p-3 text-sm">
        <p className="font-medium mb-1">How it works:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>The trainer translates physical key presses to match your layout</li>
          <li>You can type naturally using your preferred keyboard layout</li>
          <li>Challenge text remains in standard characters (QWERTY-based)</li>
        </ul>
      </div>
    </div>
  );
}
