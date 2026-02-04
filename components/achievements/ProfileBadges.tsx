'use client';

import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { AchievementIcon } from './achievement-icons';
import { cn } from '@/lib/utils';

export interface ProfileBadge {
  id: number;
  slug: string;
  name: string;
  icon: string;
  earnedAt: Date | null;
}

interface ProfileBadgesProps {
  badges: ProfileBadge[];
  totalAchievements: number;
}

export function ProfileBadges({ badges, totalAchievements }: ProfileBadgesProps) {
  const earnedBadges = badges.filter((b) => b.earnedAt !== null);
  const earnedCount = earnedBadges.length;

  return (
    <div data-testid="profile-badges">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <h3 className="text-sm font-medium text-gray-900">Badges</h3>
          <span className="text-xs text-muted-foreground">
            {earnedCount}/{totalAchievements}
          </span>
        </div>
        <Link
          href="/dashboard/achievements"
          className="text-xs text-orange-500 hover:text-orange-600 font-medium"
        >
          View all
        </Link>
      </div>

      {earnedCount === 0 ? (
        <p
          data-testid="profile-badges-empty"
          className="text-sm text-muted-foreground"
        >
          No badges earned yet. Complete challenges to unlock badges.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2" data-testid="profile-badges-list">
          {earnedBadges.map((badge) => (
            <div
              key={badge.id}
              title={badge.name}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full',
                'bg-yellow-500/10 border border-yellow-500/20',
                'transition-colors hover:bg-yellow-500/20'
              )}
            >
              <AchievementIcon
                icon={badge.icon}
                className="h-4 w-4 text-yellow-500"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
