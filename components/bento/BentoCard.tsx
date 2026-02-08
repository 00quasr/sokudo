import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BentoCardProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Card footer content */
  footer?: ReactNode;
  /** Span multiple columns */
  colSpan?: 1 | 2 | 3 | 4;
}

const colSpanClasses = {
  1: 'col-span-1',
  2: 'col-span-1 sm:col-span-2',
  3: 'col-span-1 sm:col-span-2 lg:col-span-3',
  4: 'col-span-1 sm:col-span-2 lg:col-span-4',
};

export function BentoCard({
  title,
  description,
  icon,
  children,
  className,
  footer,
  colSpan = 1,
}: BentoCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-6',
        'flex flex-col',
        colSpanClasses[colSpan],
        className
      )}
    >
      {(icon || title || description) && (
        <div className="mb-4">
          {icon && (
            <div className="mb-3 inline-flex items-center justify-center rounded-lg bg-muted p-2 text-muted-foreground">
              {icon}
            </div>
          )}
          {title && (
            <h3 className="text-lg font-medium text-foreground">{title}</h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {children && <div className="flex-1">{children}</div>}

      {footer && (
        <div className="mt-4 pt-4 border-t border-border">
          {footer}
        </div>
      )}
    </div>
  );
}
