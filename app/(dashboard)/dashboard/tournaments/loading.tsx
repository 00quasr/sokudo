import { Card, CardContent } from '@/components/ui/card';

export default function TournamentsLoading() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <div className="h-7 w-48 bg-white/[0.06] rounded animate-pulse" />
        <div className="h-4 w-72 bg-white/[0.06] rounded animate-pulse mt-2" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-5 w-64 bg-white/[0.06] rounded animate-pulse mb-2" />
              <div className="h-4 w-96 bg-white/[0.06] rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
