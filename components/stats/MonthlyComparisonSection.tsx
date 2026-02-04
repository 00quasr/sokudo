'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="bg-gray-100 rounded-full p-2">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          {label}
        </p>
        <div className="flex items-baseline gap-4">
          <div>
            <span className="text-lg font-mono font-semibold">
              {thisMonth}
              {suffix}
            </span>
            <span className="text-xs text-muted-foreground ml-1">this month</span>
          </div>
          <div>
            <span className="text-sm font-mono text-gray-500">
              {lastMonth}
              {suffix}
            </span>
            <span className="text-xs text-muted-foreground ml-1">last month</span>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-orange-500" />
          Monthly Comparison
          <span className="text-sm font-normal text-muted-foreground">
            ({thisMonth.monthLabel} vs {lastMonth.monthLabel})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        <StatItem
          label="Sessions"
          thisMonth={thisMonth.totalSessions}
          lastMonth={lastMonth.totalSessions}
          change={changes.sessions}
          icon={<Keyboard className="h-4 w-4 text-gray-600" />}
        />
        <StatItem
          label="Avg WPM"
          thisMonth={thisMonth.avgWpm}
          lastMonth={lastMonth.avgWpm}
          change={changes.avgWpm}
          icon={<TrendingUp className="h-4 w-4 text-orange-600" />}
        />
        <StatItem
          label="Avg Accuracy"
          thisMonth={thisMonth.avgAccuracy}
          lastMonth={lastMonth.avgAccuracy}
          change={changes.avgAccuracy}
          suffix="%"
          icon={<Target className="h-4 w-4 text-green-600" />}
        />
        <StatItem
          label="Practice Time"
          thisMonth={formatTime(thisMonth.totalPracticeTimeMs)}
          lastMonth={formatTime(lastMonth.totalPracticeTimeMs)}
          change={changes.practiceTime}
          icon={<Clock className="h-4 w-4 text-blue-600" />}
        />
        <StatItem
          label="Best WPM"
          thisMonth={thisMonth.bestWpm}
          lastMonth={lastMonth.bestWpm}
          change={changes.bestWpm}
          icon={<Trophy className="h-4 w-4 text-yellow-600" />}
        />
        <StatItem
          label="Days Practiced"
          thisMonth={thisMonth.daysWithPractice}
          lastMonth={lastMonth.daysWithPractice}
          change={changes.daysWithPractice}
          icon={<CalendarDays className="h-4 w-4 text-purple-600" />}
        />
      </CardContent>
    </Card>
  );
}
