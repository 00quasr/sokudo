import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function SkeletonCard() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 rounded-full p-2 w-9 h-9 animate-pulse" />
          <div className="space-y-2">
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonAchievement() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50/50">
      <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function TeamAchievementsLoading() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Team Achievements
      </h1>

      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <SkeletonAchievement />
              <SkeletonAchievement />
              <SkeletonAchievement />
              <SkeletonAchievement />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
