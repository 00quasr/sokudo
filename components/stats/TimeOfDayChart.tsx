'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Moon, Sunrise, Sunset } from 'lucide-react';

export interface TimeOfDayDataPoint {
  hour: number;
  avgWpm: number;
  sessions: number;
}

interface TimeOfDayChartProps {
  data: TimeOfDayDataPoint[];
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

function getTimeOfDayIcon(hour: number) {
  if (hour >= 5 && hour < 9) return <Sunrise className="h-4 w-4" />;
  if (hour >= 9 && hour < 17) return <Sun className="h-4 w-4" />;
  if (hour >= 17 && hour < 21) return <Sunset className="h-4 w-4" />;
  return <Moon className="h-4 w-4" />;
}

function getTimeOfDayLabel(hour: number): string {
  if (hour >= 5 && hour < 9) return 'Morning';
  if (hour >= 9 && hour < 12) return 'Late Morning';
  if (hour >= 12 && hour < 14) return 'Midday';
  if (hour >= 14 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
}

export function TimeOfDayChart({ data }: TimeOfDayChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return null;
  }

  const maxWpm = Math.max(...data.map((d) => d.avgWpm), 1);
  const minWpm = Math.min(...data.map((d) => d.avgWpm));

  // Calculate padding (10% of range, minimum 5)
  const range = maxWpm - minWpm || 1;
  const padding = Math.max(range * 0.1, 5);
  const chartMin = Math.max(0, minWpm - padding);
  const chartMax = maxWpm + padding;
  const chartRange = chartMax - chartMin;

  // Find best and worst hours
  const sortedByWpm = [...data].sort((a, b) => b.avgWpm - a.avgWpm);
  const bestHour = sortedByWpm[0];
  const worstHour = sortedByWpm[sortedByWpm.length - 1];

  const chartWidth = 100;
  const chartHeight = 60;
  const barWidth = chartWidth / 24;
  const barGap = barWidth * 0.2;
  const actualBarWidth = barWidth - barGap;

  // Generate bars for all 24 hours
  const bars = Array.from({ length: 24 }, (_, hour) => {
    const dataPoint = data.find((d) => d.hour === hour);
    const avgWpm = dataPoint?.avgWpm ?? 0;
    const sessions = dataPoint?.sessions ?? 0;
    const barHeight = dataPoint
      ? ((avgWpm - chartMin) / chartRange) * chartHeight
      : 0;

    return {
      hour,
      avgWpm,
      sessions,
      x: hour * barWidth + barGap / 2,
      height: Math.max(barHeight, dataPoint ? 2 : 0),
      hasData: !!dataPoint,
    };
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Speed by Time of Day
          </CardTitle>
          {bestHour && worstHour && bestHour.hour !== worstHour.hour && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-green-600">
                {getTimeOfDayIcon(bestHour.hour)}
                <span className="font-medium">{formatHour(bestHour.hour)}</span>
                <span className="text-muted-foreground">best</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-xs text-muted-foreground">
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
                stroke="#e5e7eb"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />

              {/* Bars */}
              {bars.map((bar, i) => (
                <rect
                  key={bar.hour}
                  x={bar.x}
                  y={chartHeight - bar.height}
                  width={actualBarWidth}
                  height={bar.height}
                  fill={
                    bar.hasData
                      ? hoveredIndex === i
                        ? '#ea580c'
                        : '#f97316'
                      : '#e5e7eb'
                  }
                  opacity={bar.hasData ? 1 : 0.3}
                  rx="0.5"
                  className="cursor-pointer transition-colors"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              ))}
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>12 AM</span>
              <span>6 AM</span>
              <span>12 PM</span>
              <span>6 PM</span>
              <span>12 AM</span>
            </div>
          </div>

          {/* Tooltip */}
          {hoveredIndex !== null && (
            <div
              className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg text-sm shadow-lg pointer-events-none z-10"
              style={{
                left: `calc(${(hoveredIndex / 24) * 100}% + 40px)`,
                top: '-8px',
                transform: 'translateX(-50%)',
              }}
            >
              <div className="font-semibold flex items-center gap-2">
                {getTimeOfDayIcon(hoveredIndex)}
                {formatHour(hoveredIndex)}
              </div>
              {bars[hoveredIndex].hasData ? (
                <>
                  <div className="text-orange-400">
                    {bars[hoveredIndex].avgWpm} WPM
                  </div>
                  <div className="text-gray-400 text-xs">
                    {bars[hoveredIndex].sessions} session
                    {bars[hoveredIndex].sessions !== 1 ? 's' : ''}
                  </div>
                </>
              ) : (
                <div className="text-gray-400 text-xs">No sessions</div>
              )}
            </div>
          )}
        </div>

        {/* Summary */}
        {data.length >= 2 && bestHour && worstHour && bestHour.hour !== worstHour.hour && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                  Peak Performance
                </p>
                <div className="flex items-center gap-2">
                  {getTimeOfDayIcon(bestHour.hour)}
                  <span className="font-medium">{getTimeOfDayLabel(bestHour.hour)}</span>
                  <span className="font-mono text-green-600">{bestHour.avgWpm} WPM</span>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                  Lowest Performance
                </p>
                <div className="flex items-center gap-2">
                  {getTimeOfDayIcon(worstHour.hour)}
                  <span className="font-medium">{getTimeOfDayLabel(worstHour.hour)}</span>
                  <span className="font-mono text-red-500">{worstHour.avgWpm} WPM</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
