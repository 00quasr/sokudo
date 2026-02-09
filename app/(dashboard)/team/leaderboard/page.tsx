import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Trophy,
  Medal,
  Target,
  TrendingUp,
  Flame,
  Clock,
  Users,
  AlertCircle,
} from 'lucide-react';
import { getTeamLeaderboard, getTeamForUser, getUser } from '@/lib/db/queries';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { TeamLeaderboardEntry } from '@/lib/db/queries';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-white/40" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
  return (
    <span className="text-sm font-mono font-semibold text-muted-foreground w-5 text-center">
      {rank}
    </span>
  );
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

function LeaderboardRow({
  entry,
  rank,
  isCurrentUser,
}: {
  entry: TeamLeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-4 py-4 px-4 border-b border-white/[0.08] last:border-0 ${
        isCurrentUser ? 'bg-orange-500/10' : ''
      }`}
    >
      <div className="flex items-center justify-center w-8">
        {getRankIcon(rank)}
      </div>

      <Avatar className="size-9">
        <AvatarFallback className={rank <= 3 ? 'bg-orange-500/20 text-orange-400' : ''}>
          {getInitials(entry.userName, entry.userEmail)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">
          {entry.userName || entry.userEmail}
          {isCurrentUser && (
            <span className="ml-2 text-xs text-orange-400 font-normal">(you)</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {entry.totalSessions} session{entry.totalSessions !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="hidden sm:flex gap-6 text-sm">
        <div className="text-right w-16">
          <p className="text-muted-foreground text-xs">Avg WPM</p>
          <p className="font-mono font-semibold">{entry.avgWpm}</p>
        </div>
        <div className="text-right w-16">
          <p className="text-muted-foreground text-xs">Best WPM</p>
          <p className="font-mono font-semibold">{entry.bestWpm}</p>
        </div>
        <div className="text-right w-16">
          <p className="text-muted-foreground text-xs">Accuracy</p>
          <p className="font-mono font-semibold">{entry.avgAccuracy}%</p>
        </div>
        <div className="text-right w-16">
          <p className="text-muted-foreground text-xs">Streak</p>
          <p className="font-mono font-semibold">{entry.currentStreak}d</p>
        </div>
      </div>

      {/* Mobile: show only avg WPM */}
      <div className="sm:hidden text-right">
        <p className="text-muted-foreground text-xs">Avg WPM</p>
        <p className="font-mono font-semibold">{entry.avgWpm}</p>
      </div>
    </div>
  );
}

export default async function TeamLeaderboardPage() {
  const [leaderboard, team, currentUser] = await Promise.all([
    getTeamLeaderboard(),
    getTeamForUser(),
    getUser(),
  ]);

  const hasTeam = team !== null;
  const hasData = leaderboard.length > 0 && leaderboard.some((e) => e.totalSessions > 0);

  // Calculate team-wide stats
  const teamStats = leaderboard.length > 0
    ? {
        totalMembers: leaderboard.length,
        teamAvgWpm: Math.round(
          leaderboard.filter((e) => e.totalSessions > 0).reduce((sum, e) => sum + e.avgWpm, 0) /
            Math.max(leaderboard.filter((e) => e.totalSessions > 0).length, 1)
        ),
        totalSessions: leaderboard.reduce((sum, e) => sum + e.totalSessions, 0),
        totalPracticeTimeMs: leaderboard.reduce((sum, e) => sum + e.totalPracticeTimeMs, 0),
      }
    : null;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-white mb-6">
        Team Leaderboard
      </h1>

      {!hasTeam ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center text-center py-12">
            <Users className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No team found
            </h3>
            <p className="text-sm text-white/50 max-w-sm">
              You need to be part of a team to view the leaderboard.
              Ask your team owner for an invitation.
            </p>
          </CardContent>
        </Card>
      ) : !hasData ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center text-center py-12">
            <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No activity yet
            </h3>
            <p className="text-sm text-white/50 max-w-sm">
              Your team members haven&apos;t completed any typing sessions yet.
              Start practicing to appear on the leaderboard!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Team Overview Stats */}
          {teamStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-500/20 rounded-full p-2">
                      <Users className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Members
                      </p>
                      <p className="text-2xl font-mono font-semibold">
                        {teamStats.totalMembers}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500/20 rounded-full p-2">
                      <TrendingUp className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Team Avg WPM
                      </p>
                      <p className="text-2xl font-mono font-semibold">
                        {teamStats.teamAvgWpm}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/20 rounded-full p-2">
                      <Target className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Total Sessions
                      </p>
                      <p className="text-2xl font-mono font-semibold">
                        {teamStats.totalSessions}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-500/20 rounded-full p-2">
                      <Clock className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Practice Time
                      </p>
                      <p className="text-2xl font-mono font-semibold">
                        {formatTime(teamStats.totalPracticeTimeMs)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Leaderboard Rankings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-orange-500" />
                Rankings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {leaderboard.map((entry, index) => (
                <LeaderboardRow
                  key={entry.userId}
                  entry={entry}
                  rank={index + 1}
                  isCurrentUser={currentUser?.id === entry.userId}
                />
              ))}
            </CardContent>
          </Card>

          {/* Top Performers */}
          {leaderboard.length >= 2 && (
            <div className="grid lg:grid-cols-3 gap-4">
              {/* Fastest Typist */}
              {(() => {
                const fastest = [...leaderboard]
                  .filter((e) => e.totalSessions > 0)
                  .sort((a, b) => b.bestWpm - a.bestWpm)[0];
                return fastest ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-yellow-500/20 rounded-full p-2">
                          <TrendingUp className="h-5 w-5 text-yellow-400" />
                        </div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          Fastest Typist
                        </p>
                      </div>
                      <p className="font-medium text-white">
                        {fastest.userName || fastest.userEmail}
                      </p>
                      <p className="text-2xl font-mono font-semibold text-orange-400">
                        {fastest.bestWpm} WPM
                      </p>
                    </CardContent>
                  </Card>
                ) : null;
              })()}

              {/* Most Accurate */}
              {(() => {
                const accurate = [...leaderboard]
                  .filter((e) => e.totalSessions > 0)
                  .sort((a, b) => b.avgAccuracy - a.avgAccuracy)[0];
                return accurate ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-green-500/20 rounded-full p-2">
                          <Target className="h-5 w-5 text-green-400" />
                        </div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          Most Accurate
                        </p>
                      </div>
                      <p className="font-medium text-white">
                        {accurate.userName || accurate.userEmail}
                      </p>
                      <p className="text-2xl font-mono font-semibold text-green-400">
                        {accurate.avgAccuracy}%
                      </p>
                    </CardContent>
                  </Card>
                ) : null;
              })()}

              {/* Longest Streak */}
              {(() => {
                const streaker = [...leaderboard]
                  .filter((e) => e.currentStreak > 0)
                  .sort((a, b) => b.currentStreak - a.currentStreak)[0];
                return streaker ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-purple-500/20 rounded-full p-2">
                          <Flame className="h-5 w-5 text-purple-400" />
                        </div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          Longest Streak
                        </p>
                      </div>
                      <p className="font-medium text-white">
                        {streaker.userName || streaker.userEmail}
                      </p>
                      <p className="text-2xl font-mono font-semibold text-purple-400">
                        {streaker.currentStreak} days
                      </p>
                    </CardContent>
                  </Card>
                ) : null;
              })()}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
