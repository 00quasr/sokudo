export const dynamic = 'force-dynamic';

import { Card, CardContent } from '@/components/ui/card';
import {
  Trophy,
  Calendar,
  Users,
  Clock,
  Zap,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/db/drizzle';
import {
  tournaments,
  tournamentParticipants,
  challenges,
  categories,
  users,
} from '@/lib/db/schema';
import { eq, desc, and, lte, sql } from 'drizzle-orm';

function formatDateRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`;
}

function timeRemaining(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  if (diffMs <= 0) return 'ended';
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  if (days > 0) return `${days}d ${hours}h left`;
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    upcoming: 'bg-blue-500/20 text-blue-400',
    active: 'bg-green-500/20 text-green-400',
    completed: 'bg-white/[0.1] text-white/50',
  };

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] ?? 'bg-muted text-muted-foreground'}`}
    >
      {status === 'active'
        ? 'Live'
        : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

async function getTournaments() {
  const now = new Date();

  // Auto-transition statuses
  await db
    .update(tournaments)
    .set({ status: 'active', updatedAt: now })
    .where(
      and(eq(tournaments.status, 'upcoming'), lte(tournaments.startsAt, now))
    );
  await db
    .update(tournaments)
    .set({ status: 'completed', updatedAt: now })
    .where(
      and(eq(tournaments.status, 'active'), lte(tournaments.endsAt, now))
    );

  return db
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
        difficulty: challenges.difficulty,
        syntaxType: challenges.syntaxType,
      },
      category: {
        id: categories.id,
        name: categories.name,
        icon: categories.icon,
      },
      participantCount:
        sql<number>`(SELECT count(*) FROM tournament_participants WHERE tournament_id = ${tournaments.id})::int`,
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
    .orderBy(desc(tournaments.startsAt))
    .limit(50);
}

export default async function TournamentsPage() {
  const tournamentList = await getTournaments();

  const active = tournamentList.filter((t) => t.status === 'active');
  const upcoming = tournamentList.filter((t) => t.status === 'upcoming');
  const completed = tournamentList.filter((t) => t.status === 'completed');

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-lg lg:text-2xl font-medium text-white">
          Weekly Tournaments
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Compete in scheduled tournaments and climb the leaderboard
        </p>
      </div>

      {tournamentList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center text-center py-12">
            <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No tournaments yet
            </h3>
            <p className="text-sm text-white/50 max-w-sm">
              Tournaments will appear here when they are scheduled. Check back
              soon for upcoming competitions.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-3">
                Live Now
              </h2>
              <div className="space-y-3">
                {active.map((t) => (
                  <TournamentCard key={t.id} tournament={t} />
                ))}
              </div>
            </div>
          )}

          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">
                Upcoming
              </h2>
              <div className="space-y-3">
                {upcoming.map((t) => (
                  <TournamentCard key={t.id} tournament={t} />
                ))}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">
                Completed
              </h2>
              <div className="space-y-3">
                {completed.map((t) => (
                  <TournamentCard key={t.id} tournament={t} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function TournamentCard({
  tournament,
}: {
  tournament: Awaited<ReturnType<typeof getTournaments>>[number];
}) {
  const isActive = tournament.status === 'active';

  return (
    <Link href={`/dashboard/tournaments/${tournament.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Trophy
                  className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-green-500' : 'text-orange-500'}`}
                />
                <h3 className="font-medium text-white truncate">
                  {tournament.name}
                </h3>
                <StatusBadge status={tournament.status} />
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {tournament.challenge.difficulty}
                </span>
              </div>
              {tournament.description && (
                <p className="text-xs text-muted-foreground truncate mb-1">
                  {tournament.description}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDateRange(
                    new Date(tournament.startsAt),
                    new Date(tournament.endsAt)
                  )}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {tournament.participantCount} participant
                  {tournament.participantCount !== 1 ? 's' : ''}
                </span>
                {isActive && (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <Clock className="h-3 w-3" />
                    {timeRemaining(new Date(tournament.endsAt))}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
