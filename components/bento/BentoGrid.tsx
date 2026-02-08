import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BentoGridProps {
  children: ReactNode;
  className?: string;
  /** Number of columns at different breakpoints */
  cols?: {
    default?: 1 | 2 | 3 | 4;
    sm?: 1 | 2 | 3 | 4;
    md?: 1 | 2 | 3 | 4;
    lg?: 1 | 2 | 3 | 4;
  };
}

const colClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

export function BentoGrid({
  children,
  className,
  cols = { default: 1, sm: 2, md: 2, lg: 4 },
}: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4',
        cols.default && colClasses[cols.default],
        cols.sm && `sm:${colClasses[cols.sm]}`,
        cols.md && `md:${colClasses[cols.md]}`,
        cols.lg && `lg:${colClasses[cols.lg]}`,
        className
      )}
    >
      {children}
    </div>
  );
}
