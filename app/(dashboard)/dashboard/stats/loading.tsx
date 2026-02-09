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

export default function StatsPageSkeleton() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-white mb-6">
        Your Stats
      </h1>

      <div className="space-y-6">
        {/* Overview Stats Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Cards Skeleton */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="h-5 w-32 bg-white/[0.06] rounded animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-[160px]" />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <div className="h-5 w-32 bg-white/[0.06] rounded animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-[160px]" />
          </Card>
        </div>
      </div>
    </section>
  );
}
