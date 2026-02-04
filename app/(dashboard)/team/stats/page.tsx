import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  TrendingUp,
  Target,
  Clock,
  Trophy,
  Flame,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import {
  getUser,
  getTeamForUser,
  getTeamStatsOverview,
  getTeamWpmTrend,
  getTeamCategoryPerformance,
  getTeamRecentActivity,
  getTeamMemberWpmComparison,
} from '@/lib/db/queries';
import { WpmTrendSection } from '@/components/stats/WpmTrendSection';
import { TeamWpmComparisonSection } from '@/components/stats/TeamWpmComparisonSection';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return email[0].toUpperCase();
}

export default async function TeamStatsPage() {
  const [overview, team, currentUser, wpmTrend7Days, wpmTrend30Days, categoryPerformance, recentActivity, comparison7Days, comparison30Days] =
    await Promise.all([
      getTeamStatsOverview(),
      getTeamForUser(),
      getUser(),
      getTeamWpmTrend(7),
      getTeamWpmTrend(30),
      getTeamCategoryPerformance(),
      getTeamRecentActivity(10),
      getTeamMemberWpmComparison(7),
      getTeamMemberWpmComparison(30),
    ]);

  const hasTeam = team !== null;
  const hasData = overview !== null && overview.totalSessions > 0;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Team Statistics
      </h1>

      {!hasTeam ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center text-center py-12">
            <Users className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No team found
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              You need to be part of a team to view team statistics.
              Ask your team owner for an invitation.
            </p>
          </CardContent>
        </Card>
      ) : !hasData ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center text-center py-12">
            <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No activity yet
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Your team members haven&apos;t completed any typing sessions yet.
              Start practicing to see team statistics!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Overview Stats */}
          {overview && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 rounded-full p-2">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Team Avg WPM
                      </p>
                      <p className="text-2xl font-mono font-semibold">
                        {overview.teamAvgWpm}
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
                        {overview.teamAvgAccuracy}%
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
                        {formatTime(overview.totalPracticeTimeMs)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 rounded-full p-2">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Active Members
                      </p>
                      <p className="text-2xl font-mono font-semibold">
                        {overview.activeMembers}
                        <span className="text-sm text-muted-foreground font-normal">
                          /{overview.totalMembers}
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* WPM Trend Chart */}
          {(wpmTrend7Days.length > 1 || wpmTrend30Days.length > 1) && (
            <WpmTrendSection data7Days={wpmTrend7Days} data30Days={wpmTrend30Days} />
          )}

          {/* Member WPM Comparison Chart */}
          {(comparison7Days.length > 1 || comparison30Days.length > 1) && (
            <TeamWpmComparisonSection data7Days={comparison7Days} data30Days={comparison30Days} />
          )}

          {/* Team Highlights */}
          {overview && (
            <div className="grid lg:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-yellow-100 rounded-full p-2">
                      <Trophy className="h-5 w-5 text-yellow-600" />
                    </div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Team Best WPM
                    </p>
                  </div>
                  <p className="text-2xl font-mono font-semibold text-orange-600">
                    {overview.teamBestWpm} WPM
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-100 rounded-full p-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Total Sessions
                    </p>
                  </div>
                  <p className="text-2xl font-mono font-semibold text-blue-600">
                    {overview.totalSessions}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-purple-100 rounded-full p-2">
                      <Flame className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Avg Streak
                    </p>
                  </div>
                  <p className="text-2xl font-mono font-semibold text-purple-600">
                    {overview.avgStreak} days
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Category Performance */}
          {categoryPerformance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryPerformance.map((cat) => (
                    <div
                      key={cat.categoryId}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {cat.categoryName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {cat.sessions} session{cat.sessions !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex gap-6 text-sm">
                        <div className="text-right">
                          <p className="text-muted-foreground text-xs">WPM</p>
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

          {/* Recent Team Activity */}
          {recentActivity.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={`${activity.userId}-${index}`}
                      className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
                    >
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(activity.userName, activity.userEmail)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate text-sm">
                          {activity.userName || activity.userEmail}
                          {currentUser?.id === activity.userId && (
                            <span className="ml-2 text-xs text-orange-600 font-normal">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.categoryName} &middot; {formatDate(new Date(activity.completedAt))}
                        </p>
                      </div>

                      <div className="flex gap-4 text-sm">
                        <div className="text-right">
                          <p className="text-muted-foreground text-xs">WPM</p>
                          <p className="font-mono font-semibold">
                            {activity.wpm}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-xs">Accuracy</p>
                          <p className="font-mono font-semibold">
                            {activity.accuracy}%
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
      )}
    </section>
  );
}
