export default function ReplayLoading() {
  return (
    <div className="flex-1 flex flex-col h-full animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="h-5 w-24 bg-muted rounded" />
          <div className="h-4 w-px bg-border" />
          <div>
            <div className="h-5 w-32 bg-muted rounded mb-1" />
            <div className="h-3 w-48 bg-muted rounded" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-5 w-32 bg-muted rounded" />
        </div>
      </div>

      {/* Typing area skeleton */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
        <div className="w-full max-w-3xl space-y-3">
          <div className="h-6 w-full bg-muted rounded" />
          <div className="h-6 w-3/4 bg-muted rounded" />
          <div className="h-6 w-5/6 bg-muted rounded" />
        </div>
      </div>

      {/* Stats bar skeleton */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-6">
          <div className="h-5 w-16 bg-muted rounded" />
          <div className="h-5 w-20 bg-muted rounded" />
          <div className="h-5 w-16 bg-muted rounded" />
        </div>
      </div>

      {/* Controls skeleton */}
      <div className="border-t border-border bg-muted/30 p-4">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-4 w-14 bg-muted rounded" />
            <div className="flex-1 h-2 bg-muted rounded-full" />
            <div className="h-4 w-14 bg-muted rounded" />
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="h-9 w-9 bg-muted rounded-lg" />
            <div className="h-9 w-9 bg-muted rounded-lg" />
            <div className="h-12 w-12 bg-muted rounded-full" />
            <div className="h-9 w-9 bg-muted rounded-lg" />
            <div className="h-9 w-16 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
