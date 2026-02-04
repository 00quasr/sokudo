import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Trophy,
  Medal,
  Target,
  TrendingUp,
  Users,
  ArrowLeft,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  getTeamChallengeById,
  getTeamChallengeResults,
  getTeamForUser,
  getUser,
} from '@/lib/db/queries';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { TeamChallengeResult } from '@/lib/db/queries';

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

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
  return (
    <span className="text-sm font-mono font-semibold text-muted-foreground w-5 text-center">
      {rank}
    </span>
  );
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

function ResultRow({
  result,
  rank,
  isCurrentUser,
}: {
  result: TeamChallengeResult;
  rank: number;
  isCurrentUser: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-4 py-4 px-4 border-b border-gray-100 last:border-0 ${
        isCurrentUser ? 'bg-orange-50/50' : ''
      }`}
    >
      <div className="flex items-center justify-center w-8">
        {getRankIcon(rank)}
      </div>

      <Avatar className="size-9">
        <AvatarFallback className={rank <= 3 ? 'bg-orange-100 text-orange-700' : ''}>
          {getInitials(result.userName, result.userEmail)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {result.userName || result.userEmail}
          {isCurrentUser && (
            <span className="ml-2 text-xs text-orange-600 font-normal">(you)</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDuration(result.durationMs)}
        </p>
      </div>

      <div className="hidden sm:flex gap-6 text-sm">
        <div className="text-right w-16">
          <p className="text-muted-foreground text-xs">WPM</p>
          <p className="font-mono font-semibold">{result.wpm}</p>
        </div>
        <div className="text-right w-16">
          <p className="text-muted-foreground text-xs">Raw WPM</p>
          <p className="font-mono font-semibold">{result.rawWpm}</p>
        </div>
        <div className="text-right w-16">
          <p className="text-muted-foreground text-xs">Accuracy</p>
          <p className="font-mono font-semibold">{result.accuracy}%</p>
        </div>
        <div className="text-right w-16">
          <p className="text-muted-foreground text-xs">Errors</p>
          <p className="font-mono font-semibold">{result.errors}</p>
        </div>
      </div>

      {/* Mobile: show only WPM */}
      <div className="sm:hidden text-right">
        <p className="text-muted-foreground text-xs">WPM</p>
        <p className="font-mono font-semibold">{result.wpm}</p>
      </div>
    </div>
  );
}

export default async function TeamChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teamChallengeId = parseInt(id, 10);
  if (isNaN(teamChallengeId)) {
    notFound();
  }

  const [challenge, results, team, currentUser] = await Promise.all([
    getTeamChallengeById(teamChallengeId),
    getTeamChallengeResults(teamChallengeId),
    getTeamForUser(),
    getUser(),
  ]);

  if (!challenge) {
    notFound();
  }

  const totalMembers = team?.teamMembers?.length ?? 0;
  const isExpired = challenge.expiresAt && new Date(challenge.expiresAt) < new Date();
  const status = isExpired ? 'expired' : challenge.status;

  // Stats from results
  const avgWpm = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.wpm, 0) / results.length)
    : 0;
  const bestWpm = results.length > 0
    ? Math.max(...results.map((r) => r.wpm))
    : 0;
  const avgAccuracy = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.accuracy, 0) / results.length)
    : 0;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <Link
        href="/team/challenges"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Team Challenges
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          Challenge Results
        </h1>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
          {challenge.categoryName}
        </span>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
          {challenge.challengeDifficulty}
        </span>
        {status === 'active' && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
            Active
          </span>
        )}
        {status === 'expired' && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
            Expired
          </span>
        )}
      </div>

      {/* Challenge Content */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            Challenge Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="font-mono text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 rounded-lg p-4">
            {challenge.challengeContent}
          </pre>
          {challenge.challengeHint && (
            <p className="mt-3 text-xs text-muted-foreground">
              Hint: {challenge.challengeHint}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 rounded-full p-2">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Participants
                </p>
                <p className="text-2xl font-mono font-semibold">
                  {results.length}/{totalMembers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-full p-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Best WPM
                </p>
                <p className="text-2xl font-mono font-semibold">
                  {bestWpm}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-full p-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Avg WPM
                </p>
                <p className="text-2xl font-mono font-semibold">
                  {avgWpm}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 rounded-full p-2">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Avg Accuracy
                </p>
                <p className="text-2xl font-mono font-semibold">
                  {avgAccuracy}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Leaderboard */}
      {results.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center text-center py-12">
            <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No results yet
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              No team members have completed this challenge yet.
              Be the first to practice!
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-orange-500" />
              Rankings ({results.length} participant{results.length !== 1 ? 's' : ''})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {results.map((result, index) => (
              <ResultRow
                key={result.userId}
                result={result}
                rank={index + 1}
                isCurrentUser={currentUser?.id === result.userId}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </section>
  );
}
