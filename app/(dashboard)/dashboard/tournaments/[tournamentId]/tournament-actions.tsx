'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function TournamentActions({
  tournamentId,
  status,
  isParticipant,
  hasSubmitted,
  challengeId,
  categorySlug,
}: {
  tournamentId: number;
  status: string;
  isParticipant: boolean;
  hasSubmitted: boolean;
  challengeId: number;
  categorySlug: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join' }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLeave() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'leave' }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (status === 'completed') {
    return (
      <div className="text-sm text-muted-foreground">
        This tournament has ended.
      </div>
    );
  }

  if (!isParticipant) {
    return (
      <Button onClick={handleJoin} disabled={loading} className="rounded-full">
        {loading ? 'Joining...' : 'Join Tournament'}
      </Button>
    );
  }

  if (status === 'active' && !hasSubmitted) {
    return (
      <div className="flex items-center gap-3">
        <Button asChild className="rounded-full">
          <Link
            href={`/practice/${categorySlug}/${challengeId}?tournament=${tournamentId}`}
          >
            Start Challenge
          </Link>
        </Button>
        <Button
          variant="outline"
          onClick={handleLeave}
          disabled={loading}
          className="rounded-full"
        >
          {loading ? 'Leaving...' : 'Leave'}
        </Button>
      </div>
    );
  }

  if (status === 'active' && hasSubmitted) {
    return (
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" className="rounded-full">
          <Link
            href={`/practice/${categorySlug}/${challengeId}?tournament=${tournamentId}`}
          >
            Try Again (Best Score Kept)
          </Link>
        </Button>
        <span className="text-xs text-muted-foreground">
          Your score has been submitted. You can try again for a better score.
        </span>
      </div>
    );
  }

  if (status === 'upcoming') {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-blue-600 font-medium">
          You&apos;re registered!
        </span>
        <Button
          variant="outline"
          onClick={handleLeave}
          disabled={loading}
          className="rounded-full"
        >
          {loading ? 'Leaving...' : 'Leave'}
        </Button>
      </div>
    );
  }

  return null;
}
