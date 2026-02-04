import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getChallengeById, getNextChallengeInCategory, getChallengePosition, getUser, getUserProfile } from '@/lib/db/queries';
import { hasUnlimitedPractice } from '@/lib/limits/constants';
import { RemainingTimeBar } from '@/components/limits/RemainingTimeBar';
import { ArrowLeft } from 'lucide-react';
import { TypingSession } from './typing-session';

export const revalidate = 3600;

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ categorySlug: string; challengeId: string }>;
}) {
  const { categorySlug, challengeId } = await params;

  const challengeIdNum = parseInt(challengeId, 10);
  if (isNaN(challengeIdNum)) {
    notFound();
  }

  const challenge = await getChallengeById(challengeIdNum);

  if (!challenge) {
    notFound();
  }

  // Verify that the challenge belongs to the category with this slug
  if (challenge.category.slug !== categorySlug) {
    notFound();
  }

  // Get the next challenge in this category
  const nextChallengeId = await getNextChallengeInCategory(
    challenge.category.id,
    challenge.id
  );

  // Get challenge position for progress indicator
  const challengePosition = await getChallengePosition(
    challenge.category.id,
    challenge.id
  );

  // Check if user is on free tier
  const user = await getUser();
  let isFreeTier = true;
  if (user) {
    const profile = await getUserProfile(user.id);
    isFreeTier = !hasUnlimitedPractice(profile?.subscriptionTier ?? 'free');
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header with navigation */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/practice/${categorySlug}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {challenge.category.name}
            </Link>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Challenge #{challenge.id}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main typing area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Remaining time for free users */}
        {user && isFreeTier && (
          <div className="mb-6">
            <RemainingTimeBar />
          </div>
        )}

        {/* Challenge info */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {challenge.category.name}
            </span>
            <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize bg-muted text-muted-foreground">
              {challenge.difficulty}
            </span>
          </div>
          {challenge.hint && (
            <p className="text-sm text-muted-foreground">{challenge.hint}</p>
          )}
        </div>

        {/* Typing session component */}
        <TypingSession
          challenge={challenge}
          categorySlug={categorySlug}
          nextChallengeId={nextChallengeId ?? undefined}
          challengePosition={challengePosition ?? undefined}
        />

        {/* Navigation hint */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Esc</kbd>
                <span>Restart</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Tab</kbd>
                <span>Skip</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Enter</kbd>
                <span>Next</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span>Challenge stats are saved automatically</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
