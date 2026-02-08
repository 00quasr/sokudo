import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BentoStatProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function BentoStat({
  label,
  value,
  icon,
  trend,
  className,
}: BentoStatProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-800 bg-zinc-900 p-6',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-50">{value}</p>
          {trend && (
            <p
              className={cn(
                'mt-1 text-sm',
                trend.isPositive ? 'text-green-500' : 'text-red-500'
              )}
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
            </p>
          )}
        </div>
        {icon && (
          <div className="text-zinc-500">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
