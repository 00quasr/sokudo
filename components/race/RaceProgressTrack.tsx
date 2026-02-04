'use client';

import type { ParticipantState } from '@/lib/ws/race-server';
import { Crown, Trophy, Flag } from 'lucide-react';

export interface RaceProgressTrackProps {
  participants: ParticipantState[];
  currentUserId?: number;
  raceStatus: 'waiting' | 'countdown' | 'in_progress' | 'finished';
  totalChallenges?: number;
  className?: string;
}

const LANE_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-pink-500',
];

const LANE_TEXT_COLORS = [
  'text-blue-500',
  'text-emerald-500',
  'text-amber-500',
  'text-purple-500',
  'text-rose-500',
  'text-cyan-500',
  'text-orange-500',
  'text-pink-500',
];

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function RaceProgressTrack({
  participants,
  currentUserId,
  raceStatus,
  totalChallenges,
  className,
}: RaceProgressTrackProps) {
  const isActive = raceStatus === 'in_progress' || raceStatus === 'countdown';
  const isFinished = raceStatus === 'finished';

  // Sort: finished participants by rank, then unfinished by progress descending
  const sorted = [...participants].sort((a, b) => {
    if (a.finishedAt && b.finishedAt) {
      return (a.rank ?? 0) - (b.rank ?? 0);
    }
    if (a.finishedAt) return -1;
    if (b.finishedAt) return 1;
    return b.progress - a.progress;
  });

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-6 ${className ?? ''}`}
      data-testid="race-progress-track"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Race Track</h3>
        {isActive && (
          <span className="text-xs font-medium text-orange-500">LIVE</span>
        )}
        {isFinished && (
          <span className="text-xs font-medium text-gray-500">FINISHED</span>
        )}
      </div>

      <div className="space-y-3" data-testid="race-lanes">
        {sorted.map((participant, idx) => {
          const isCurrentUser = participant.userId === currentUserId;
          const laneColor = LANE_COLORS[idx % LANE_COLORS.length];
          const laneTextColor = LANE_TEXT_COLORS[idx % LANE_TEXT_COLORS.length];
          const progress = Math.min(100, Math.max(0, participant.progress));
          const hasFinished = participant.finishedAt !== null;

          return (
            <div
              key={participant.userId}
              className={`relative rounded-lg border px-3 py-2 ${
                isCurrentUser
                  ? 'border-blue-300 bg-blue-50/50'
                  : 'border-gray-100 bg-gray-50'
              }`}
              data-testid={`race-lane-${participant.userId}`}
            >
              {/* Participant info row */}
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Rank badge for finished participants */}
                  {hasFinished && participant.rank === 1 && (
                    <Crown
                      className="h-3.5 w-3.5 text-yellow-500"
                      data-testid={`rank-icon-${participant.userId}`}
                    />
                  )}
                  {hasFinished && participant.rank === 2 && (
                    <Trophy
                      className="h-3.5 w-3.5 text-gray-400"
                      data-testid={`rank-icon-${participant.userId}`}
                    />
                  )}
                  {hasFinished && participant.rank === 3 && (
                    <Trophy
                      className="h-3.5 w-3.5 text-amber-600"
                      data-testid={`rank-icon-${participant.userId}`}
                    />
                  )}

                  {/* Avatar */}
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${laneColor}`}
                  >
                    {getInitial(participant.userName)}
                  </div>

                  {/* Name */}
                  <span
                    className={`text-sm font-medium ${
                      isCurrentUser ? 'text-blue-900' : 'text-gray-800'
                    }`}
                  >
                    {participant.userName}
                    {isCurrentUser && (
                      <span className="ml-1 text-xs text-gray-400">(you)</span>
                    )}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {totalChallenges && totalChallenges > 1 && !hasFinished && (
                    <span
                      className="font-mono text-gray-600"
                      data-testid={`challenge-index-${participant.userId}`}
                    >
                      {participant.currentChallengeIndex + 1}/{totalChallenges}
                    </span>
                  )}
                  {(isActive || isFinished) && participant.currentWpm > 0 && (
                    <span
                      className={`font-mono font-medium ${laneTextColor}`}
                      data-testid={`wpm-${participant.userId}`}
                    >
                      {hasFinished && participant.wpm !== null
                        ? participant.wpm
                        : participant.currentWpm}{' '}
                      WPM
                    </span>
                  )}
                  {hasFinished && participant.accuracy !== null && (
                    <span
                      className="font-mono text-gray-400"
                      data-testid={`accuracy-${participant.userId}`}
                    >
                      {participant.accuracy}%
                    </span>
                  )}
                  {hasFinished && participant.rank !== null && (
                    <span
                      className="font-bold text-gray-700"
                      data-testid={`rank-${participant.userId}`}
                    >
                      #{participant.rank}
                    </span>
                  )}
                  {isActive && !hasFinished && (
                    <span
                      className="font-mono text-gray-400"
                      data-testid={`progress-pct-${participant.userId}`}
                    >
                      {Math.round(progress)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Progress track */}
              <div
                className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200"
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${participant.userName} progress`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-300 ease-out ${laneColor} ${
                    hasFinished ? 'opacity-80' : ''
                  }`}
                  style={{ width: `${progress}%` }}
                  data-testid={`progress-bar-${participant.userId}`}
                />

                {/* Finish flag at the end */}
                {progress >= 100 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <Flag className="h-2.5 w-2.5 text-gray-600" />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {participants.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-400">
            Waiting for players to join...
          </div>
        )}
      </div>
    </div>
  );
}
