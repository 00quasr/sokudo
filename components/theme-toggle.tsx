'use client';

import * as React from 'react';
import { Eye } from 'lucide-react';
import { useHighContrast } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';

// Simplified toggle - just high contrast for accessibility
export function ThemeToggle() {
  const { highContrast, setHighContrast } = useHighContrast();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled className="text-white/50">
        <Eye className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle high contrast</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setHighContrast(!highContrast)}
      className={`text-white/50 hover:text-white hover:bg-white/5 ${highContrast ? 'bg-white/10 text-white' : ''}`}
      title={highContrast ? 'Disable high contrast' : 'Enable high contrast'}
    >
      <Eye className="h-[1.2rem] w-[1.2rem]" />
      <span className="sr-only">Toggle high contrast</span>
    </Button>
  );
}
