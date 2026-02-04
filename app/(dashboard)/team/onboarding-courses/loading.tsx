import { Card, CardContent, CardHeader } from '@/components/ui/card';

function SkeletonCard() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="animate-pulse space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-48 bg-gray-200 rounded" />
            <div className="h-5 w-16 bg-gray-200 rounded-full" />
          </div>
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="flex items-center gap-4">
            <div className="h-5 w-5 bg-gray-200 rounded-full" />
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OnboardingCoursesLoading() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Onboarding Courses
      </h1>
      <Card>
        <CardHeader>
          <div className="animate-pulse h-6 w-48 bg-gray-200 rounded" />
        </CardHeader>
        <CardContent className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </CardContent>
      </Card>
    </section>
  );
}
