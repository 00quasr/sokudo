import { Card, CardContent } from '@/components/ui/card';
import { Crown, Trophy, Medal, Zap, Target, Clock, Users, AlertCircle } from 'lucide-react';
import { getRaceHistory } from '@/lib/db/queries';

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

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="h-4 w-4 text-yellow-500" />;
  if (rank === 2) return <Trophy className="h-4 w-4 text-gray-400" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
  return <span className="text-xs font-mono text-muted-foreground">#{rank}</span>;
}

function RankBadge({ rank }: { rank: number | null }) {
  if (rank === null) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
        DNF
      </span>
    );
  }

  const styles: Record<number, string> = {
    1: 'bg-yellow-100 text-yellow-700',
    2: 'bg-gray-100 text-gray-600',
    3: 'bg-amber-100 text-amber-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${styles[rank] ?? 'bg-muted text-muted-foreground'}`}
    >
      <RankIcon rank={rank} />
      {rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`}
    </span>
  );
}

export default async function RacesPage() {
  const participations = await getRaceHistory(50);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          Race History
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review your past race results and performance
        </p>
      </div>

      {participations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center text-center py-12">
            <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No races yet
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Join a race to compete against other typists. Your race history
              and results will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {participations.map((participation) => {
            const race = participation.race;
            const totalParticipants = race.participants.length;
            const finishedCount = race.participants.filter((p) => p.finishedAt !== null).length;
            const raceDate = race.startedAt ?? race.createdAt;
            const timeTaken =
              participation.finishedAt && race.startedAt
                ? (new Date(participation.finishedAt).getTime() -
                    new Date(race.startedAt).getTime()) /
                  1000
                : null;

            return (
              <Card key={participation.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">
                          {race.challenge.category.name}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {race.challenge.difficulty}
                        </span>
                        <RankBadge rank={participation.rank} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatDate(new Date(raceDate))}</span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {finishedCount}/{totalParticipants} finished
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      {participation.wpm !== null && (
                        <div className="flex items-center gap-1.5">
                          <Zap className="h-4 w-4 text-orange-500" />
                          <span className="font-mono font-semibold">{participation.wpm}</span>
                          <span className="text-xs text-muted-foreground">WPM</span>
                        </div>
                      )}
                      {participation.accuracy !== null && (
                        <div className="flex items-center gap-1.5">
                          <Target className="h-4 w-4 text-green-500" />
                          <span className="font-mono font-semibold">{participation.accuracy}%</span>
                        </div>
                      )}
                      {timeTaken !== null && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span className="font-mono">{formatTime(timeTaken)}</span>
                        </div>
                      )}
                      {participation.finishedAt === null && (
                        <span className="text-xs text-gray-400 italic">Did not finish</span>
                      )}
                    </div>
                  </div>

                  {totalParticipants > 1 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">Opponents:</span>
                        {race.participants
                          .filter((p) => p.userId !== participation.userId)
                          .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
                          .map((opponent) => (
                            <span
                              key={opponent.id}
                              className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full"
                            >
                              {opponent.user.username ?? opponent.user.name ?? opponent.user.email.split('@')[0]}
                              {opponent.wpm !== null && (
                                <span className="font-mono text-muted-foreground">
                                  {opponent.wpm} WPM
                                </span>
                              )}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
