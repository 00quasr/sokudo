'use client';

import { useState } from 'react';
import { WpmTrendChart, WpmTrendDataPoint } from './WpmTrendChart';

interface WpmTrendSectionProps {
  data7Days: WpmTrendDataPoint[];
  data30Days: WpmTrendDataPoint[];
}

export function WpmTrendSection({ data7Days, data30Days }: WpmTrendSectionProps) {
  const [period, setPeriod] = useState<'7' | '30'>('7');

  const data = period === '7' ? data7Days : data30Days;

  if (data7Days.length === 0 && data30Days.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <div className="inline-flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setPeriod('7')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              period === '7'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            7 days
          </button>
          <button
            onClick={() => setPeriod('30')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              period === '30'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            30 days
          </button>
        </div>
      </div>
      <WpmTrendChart data={data} period={period} />
    </div>
  );
}
