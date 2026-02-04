'use client';

import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AchievementIcon } from './achievement-icons';

interface AchievementProgress {
  current: number;
  target: number;
  percentage: number;
  label: string;
}

interface AchievementCardProps {
  achievement: {
    id: number;
    slug: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: Date | null;
    progress?: AchievementProgress | null;
  };
}

function formatEarnedDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const isEarned = achievement.earnedAt !== null;
  const progress = achievement.progress;

  return (
    <div
      data-testid="achievement-card"
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 transition-colors',
        isEarned
          ? 'border-yellow-500/20 bg-yellow-500/5'
          : 'border-gray-200 bg-gray-50 opacity-60'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          isEarned ? 'bg-yellow-500/10' : 'bg-gray-200'
        )}
      >
        {isEarned ? (
          <AchievementIcon
            icon={achievement.icon}
            className="h-5 w-5 text-yellow-500"
          />
        ) : (
          <Lock className="h-4 w-4 text-gray-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'font-semibold truncate',
            isEarned ? 'text-foreground' : 'text-gray-500'
          )}
        >
          {achievement.name}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {achievement.description}
        </p>
        {isEarned && achievement.earnedAt && (
          <p className="mt-1 text-xs text-yellow-600">
            Earned {formatEarnedDate(achievement.earnedAt)}
          </p>
        )}
        {!isEarned && progress && (
          <div className="mt-2" data-testid="achievement-progress">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">
                {progress.label}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {progress.percentage}%
              </span>
            </div>
            <div
              className="h-1.5 w-full rounded-full bg-gray-200"
              role="progressbar"
              aria-valuenow={progress.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${progress.percentage}% progress toward ${achievement.name}`}
            >
              <div
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  progress.percentage >= 75
                    ? 'bg-yellow-500'
                    : progress.percentage >= 50
                      ? 'bg-blue-500'
                      : 'bg-gray-400'
                )}
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
