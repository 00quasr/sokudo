import { Card, CardContent } from '@/components/ui/card';

export default function RacesLoading() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <div className="h-7 w-40 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                    <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                    <div className="h-5 w-12 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-3 w-40 bg-muted rounded animate-pulse mt-1" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-5 w-12 bg-muted rounded animate-pulse" />
                  <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
