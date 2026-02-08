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
    <div>
      <h1 className="text-xl font-medium text-white mb-6">
        Your stats
      </h1>

      {!hasData ? (
        <div className="rounded-2xl bg-white/[0.02] p-12 flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-12 w-12 text-white/40 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            No stats yet
          </h3>
          <p className="text-sm text-white/40 max-w-sm">
            Complete some typing challenges to start tracking your progress.
            Your WPM, accuracy, and streaks will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-white/[0.02] p-5">
              <div className="flex items-center gap-3">
                <div className="bg-white/5 rounded-xl p-2">
                  <TrendingUp className="h-5 w-5 text-white/60" />
                </div>
                <div>
                  <p className="text-xs text-white/40">
                    Avg WPM
                  </p>
                  <p className="text-2xl font-mono font-medium text-white">
                    {stats.avgWpm}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/[0.02] p-5">
              <div className="flex items-center gap-3">
                <div className="bg-white/5 rounded-xl p-2">
                  <Target className="h-5 w-5 text-white/60" />
                </div>
                <div>
                  <p className="text-xs text-white/40">
                    Avg accuracy
                  </p>
                  <p className="text-2xl font-mono font-medium text-white">
                    {stats.avgAccuracy}%
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/[0.02] p-5">
              <div className="flex items-center gap-3">
                <div className="bg-white/5 rounded-xl p-2">
                  <Clock className="h-5 w-5 text-white/60" />
                </div>
                <div>
                  <p className="text-xs text-white/40">
                    Practice time
                  </p>
                  <p className="text-2xl font-mono font-medium text-white">
                    {formatTime(stats.totalPracticeTimeMs)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/[0.02] p-5">
              <div className="flex items-center gap-3">
                <div className="bg-white/5 rounded-xl p-2">
                  <Flame className="h-5 w-5 text-white/60" />
                </div>
                <div>
                  <p className="text-xs text-white/40">
                    Current streak
                  </p>
                  <p className="text-2xl font-mono font-medium text-white">
                    {stats.currentStreak} days
                  </p>
                </div>
              </div>
            </div>
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
            <div className="rounded-2xl bg-white/[0.02] p-6">
              <h2 className="flex items-center gap-2 text-lg font-medium text-white mb-4">
                <Trophy className="h-5 w-5 text-white/60" />
                Personal bests
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/50">
                    Best WPM
                  </span>
                  <span className="font-mono font-medium text-white">
                    {stats.bestWpm}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/50">
                    Best accuracy
                  </span>
                  <span className="font-mono font-medium text-white">
                    {stats.bestAccuracy}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/50">
                    Longest streak
                  </span>
                  <span className="font-mono font-medium text-white">
                    {stats.longestStreak} days
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/50">
                    Total sessions
                  </span>
                  <span className="font-mono font-medium text-white">
                    {stats.totalSessions}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/[0.02] p-6">
              <h2 className="flex items-center gap-2 text-lg font-medium text-white mb-4">
                <Keyboard className="h-5 w-5 text-white/60" />
                Keystroke stats
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/50">
                    Total keystrokes
                  </span>
                  <span className="font-mono font-medium text-white">
                    {stats.totalKeystrokes.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/50">
                    Total errors
                  </span>
                  <span className="font-mono font-medium text-white">
                    {stats.totalErrors.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/50">
                    Error rate
                  </span>
                  <span className="font-mono font-medium text-white">
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
            </div>
          </div>

          {/* Category Performance */}
          {categoryPerformance.length > 0 && (
            <div className="rounded-2xl bg-white/[0.02] p-6">
              <h2 className="text-lg font-medium text-white mb-4">Category performance</h2>
              <div className="space-y-3">
                {categoryPerformance.map((cat) => (
                  <div
                    key={cat.categoryId}
                    className="flex items-center justify-between py-3 border-b border-white/[0.08] last:border-0"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {cat.categoryName}
                      </p>
                      <p className="text-xs text-white/40">
                        {cat.sessions} session{cat.sessions !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div className="text-right">
                        <p className="text-white/40 text-xs">WPM</p>
                        <p className="font-mono font-medium text-white">
                          {cat.avgWpm}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/40 text-xs">
                          Accuracy
                        </p>
                        <p className="font-mono font-medium text-white">
                          {cat.avgAccuracy}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Sessions */}
          {recentSessions.length > 0 && (
            <div className="rounded-2xl bg-white/[0.02] p-6">
              <h2 className="text-lg font-medium text-white mb-4">Recent sessions</h2>
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between py-3 border-b border-white/[0.08] last:border-0"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {session.challenge.category.name}
                      </p>
                      <p className="text-xs text-white/40">
                        {formatDate(new Date(session.completedAt))}
                      </p>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div className="text-right">
                        <p className="text-white/40 text-xs">WPM</p>
                        <p className="font-mono font-medium text-white">
                          {session.wpm}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/40 text-xs">
                          Accuracy
                        </p>
                        <p className="font-mono font-medium text-white">
                          {session.accuracy}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Share Stats Card */}
          {user?.username && (
            <div className="rounded-2xl bg-white/[0.02] p-6">
              <ShareStatsCard username={user.username} baseUrl={baseUrl} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
