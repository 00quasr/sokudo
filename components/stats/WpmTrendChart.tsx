'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface WpmTrendDataPoint {
  date: string;
  avgWpm: number;
  sessions: number;
}

interface WpmTrendChartProps {
  data: WpmTrendDataPoint[];
  period: '7' | '30';
}

export function WpmTrendChart({ data, period }: WpmTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return null;
  }

  const maxWpm = Math.max(...data.map((d) => d.avgWpm), 1);
  const minWpm = Math.min(...data.map((d) => d.avgWpm));
  const range = maxWpm - minWpm || 1;

  // Calculate padding (10% of range, minimum 5)
  const padding = Math.max(range * 0.1, 5);
  const chartMin = Math.max(0, minWpm - padding);
  const chartMax = maxWpm + padding;
  const chartRange = chartMax - chartMin;

  // Calculate trend (comparing first half to second half averages)
  const halfLength = Math.ceil(data.length / 2);
  const firstHalf = data.slice(0, halfLength);
  const secondHalf = data.slice(halfLength);

  const firstHalfAvg =
    firstHalf.length > 0
      ? firstHalf.reduce((sum, d) => sum + d.avgWpm, 0) / firstHalf.length
      : 0;
  const secondHalfAvg =
    secondHalf.length > 0
      ? secondHalf.reduce((sum, d) => sum + d.avgWpm, 0) / secondHalf.length
      : 0;

  const trendPercentage =
    firstHalfAvg > 0
      ? Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100)
      : 0;

  const chartWidth = 100;
  const chartHeight = 60;
  const pointSpacing = chartWidth / Math.max(data.length - 1, 1);

  // Generate SVG path for the line
  const points = data.map((d, i) => ({
    x: i * pointSpacing,
    y: chartHeight - ((d.avgWpm - chartMin) / chartRange) * chartHeight,
  }));

  const linePath =
    points.length > 0
      ? `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`
      : '';

  // Generate area path (filled area under line)
  const areaPath =
    points.length > 0
      ? `M ${points[0].x},${chartHeight} L ${points.map((p) => `${p.x},${p.y}`).join(' L ')} L ${points[points.length - 1].x},${chartHeight} Z`
      : '';

  // Format date for display
  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="rounded-2xl bg-white/[0.02] p-6">
      <div className="pb-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-medium text-white">
            WPM trend
            <span className="text-sm font-normal text-white/40">
              (Last {period} days)
            </span>
          </h2>
          {trendPercentage !== 0 && (
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                trendPercentage > 0
                  ? 'text-white'
                  : trendPercentage < 0
                    ? 'text-white/40'
                    : 'text-white/50'
              }`}
            >
              {trendPercentage > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : trendPercentage < 0 ? (
                <TrendingDown className="h-4 w-4" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              {trendPercentage > 0 ? '+' : ''}
              {trendPercentage}%
            </div>
          )}
        </div>
      </div>
      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-xs text-white/40">
          <span>{Math.round(chartMax)}</span>
          <span>{Math.round(chartMin)}</span>
        </div>

        {/* Chart area */}
        <div className="ml-10">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-40"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            <line
              x1="0"
              y1={chartHeight / 2}
              x2={chartWidth}
              y2={chartHeight / 2}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />

            {/* Area fill */}
            <path d={areaPath} fill="url(#wpmGradient)" opacity="0.4" />

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />

            {/* Data points */}
            {points.map((point, i) => (
              <circle
                key={i}
                cx={point.x}
                cy={point.y}
                r={hoveredIndex === i ? 4 : 2.5}
                fill={hoveredIndex === i ? '#60a5fa' : '#08090a'}
                stroke="#60a5fa"
                strokeWidth="2"
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {/* Gradient definition */}
            <defs>
              <linearGradient
                id="wpmGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          {/* X-axis labels */}
          <div className="flex justify-between text-xs text-white/40 mt-2">
            <span>{formatDateLabel(data[0].date)}</span>
            {data.length > 2 && (
              <span>
                {formatDateLabel(data[Math.floor(data.length / 2)].date)}
              </span>
            )}
            <span>{formatDateLabel(data[data.length - 1].date)}</span>
          </div>
        </div>

        {/* Tooltip */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div
            className="absolute bg-[#1a1a1d] text-white px-3 py-2 rounded-lg text-sm shadow-lg pointer-events-none z-10 border border-white/[0.08]"
            style={{
              left: `calc(${(hoveredIndex / Math.max(data.length - 1, 1)) * 100}% + 40px)`,
              top: '-8px',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-semibold">
              {formatDateLabel(data[hoveredIndex].date)}
            </div>
            <div className="text-white/80">
              {data[hoveredIndex].avgWpm} WPM
            </div>
            <div className="text-white/40 text-xs">
              {data[hoveredIndex].sessions} session
              {data[hoveredIndex].sessions !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
