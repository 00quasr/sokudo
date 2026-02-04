import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Trophy,
  Users,
  AlertCircle,
  Gauge,
  Zap,
  CheckCircle,
  Clock,
  Target,
  Flame,
  Swords,
} from 'lucide-react';
import { getTeamAchievements, getTeamForUser } from '@/lib/db/queries';
import type { TeamAchievementWithStatus } from '@/lib/db/queries';

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getAchievementIcon(icon: string) {
  const iconMap: Record<string, React.ReactNode> = {
    users: <Users className="h-6 w-6" />,
    gauge: <Gauge className="h-6 w-6" />,
    zap: <Zap className="h-6 w-6" />,
    'check-circle': <CheckCircle className="h-6 w-6" />,
    clock: <Clock className="h-6 w-6" />,
    target: <Target className="h-6 w-6" />,
    flame: <Flame className="h-6 w-6" />,
    swords: <Swords className="h-6 w-6" />,
    trophy: <Trophy className="h-6 w-6" />,
  };
  return iconMap[icon] ?? <Trophy className="h-6 w-6" />;
}

function AchievementCard({ achievement }: { achievement: TeamAchievementWithStatus }) {
  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg border ${
        achievement.earned
          ? 'border-orange-200 bg-orange-50/50'
          : 'border-gray-200 bg-gray-50/50 opacity-60'
      }`}
    >
      <div
        className={`rounded-full p-3 ${
          achievement.earned
            ? 'bg-orange-100 text-orange-600'
            : 'bg-gray-100 text-gray-400'
        }`}
      >
        {getAchievementIcon(achievement.icon)}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`font-medium ${
            achievement.earned ? 'text-gray-900' : 'text-gray-500'
          }`}
        >
          {achievement.name}
        </p>
        <p className="text-xs text-muted-foreground">{achievement.description}</p>
        {achievement.earned && achievement.earnedAt && (
          <p className="text-xs text-orange-600 mt-1">
            Earned {formatDate(achievement.earnedAt)}
          </p>
        )}
      </div>
      {achievement.earned && (
        <CheckCircle className="h-5 w-5 text-orange-500 flex-shrink-0" />
      )}
    </div>
  );
}

export default async function TeamAchievementsPage() {
  const [achievements, team] = await Promise.all([
    getTeamAchievements(),
    getTeamForUser(),
  ]);

  const hasTeam = team !== null;
  const earnedCount = achievements.filter((a) => a.earned).length;
  const totalCount = achievements.length;

  const earned = achievements.filter((a) => a.earned);
  const unearned = achievements.filter((a) => !a.earned);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Team Achievements
      </h1>

      {!hasTeam ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center text-center py-12">
            <Users className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No team found
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              You need to be part of a team to view team achievements.
              Ask your team owner for an invitation.
            </p>
          </CardContent>
        </Card>
      ) : totalCount === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center text-center py-12">
            <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No achievements available
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Team achievements haven&apos;t been set up yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Progress Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 rounded-full p-2">
                    <Trophy className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Earned
                    </p>
                    <p className="text-2xl font-mono font-semibold">
                      {earnedCount}
                      <span className="text-sm text-muted-foreground font-normal">
                        /{totalCount}
                      </span>
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
                      Progress
                    </p>
                    <p className="text-2xl font-mono font-semibold">
                      {totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-2 lg:col-span-1">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 rounded-full p-2">
                    <Flame className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Remaining
                    </p>
                    <p className="text-2xl font-mono font-semibold">
                      {totalCount - earnedCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Earned Achievements */}
          {earned.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-orange-500" />
                  Earned ({earned.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {earned.map((achievement) => (
                    <AchievementCard key={achievement.id} achievement={achievement} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Locked Achievements */}
          {unearned.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-5 w-5" />
                  Locked ({unearned.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {unearned.map((achievement) => (
                    <AchievementCard key={achievement.id} achievement={achievement} />
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
