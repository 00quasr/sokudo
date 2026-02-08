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
import { ArrowLeft } from 'lucide-react';
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
    <main className="min-h-screen bg-[#08090a]">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/practice"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to categories
          </Link>

          <div className="text-right">
            <p className="text-sm font-medium text-white">Smart Practice</p>
            <p className="text-xs text-white/40">{result.challenges.length} challenges</p>
          </div>
        </div>

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
      </div>
    </main>
  );
}
