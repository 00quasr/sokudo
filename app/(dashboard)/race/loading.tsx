export default function Loading() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 text-center">
        <div className="mx-auto mb-4 h-10 w-64 animate-pulse rounded-lg bg-white/[0.06]" />
        <div className="mx-auto h-6 w-96 animate-pulse rounded-lg bg-white/[0.06]" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-52 animate-pulse rounded-xl border border-white/[0.04] bg-white/[0.02]"
          />
        ))}
      </div>
    </main>
  );
}
