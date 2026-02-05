'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Shortcut {
  key: string;
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  { key: '?', description: 'Show keyboard shortcuts', category: 'Global' },
  { key: 'Escape', description: 'Close dialogs and modals', category: 'Global' },
  { key: '/', description: 'Focus search (when available)', category: 'Global' },
  { key: 'Tab', description: 'Skip to next challenge', category: 'Typing Practice' },
  { key: 'Escape', description: 'Retry current challenge', category: 'Typing Practice' },
  { key: 'Enter', description: 'Go to next challenge after completion', category: 'Typing Practice' },
  { key: 'Backspace', description: 'Delete last character', category: 'Typing Practice' },
  { key: 'r', description: 'Retry challenge (in completion modal)', category: 'Typing Practice' },
  { key: 'n', description: 'Next challenge (in completion modal)', category: 'Typing Practice' },
  { key: 'Alt + 1-9', description: 'Navigate to category by number', category: 'Navigation' },
  { key: 'g then h', description: 'Go to home', category: 'Navigation' },
  { key: 'g then p', description: 'Go to practice', category: 'Navigation' },
  { key: 'g then d', description: 'Go to dashboard', category: 'Navigation' },
];

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show shortcuts dialog with Shift + ?
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate Sokudo more efficiently
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {categories.map(category => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts
                  .filter(s => s.category === category)
                  .map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
                    >
                      <span className="text-sm text-muted-foreground">
                        {shortcut.description}
                      </span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-background border border-border rounded">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1 py-0.5 text-xs border border-border rounded">Shift</kbd> +{' '}
            <kbd className="px-1 py-0.5 text-xs border border-border rounded">?</kbd> to show this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
