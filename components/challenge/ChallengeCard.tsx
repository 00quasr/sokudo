'use client';

import Link from 'next/link';
import { ChevronRight, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Challenge } from '@/lib/db/schema';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
};

export interface ChallengeCardProps {
  challenge: Challenge;
  categorySlug: string;
  index?: number;
  className?: string;
}

export function ChallengeCard({
  challenge,
  categorySlug,
  index,
  className,
}: ChallengeCardProps) {
  const difficultyClass =
    difficultyColors[challenge.difficulty] || difficultyColors.beginner;

  return (
    <Link
      href={`/practice/${categorySlug}/${challenge.id}`}
      className={cn(
        'group flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-orange-300 hover:shadow-md',
        className
      )}
    >
      <div className="flex items-center gap-4">
        {typeof index === 'number' && (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
            {index + 1}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-mono text-sm text-gray-900 group-hover:text-orange-600 line-clamp-1">
            {challenge.content}
          </p>
          {challenge.hint && (
            <p className="mt-1 text-xs text-gray-500 line-clamp-1">
              {challenge.hint}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-4">
        {challenge.avgWpm > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Gauge className="h-3.5 w-3.5" />
            <span>{challenge.avgWpm} WPM</span>
          </div>
        )}
        <span
          className={cn(
            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize',
            difficultyClass
          )}
        >
          {challenge.difficulty}
        </span>
        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-orange-500" />
      </div>
    </Link>
  );
}
