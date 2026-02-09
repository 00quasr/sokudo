'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { Button } from '@/components/ui/button';
import {
  Users,
  Plus,
  Loader2,
  Trophy,
  Zap,
  X,
  Swords,
  Eye,
} from 'lucide-react';
import { CreateRaceDialog } from './create-race-dialog';
import { ChallengeFriendDialog } from './challenge-friend-dialog';
import { FriendChallengesList } from './friend-challenges-list';
import { RaceCard } from './race-card';
import { useLobbySocket, type LobbyUpdate } from '@/lib/ws/use-race-socket';
import { useMatchmaking } from '@/lib/matchmaking/use-matchmaking';

interface RaceCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
  difficulty: string;
}

export interface ActiveRace {
  id: number;
  status: string;
  maxPlayers: number;
  createdAt: string;
  startedAt: string | null;
  category: RaceCategory;
  participantCount: number;
  challengeCount: number;
}

interface RaceLobbyProps {
  userId?: number;
  userName?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function RaceLobby({ userId, userName }: RaceLobbyProps) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [showChallengeFriend, setShowChallengeFriend] = useState(false);
  const { data, error, isLoading } = useSWR<{ races: ActiveRace[] }>(
    '/api/races?status=waiting',
    fetcher,
    { refreshInterval: 10000 }
  );

  const { data: liveData } = useSWR<{ races: ActiveRace[] }>(
    '/api/races?status=in_progress,countdown',
    fetcher,
    { refreshInterval: 10000 }
  );

  const handleLobbyUpdate = useCallback((_update: LobbyUpdate) => {
    mutate('/api/races?status=waiting');
  }, []);

  useLobbySocket({ onLobbyUpdate: handleLobbyUpdate });

  const handleMatched = useCallback(
    (raceId: number) => {
      router.push(`/race/${raceId}`);
    },
    [router]
  );

  const matchmaking = useMatchmaking({
    userId: userId ?? 0,
    userName: userName ?? 'Anonymous',
    onMatched: handleMatched,
  });

  const races = data?.races ?? [];
  const liveRaces = liveData?.races ?? [];

  return (
    <div className="space-y-8">
      {/* Matchmaking banner */}
      {matchmaking.state === 'queued' && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-white/60" />
            <div>
              <p className="text-sm font-medium text-white">
                Finding players with similar WPM...
              </p>
              <p className="text-xs text-white/50">
                Your average: {matchmaking.averageWpm ?? '...'} WPM
                {matchmaking.queueSize
                  ? ` · ${matchmaking.queueSize} in queue`
                  : ''}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={matchmaking.leaveQueue}
            className="rounded-full border-white/20 text-white/70 hover:bg-white/5 hover:text-white"
          >
            <X className="mr-1 h-3 w-3" />
            Cancel
          </Button>
        </div>
      )}

      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Users className="h-4 w-4" />
          <span>
            {races.length} {races.length === 1 ? 'race' : 'races'} waiting for
            players
          </span>
        </div>
        <div className="flex items-center gap-3">
          {userId && matchmaking.state === 'idle' && (
            <Button
              onClick={matchmaking.joinQueue}
              variant="outline"
              className="rounded-full border-white/20 text-white/70 hover:bg-white/5 hover:text-white"
            >
              <Zap className="mr-2 h-4 w-4" />
              Find Match
            </Button>
          )}
          {userId && (
            <Button
              onClick={() => setShowChallengeFriend(true)}
              variant="outline"
              className="rounded-full border-white/20 text-white/70 hover:bg-white/5 hover:text-white"
            >
              <Swords className="mr-2 h-4 w-4" />
              Challenge Friend
            </Button>
          )}
          <Button
            onClick={() => setShowCreate(true)}
            className="rounded-full bg-white text-black hover:bg-white/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Race
          </Button>
        </div>
      </div>

      {/* Race list */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-white/40" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400">
          Failed to load races. Please try again.
        </div>
      )}

      {!isLoading && !error && races.length === 0 && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-12 text-center">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-white/20" />
          <h3 className="mb-2 text-lg font-medium text-white">
            No active races
          </h3>
          <p className="mb-6 text-sm text-white/50">
            Be the first to create a race and challenge other developers!
          </p>
          <Button
            onClick={() => setShowCreate(true)}
            variant="outline"
            className="rounded-full border-white/20 text-white/70 hover:bg-white/5 hover:text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Race
          </Button>
        </div>
      )}

      {!isLoading && !error && races.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {races.map((race) => (
            <RaceCard key={race.id} race={race} />
          ))}
        </div>
      )}

      {/* Live races - spectatable */}
      {liveRaces.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Eye className="h-4 w-4 text-white/60" />
            <span className="font-medium text-white/70">
              Live Races ({liveRaces.length})
            </span>
            <span>- Watch in real-time</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveRaces.map((race) => (
              <RaceCard key={race.id} race={race} />
            ))}
          </div>
        </div>
      )}

      {/* Friend challenges */}
      {userId && <FriendChallengesList userId={userId} />}

      {/* Create race dialog */}
      <CreateRaceDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={() => {
          setShowCreate(false);
          mutate('/api/races?status=waiting');
        }}
      />

      {/* Challenge friend dialog */}
      <ChallengeFriendDialog
        open={showChallengeFriend}
        onOpenChange={setShowChallengeFriend}
        onSent={() => {
          setShowChallengeFriend(false);
          mutate('/api/friend-challenges?filter=sent');
        }}
      />
    </div>
  );
}
