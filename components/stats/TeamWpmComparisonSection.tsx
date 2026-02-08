'use client';

import { useState } from 'react';
import { TeamWpmComparisonChart } from './TeamWpmComparisonChart';

interface MemberDataPoint {
  date: string;
  avgWpm: number;
  sessions: number;
}

interface MemberComparison {
  userId: number;
  userName: string | null;
  userEmail: string;
  data: MemberDataPoint[];
}

interface TeamWpmComparisonSectionProps {
  data7Days: MemberComparison[];
  data30Days: MemberComparison[];
}

export function TeamWpmComparisonSection({
  data7Days,
  data30Days,
}: TeamWpmComparisonSectionProps) {
  const [period, setPeriod] = useState<'7' | '30'>('7');

  const members = period === '7' ? data7Days : data30Days;

  if (data7Days.length === 0 && data30Days.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <div className="inline-flex rounded-lg bg-white/5 p-1">
          <button
            onClick={() => setPeriod('7')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              period === '7'
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white'
            }`}
          >
            7 days
          </button>
          <button
            onClick={() => setPeriod('30')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              period === '30'
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white'
            }`}
          >
            30 days
          </button>
        </div>
      </div>
      <TeamWpmComparisonChart members={members} period={period} />
    </div>
  );
}
