'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { ArrowLeft, Eye, Wifi, WifiOff, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useSpectatorSocket,
  type RaceStateUpdate,
  type ParticipantState,
} from '@/lib/ws/use-race-socket';
import { RaceProgressTrack } from '@/components/race/RaceProgressTrack';
import { RaceCountdown } from '@/components/race/RaceCountdown';
import { RaceResults } from '@/components/race/RaceResults';

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
  challenges: Array<{
    id: number;
    content: string;
    difficulty: string;
    syntaxType: string;
  }>;
  participants: Array<{
    id: number;
    userId: number;
    currentChallengeIndex: number;
    wpm: number | null;
    accuracy: number | null;
    finishedAt: string | null;
    rank: number | null;
    userName: string | null;
    userEmail: string;
  }>;
}

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SpectatorView({ raceId }: { raceId: string }) {
  const router = useRouter();
  const [wsState, setWsState] = useState<RaceStateUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, error: fetchError, isLoading } = useSWR<RaceDetail>(
    `/api/races/${raceId}`,
    fetcher,
    { refreshInterval: wsState ? 0 : 2000 }
  );

  const handleWsStateUpdate = useCallback((state: RaceStateUpdate) => {
    setWsState(state);
  }, []);

  const handleWsError = useCallback((message: string) => {
    setError(message);
  }, []);

  const { connected: wsConnected, raceState } = useSpectatorSocket({
    raceId: parseInt(raceId, 10),
    onStateUpdate: handleWsStateUpdate,
    onError: handleWsError,
  });

  function getRaceStatus(): string {
    if (wsState) return wsState.status;
    return data?.status ?? 'waiting';
  }

  function getParticipantStates(): ParticipantState[] {
    if (wsState && wsState.participants.length > 0) {
      return wsState.participants;
    }
    return (data?.participants ?? []).map((p) => ({
      userId: p.userId,
      userName: p.userName ?? p.userEmail.split('@')[0],
      progress: p.finishedAt ? 100 : 0,
      currentWpm: p.wpm ?? 0,
      currentChallengeIndex: p.currentChallengeIndex ?? 0,
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
  const participantStates = getParticipantStates();
  const spectatorCount = wsState?.spectatorCount ?? 0;

  // Show the first challenge for spectators
  const currentChallenge = race.challenges[0];
  const totalChallenges = race.challenges.length;
  const difficultyClass =
    difficultyColors[currentChallenge.difficulty] ?? difficultyColors.beginner;

  return (
    <div className="space-y-8" data-testid="spectator-view">
      {/* Back to lobby */}
      <button
        onClick={() => router.push('/race')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to lobby
      </button>

      {/* Spectator banner */}
      <div className="flex items-center justify-between rounded-xl border border-purple-200 bg-purple-50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-purple-800">
          <Eye className="h-4 w-4" />
          Spectator Mode
        </div>
        <div className="flex items-center gap-3 text-xs text-purple-600">
          {spectatorCount > 0 && (
            <span>{spectatorCount} watching</span>
          )}
          {wsConnected ? (
            <Wifi className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-gray-400" />
          )}
        </div>
      </div>

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
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Eye className="h-4 w-4" />
            <span>Watching</span>
          </div>
        </div>

        {/* Challenge info */}
        <div className="mb-4 flex items-center gap-3 text-sm text-gray-500">
          <span className="font-medium text-gray-700">{race.category.name}</span>
          <span className="text-gray-600">({totalChallenges} challenges)</span>
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${difficultyClass}`}
          >
            {race.category.difficulty}
          </span>
          <div className="flex items-center gap-1">
            <Zap className="h-3.5 w-3.5" />
            <span>{currentChallenge.syntaxType}</span>
          </div>
        </div>

        {/* Challenge preview - first challenge */}
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="mb-2 text-xs text-gray-500">First Challenge:</div>
          <code className="block whitespace-pre-wrap text-sm text-gray-700">
            {currentChallenge.content}
          </code>
        </div>
      </div>

      {/* Race Progress Track - visible during countdown and racing */}
      {(isCountdown || isInProgress || isFinished) && (
        <RaceProgressTrack
          participants={participantStates}
          raceStatus={currentStatus as 'waiting' | 'countdown' | 'in_progress' | 'finished'}
        />
      )}

      {/* Countdown */}
      {isCountdown && (
        <div className="flex items-center justify-center">
          <RaceCountdown
            countdownValue={wsState?.countdownValue ?? 3}
            startTime={wsState?.startTime}
            status={currentStatus as 'countdown' | 'in_progress' | 'waiting' | 'finished'}
          />
        </div>
      )}

      {/* Race Results - visible when race is finished */}
      {isFinished && (
        <RaceResults
          participants={participantStates}
          raceStartedAt={race.startedAt}
        />
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Back button */}
      <div className="flex justify-center">
        <Button
          onClick={() => router.push('/race')}
          variant="outline"
          className="rounded-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lobby
        </Button>
      </div>
    </div>
  );
}
