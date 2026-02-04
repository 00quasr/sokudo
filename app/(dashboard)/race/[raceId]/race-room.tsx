'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Users,
  Loader2,
  Play,
  ArrowLeft,
  Clock,
  Zap,
  Crown,
  LogOut,
  Wifi,
  WifiOff,
  Eye,
} from 'lucide-react';
import {
  useRaceSocket,
  type RaceStateUpdate,
  type ParticipantState,
} from '@/lib/ws/use-race-socket';
import { RaceProgressTrack } from '@/components/race/RaceProgressTrack';
import { RaceCountdown } from '@/components/race/RaceCountdown';
import { RaceResults } from '@/components/race/RaceResults';

interface Participant {
  id: number;
  userId: number;
  currentChallengeIndex: number;
  wpm: number | null;
  accuracy: number | null;
  finishedAt: string | null;
  rank: number | null;
  userName: string | null;
  userEmail: string;
}

interface Challenge {
  id: number;
  content: string;
  difficulty: string;
  syntaxType: string;
}

interface RaceDetail {
  id: number;
  status: string;
  maxPlayers: number;
  createdAt: string;
  startedAt: string | null;
  updatedAt: string;
  category: {
    id: number;
    name: string;
    slug: string;
    icon: string;
    difficulty: string;
  };
  challenges: Challenge[];
  participants: Participant[];
}

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function RaceRoom({
  raceId,
  userId,
  userName,
}: {
  raceId: string;
  userId?: number;
  userName?: string;
}) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wsState, setWsState] = useState<RaceStateUpdate | null>(null);

  // Fetch initial race data via REST
  const { data, error: fetchError, isLoading, mutate } = useSWR<RaceDetail>(
    `/api/races/${raceId}`,
    fetcher,
    {
      // Use longer polling interval as WebSocket handles real-time updates
      refreshInterval: wsState ? 0 : 2000,
    }
  );

  const handleWsStateUpdate = useCallback((state: RaceStateUpdate) => {
    setWsState(state);
  }, []);

  const handleWsError = useCallback((message: string) => {
    setError(message);
  }, []);

  // Connect to WebSocket for real-time updates
  const {
    connected: wsConnected,
    sendStart,
    sendLeave,
  } = useRaceSocket({
    raceId: parseInt(raceId, 10),
    userId: userId ?? 0,
    userName: userName ?? 'Anonymous',
    onStateUpdate: handleWsStateUpdate,
    onError: handleWsError,
  });

  async function handleAction(action: string) {
    setActionLoading(action);
    setError(null);

    try {
      // Use WebSocket for start/leave if connected
      if (wsConnected && action === 'start') {
        sendStart();
        setActionLoading(null);
        return;
      }

      if (wsConnected && action === 'leave') {
        sendLeave();
        router.push('/race');
        setActionLoading(null);
        return;
      }

      // Fallback to REST API
      const res = await fetch(`/api/races/${raceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error || `Failed to ${action}`);
        return;
      }

      if (action === 'leave') {
        router.push('/race');
        return;
      }

      mutate();
    } catch {
      setError('Network error');
    } finally {
      setActionLoading(null);
    }
  }

  // Merge WebSocket state with REST data for participant display
  function getParticipants(): Participant[] {
    if (wsState && wsState.participants.length > 0) {
      return wsState.participants.map((p: ParticipantState, idx: number) => ({
        id: idx + 1,
        userId: p.userId,
        currentChallengeIndex: p.currentChallengeIndex,
        wpm: p.wpm,
        accuracy: p.accuracy,
        finishedAt: p.finishedAt,
        rank: p.rank,
        userName: p.userName,
        userEmail: '',
      }));
    }
    return data?.participants ?? [];
  }

  function getRaceStatus(): string {
    if (wsState) return wsState.status;
    return data?.status ?? 'waiting';
  }

  // Get participant state for the progress track
  function getParticipantStates(): ParticipantState[] {
    if (wsState && wsState.participants.length > 0) {
      return wsState.participants;
    }
    // Convert REST participants to ParticipantState format
    return (data?.participants ?? []).map((p) => ({
      userId: p.userId,
      userName: p.userName ?? p.userEmail.split('@')[0],
      progress: p.finishedAt ? 100 : 0,
      currentWpm: p.wpm ?? 0,
      currentChallengeIndex: p.currentChallengeIndex,
      wpm: p.wpm,
      accuracy: p.accuracy,
      finishedAt: p.finishedAt,
      rank: p.rank,
    }));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (fetchError || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-600">
        Failed to load race details.{' '}
        <button
          onClick={() => router.push('/race')}
          className="underline hover:no-underline"
        >
          Back to lobby
        </button>
      </div>
    );
  }

  const race = data;
  const currentStatus = getRaceStatus();
  const isWaiting = currentStatus === 'waiting';
  const isCountdown = currentStatus === 'countdown';
  const isInProgress = currentStatus === 'in_progress';
  const isFinished = currentStatus === 'finished';
  const participants = getParticipants();
  const participantStates = getParticipantStates();
  const participantCount = participants.length;
  const difficultyClass =
    difficultyColors[race.category.difficulty] ?? difficultyColors.beginner;

  // Get current user's challenge index
  const currentParticipant = participants.find(p => p.userId === userId);
  const currentChallengeIndex = currentParticipant?.currentChallengeIndex ?? 0;
  const currentChallenge = race.challenges[currentChallengeIndex];
  const totalChallenges = race.challenges.length;

  return (
    <div className="space-y-8">
      {/* Back to lobby */}
      <button
        onClick={() => router.push('/race')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to lobby
      </button>

      {/* Race header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">
              Race #{race.id}
            </h2>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isWaiting
                  ? 'bg-blue-100 text-blue-800'
                  : isCountdown
                    ? 'bg-purple-100 text-purple-800'
                    : isInProgress
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-gray-100 text-gray-800'
              }`}
            >
              {isWaiting
                ? 'Waiting'
                : isCountdown
                  ? 'Starting...'
                  : isInProgress
                    ? 'In Progress'
                    : 'Finished'}
            </span>
            {wsConnected ? (
              <Wifi className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-gray-400" />
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>
                {participantCount}/{race.maxPlayers}
              </span>
            </div>
            {(wsState?.spectatorCount ?? 0) > 0 && (
              <div className="flex items-center gap-1 text-purple-500">
                <Eye className="h-3.5 w-3.5" />
                <span>{wsState?.spectatorCount} watching</span>
              </div>
            )}
          </div>
        </div>

        {/* Category info */}
        <div className="mb-4 flex items-center gap-3 text-sm text-gray-500">
          <span className="font-medium text-gray-700">{race.category.name}</span>
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${difficultyClass}`}
          >
            {race.category.difficulty}
          </span>
          <span className="text-xs text-gray-500">
            {totalChallenges} challenges total
          </span>
        </div>

        {/* Current challenge progress */}
        {currentChallenge && (
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">
                Challenge {currentChallengeIndex + 1} of {totalChallenges}
              </span>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Zap className="h-3 w-3" />
                <span className="capitalize">{currentChallenge.syntaxType}</span>
              </div>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-300"
                style={{
                  width: `${((currentChallengeIndex) / totalChallenges) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Challenge preview */}
        {currentChallenge && (
          <div className="rounded-lg bg-gray-50 p-4">
            <code className="block whitespace-pre-wrap text-sm text-gray-700">
              {currentChallenge.content}
            </code>
          </div>
        )}
      </div>

      {/* Participants */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Players ({participantCount}/{race.maxPlayers})
        </h3>

        <div className="space-y-3">
          {participants.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                {idx === 0 && (
                  <Crown className="h-4 w-4 text-yellow-500" />
                )}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-700">
                  {(p.userName ?? p.userEmail)[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {p.userName ?? p.userEmail.split('@')[0]}
                </span>
              </div>

              {/* Show results for finished participants */}
              {p.finishedAt && (
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {p.rank && (
                    <span className="font-medium text-gray-900">
                      #{p.rank}
                    </span>
                  )}
                  {p.wpm !== null && <span>{p.wpm} WPM</span>}
                  {p.accuracy !== null && <span>{p.accuracy}%</span>}
                </div>
              )}

              {/* Show real-time progress for unfinished participants in active race */}
              {(isInProgress || isCountdown) && !p.finishedAt && wsState && (
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  {wsState.participants.find(
                    (wp) => wp.userId === p.userId
                  )?.currentWpm ? (
                    <span>
                      {
                        wsState.participants.find(
                          (wp) => wp.userId === p.userId
                        )?.currentWpm
                      }{' '}
                      WPM
                    </span>
                  ) : null}
                  <span className="text-xs text-gray-400">Typing...</span>
                </div>
              )}

              {/* Fallback: Show typing indicator without WS data */}
              {isInProgress && !p.finishedAt && !wsState && (
                <span className="text-xs text-gray-400">Typing...</span>
              )}
            </div>
          ))}

          {/* Empty slots */}
          {isWaiting &&
            Array.from({ length: race.maxPlayers - participantCount }).map(
              (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center rounded-lg border border-dashed border-gray-200 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-300">
                      ?
                    </div>
                    <span className="text-sm text-gray-400">
                      Waiting for player...
                    </span>
                  </div>
                </div>
              )
            )}
        </div>
      </div>

      {/* Race Progress Track - visible during countdown and racing */}
      {(isCountdown || isInProgress) && (
        <RaceProgressTrack
          participants={participantStates}
          currentUserId={userId}
          raceStatus={currentStatus as 'waiting' | 'countdown' | 'in_progress' | 'finished'}
          totalChallenges={totalChallenges}
        />
      )}

      {/* Race Results - visible when race is finished */}
      {isFinished && (
        <RaceResults
          participants={participantStates}
          currentUserId={userId}
          raceStartedAt={race.startedAt}
        />
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        {isWaiting && (
          <>
            <Button
              variant="outline"
              onClick={() => handleAction('leave')}
              disabled={actionLoading !== null}
              className="rounded-full"
            >
              {actionLoading === 'leave' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Leave Race
            </Button>
            <Button
              onClick={() => handleAction('start')}
              disabled={actionLoading !== null || participantCount < 2}
              className="rounded-full"
            >
              {actionLoading === 'start' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Start Race
            </Button>
          </>
        )}

        {isCountdown && (
          <RaceCountdown
            countdownValue={wsState?.countdownValue ?? 3}
            startTime={wsState?.startTime}
            status={currentStatus as 'countdown' | 'in_progress' | 'waiting' | 'finished'}
          />
        )}

        {isInProgress && (
          <div className="flex w-full items-center justify-center gap-2 text-sm text-orange-600">
            <Clock className="h-4 w-4" />
            <span>Race in progress...</span>
          </div>
        )}

        {isFinished && (
          <Button
            onClick={() => router.push('/race')}
            variant="outline"
            className="mx-auto rounded-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lobby
          </Button>
        )}
      </div>
    </div>
  );
}
