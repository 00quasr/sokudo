import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function SkeletonCard() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="bg-white/[0.06] rounded-full p-2 w-9 h-9 animate-pulse" />
          <div className="space-y-2">
            <div className="h-3 w-16 bg-white/[0.06] rounded animate-pulse" />
            <div className="h-6 w-12 bg-white/[0.06] rounded animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-4 px-4 border-b border-white/[0.04] last:border-0">
      <div className="w-8 h-5 bg-white/[0.06] rounded animate-pulse" />
      <div className="w-9 h-9 bg-white/[0.06] rounded-full animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 bg-white/[0.06] rounded animate-pulse" />
        <div className="h-3 w-20 bg-white/[0.06] rounded animate-pulse" />
      </div>
      <div className="hidden sm:flex gap-6">
        <div className="h-8 w-16 bg-white/[0.06] rounded animate-pulse" />
        <div className="h-8 w-16 bg-white/[0.06] rounded animate-pulse" />
        <div className="h-8 w-16 bg-white/[0.06] rounded animate-pulse" />
        <div className="h-8 w-16 bg-white/[0.06] rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function TeamLeaderboardLoading() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-white mb-6">
        Team Leaderboard
      </h1>

      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <div className="h-5 w-24 bg-white/[0.06] rounded animate-pulse" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
