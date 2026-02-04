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
import { ArrowLeft, Crosshair } from 'lucide-react';
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
              <Crosshair className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Personalized Practice</span>
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
              href="/dashboard/stats"
              className="text-orange-500 hover:text-orange-600 transition-colors"
            >
              View full weakness report
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
