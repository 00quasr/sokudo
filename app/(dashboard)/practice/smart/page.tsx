import Link from 'next/link';
import {
  getUser,
  getUserProfile,
  getRecentSessionsForAdaptive,
  getRecentSessionChallengeIds,
  getAllChallengesWithCategories,
  getKeyAccuracyForUser,
  getCharErrorPatternsForUser,
  getProblemSequences,
} from '@/lib/db/queries';
import { analyzeWeaknesses } from '@/lib/weakness/analyze';
import { selectSmartChallenges } from '@/lib/practice/smart-practice';
import { canAccessPremiumCategories, hasUnlimitedPractice } from '@/lib/limits/constants';
import type { DifficultyLevel, SessionPerformance } from '@/lib/practice/adaptive-difficulty';
import { RemainingTimeBar } from '@/components/limits/RemainingTimeBar';
import { ArrowLeft, Brain } from 'lucide-react';
import { redirect } from 'next/navigation';
import { SmartPracticeClient } from './smart-practice-client';

export default async function SmartPracticePage() {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const [
    recentSessions,
    recentChallengeIds,
    allChallenges,
    keyData,
    errorPatterns,
    problemSeqs,
    profile,
  ] = await Promise.all([
    getRecentSessionsForAdaptive(10),
    getRecentSessionChallengeIds(20),
    getAllChallengesWithCategories(),
    getKeyAccuracyForUser(user.id),
    getCharErrorPatternsForUser(user.id),
    getProblemSequences(user.id, 10),
    getUserProfile(user.id),
  ]);

  // Filter premium challenges for free users
  const canAccessPremium = canAccessPremiumCategories(
    profile?.subscriptionTier ?? 'free'
  );
  const accessibleChallenges = canAccessPremium
    ? allChallenges
    : allChallenges.filter((c) => !c.isPremium);

  const sessionPerformance: SessionPerformance[] = recentSessions.map((s) => ({
    wpm: s.wpm,
    accuracy: s.accuracy,
    errors: s.errors,
    keystrokes: s.keystrokes,
    durationMs: s.durationMs,
    challengeDifficulty: s.challengeDifficulty as DifficultyLevel,
  }));

  const weaknessReport =
    keyData.length > 0 || errorPatterns.length > 0 || problemSeqs.length > 0
      ? analyzeWeaknesses(keyData, errorPatterns, problemSeqs)
      : null;

  const result = selectSmartChallenges(
    accessibleChallenges,
    sessionPerformance,
    recentChallengeIds,
    weaknessReport,
    { limit: 5 }
  );

  const isFreeTier = !hasUnlimitedPractice(profile?.subscriptionTier ?? 'free');

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/practice"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Categories
            </Link>

            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-medium">Smart Practice</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isFreeTier && (
          <div className="mb-6">
            <RemainingTimeBar />
          </div>
        )}

        <SmartPracticeClient
          initialChallenges={result.challenges}
          adaptive={result.adaptive}
          summary={result.summary}
        />

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
            <Link
              href="/practice/personalized"
              className="text-violet-500 hover:text-violet-600 transition-colors"
            >
              Try Personalized Practice
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
