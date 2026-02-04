import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Trophy,
  Target,
  Clock,
  Keyboard,
  Flame,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import {
  getUser,
  getUserStatsOverview,
  getRecentTypingSessions,
  getCategoryPerformance,
  getCategoryBreakdown,
  getWpmTrend,
  getWpmByHourOfDay,
  getCategoryMastery,
  getMonthlyComparison,
  getDailyPracticeHistory,
  getUserWeaknessReport,
} from '@/lib/db/queries';
import { ShareStatsCard } from '@/components/stats/ShareStatsCard';
import { WpmTrendSection } from '@/components/stats/WpmTrendSection';
import { CategoryBreakdownSection } from '@/components/stats/CategoryBreakdown';
import { TimeOfDayChart } from '@/components/stats/TimeOfDayChart';
import { CategoryMasterySection } from '@/components/stats/CategoryMasterySection';
import { MonthlyComparisonSection } from '@/components/stats/MonthlyComparisonSection';
import { PracticeCalendar } from '@/components/stats/PracticeCalendar';
import { WeaknessAnalysis } from '@/components/stats/WeaknessAnalysis';

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

export default async function StatsPage() {
  const [user, stats, recentSessions, categoryPerformance, categoryBreakdown, wpmTrend7Days, wpmTrend30Days, wpmByHour, categoryMastery, monthlyComparison, dailyPracticeData, weaknessReport] = await Promise.all([
    getUser(),
    getUserStatsOverview(),
    getRecentTypingSessions(5),
    getCategoryPerformance(),
    getCategoryBreakdown(),
    getWpmTrend(7),
    getWpmTrend(30),
    getWpmByHourOfDay(),
    getCategoryMastery(),
    getMonthlyComparison(),
    getDailyPracticeHistory(365),
    getUserWeaknessReport(),
  ]);

  const hasData = stats.totalSessions > 0;
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Your Stats
      </h1>

      {!hasData ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center text-center py-12">
            <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No stats yet
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Complete some typing challenges to start tracking your progress.
              Your WPM, accuracy, and streaks will appear here.
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

          {/* Practice Calendar */}
          <PracticeCalendar
            data={dailyPracticeData.map((d) => ({
              date: d.date,
              practiceTimeMs: d.practiceTimeMs,
              sessionsCompleted: d.sessionsCompleted,
            }))}
          />

          {/* WPM Trend Chart */}
          {(wpmTrend7Days.length > 1 || wpmTrend30Days.length > 1) && (
            <WpmTrendSection data7Days={wpmTrend7Days} data30Days={wpmTrend30Days} />
          )}

          {/* Weakness Analysis */}
          <WeaknessAnalysis report={weaknessReport} />

          {/* Monthly Comparison */}
          {monthlyComparison && (
            <MonthlyComparisonSection data={monthlyComparison} />
          )}

          {/* Speed by Time of Day Chart */}
          {wpmByHour.length > 1 && (
            <TimeOfDayChart data={wpmByHour} />
          )}

          {/* Category Breakdown - Best/Worst */}
          {(categoryBreakdown.best.byWpm || categoryBreakdown.best.byAccuracy) && (
            <CategoryBreakdownSection data={categoryBreakdown} />
          )}

          {/* Category Mastery Progress */}
          {categoryMastery.some((c) => c.totalChallenges > 0) && (
            <CategoryMasterySection data={categoryMastery} />
          )}

          {/* Best Stats & Details */}
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Keyboard className="h-5 w-5 text-orange-500" />
                  Keystroke Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Total Keystrokes
                    </span>
                    <span className="font-mono font-semibold">
                      {stats.totalKeystrokes.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Total Errors
                    </span>
                    <span className="font-mono font-semibold">
                      {stats.totalErrors.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Error Rate
                    </span>
                    <span className="font-mono font-semibold">
                      {stats.totalKeystrokes > 0
                        ? (
                            (stats.totalErrors / stats.totalKeystrokes) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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

          {/* Recent Sessions */}
          {recentSessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {session.challenge.category.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(new Date(session.completedAt))}
                        </p>
                      </div>
                      <div className="flex gap-6 text-sm">
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
          {user?.username && (
            <Card>
              <CardContent className="pt-6">
                <ShareStatsCard username={user.username} baseUrl={baseUrl} />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </section>
  );
}
