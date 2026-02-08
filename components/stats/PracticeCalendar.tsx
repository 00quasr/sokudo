'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';

export interface PracticeDay {
  date: string;
  practiceTimeMs: number;
  sessionsCompleted: number;
}

interface PracticeCalendarProps {
  data: PracticeDay[];
}

const CELL_SIZE = 13;
const CELL_GAP = 3;
const WEEKS_TO_SHOW = 53;
const DAYS_IN_WEEK = 7;

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function getIntensityLevel(
  sessions: number,
  maxSessions: number
): 0 | 1 | 2 | 3 | 4 {
  if (sessions === 0) return 0;
  if (maxSessions <= 0) return 1;
  const ratio = sessions / maxSessions;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

// Soft green tones for practice activity (GitHub-style convention)
const LEVEL_COLORS: Record<number, string> = {
  0: 'rgba(255,255,255,0.03)',
  1: '#0e4429',
  2: '#006d32',
  3: '#26a641',
  4: '#39d353',
};

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${Math.ceil(ms / 1000)}s`;
}

function buildCalendarGrid(data: PracticeDay[]) {
  const dataMap = new Map<string, PracticeDay>();
  for (const d of data) {
    dataMap.set(d.date, d);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the Sunday that starts the last (rightmost) week column
  const todayDay = today.getDay(); // 0=Sun
  const endOfGrid = new Date(today);

  // Start of grid: go back WEEKS_TO_SHOW * 7 days from the start of this week
  const startOfGrid = new Date(endOfGrid);
  startOfGrid.setDate(
    startOfGrid.getDate() - todayDay - (WEEKS_TO_SHOW - 1) * 7
  );

  const weeks: {
    date: Date;
    dateStr: string;
    sessions: number;
    practiceTimeMs: number;
  }[][] = [];
  let currentWeek: typeof weeks[number] = [];

  const cursor = new Date(startOfGrid);
  while (cursor <= endOfGrid) {
    const dateStr = cursor.toISOString().split('T')[0];
    const entry = dataMap.get(dateStr);

    currentWeek.push({
      date: new Date(cursor),
      dateStr,
      sessions: entry?.sessionsCompleted ?? 0,
      practiceTimeMs: entry?.practiceTimeMs ?? 0,
    });

    if (currentWeek.length === DAYS_IN_WEEK) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}

function getMonthLabels(
  weeks: ReturnType<typeof buildCalendarGrid>
): { label: string; col: number }[] {
  const labels: { label: string; col: number }[] = [];
  let lastMonth = -1;

  for (let col = 0; col < weeks.length; col++) {
    const firstDay = weeks[col][0];
    if (!firstDay) continue;
    const month = firstDay.date.getMonth();
    if (month !== lastMonth) {
      labels.push({ label: MONTH_LABELS[month], col });
      lastMonth = month;
    }
  }

  return labels;
}

export function PracticeCalendar({ data }: PracticeCalendarProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    dateStr: string;
    sessions: number;
    practiceTimeMs: number;
    x: number;
    y: number;
  } | null>(null);

  const weeks = buildCalendarGrid(data);
  const monthLabels = getMonthLabels(weeks);

  const allSessions = data.map((d) => d.sessionsCompleted);
  const maxSessions = allSessions.length > 0 ? Math.max(...allSessions) : 0;

  const totalDaysActive = data.filter((d) => d.sessionsCompleted > 0).length;
  const totalSessions = data.reduce((sum, d) => sum + d.sessionsCompleted, 0);

  const svgWidth = WEEKS_TO_SHOW * (CELL_SIZE + CELL_GAP);
  const svgHeight = DAYS_IN_WEEK * (CELL_SIZE + CELL_GAP);

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div className="rounded-2xl bg-white/[0.02] p-6">
      <div className="pb-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-medium text-white">
            <Calendar className="h-5 w-5 text-white/60" />
            Practice calendar
          </h2>
          <div className="flex items-center gap-4 text-sm text-white/40">
            <span>
              <span className="font-mono font-semibold text-white">
                {totalDaysActive}
              </span>{' '}
              active days
            </span>
            <span>
              <span className="font-mono font-semibold text-white">
                {totalSessions}
              </span>{' '}
              sessions
            </span>
          </div>
        </div>
      </div>
      <div className="relative overflow-x-auto">
        {/* Month labels */}
        <div
          className="flex text-xs text-white/40 mb-1"
          style={{ marginLeft: 32 }}
        >
          {monthLabels.map((m, i) => (
            <span
              key={`${m.label}-${i}`}
              className="absolute"
              style={{
                left: 32 + m.col * (CELL_SIZE + CELL_GAP),
              }}
            >
              {m.label}
            </span>
          ))}
        </div>

        <div className="flex mt-5">
          {/* Day labels */}
          <div
            className="flex flex-col text-xs text-white/40 mr-1"
            style={{ width: 28 }}
          >
            {dayLabels.map((label, i) => (
              <span
                key={i}
                style={{
                  height: CELL_SIZE + CELL_GAP,
                  lineHeight: `${CELL_SIZE + CELL_GAP}px`,
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Grid */}
          <svg
            width={svgWidth}
            height={svgHeight}
            role="img"
            aria-label="Practice calendar heatmap"
          >
            {weeks.map((week, colIndex) =>
              week.map((day, rowIndex) => {
                const level = getIntensityLevel(
                  day.sessions,
                  maxSessions
                );
                const x = colIndex * (CELL_SIZE + CELL_GAP);
                const y = rowIndex * (CELL_SIZE + CELL_GAP);
                const isFuture = day.date > new Date();

                if (isFuture) return null;

                return (
                  <rect
                    key={day.dateStr}
                    x={x}
                    y={y}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    rx={2}
                    ry={2}
                    fill={LEVEL_COLORS[level]}
                    className="cursor-pointer"
                    data-date={day.dateStr}
                    data-level={level}
                    onMouseEnter={() =>
                      setHoveredCell({
                        dateStr: day.dateStr,
                        sessions: day.sessions,
                        practiceTimeMs: day.practiceTimeMs,
                        x: x + CELL_SIZE / 2,
                        y,
                      })
                    }
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                );
              })
            )}
          </svg>
        </div>

        {/* Tooltip */}
        {hoveredCell && (
          <div
            className="absolute bg-[#1a1a1d] text-white px-3 py-2 rounded-lg text-sm shadow-lg pointer-events-none z-10 border border-white/[0.08]"
            style={{
              left: 32 + hoveredCell.x,
              top: hoveredCell.y,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="font-semibold">
              {new Date(hoveredCell.dateStr + 'T00:00:00').toLocaleDateString(
                'en-US',
                {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }
              )}
            </div>
            {hoveredCell.sessions > 0 ? (
              <>
                <div className="text-white/80">
                  {hoveredCell.sessions} session
                  {hoveredCell.sessions !== 1 ? 's' : ''}
                </div>
                <div className="text-white/40 text-xs">
                  {formatTime(hoveredCell.practiceTimeMs)}
                </div>
              </>
            ) : (
              <div className="text-white/40">No practice</div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-end gap-1 mt-3 text-xs text-white/40">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className="inline-block rounded-sm"
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                backgroundColor: LEVEL_COLORS[level],
              }}
              data-testid={`legend-${level}`}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
