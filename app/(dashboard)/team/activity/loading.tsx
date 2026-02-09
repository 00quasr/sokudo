import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TeamActivityLoadingSkeleton() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-white mb-6">
        Team Activity
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <div className="size-8 rounded-full bg-white/[0.06] animate-pulse" />
                <div className="size-7 rounded-full bg-white/[0.06] animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/[0.06] rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-white/[0.06] rounded animate-pulse w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
