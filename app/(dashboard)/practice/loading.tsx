function CategoryCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 animate-pulse">
      <div className="mb-4 h-12 w-12 rounded-lg bg-gray-200" />
      <div className="mb-2 h-6 w-3/4 rounded bg-gray-200" />
      <div className="mb-4 space-y-2">
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-2/3 rounded bg-gray-200" />
      </div>
      <div className="h-6 w-20 rounded-full bg-gray-200" />
    </div>
  );
}

export default function PracticeLoading() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 text-center">
        <div className="mx-auto mb-3 h-10 w-64 rounded bg-gray-200 animate-pulse" />
        <div className="mx-auto h-6 w-96 rounded bg-gray-200 animate-pulse" />
      </div>

      <section className="mb-12">
        <div className="mb-6 h-7 w-16 rounded bg-gray-200 animate-pulse" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <CategoryCardSkeleton key={i} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-6 h-7 w-12 rounded bg-gray-200 animate-pulse" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CategoryCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </main>
  );
}
