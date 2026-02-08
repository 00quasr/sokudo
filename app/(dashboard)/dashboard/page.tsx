'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { customerPortalAction } from '@/lib/payments/actions';
import { useActionState } from 'react';
import { TeamDataWithMembers, User } from '@/lib/db/schema';
import { removeTeamMember, inviteTeamMember, cancelInvitation } from '@/app/(login)/actions';
import useSWR, { mutate } from 'swr';
import { Suspense } from 'react';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle, Mail, X, Clock } from 'lucide-react';

type ActionState = {
  error?: string;
  success?: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function SubscriptionSkeleton() {
  return (
    <div className="rounded-2xl bg-white/[0.02] p-6 mb-6 h-[120px] animate-pulse" />
  );
}

function ManageSubscription() {
  const { data: teamData } = useSWR<TeamDataWithMembers>('/api/team', fetcher);

  const hasSubscription = teamData?.subscriptionStatus === 'active' || teamData?.subscriptionStatus === 'trialing';

  return (
    <div className="rounded-2xl bg-white/[0.02] p-6 mb-6">
      <h2 className="text-lg font-medium text-white mb-4">Team subscription</h2>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="font-medium text-white">
            {teamData?.planName || 'Free'}
          </p>
          <p className="text-sm text-white/40">
            {teamData?.subscriptionStatus === 'active'
              ? 'Billed monthly'
              : teamData?.subscriptionStatus === 'trialing'
              ? 'Trial period'
              : 'No active subscription'}
          </p>
        </div>
        {hasSubscription ? (
          <form action={customerPortalAction}>
            <Button
              type="submit"
              className="rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              Manage subscription
            </Button>
          </form>
        ) : (
          <Button asChild className="rounded-full bg-white text-black hover:bg-white/90">
            <a href="/pricing">Upgrade plan</a>
          </Button>
        )}
      </div>
    </div>
  );
}

function TeamMembersSkeleton() {
  return (
    <div className="rounded-2xl bg-white/[0.02] p-6 mb-6 h-[140px] animate-pulse" />
  );
}

function TeamMembers() {
  const { data: teamData } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const [removeState, removeAction, isRemovePending] = useActionState<
    ActionState,
    FormData
  >(removeTeamMember, {});

  const getUserDisplayName = (user: Pick<User, 'id' | 'name' | 'email'>) => {
    return user.name || user.email || 'Unknown User';
  };

  if (!teamData?.teamMembers?.length) {
    return (
      <div className="rounded-2xl bg-white/[0.02] p-6 mb-6">
        <h2 className="text-lg font-medium text-white mb-4">Team members</h2>
        <p className="text-white/40">No team members yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/[0.02] p-6 mb-6">
      <h2 className="text-lg font-medium text-white mb-4">Team members</h2>
      <ul className="space-y-4">
        {teamData.teamMembers.map((member, index) => (
          <li key={member.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="border border-white/10">
                <AvatarFallback className="bg-white/5 text-white/70 text-sm">
                  {getUserDisplayName(member.user)
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-white">
                  {getUserDisplayName(member.user)}
                </p>
                <p className="text-sm text-white/40 capitalize">
                  {member.role}
                </p>
              </div>
            </div>
            {index > 1 ? (
              <form action={removeAction}>
                <input type="hidden" name="memberId" value={member.id} />
                <Button
                  type="submit"
                  className="rounded-full bg-white/10 text-white hover:bg-white/20"
                  size="sm"
                  disabled={isRemovePending}
                >
                  {isRemovePending ? 'Removing...' : 'Remove'}
                </Button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
      {removeState?.error && (
        <p className="text-red-400 mt-4 text-sm">{removeState.error}</p>
      )}
    </div>
  );
}

type TeamInvitation = {
  id: number;
  email: string;
  role: string;
  status: string;
  invitedAt: string;
  invitedByName: string | null;
  invitedByEmail: string;
};

function PendingInvitationsSkeleton() {
  return (
    <div className="rounded-2xl bg-white/[0.02] p-6 mb-6 h-[100px] animate-pulse" />
  );
}

function PendingInvitations() {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const { data: invitationData, mutate: mutateInvitations } = useSWR<{
    invitations: TeamInvitation[];
  }>('/api/team/invitations', fetcher);
  const [cancelState, cancelAction, isCancelPending] = useActionState<
    ActionState,
    FormData
  >(cancelInvitation, {});

  const isOwner = user?.role === 'owner';

  const pendingInvitations = invitationData?.invitations?.filter(
    (inv) => inv.status === 'pending'
  );

  if (!pendingInvitations || pendingInvitations.length === 0) {
    return null;
  }

  const handleCancel = async (formData: FormData) => {
    await cancelAction(formData);
    mutateInvitations();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="rounded-2xl bg-white/[0.02] p-6 mb-6">
      <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
        <Mail className="h-5 w-5 text-white/60" />
        Pending invitations
      </h2>
      <ul className="space-y-3">
        {pendingInvitations.map((invitation) => (
          <li
            key={invitation.id}
            className="flex items-center justify-between border-b border-white/[0.08] pb-3 last:border-0 last:pb-0"
          >
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
                <Mail className="h-4 w-4 text-white/60" />
              </div>
              <div>
                <p className="font-medium text-sm text-white">{invitation.email}</p>
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <span className="capitalize">{invitation.role}</span>
                  <span>&middot;</span>
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(invitation.invitedAt)}</span>
                  {invitation.invitedByName && (
                    <>
                      <span>&middot;</span>
                      <span>by {invitation.invitedByName}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {isOwner && (
              <form action={handleCancel}>
                <input
                  type="hidden"
                  name="invitationId"
                  value={invitation.id}
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  disabled={isCancelPending}
                  className="text-white/40 hover:text-red-400 hover:bg-transparent"
                >
                  {isCancelPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </form>
            )}
          </li>
        ))}
      </ul>
      {cancelState?.error && (
        <p className="text-red-400 mt-3 text-sm">{cancelState.error}</p>
      )}
    </div>
  );
}

function InviteTeamMemberSkeleton() {
  return (
    <div className="rounded-2xl bg-white/[0.02] p-6 h-[220px] animate-pulse" />
  );
}

function InviteTeamMember() {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const isOwner = user?.role === 'owner';
  const [inviteState, inviteAction, isInvitePending] = useActionState<
    ActionState,
    FormData
  >(inviteTeamMember, {});

  return (
    <div className="rounded-2xl bg-white/[0.02] p-6">
      <h2 className="text-lg font-medium text-white mb-4">Invite team member</h2>
      <form action={inviteAction} className="space-y-4">
        <div>
          <Label htmlFor="email" className="text-sm text-white/70 mb-2 block">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="teammate@example.com"
            required
            disabled={!isOwner}
            className="rounded-xl bg-white/5 border-white/[0.08] text-white placeholder:text-white/30 focus:border-white/20"
          />
        </div>
        <div>
          <Label className="text-sm text-white/70 mb-2 block">Role</Label>
          <RadioGroup
            defaultValue="member"
            name="role"
            className="flex space-x-4"
            disabled={!isOwner}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="member" id="member" className="border-white/30 text-white" />
              <Label htmlFor="member" className="text-white/70">Member</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="owner" id="owner" className="border-white/30 text-white" />
              <Label htmlFor="owner" className="text-white/70">Owner</Label>
            </div>
          </RadioGroup>
        </div>
        {inviteState?.error && (
          <p className="text-red-400 text-sm">{inviteState.error}</p>
        )}
        {inviteState?.success && (
          <p className="text-green-400 text-sm">{inviteState.success}</p>
        )}
        <Button
          type="submit"
          className="rounded-full bg-white text-black hover:bg-white/90"
          disabled={isInvitePending || !isOwner}
        >
          {isInvitePending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Inviting...
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-4 w-4" />
              Invite member
            </>
          )}
        </Button>
      </form>
      {!isOwner && (
        <p className="text-sm text-white/40 mt-4">
          You must be a team owner to invite new members.
        </p>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-xl font-medium text-white mb-6">Team settings</h1>
      <Suspense fallback={<SubscriptionSkeleton />}>
        <ManageSubscription />
      </Suspense>
      <Suspense fallback={<TeamMembersSkeleton />}>
        <TeamMembers />
      </Suspense>
      <Suspense fallback={<PendingInvitationsSkeleton />}>
        <PendingInvitations />
      </Suspense>
      <Suspense fallback={<InviteTeamMemberSkeleton />}>
        <InviteTeamMember />
      </Suspense>
    </div>
  );
}
