'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';

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

interface TeamWpmComparisonChartProps {
  members: MemberComparison[];
  period: '7' | '30';
}

// Monochrome colors for team members (different opacities of white)
const MEMBER_COLORS = [
  'rgba(255,255,255,0.9)',
  'rgba(255,255,255,0.7)',
  'rgba(255,255,255,0.5)',
  'rgba(255,255,255,0.35)',
  'rgba(255,255,255,0.25)',
  'rgba(255,255,255,0.18)',
  'rgba(255,255,255,0.12)',
  'rgba(255,255,255,0.08)',
];

function getMemberDisplayName(member: MemberComparison): string {
  if (member.userName) return member.userName;
  return member.userEmail.split('@')[0];
}

export function TeamWpmComparisonChart({
  members,
  period,
}: TeamWpmComparisonChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    memberIndex: number;
    pointIndex: number;
  } | null>(null);

  if (members.length === 0) {
    return null;
  }

  // Collect all unique dates across all members and sort
  const allDates = Array.from(
    new Set(members.flatMap((m) => m.data.map((d) => d.date)))
  ).sort();

  if (allDates.length === 0) {
    return null;
  }

  // Find global min/max WPM across all members
  const allWpmValues = members.flatMap((m) => m.data.map((d) => d.avgWpm));
  const maxWpm = Math.max(...allWpmValues, 1);
  const minWpm = Math.min(...allWpmValues);
  const range = maxWpm - minWpm || 1;
  const padding = Math.max(range * 0.1, 5);
  const chartMin = Math.max(0, minWpm - padding);
  const chartMax = maxWpm + padding;
  const chartRange = chartMax - chartMin;

  const chartWidth = 100;
  const chartHeight = 60;
  const dateSpacing = chartWidth / Math.max(allDates.length - 1, 1);

  // Build a date-to-x-position map
  const dateXMap = new Map(allDates.map((d, i) => [d, i * dateSpacing]));

  // Generate line paths and points for each member
  const memberLines = members.map((member, memberIndex) => {
    const points = member.data
      .map((d) => {
        const x = dateXMap.get(d.date);
        if (x === undefined) return null;
        const y =
          chartHeight - ((d.avgWpm - chartMin) / chartRange) * chartHeight;
        return { x, y, avgWpm: d.avgWpm, sessions: d.sessions, date: d.date };
      })
      .filter(
        (
          p
        ): p is {
          x: number;
          y: number;
          avgWpm: number;
          sessions: number;
          date: string;
        } => p !== null
      );

    const linePath =
      points.length > 1
        ? `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`
        : '';

    return {
      member,
      memberIndex,
      color: MEMBER_COLORS[memberIndex % MEMBER_COLORS.length],
      points,
      linePath,
    };
  });

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="rounded-2xl bg-white/[0.02] p-6">
      <div className="pb-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-medium text-white">
            <Users className="h-5 w-5 text-white/60" />
            Member WPM comparison
            <span className="text-sm font-normal text-white/40">
              (Last {period} days)
            </span>
          </h2>
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
            className="w-full h-48"
            preserveAspectRatio="none"
            data-testid="comparison-chart"
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
            <line
              x1="0"
              y1={chartHeight / 4}
              x2={chartWidth}
              y2={chartHeight / 4}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="0.3"
              strokeDasharray="2,2"
            />
            <line
              x1="0"
              y1={(chartHeight * 3) / 4}
              x2={chartWidth}
              y2={(chartHeight * 3) / 4}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="0.3"
              strokeDasharray="2,2"
            />

            {/* Lines for each member */}
            {memberLines.map(({ memberIndex, color, linePath }) =>
              linePath ? (
                <path
                  key={`line-${memberIndex}`}
                  d={linePath}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={
                    hoveredPoint !== null &&
                    hoveredPoint.memberIndex !== memberIndex
                      ? 0.3
                      : 1
                  }
                />
              ) : null
            )}

            {/* Data points for each member */}
            {memberLines.map(({ memberIndex, color, points }) =>
              points.map((point, pointIndex) => (
                <circle
                  key={`point-${memberIndex}-${pointIndex}`}
                  cx={point.x}
                  cy={point.y}
                  r={
                    hoveredPoint?.memberIndex === memberIndex &&
                    hoveredPoint?.pointIndex === pointIndex
                      ? 4
                      : 2.5
                  }
                  fill={
                    hoveredPoint?.memberIndex === memberIndex &&
                    hoveredPoint?.pointIndex === pointIndex
                      ? color
                      : '#08090a'
                  }
                  stroke={color}
                  strokeWidth="2"
                  className="cursor-pointer transition-all"
                  onMouseEnter={() =>
                    setHoveredPoint({ memberIndex, pointIndex })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                  vectorEffect="non-scaling-stroke"
                  opacity={
                    hoveredPoint !== null &&
                    hoveredPoint.memberIndex !== memberIndex
                      ? 0.3
                      : 1
                  }
                />
              ))
            )}
          </svg>

          {/* X-axis labels */}
          <div className="flex justify-between text-xs text-white/40 mt-2">
            <span>{formatDateLabel(allDates[0])}</span>
            {allDates.length > 2 && (
              <span>
                {formatDateLabel(allDates[Math.floor(allDates.length / 2)])}
              </span>
            )}
            <span>{formatDateLabel(allDates[allDates.length - 1])}</span>
          </div>
        </div>

        {/* Tooltip */}
        {hoveredPoint !== null && (() => {
          const ml = memberLines[hoveredPoint.memberIndex];
          const point = ml?.points[hoveredPoint.pointIndex];
          if (!ml || !point) return null;

          return (
            <div
              className="absolute bg-[#1a1a1d] text-white px-3 py-2 rounded-lg text-sm shadow-lg pointer-events-none z-10 border border-white/[0.08]"
              style={{
                left: `calc(${(dateXMap.get(point.date) ?? 0) / chartWidth * 100}% + 40px)`,
                top: '-8px',
                transform: 'translateX(-50%)',
              }}
            >
              <div className="font-semibold text-white">
                {getMemberDisplayName(ml.member)}
              </div>
              <div className="text-white/60">
                {formatDateLabel(point.date)}
              </div>
              <div className="text-white/80">
                {point.avgWpm} WPM
              </div>
              <div className="text-white/40 text-xs">
                {point.sessions} session{point.sessions !== 1 ? 's' : ''}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-white/[0.08]">
        {memberLines.map(({ member, memberIndex, color }) => (
          <div
            key={memberIndex}
            className="flex items-center gap-2 text-sm"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-white/50">
              {getMemberDisplayName(member)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
