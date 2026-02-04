import { Card, CardHeader } from '@/components/ui/card';

export default function Loading() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-36 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="h-4 w-96 bg-gray-200 rounded animate-pulse mb-6" />
      <Card>
        <CardHeader>
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </Card>
    </section>
  );
}
