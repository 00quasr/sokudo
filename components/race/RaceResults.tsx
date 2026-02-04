'use client';

import type { ParticipantState } from '@/lib/ws/race-server';
import { Crown, Trophy, Medal, Zap, Target, Clock } from 'lucide-react';

export interface RaceResultsProps {
  participants: ParticipantState[];
  currentUserId?: number;
  raceStartedAt?: string | null;
}

interface RankedParticipant extends ParticipantState {
  timeTaken: number | null; // seconds from race start to finish
}

const PODIUM_STYLES: Record<number, { bg: string; border: string; text: string; icon: typeof Crown }> = {
  1: { bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-700', icon: Crown },
  2: { bg: 'bg-gray-50', border: 'border-gray-400', text: 'text-gray-600', icon: Trophy },
  3: { bg: 'bg-amber-50', border: 'border-amber-600', text: 'text-amber-700', icon: Medal },
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function RaceResults({
  participants,
  currentUserId,
  raceStartedAt,
}: RaceResultsProps) {
  const startTime = raceStartedAt ? new Date(raceStartedAt).getTime() : null;

  // Build ranked list with time calculations
  const ranked: RankedParticipant[] = participants
    .filter((p) => p.finishedAt !== null)
    .map((p) => ({
      ...p,
      timeTaken:
        startTime && p.finishedAt
          ? Math.max(0, (new Date(p.finishedAt).getTime() - startTime) / 1000)
          : null,
    }))
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));

  // Include DNF participants (did not finish)
  const dnf: RankedParticipant[] = participants
    .filter((p) => p.finishedAt === null)
    .map((p) => ({
      ...p,
      timeTaken: null,
    }));

  const allParticipants = [...ranked, ...dnf];
  const maxWpm = Math.max(...ranked.map((p) => p.wpm ?? 0), 1);

  if (allParticipants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6" data-testid="race-results">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900" data-testid="results-title">
          Race Results
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {ranked.length} of {allParticipants.length} player{allParticipants.length !== 1 ? 's' : ''} finished
        </p>
      </div>

      {/* Podium - top 3 */}
      {ranked.length > 0 && (
        <div
          className="flex items-end justify-center gap-4"
          data-testid="podium"
        >
          {/* Reorder for podium display: 2nd, 1st, 3rd */}
          {[ranked[1], ranked[0], ranked[2]]
            .filter(Boolean)
            .map((p) => {
              const rank = p.rank ?? 0;
              const style = PODIUM_STYLES[rank] ?? PODIUM_STYLES[3];
              const Icon = style.icon;
              const isCurrentUser = p.userId === currentUserId;
              const heightClass =
                rank === 1 ? 'h-32' : rank === 2 ? 'h-24' : 'h-20';

              return (
                <div
                  key={p.userId}
                  className="flex flex-col items-center"
                  data-testid={`podium-${rank}`}
                >
                  {/* Avatar + name */}
                  <div
                    className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${
                      rank === 1
                        ? 'bg-yellow-500'
                        : rank === 2
                          ? 'bg-gray-400'
                          : 'bg-amber-600'
                    }`}
                  >
                    {getInitial(p.userName)}
                  </div>
                  <span className="mb-1 text-sm font-medium text-gray-900">
                    {p.userName}
                    {isCurrentUser && (
                      <span className="ml-1 text-xs text-gray-400">(you)</span>
                    )}
                  </span>
                  <span className="mb-2 text-xs font-semibold text-gray-600">
                    {p.wpm ?? 0} WPM
                  </span>

                  {/* Podium block */}
                  <div
                    className={`flex w-24 ${heightClass} flex-col items-center justify-center rounded-t-lg border-2 ${style.border} ${style.bg}`}
                  >
                    <Icon className={`h-5 w-5 ${style.text}`} />
                    <span
                      className={`mt-1 text-lg font-bold ${style.text}`}
                    >
                      #{rank}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Full rankings table */}
      <div
        className="rounded-xl border border-gray-200 bg-white"
        data-testid="rankings-table"
      >
        <div className="border-b border-gray-100 px-6 py-3">
          <h4 className="text-sm font-semibold text-gray-700">Rankings</h4>
        </div>

        <div className="divide-y divide-gray-100">
          {allParticipants.map((p) => {
            const isCurrentUser = p.userId === currentUserId;
            const isFinished = p.finishedAt !== null;
            const wpmBarWidth =
              isFinished && p.wpm !== null
                ? Math.max(4, (p.wpm / maxWpm) * 100)
                : 0;

            return (
              <div
                key={p.userId}
                className={`flex items-center gap-4 px-6 py-3 ${
                  isCurrentUser ? 'bg-blue-50/50' : ''
                }`}
                data-testid={`result-row-${p.userId}`}
              >
                {/* Rank */}
                <div className="flex w-8 shrink-0 items-center justify-center">
                  {isFinished && p.rank !== null ? (
                    <span
                      className={`text-sm font-bold ${
                        p.rank === 1
                          ? 'text-yellow-600'
                          : p.rank === 2
                            ? 'text-gray-500'
                            : p.rank === 3
                              ? 'text-amber-600'
                              : 'text-gray-400'
                      }`}
                      data-testid={`rank-${p.userId}`}
                    >
                      #{p.rank}
                    </span>
                  ) : (
                    <span
                      className="text-xs text-gray-400"
                      data-testid={`dnf-${p.userId}`}
                    >
                      DNF
                    </span>
                  )}
                </div>

                {/* Avatar + name */}
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-700">
                    {getInitial(p.userName)}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isCurrentUser ? 'text-blue-900' : 'text-gray-900'
                    }`}
                  >
                    {p.userName}
                    {isCurrentUser && (
                      <span className="ml-1 text-xs text-gray-400">(you)</span>
                    )}
                  </span>
                </div>

                {/* WPM bar + stats */}
                <div className="ml-auto flex items-center gap-4">
                  {/* WPM comparison bar */}
                  {isFinished && p.wpm !== null && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full transition-all ${
                            p.rank === 1
                              ? 'bg-yellow-500'
                              : p.rank === 2
                                ? 'bg-gray-400'
                                : p.rank === 3
                                  ? 'bg-amber-500'
                                  : 'bg-gray-300'
                          }`}
                          style={{ width: `${wpmBarWidth}%` }}
                          data-testid={`wpm-bar-${p.userId}`}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-gray-400" />
                        <span
                          className="w-14 text-right text-sm font-mono font-semibold text-gray-800"
                          data-testid={`wpm-value-${p.userId}`}
                        >
                          {p.wpm} WPM
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Accuracy */}
                  {isFinished && p.accuracy !== null && (
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3 text-gray-400" />
                      <span
                        className="text-sm font-mono text-gray-500"
                        data-testid={`accuracy-value-${p.userId}`}
                      >
                        {p.accuracy}%
                      </span>
                    </div>
                  )}

                  {/* Time taken */}
                  {isFinished && p.timeTaken !== null && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span
                        className="text-sm font-mono text-gray-500"
                        data-testid={`time-value-${p.userId}`}
                      >
                        {formatTime(p.timeTaken)}
                      </span>
                    </div>
                  )}

                  {/* DNF indicator */}
                  {!isFinished && (
                    <span className="text-xs text-gray-400 italic">
                      Did not finish
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
