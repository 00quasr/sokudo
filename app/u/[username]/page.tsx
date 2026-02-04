import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  getUserByUsername,
  getPublicProfileStats,
  getPublicCategoryPerformance,
  getPublicRecentSessions,
  getPublicUserAchievements,
} from '@/lib/db/queries';
import {
  Trophy,
  Target,
  Clock,
  TrendingUp,
  Flame,
  Keyboard,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShareStatsCard } from '@/components/stats/ShareStatsCard';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    return { title: 'User Not Found - Sokudo' };
  }

  const displayName = user.name || user.username || 'User';
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const ogImageUrl = `${baseUrl}/api/og/stats/${username}`;
  const profileUrl = `${baseUrl}/u/${username}`;

  return {
    title: `${displayName} - Sokudo Profile`,
    description: `View ${displayName}'s typing stats on Sokudo`,
    openGraph: {
      title: `${displayName}'s Typing Stats - Sokudo`,
      description: `Check out ${displayName}'s developer typing stats on Sokudo`,
      url: profileUrl,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${displayName}'s Sokudo stats card`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName}'s Typing Stats - Sokudo`,
      description: `Check out ${displayName}'s developer typing stats on Sokudo`,
      images: [ogImageUrl],
    },
  };
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function formatJoinDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    notFound();
  }

  const [stats, categoryPerformance, recentSessions, earnedAchievements] =
    await Promise.all([
      getPublicProfileStats(user.id),
      getPublicCategoryPerformance(user.id),
      getPublicRecentSessions(user.id, 10),
      getPublicUserAchievements(user.id),
    ]);

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const displayName = user.name || user.username || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sokudo
        </Link>

        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-xl">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
            <p className="text-sm text-gray-500">
              @{user.username} &middot; Joined{' '}
              {formatJoinDate(new Date(user.createdAt))}
            </p>
          </div>
        </div>

        {/* Earned Badges */}
        {earnedAchievements.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {earnedAchievements.map((a, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium border border-orange-200"
                title={a.name}
              >
                <span>{a.icon}</span>
                {a.name}
              </span>
            ))}
          </div>
        )}

        {stats.totalSessions === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center text-center py-12">
              <Keyboard className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No stats yet
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                This user hasn&apos;t completed any typing sessions yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 rounded-full p-2">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Avg WPM
                      </p>
                      <p className="text-2xl font-mono font-semibold">
                        {stats.avgWpm}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 rounded-full p-2">
                      <Target className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Avg Accuracy
                      </p>
                      <p className="text-2xl font-mono font-semibold">
                        {stats.avgAccuracy}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 rounded-full p-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Practice Time
                      </p>
                      <p className="text-2xl font-mono font-semibold">
                        {formatTime(stats.totalPracticeTimeMs)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 rounded-full p-2">
                      <Flame className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Current Streak
                      </p>
                      <p className="text-2xl font-mono font-semibold">
                        {stats.currentStreak} days
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Personal Bests */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-orange-500" />
                    Personal Bests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Best WPM
                      </span>
                      <span className="font-mono font-semibold">
                        {stats.bestWpm}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Best Accuracy
                      </span>
                      <span className="font-mono font-semibold">
                        {stats.bestAccuracy}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Longest Streak
                      </span>
                      <span className="font-mono font-semibold">
                        {stats.longestStreak} days
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Total Sessions
                      </span>
                      <span className="font-mono font-semibold">
                        {stats.totalSessions}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Category Performance */}
              {categoryPerformance.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Category Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categoryPerformance.slice(0, 5).map((cat, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                        >
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {cat.categoryName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {cat.sessions} session
                              {cat.sessions !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="flex gap-4 text-sm">
                            <div className="text-right">
                              <p className="text-muted-foreground text-xs">
                                WPM
                              </p>
                              <p className="font-mono font-semibold">
                                {cat.avgWpm}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-muted-foreground text-xs">
                                Accuracy
                              </p>
                              <p className="font-mono font-semibold">
                                {cat.avgAccuracy}%
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Recent Sessions */}
            {recentSessions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentSessions.map((session, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {session.categoryName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(new Date(session.completedAt))}
                          </p>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <div className="text-right">
                            <p className="text-muted-foreground text-xs">WPM</p>
                            <p className="font-mono font-semibold">
                              {session.wpm}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-muted-foreground text-xs">
                              Accuracy
                            </p>
                            <p className="font-mono font-semibold">
                              {session.accuracy}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Share Stats Card */}
            {user.username && (
              <Card>
                <CardContent className="pt-6">
                  <ShareStatsCard username={user.username} baseUrl={baseUrl} />
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
