function ChallengeCardSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 rounded-full bg-gray-200" />
        <div>
          <div className="h-4 w-48 rounded bg-gray-200" />
          <div className="mt-2 h-3 w-32 rounded bg-gray-200" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-5 w-16 rounded-full bg-gray-200" />
        <div className="h-4 w-4 rounded bg-gray-200" />
      </div>
    </div>
  );
}

export default function CategoryLoading() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="h-5 w-32 rounded bg-gray-200 animate-pulse mb-8" />

      <div className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-14 w-14 rounded-lg bg-gray-200 animate-pulse" />
          <div>
            <div className="h-8 w-48 rounded bg-gray-200 animate-pulse" />
            <div className="mt-2 flex items-center gap-2">
              <div className="h-5 w-16 rounded-full bg-gray-200 animate-pulse" />
              <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="h-5 w-full max-w-md rounded bg-gray-200 animate-pulse" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <ChallengeCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
