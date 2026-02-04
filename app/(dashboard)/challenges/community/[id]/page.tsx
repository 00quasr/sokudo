import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicChallengeById } from '@/lib/db/queries';
import { ArrowLeft, Users } from 'lucide-react';
import { CommunityTypingSession } from './typing-session';
import { VoteButtons } from '@/components/challenges/vote-buttons';
import { ForkButton } from '@/components/challenges/fork-button';

export const dynamic = 'force-dynamic';

export default async function CommunityChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const challengeId = parseInt(id, 10);
  if (isNaN(challengeId)) {
    notFound();
  }

  const challenge = await getPublicChallengeById(challengeId);

  if (!challenge) {
    notFound();
  }

  const authorDisplay = challenge.authorName || challenge.authorEmail.split('@')[0];

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/challenges/community"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Community Challenges
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">
            {challenge.name}
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>by {authorDisplay}</span>
            {challenge.timesCompleted > 0 && (
              <>
                <span className="text-gray-300">|</span>
                <span>Practiced {challenge.timesCompleted} times</span>
              </>
            )}
            <span className="text-gray-300">|</span>
            <VoteButtons
              challengeId={challenge.id}
              initialVotes={challenge.votes}
              initialUserVote={0}
            />
            <span className="text-gray-300">|</span>
            <ForkButton challengeId={challenge.id} />
          </div>
        </div>

        <CommunityTypingSession
          challengeId={challenge.id}
          content={challenge.content}
        />

        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex items-center text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Esc</kbd>
                <span>Restart</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
