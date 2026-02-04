import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Swords,
  Users,
  AlertCircle,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { getTeamChallenges, getTeamForUser, getUser } from '@/lib/db/queries';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import type { TeamChallengeWithDetails } from '@/lib/db/queries';

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

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'just now';
}

function ChallengeCard({
  challenge,
  totalMembers,
}: {
  challenge: TeamChallengeWithDetails;
  totalMembers: number;
}) {
  const isExpired = challenge.expiresAt && new Date(challenge.expiresAt) < new Date();
  const status = isExpired ? 'expired' : challenge.status;

  return (
    <Link href={`/team/challenges/${challenge.id}`}>
      <Card className="hover:border-orange-200 transition-colors cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
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
                {status === 'completed' && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    Completed
                  </span>
                )}
              </div>

              <p className="font-mono text-sm text-gray-700 truncate mb-3">
                {challenge.challengeContent.slice(0, 80)}
                {challenge.challengeContent.length > 80 ? '...' : ''}
              </p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Avatar className="size-5">
                    <AvatarFallback className="text-[10px]">
                      {getInitials(challenge.creatorName, challenge.creatorEmail)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{challenge.creatorName || challenge.creatorEmail}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>
                    {challenge.participantCount}/{totalMembers} participated
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTimeAgo(challenge.createdAt)}</span>
                </div>
              </div>
            </div>

            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function TeamChallengesPage() {
  const [challenges, team, currentUser] = await Promise.all([
    getTeamChallenges(),
    getTeamForUser(),
    getUser(),
  ]);

  const hasTeam = team !== null;
  const totalMembers = team?.teamMembers?.length ?? 0;

  const activeChallenges = challenges.filter((c) => {
    const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
    return c.status === 'active' && !isExpired;
  });
  const pastChallenges = challenges.filter((c) => {
    const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
    return c.status === 'completed' || isExpired;
  });

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          Team Challenges
        </h1>
        <Link
          href="/team/custom-challenges"
          className="text-sm text-muted-foreground hover:text-gray-900"
        >
          Custom Challenges
        </Link>
      </div>

      {!hasTeam ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center text-center py-12">
            <Users className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No team found
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              You need to be part of a team to view team challenges.
              Ask your team owner for an invitation.
            </p>
          </CardContent>
        </Card>
      ) : challenges.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center text-center py-12">
            <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No team challenges yet
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Team challenges let everyone practice the same content and compare results.
              Create one via the API to get started!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Active Challenges */}
          {activeChallenges.length > 0 && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Swords className="h-5 w-5 text-orange-500" />
                    Active Challenges ({activeChallenges.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeChallenges.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      totalMembers={totalMembers}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Past Challenges */}
          {pastChallenges.length > 0 && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-5 w-5" />
                    Past Challenges ({pastChallenges.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pastChallenges.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      totalMembers={totalMembers}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
