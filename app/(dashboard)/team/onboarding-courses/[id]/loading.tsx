import { Card, CardContent, CardHeader } from '@/components/ui/card';

function SkeletonStep() {
  return (
    <div className="border rounded-lg p-4 border-white/[0.04]">
      <div className="flex items-start gap-3">
        <div className="animate-pulse h-5 w-5 bg-white/[0.06] rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="animate-pulse h-4 w-12 bg-white/[0.06] rounded" />
            <div className="animate-pulse h-4 w-20 bg-white/[0.06] rounded-full" />
            <div className="animate-pulse h-4 w-16 bg-white/[0.06] rounded-full" />
          </div>
          <div className="animate-pulse h-4 w-full bg-white/[0.06] rounded" />
        </div>
      </div>
    </div>
  );
}

export default function OnboardingCourseDetailLoading() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="animate-pulse h-4 w-32 bg-white/[0.06] rounded mb-4" />
      <div className="mb-6 space-y-2">
        <div className="animate-pulse h-7 w-64 bg-white/[0.06] rounded" />
        <div className="animate-pulse h-4 w-96 bg-white/[0.06] rounded" />
      </div>
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="animate-pulse h-4 w-24 bg-white/[0.06] rounded" />
            <div className="animate-pulse h-4 w-16 bg-white/[0.06] rounded" />
          </div>
          <div className="animate-pulse w-full bg-white/[0.06] rounded-full h-2" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="animate-pulse h-6 w-40 bg-white/[0.06] rounded" />
        </CardHeader>
        <CardContent className="space-y-3">
          <SkeletonStep />
          <SkeletonStep />
          <SkeletonStep />
          <SkeletonStep />
        </CardContent>
      </Card>
    </section>
  );
}
