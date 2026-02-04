export default function ChallengeLoading() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header skeleton */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-36 rounded bg-muted animate-pulse" />
            <div className="h-5 w-24 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main content skeleton */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Challenge info skeleton */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-4 w-20 rounded bg-muted animate-pulse" />
            <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
          </div>
          <div className="h-4 w-64 rounded bg-muted animate-pulse" />
        </div>

        {/* Stats bar skeleton */}
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-8 rounded bg-muted animate-pulse" />
            <div className="h-5 w-8 rounded bg-muted animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-12 rounded bg-muted animate-pulse" />
            <div className="h-5 w-10 rounded bg-muted animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-6 rounded bg-muted animate-pulse" />
            <div className="h-5 w-12 rounded bg-muted animate-pulse" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="h-1 w-24 rounded-full bg-muted animate-pulse" />
            <div className="h-4 w-8 rounded bg-muted animate-pulse" />
          </div>
        </div>

        {/* Typing area skeleton */}
        <div className="rounded-lg border border-border bg-card p-6 animate-pulse">
          <div className="space-y-3">
            <div className="h-6 w-full rounded bg-muted" />
            <div className="h-6 w-3/4 rounded bg-muted" />
          </div>
        </div>

        {/* Footer skeleton */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-5 w-16 rounded bg-muted animate-pulse" />
              <div className="h-5 w-14 rounded bg-muted animate-pulse" />
            </div>
            <div className="h-4 w-48 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  );
}
