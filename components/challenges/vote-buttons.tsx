'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoteButtonsProps {
  challengeId: number;
  initialVotes: { upvotes: number; downvotes: number; score: number };
  initialUserVote: number;
}

export function VoteButtons({ challengeId, initialVotes, initialUserVote }: VoteButtonsProps) {
  const [votes, setVotes] = useState(initialVotes);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [loading, setLoading] = useState(false);

  const handleVote = async (value: 1 | -1, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/community-challenges/${challengeId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });

      if (res.status === 401) {
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setVotes(data.votes);
        setUserVote(data.userVote);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
      <Button
        variant="ghost"
        size="sm"
        className={`h-7 px-1.5 ${userVote === 1 ? 'text-green-500 hover:text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
        onClick={(e) => handleVote(1, e)}
        disabled={loading}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
        <span className="ml-1 text-xs">{votes.upvotes}</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`h-7 px-1.5 ${userVote === -1 ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
        onClick={(e) => handleVote(-1, e)}
        disabled={loading}
      >
        <ThumbsDown className="h-3.5 w-3.5" />
        <span className="ml-1 text-xs">{votes.downvotes}</span>
      </Button>
    </div>
  );
}
