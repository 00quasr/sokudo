import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  Users,
  AlertCircle,
  Clock,
  Plus,
} from 'lucide-react';
import { getTeamCustomChallenges, getTeamForUser, getUser } from '@/lib/db/queries';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import type { TeamCustomChallengeWithCreator } from '@/lib/db/queries';
import { CreateTeamCustomChallengeForm } from './create-form';

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
}: {
  challenge: TeamCustomChallengeWithCreator;
}) {
  return (
    <Card className="hover:border-orange-200 transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium text-gray-900 truncate">
                {challenge.name}
              </h3>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {challenge.difficulty}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {challenge.syntaxType}
              </span>
            </div>

            <p className="font-mono text-sm text-gray-700 truncate mb-3">
              {challenge.content.slice(0, 100)}
              {challenge.content.length > 100 ? '...' : ''}
            </p>

            {challenge.hint && (
              <p className="text-xs text-muted-foreground mb-2 italic">
                Hint: {challenge.hint}
              </p>
            )}

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
                <Clock className="h-3 w-3" />
                <span>{formatTimeAgo(challenge.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function TeamCustomChallengesPage() {
  const [challenges, team, currentUser] = await Promise.all([
    getTeamCustomChallenges(),
    getTeamForUser(),
    getUser(),
  ]);

  const hasTeam = team !== null;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          Team Custom Challenges
        </h1>
        <Link
          href="/team/challenges"
          className="text-sm text-muted-foreground hover:text-gray-900"
        >
          View Team Challenges
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
              You need to be part of a team to view team custom challenges.
              Ask your team owner for an invitation.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Create New Challenge */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-orange-500" />
                Create Custom Challenge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CreateTeamCustomChallengeForm />
            </CardContent>
          </Card>

          {/* Challenges List */}
          {challenges.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center text-center py-12">
                <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No custom challenges yet
                </h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Create custom typing challenges for your team to practice.
                  Only team members can see these challenges.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-500" />
                  Custom Challenges ({challenges.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {challenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </section>
  );
}
