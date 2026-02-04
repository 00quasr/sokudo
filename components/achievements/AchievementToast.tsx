'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AchievementIcon } from './achievement-icons';

export interface AchievementToastData {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
}

interface AchievementToastProps {
  achievement: AchievementToastData;
  onDismiss: () => void;
  delay?: number;
}

export function AchievementToast({
  achievement,
  onDismiss,
  delay = 0,
}: AchievementToastProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(showTimer);
  }, [delay]);

  useEffect(() => {
    if (!visible) return;
    const autoClose = setTimeout(() => {
      setExiting(true);
    }, 5000);
    return () => clearTimeout(autoClose);
  }, [visible]);

  useEffect(() => {
    if (!exiting) return;
    const exitTimer = setTimeout(onDismiss, 300);
    return () => clearTimeout(exitTimer);
  }, [exiting, onDismiss]);

  const handleDismiss = () => {
    setExiting(true);
  };

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="achievement-toast"
      className={cn(
        'pointer-events-auto flex w-80 items-start gap-3 rounded-lg border border-yellow-500/20 bg-card p-4 shadow-lg shadow-yellow-500/5',
        'transition-all duration-300 ease-out',
        exiting
          ? 'translate-x-full opacity-0'
          : 'translate-x-0 opacity-100',
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-500/10">
        <AchievementIcon
          icon={achievement.icon}
          className="h-5 w-5 text-yellow-500"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-yellow-500">
          Achievement Unlocked
        </p>
        <p className="mt-0.5 truncate font-semibold text-foreground">
          {achievement.name}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {achievement.description}
        </p>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

interface AchievementToastContainerProps {
  achievements: AchievementToastData[];
  onAllDismissed?: () => void;
}

export function AchievementToastContainer({
  achievements,
  onAllDismissed,
}: AchievementToastContainerProps) {
  const [remaining, setRemaining] = useState<AchievementToastData[]>(
    achievements,
  );

  useEffect(() => {
    setRemaining(achievements);
  }, [achievements]);

  useEffect(() => {
    if (remaining.length === 0 && achievements.length > 0) {
      onAllDismissed?.();
    }
  }, [remaining.length, achievements.length, onAllDismissed]);

  const handleDismiss = (id: number) => {
    setRemaining((prev) => prev.filter((a) => a.id !== id));
  };

  if (remaining.length === 0) return null;

  return (
    <div
      aria-label="Achievement notifications"
      className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-3"
    >
      {remaining.map((achievement, index) => (
        <AchievementToast
          key={achievement.id}
          achievement={achievement}
          delay={index * 800}
          onDismiss={() => handleDismiss(achievement.id)}
        />
      ))}
    </div>
  );
}
