'use client';

import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Target,
  Clock,
  Keyboard,
  Trophy,
  CalendarDays,
} from 'lucide-react';
import type { MonthlyComparison } from '@/lib/db/queries';

interface MonthlyComparisonSectionProps {
  data: MonthlyComparison;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

interface StatItemProps {
  label: string;
  thisMonth: number | string;
  lastMonth: number | string;
  change: number;
  suffix?: string;
  icon: React.ReactNode;
}

function StatItem({
  label,
  thisMonth,
  lastMonth,
  change,
  suffix = '',
  icon,
}: StatItemProps) {
  const getTrendIcon = () => {
    if (change > 0) return <TrendingUp className="h-3 w-3" />;
    if (change < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (change > 0) return 'text-emerald-400';
    if (change < 0) return 'text-rose-400';
    return 'text-white/50';
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/[0.08] last:border-0">
      <div className="bg-white/5 rounded-full p-2">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-white/40 tracking-wide mb-1">
          {label}
        </p>
        <div className="flex items-baseline gap-4">
          <div>
            <span className="text-lg font-mono font-semibold text-white">
              {thisMonth}
              {suffix}
            </span>
            <span className="text-xs text-white/40 ml-1">this month</span>
          </div>
          <div>
            <span className="text-sm font-mono text-white/50">
              {lastMonth}
              {suffix}
            </span>
            <span className="text-xs text-white/40 ml-1">last month</span>
          </div>
        </div>
      </div>
      {(thisMonth !== 0 || lastMonth !== 0) && (
        <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
          {getTrendIcon()}
          {change > 0 ? '+' : ''}
          {change}%
        </div>
      )}
    </div>
  );
}

export function MonthlyComparisonSection({ data }: MonthlyComparisonSectionProps) {
  const { thisMonth, lastMonth, changes } = data;

  // Don't show if no data for either month
  if (thisMonth.totalSessions === 0 && lastMonth.totalSessions === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-white/[0.02] p-6">
      <div className="pb-4">
        <h2 className="flex items-center gap-2 text-lg font-medium text-white">
          <Calendar className="h-5 w-5 text-white/60" />
          Monthly comparison
          <span className="text-sm font-normal text-white/40">
            ({thisMonth.monthLabel} vs {lastMonth.monthLabel})
          </span>
        </h2>
      </div>
      <div className="space-y-0">
        <StatItem
          label="Sessions"
          thisMonth={thisMonth.totalSessions}
          lastMonth={lastMonth.totalSessions}
          change={changes.sessions}
          icon={<Keyboard className="h-4 w-4 text-white/60" />}
        />
        <StatItem
          label="Avg WPM"
          thisMonth={thisMonth.avgWpm}
          lastMonth={lastMonth.avgWpm}
          change={changes.avgWpm}
          icon={<TrendingUp className="h-4 w-4 text-white/60" />}
        />
        <StatItem
          label="Avg accuracy"
          thisMonth={thisMonth.avgAccuracy}
          lastMonth={lastMonth.avgAccuracy}
          change={changes.avgAccuracy}
          suffix="%"
          icon={<Target className="h-4 w-4 text-white/60" />}
        />
        <StatItem
          label="Practice time"
          thisMonth={formatTime(thisMonth.totalPracticeTimeMs)}
          lastMonth={formatTime(lastMonth.totalPracticeTimeMs)}
          change={changes.practiceTime}
          icon={<Clock className="h-4 w-4 text-white/60" />}
        />
        <StatItem
          label="Best WPM"
          thisMonth={thisMonth.bestWpm}
          lastMonth={lastMonth.bestWpm}
          change={changes.bestWpm}
          icon={<Trophy className="h-4 w-4 text-white/60" />}
        />
        <StatItem
          label="Days practiced"
          thisMonth={thisMonth.daysWithPractice}
          lastMonth={lastMonth.daysWithPractice}
          change={changes.daysWithPractice}
          icon={<CalendarDays className="h-4 w-4 text-white/60" />}
        />
      </div>
    </div>
  );
}
