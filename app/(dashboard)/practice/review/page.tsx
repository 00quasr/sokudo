import Link from 'next/link';
import { getUser, getDueReviewItems, getUserReviewStats } from '@/lib/db/queries';
import { ArrowLeft, Clock } from 'lucide-react';
import { redirect } from 'next/navigation';
import { ReviewPracticeClient } from './review-practice-client';

export default async function ReviewPracticePage() {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const [items, stats] = await Promise.all([
    getDueReviewItems(10),
    getUserReviewStats(user.id),
  ]);

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
              <Clock className="h-4 w-4 text-cyan-500" />
              <span className="text-sm font-medium">Spaced Review</span>
              {stats.dueItems > 0 && (
                <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-500 border border-cyan-500/20">
                  {stats.dueItems} due
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ReviewPracticeClient
          initialItems={items}
          stats={stats}
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
              href="/practice/smart"
              className="text-cyan-500 hover:text-cyan-600 transition-colors"
            >
              Try Smart Practice
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
