import Link from 'next/link';
import {
  getUser,
  getUserProfile,
  getKeyAccuracyForUser,
  getCharErrorPatternsForUser,
  getProblemSequences,
} from '@/lib/db/queries';
import { analyzeWeaknesses } from '@/lib/weakness/analyze';
import { generatePersonalizedPractice } from '@/lib/practice/personalized';
import { hasUnlimitedPractice } from '@/lib/limits/constants';
import { RemainingTimeBar } from '@/components/limits/RemainingTimeBar';
import { ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';
import { PersonalizedPracticeClient } from './personalized-practice-client';

export default async function PersonalizedPracticePage() {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const [keyData, errorPatterns, problemSeqs, profile] = await Promise.all([
    getKeyAccuracyForUser(user.id),
    getCharErrorPatternsForUser(user.id),
    getProblemSequences(user.id, 10),
    getUserProfile(user.id),
  ]);

  const report = analyzeWeaknesses(keyData, errorPatterns, problemSeqs);
  const practiceSet = generatePersonalizedPractice(report, { maxChallenges: 5 });

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
            <p className="text-sm font-medium text-white">Personalized</p>
            <p className="text-xs text-white/40">{practiceSet.challenges.length} exercises</p>
          </div>
        </div>

        {isFreeTier && (
          <div className="mb-6">
            <RemainingTimeBar />
          </div>
        )}

        <PersonalizedPracticeClient
          initialChallenges={practiceSet.challenges}
          summary={practiceSet.summary}
          weaknessReport={{
            weakKeyCount: report.weakestKeys.filter((k) => k.accuracy < 90).length,
            typoCount: report.commonTypos.length,
            slowKeyCount: report.slowestKeys.length,
            sequenceCount: report.problemSequences.filter((s) => s.errorRate >= 20).length,
            topWeakness: report.summary.topWeakness,
          }}
        />
      </div>
    </main>
  );
}
