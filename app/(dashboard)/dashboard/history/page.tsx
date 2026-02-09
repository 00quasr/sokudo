import { Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Target, Zap, PlayCircle, AlertCircle } from 'lucide-react';
import { getRecentTypingSessions } from '@/lib/db/queries';
import { ExportCSVButton } from '@/components/history/ExportCSVButton';

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}.${Math.floor((ms % 1000) / 100)}s`;
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

async function SessionList() {
  const sessions = await getRecentTypingSessions(50);

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center text-center py-12">
          <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No sessions yet
          </h3>
          <p className="text-sm text-white/50 max-w-sm">
            Complete some typing challenges to see your session history here.
            You&apos;ll be able to replay your sessions and analyze your performance.
          </p>
          <Link
            href="/practice"
            className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Start Practicing
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <Card key={session.id} className="hover:bg-muted/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-white">
                    {session.challenge.category.name}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {session.challenge.difficulty}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDate(new Date(session.completedAt))}
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-orange-500" />
                    <span className="font-mono font-semibold">{session.wpm}</span>
                    <span className="text-xs text-muted-foreground">WPM</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-green-500" />
                    <span className="font-mono font-semibold">{session.accuracy}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="font-mono">{formatTime(session.durationMs)}</span>
                  </div>
                </div>

                <Link
                  href={`/dashboard/history/${session.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm"
                >
                  <PlayCircle className="h-4 w-4" />
                  Replay
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SessionListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-5 w-32 bg-muted rounded animate-pulse mb-1" />
                <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-5 w-12 bg-muted rounded animate-pulse" />
                  <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-8 w-20 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg lg:text-2xl font-medium text-white">
            Session History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and replay your past typing sessions
          </p>
        </div>
        <ExportCSVButton />
      </div>

      <Suspense fallback={<SessionListSkeleton />}>
        <SessionList />
      </Suspense>
    </section>
  );
}
