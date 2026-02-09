'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, Zap, Clock, ChevronRight, Loader2, Eye } from 'lucide-react';
import { mutate } from 'swr';
import type { ActiveRace } from './race-lobby';

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-500/20 text-green-400',
  intermediate: 'bg-yellow-500/20 text-yellow-400',
  advanced: 'bg-red-500/20 text-red-400',
};

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const created = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - created) / 1000);

  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  return `${Math.floor(diffSec / 3600)}h ago`;
}

export function RaceCard({ race }: { race: ActiveRace }) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const difficultyClass =
    difficultyColors[race.category.difficulty] ?? difficultyColors.beginner;

  const isFull = race.participantCount >= race.maxPlayers;
  const isSpectatable = race.status === 'in_progress' || race.status === 'countdown';

  async function handleJoin() {
    setJoining(true);
    setJoinError(null);

    try {
      const res = await fetch(`/api/races/${race.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join' }),
      });

      if (!res.ok) {
        const data = await res.json();
        setJoinError(data.error || 'Failed to join');
        return;
      }

      mutate('/api/races?status=waiting');
      router.push(`/race/${race.id}`);
    } catch {
      setJoinError('Network error');
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="group rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 transition-all hover:border-white/[0.15] hover:bg-white/[0.04]">
      {/* Category & difficulty */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-white/50">
          {race.category.name}
        </span>
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${difficultyClass}`}
        >
          {race.category.difficulty}
        </span>
      </div>

      {/* Category info */}
      <div className="mb-4 rounded-lg bg-white/[0.03] p-3">
        <p className="text-sm text-white/70">
          Race through {race.challengeCount} challenges
        </p>
        <p className="mt-1 text-xs text-white/40">
          First to complete all challenges wins!
        </p>
      </div>

      {/* Stats row */}
      <div className="mb-4 flex items-center gap-4 text-sm text-white/50">
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          <span>
            {race.participantCount}/{race.maxPlayers}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="h-3.5 w-3.5" />
          <span>{race.challengeCount} challenges</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatTimeAgo(race.createdAt)}</span>
        </div>
      </div>

      {/* Action button */}
      {joinError && (
        <p className="mb-2 text-xs text-red-400">{joinError}</p>
      )}
      {isSpectatable ? (
        <Button
          onClick={() => router.push(`/race/${race.id}?spectate=true`)}
          variant="outline"
          className="w-full rounded-full border-white/20 text-white/70 hover:bg-white/5 hover:text-white"
        >
          <Eye className="mr-2 h-4 w-4" />
          Watch Race
        </Button>
      ) : (
        <Button
          onClick={handleJoin}
          disabled={joining || isFull}
          className={`w-full rounded-full ${
            isFull
              ? 'bg-white/10 text-white/50 cursor-not-allowed'
              : 'bg-white text-black hover:bg-white/90'
          }`}
        >
          {joining ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ChevronRight className="mr-2 h-4 w-4" />
          )}
          {isFull ? 'Full' : 'Join Race'}
        </Button>
      )}
    </div>
  );
}
