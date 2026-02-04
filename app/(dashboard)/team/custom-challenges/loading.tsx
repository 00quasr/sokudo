import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function SkeletonChallengeCard() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-14 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-5 w-12 bg-gray-200 rounded-full animate-pulse" />
            </div>
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="flex items-center gap-4">
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TeamCustomChallengesLoading() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Team Custom Challenges
      </h1>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SkeletonChallengeCard />
            <SkeletonChallengeCard />
            <SkeletonChallengeCard />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
