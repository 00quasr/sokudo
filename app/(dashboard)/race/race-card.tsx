'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, Zap, Clock, ChevronRight, Loader2, Eye } from 'lucide-react';
import { mutate } from 'swr';
import type { ActiveRace } from './race-lobby';

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
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
    difficultyColors[race.challenge.difficulty] ?? difficultyColors.beginner;

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
    <div className="group rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-orange-300 hover:shadow-lg">
      {/* Category & difficulty */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {race.category.name}
        </span>
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${difficultyClass}`}
        >
          {race.challenge.difficulty}
        </span>
      </div>

      {/* Challenge preview */}
      <div className="mb-4 rounded-lg bg-gray-50 p-3">
        <code className="block truncate text-sm text-gray-700">
          {race.challenge.content.slice(0, 60)}
          {race.challenge.content.length > 60 ? '...' : ''}
        </code>
      </div>

      {/* Stats row */}
      <div className="mb-4 flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          <span>
            {race.participantCount}/{race.maxPlayers}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="h-3.5 w-3.5" />
          <span>{race.challenge.syntaxType}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatTimeAgo(race.createdAt)}</span>
        </div>
      </div>

      {/* Action button */}
      {joinError && (
        <p className="mb-2 text-xs text-red-600">{joinError}</p>
      )}
      {isSpectatable ? (
        <Button
          onClick={() => router.push(`/race/${race.id}?spectate=true`)}
          variant="outline"
          className="w-full rounded-full border-purple-300 text-purple-700 hover:bg-purple-50"
        >
          <Eye className="mr-2 h-4 w-4" />
          Watch Race
        </Button>
      ) : (
        <Button
          onClick={handleJoin}
          disabled={joining || isFull}
          variant={isFull ? 'secondary' : 'default'}
          className="w-full rounded-full"
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
