export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import {
  Trophy,
  Crown,
  Medal,
  Calendar,
  Users,
  Clock,
  Zap,
  Target,
} from 'lucide-react';
import { db } from '@/lib/db/drizzle';
import {
  tournaments,
  tournamentParticipants,
  challenges,
  categories,
  users,
} from '@/lib/db/schema';
import { eq, and, desc, lte } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { TournamentActions } from './tournament-actions';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function timeRemaining(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  if (diffMs <= 0) return 'ended';
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  if (days > 0) return `${days}d ${hours}h remaining`;
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="h-4 w-4 text-yellow-500" />;
  if (rank === 2) return <Trophy className="h-4 w-4 text-gray-400" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
  return (
    <span className="text-xs font-mono text-muted-foreground">#{rank}</span>
  );
}

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId: tournamentIdStr } = await params;
  const tournamentId = parseInt(tournamentIdStr, 10);
  if (isNaN(tournamentId)) notFound();

  const now = new Date();

  // Auto-transition statuses
  await db
    .update(tournaments)
    .set({ status: 'active', updatedAt: now })
    .where(
      and(
        eq(tournaments.id, tournamentId),
        eq(tournaments.status, 'upcoming'),
        lte(tournaments.startsAt, now)
      )
    );
  await db
    .update(tournaments)
    .set({ status: 'completed', updatedAt: now })
    .where(
      and(
        eq(tournaments.id, tournamentId),
        eq(tournaments.status, 'active'),
        lte(tournaments.endsAt, now)
      )
    );

  const [tournament] = await db
    .select({
      id: tournaments.id,
      name: tournaments.name,
      description: tournaments.description,
      status: tournaments.status,
      startsAt: tournaments.startsAt,
      endsAt: tournaments.endsAt,
      createdAt: tournaments.createdAt,
      challenge: {
        id: challenges.id,
        content: challenges.content,
        difficulty: challenges.difficulty,
        syntaxType: challenges.syntaxType,
      },
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        icon: categories.icon,
      },
      creator: {
        id: users.id,
        name: users.name,
        username: users.username,
      },
    })
    .from(tournaments)
    .innerJoin(challenges, eq(tournaments.challengeId, challenges.id))
    .innerJoin(categories, eq(challenges.categoryId, categories.id))
    .innerJoin(users, eq(tournaments.createdBy, users.id))
    .where(eq(tournaments.id, tournamentId))
    .limit(1);

  if (!tournament) notFound();

  const leaderboard = await db
    .select({
      id: tournamentParticipants.id,
      userId: tournamentParticipants.userId,
      wpm: tournamentParticipants.wpm,
      rawWpm: tournamentParticipants.rawWpm,
      accuracy: tournamentParticipants.accuracy,
      completedAt: tournamentParticipants.completedAt,
      rank: tournamentParticipants.rank,
      user: {
        id: users.id,
        name: users.name,
        username: users.username,
      },
    })
    .from(tournamentParticipants)
    .innerJoin(users, eq(tournamentParticipants.userId, users.id))
    .where(eq(tournamentParticipants.tournamentId, tournamentId))
    .orderBy(desc(tournamentParticipants.wpm));

  const currentUser = await getUser();
  const isParticipant = currentUser
    ? leaderboard.some((p) => p.userId === currentUser.id)
    : false;
  const userEntry = currentUser
    ? leaderboard.find((p) => p.userId === currentUser.id)
    : null;

  const statusColor =
    tournament.status === 'active'
      ? 'text-green-600'
      : tournament.status === 'upcoming'
        ? 'text-blue-600'
        : 'text-gray-500';

  return (
    <section className="flex-1 p-4 lg:p-8 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="h-5 w-5 text-orange-500" />
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            {tournament.name}
          </h1>
        </div>
        {tournament.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {tournament.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formatDate(new Date(tournament.startsAt))} –{' '}
            {formatDate(new Date(tournament.endsAt))}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {leaderboard.length} participant
            {leaderboard.length !== 1 ? 's' : ''}
          </span>
          <span className={`flex items-center gap-1.5 font-medium ${statusColor}`}>
            <Clock className="h-4 w-4" />
            {tournament.status === 'active'
              ? timeRemaining(new Date(tournament.endsAt))
              : tournament.status === 'upcoming'
                ? `Starts ${formatDate(new Date(tournament.startsAt))}`
                : 'Completed'}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {tournament.category.name}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {tournament.challenge.difficulty}
          </span>
        </div>
      </div>

      {currentUser && (
        <TournamentActions
          tournamentId={tournament.id}
          status={tournament.status}
          isParticipant={isParticipant}
          hasSubmitted={userEntry?.completedAt !== null && userEntry?.completedAt !== undefined}
          challengeId={tournament.challenge.id}
          categorySlug={tournament.category.slug}
        />
      )}

      <Card className="mt-6">
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">
              Leaderboard
            </h2>
          </div>

          {leaderboard.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No participants yet. Be the first to join!
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {leaderboard.map((entry) => {
                const isCurrentUser =
                  currentUser && entry.userId === currentUser.id;
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between px-4 py-3 ${isCurrentUser ? 'bg-orange-50/50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 flex justify-center">
                        {entry.rank ? (
                          <RankIcon rank={entry.rank} />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            –
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-sm ${isCurrentUser ? 'font-semibold' : 'font-medium'} text-gray-900`}
                      >
                        {entry.user.username ??
                          entry.user.name ??
                          'Anonymous'}
                        {isCurrentUser && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (you)
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      {entry.wpm !== null ? (
                        <>
                          <div className="flex items-center gap-1.5">
                            <Zap className="h-4 w-4 text-orange-500" />
                            <span className="font-mono font-semibold">
                              {entry.wpm}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              WPM
                            </span>
                          </div>
                          {entry.accuracy !== null && (
                            <div className="flex items-center gap-1.5">
                              <Target className="h-4 w-4 text-green-500" />
                              <span className="font-mono font-semibold">
                                {entry.accuracy}%
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Not submitted
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
