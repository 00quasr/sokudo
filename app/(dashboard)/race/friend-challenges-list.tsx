'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { Button } from '@/components/ui/button';
import {
  Check,
  X,
  Loader2,
  Swords,
  Clock,
} from 'lucide-react';

interface FriendChallengeUser {
  id: number;
  username: string;
  name: string;
}

interface FriendChallengeData {
  id: number;
  status: string;
  message: string | null;
  raceId: number | null;
  expiresAt: string;
  respondedAt: string | null;
  createdAt: string;
  challenger: FriendChallengeUser;
  challenged: FriendChallengeUser;
  challenge: {
    id: number;
    content: string;
    difficulty: string;
    syntaxType: string;
  };
  category: {
    id: number;
    name: string;
    slug: string;
    icon: string;
  };
}

interface FriendChallengesListProps {
  userId: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function FriendChallengesList({ userId }: FriendChallengesListProps) {
  const router = useRouter();

  const { data: receivedData, isLoading: loadingReceived } = useSWR<{
    challenges: FriendChallengeData[];
  }>('/api/friend-challenges?filter=received', fetcher, {
    refreshInterval: 15000,
  });

  const { data: sentData, isLoading: loadingSent } = useSWR<{
    challenges: FriendChallengeData[];
  }>('/api/friend-challenges?filter=sent', fetcher, {
    refreshInterval: 15000,
  });

  const pendingReceived = (receivedData?.challenges ?? []).filter(
    (c) => c.status === 'pending' && new Date(c.expiresAt) > new Date()
  );
  const pendingSent = (sentData?.challenges ?? []).filter(
    (c) => c.status === 'pending' && new Date(c.expiresAt) > new Date()
  );
  const acceptedRecent = (receivedData?.challenges ?? [])
    .concat(sentData?.challenges ?? [])
    .filter((c) => c.status === 'accepted' && c.raceId);

  const handleAction = useCallback(
    async (id: number, action: 'accept' | 'decline' | 'cancel') => {
      try {
        const res = await fetch(`/api/friend-challenges/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });

        const body = await res.json();

        mutate('/api/friend-challenges?filter=received');
        mutate('/api/friend-challenges?filter=sent');

        if (action === 'accept' && body.raceId) {
          router.push(`/race/${body.raceId}`);
        }
      } catch (error) {
        console.error('Error updating challenge:', error);
      }
    },
    [router]
  );

  const isLoading = loadingReceived || loadingSent;
  const hasContent =
    pendingReceived.length > 0 ||
    pendingSent.length > 0 ||
    acceptedRecent.length > 0;

  if (isLoading) {
    return null;
  }

  if (!hasContent) {
    return null;
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Swords className="h-4 w-4" />
        Friend Challenges
      </div>

      {/* Received challenges - pending */}
      {pendingReceived.length > 0 && (
        <div className="space-y-2">
          {pendingReceived.map((fc) => (
            <div
              key={fc.id}
              className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  <span className="font-bold">
                    {fc.challenger.name || fc.challenger.username}
                  </span>{' '}
                  challenged you
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                  <span>{fc.category.name}</span>
                  <span className="capitalize">{fc.challenge.difficulty}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {timeAgo(fc.createdAt)}
                  </span>
                </div>
                {fc.message && (
                  <p className="mt-1 text-xs italic text-gray-600">
                    &quot;{fc.message}&quot;
                  </p>
                )}
              </div>
              <div className="ml-3 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(fc.id, 'decline')}
                  className="h-8 rounded-full border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  <X className="mr-1 h-3 w-3" />
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAction(fc.id, 'accept')}
                  className="h-8 rounded-full"
                >
                  <Check className="mr-1 h-3 w-3" />
                  Accept
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sent challenges - pending */}
      {pendingSent.length > 0 && (
        <div className="space-y-2">
          {pendingSent.map((fc) => (
            <div
              key={`sent-${fc.id}`}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  You challenged{' '}
                  <span className="font-bold">
                    {fc.challenged.name || fc.challenged.username}
                  </span>
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                  <span>{fc.category.name}</span>
                  <span className="capitalize">{fc.challenge.difficulty}</span>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Waiting for response</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction(fc.id, 'cancel')}
                className="ml-3 h-8 rounded-full border-gray-300 text-gray-600 hover:bg-gray-100"
              >
                <X className="mr-1 h-3 w-3" />
                Cancel
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Recently accepted - go to race */}
      {acceptedRecent.length > 0 && (
        <div className="space-y-2">
          {acceptedRecent
            .filter(
              (fc, idx, arr) => arr.findIndex((f) => f.id === fc.id) === idx
            )
            .slice(0, 5)
            .map((fc) => (
              <div
                key={`accepted-${fc.id}`}
                className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Challenge with{' '}
                    <span className="font-bold">
                      {fc.challenger.id === userId
                        ? fc.challenged.name || fc.challenged.username
                        : fc.challenger.name || fc.challenger.username}
                    </span>{' '}
                    accepted
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {fc.category.name}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => router.push(`/race/${fc.raceId}`)}
                  className="ml-3 h-8 rounded-full"
                >
                  Join Race
                </Button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
