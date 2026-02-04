export default function Loading() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 h-5 w-28 animate-pulse rounded bg-gray-200" />
      <div className="mb-8 animate-pulse rounded-xl border border-gray-200 bg-gray-50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-7 w-32 rounded bg-gray-200" />
          <div className="h-5 w-16 rounded bg-gray-200" />
        </div>
        <div className="mb-4 h-4 w-48 rounded bg-gray-200" />
        <div className="h-24 rounded-lg bg-gray-200" />
      </div>
      <div className="animate-pulse rounded-xl border border-gray-200 bg-gray-50 p-6">
        <div className="mb-4 h-6 w-40 rounded bg-gray-200" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="mb-3 h-14 rounded-lg border border-gray-200 bg-gray-100"
          />
        ))}
      </div>
    </main>
  );
}
