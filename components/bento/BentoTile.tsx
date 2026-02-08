import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BentoTileProps {
  children: ReactNode;
  className?: string;
  /** Span multiple columns */
  colSpan?: 1 | 2 | 3 | 4;
  /** Span multiple rows */
  rowSpan?: 1 | 2;
  /** Visual variant */
  variant?: 'default' | 'feature' | 'stat' | 'action';
  /** Make tile clickable */
  onClick?: () => void;
  /** Href for link tiles */
  href?: string;
}

const variantClasses = {
  default: 'bg-zinc-900 border-zinc-800',
  feature: 'bg-zinc-900 border-zinc-800',
  stat: 'bg-zinc-900 border-zinc-800',
  action: 'bg-zinc-900 border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/80 transition-colors cursor-pointer',
};

const colSpanClasses = {
  1: 'col-span-1',
  2: 'col-span-1 sm:col-span-2',
  3: 'col-span-1 sm:col-span-2 lg:col-span-3',
  4: 'col-span-1 sm:col-span-2 lg:col-span-4',
};

const rowSpanClasses = {
  1: 'row-span-1',
  2: 'row-span-1 md:row-span-2',
};

export function BentoTile({
  children,
  className,
  colSpan = 1,
  rowSpan = 1,
  variant = 'default',
  onClick,
  href,
}: BentoTileProps) {
  const baseClasses = cn(
    'rounded-xl border p-6',
    variantClasses[variant],
    colSpanClasses[colSpan],
    rowSpanClasses[rowSpan],
    className
  );

  if (href) {
    return (
      <a href={href} className={cn(baseClasses, 'block hover:border-zinc-600 transition-colors')}>
        {children}
      </a>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={cn(baseClasses, 'text-left w-full')}>
        {children}
      </button>
    );
  }

  return <div className={baseClasses}>{children}</div>;
}
