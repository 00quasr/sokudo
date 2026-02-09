'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  Gift,
  Clock,
  CheckCircle,
  Copy,
  Check,
  Loader2,
  Trophy,
  Medal,
} from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ReferralEntry {
  id: number;
  referredName: string | null;
  referredEmail: string;
  status: string;
  rewardGiven: boolean;
  createdAt: string;
}

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  rewardsEarned: number;
}

interface ReferralData {
  stats: ReferralStats;
  referrals: ReferralEntry[];
}

interface ReferralCodeData {
  referralCode: string;
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-orange-500/20 p-2">
            <Icon className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReferralCodeSection() {
  const { data } = useSWR<ReferralCodeData>('/api/referral-code', fetcher);
  const [copied, setCopied] = useState(false);

  const referralCode = data?.referralCode ?? '';
  const referralLink = referralCode
    ? `${window.location.origin}/sign-up?ref=${referralCode}`
    : '';

  const handleCopy = useCallback(
    async (text: string) => {
      if (!text) return;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    },
    []
  );

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Referral Code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Share your referral code or link with friends. When they sign up, you
          both benefit.
        </p>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Code</label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={referralCode}
              className="font-mono text-lg tracking-wider"
              data-testid="referral-code"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopy(referralCode)}
              aria-label="Copy referral code"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            Referral Link
          </label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={referralLink}
              className="text-sm"
              data-testid="referral-link"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopy(referralLink)}
              aria-label="Copy referral link"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    completed: 'bg-green-500/20 text-green-400',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? 'bg-white/[0.1] text-white/60'}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function ReferralTable({ referrals }: { referrals: ReferralEntry[] }) {
  if (referrals.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No referrals yet. Share your code to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="referrals-table">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2 font-medium text-muted-foreground">
              User
            </th>
            <th className="text-left py-3 px-2 font-medium text-muted-foreground">
              Status
            </th>
            <th className="text-left py-3 px-2 font-medium text-muted-foreground">
              Reward
            </th>
            <th className="text-left py-3 px-2 font-medium text-muted-foreground">
              Date
            </th>
          </tr>
        </thead>
        <tbody>
          {referrals.map((referral) => (
            <tr key={referral.id} className="border-b last:border-0">
              <td className="py-3 px-2">
                <div>
                  <p className="font-medium">
                    {referral.referredName ?? 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {referral.referredEmail}
                  </p>
                </div>
              </td>
              <td className="py-3 px-2">
                <StatusBadge status={referral.status} />
              </td>
              <td className="py-3 px-2">
                {referral.rewardGiven ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Clock className="h-4 w-4 text-muted-foreground" />
                )}
              </td>
              <td className="py-3 px-2 text-muted-foreground">
                {new Date(referral.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface LeaderboardEntry {
  rank: number;
  userId: number;
  userName: string | null;
  username: string | null;
  completedReferrals: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return <Trophy className="h-5 w-5 text-yellow-500" />;
  }
  if (rank === 2) {
    return <Medal className="h-5 w-5 text-white/40" />;
  }
  if (rank === 3) {
    return <Medal className="h-5 w-5 text-amber-600" />;
  }
  return (
    <span className="text-sm font-medium text-muted-foreground w-5 text-center">
      {rank}
    </span>
  );
}

function ReferralLeaderboard({
  currentUserId,
}: {
  currentUserId: number | null;
}) {
  const { data, isLoading } = useSWR<LeaderboardData>(
    '/api/referrals/leaderboard',
    fetcher
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const leaderboard = data?.leaderboard ?? [];

  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No referrals yet. Be the first to refer someone!
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="referral-leaderboard">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2 font-medium text-muted-foreground w-12">
              Rank
            </th>
            <th className="text-left py-3 px-2 font-medium text-muted-foreground">
              User
            </th>
            <th className="text-right py-3 px-2 font-medium text-muted-foreground">
              Referrals
            </th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry) => (
            <tr
              key={entry.userId}
              className={`border-b last:border-0 ${
                entry.userId === currentUserId
                  ? 'bg-orange-500/10'
                  : ''
              }`}
            >
              <td className="py-3 px-2">
                <RankBadge rank={entry.rank} />
              </td>
              <td className="py-3 px-2">
                <div>
                  <p className="font-medium">
                    {entry.userName ?? 'Anonymous'}
                    {entry.userId === currentUserId && (
                      <span className="ml-1.5 text-xs text-orange-500 font-normal">
                        (you)
                      </span>
                    )}
                  </p>
                  {entry.username && (
                    <p className="text-xs text-muted-foreground">
                      @{entry.username}
                    </p>
                  )}
                </div>
              </td>
              <td className="py-3 px-2 text-right">
                <span className="font-semibold">{entry.completedReferrals}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface UserData {
  id: number;
}

export default function ReferralsPage() {
  const { data, isLoading } = useSWR<ReferralData>('/api/referrals', fetcher);
  const { data: userData } = useSWR<UserData>('/api/user', fetcher);

  const stats = data?.stats ?? {
    totalReferrals: 0,
    pendingReferrals: 0,
    completedReferrals: 0,
    rewardsEarned: 0,
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-white mb-6">
        Referrals
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Total" value={stats.totalReferrals} />
        <StatCard icon={Clock} label="Pending" value={stats.pendingReferrals} />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={stats.completedReferrals}
        />
        <StatCard icon={Gift} label="Rewards" value={stats.rewardsEarned} />
      </div>

      <div className="space-y-6">
        <ReferralCodeSection />

        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <ReferralLeaderboard currentUserId={userData?.id ?? null} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ReferralTable referrals={data?.referrals ?? []} />
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
