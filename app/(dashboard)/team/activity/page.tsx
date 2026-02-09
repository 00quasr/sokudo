import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Keyboard,
  UserPlus,
  LogOut,
  Lock,
  UserMinus,
  Mail,
  CheckCircle,
  Settings,
  UserCog,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import { ActivityType } from '@/lib/db/schema';
import { getUser, getTeamForUser, getTeamActivityFeed } from '@/lib/db/queries';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { TeamActivityFeedItem } from '@/lib/db/queries';

const actionIconMap: Record<string, LucideIcon> = {
  [ActivityType.SIGN_UP]: UserPlus,
  [ActivityType.SIGN_IN]: UserCog,
  [ActivityType.SIGN_OUT]: LogOut,
  [ActivityType.UPDATE_PASSWORD]: Lock,
  [ActivityType.DELETE_ACCOUNT]: UserMinus,
  [ActivityType.UPDATE_ACCOUNT]: Settings,
  [ActivityType.CREATE_TEAM]: UserPlus,
  [ActivityType.REMOVE_TEAM_MEMBER]: UserMinus,
  [ActivityType.INVITE_TEAM_MEMBER]: Mail,
  [ActivityType.ACCEPT_INVITATION]: CheckCircle,
};

function formatRelativeTime(date: Date): string {
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

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

function formatAction(action: string, userName: string | null): string {
  const name = userName ?? 'A member';
  switch (action) {
    case ActivityType.SIGN_UP:
      return `${name} signed up`;
    case ActivityType.SIGN_IN:
      return `${name} signed in`;
    case ActivityType.SIGN_OUT:
      return `${name} signed out`;
    case ActivityType.UPDATE_PASSWORD:
      return `${name} changed their password`;
    case ActivityType.DELETE_ACCOUNT:
      return `${name} deleted their account`;
    case ActivityType.UPDATE_ACCOUNT:
      return `${name} updated their account`;
    case ActivityType.CREATE_TEAM:
      return `${name} created the team`;
    case ActivityType.REMOVE_TEAM_MEMBER:
      return `${name} removed a team member`;
    case ActivityType.INVITE_TEAM_MEMBER:
      return `${name} invited a team member`;
    case ActivityType.ACCEPT_INVITATION:
      return `${name} accepted an invitation`;
    default:
      return `${name} performed an action`;
  }
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

function ActivityFeedItem({
  item,
  isCurrentUser,
}: {
  item: TeamActivityFeedItem;
  isCurrentUser: boolean;
}) {
  if (item.type === 'practice') {
    return (
      <div className="flex items-center gap-3 py-3 border-b border-white/[0.08] last:border-0">
        <Avatar className="size-8">
          <AvatarFallback className="text-xs">
            {getInitials(item.userName, item.userEmail)}
          </AvatarFallback>
        </Avatar>

        <div className="bg-orange-500/20 rounded-full p-1.5">
          <Keyboard className="h-4 w-4 text-orange-400" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-white">
            <span className="font-medium">
              {item.userName || item.userEmail}
            </span>
            {isCurrentUser && (
              <span className="ml-1.5 text-xs text-orange-400 font-normal">(you)</span>
            )}
            {' '}practiced{' '}
            <span className="font-medium">{item.categoryName}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(new Date(item.timestamp))}
            {item.durationMs !== undefined && (
              <> &middot; {formatDuration(item.durationMs)}</>
            )}
          </p>
        </div>

        <div className="flex gap-4 text-sm shrink-0">
          <div className="text-right">
            <p className="text-muted-foreground text-xs">WPM</p>
            <p className="font-mono font-semibold">{item.wpm}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Accuracy</p>
            <p className="font-mono font-semibold">{item.accuracy}%</p>
          </div>
        </div>
      </div>
    );
  }

  // Action type
  const Icon = (item.action && actionIconMap[item.action]) || Settings;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/[0.08] last:border-0">
      <Avatar className="size-8">
        <AvatarFallback className="text-xs">
          {getInitials(item.userName, item.userEmail)}
        </AvatarFallback>
      </Avatar>

      <div className="bg-white/[0.06] rounded-full p-1.5">
        <Icon className="h-4 w-4 text-white/60" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">
          {formatAction(item.action ?? '', item.userName)}
          {isCurrentUser && (
            <span className="ml-1.5 text-xs text-orange-400 font-normal">(you)</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatRelativeTime(new Date(item.timestamp))}
        </p>
      </div>
    </div>
  );
}

export default async function TeamActivityPage() {
  const [feed, team, currentUser] = await Promise.all([
    getTeamActivityFeed(30),
    getTeamForUser(),
    getUser(),
  ]);

  const hasTeam = team !== null;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-white mb-6">
        Team Activity
      </h1>

      {!hasTeam ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center text-center py-12">
            <Users className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No team found
            </h3>
            <p className="text-sm text-white/50 max-w-sm">
              You need to be part of a team to view team activity.
              Ask your team owner for an invitation.
            </p>
          </CardContent>
        </Card>
      ) : feed.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center text-center py-12">
            <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No activity yet
            </h3>
            <p className="text-sm text-white/50 max-w-sm">
              When team members practice or perform actions, their activity
              will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              {feed.map((item, index) => (
                <ActivityFeedItem
                  key={`${item.type}-${item.userId}-${index}`}
                  item={item}
                  isCurrentUser={currentUser?.id === item.userId}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
