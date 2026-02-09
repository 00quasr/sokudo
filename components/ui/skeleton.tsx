import { cn } from "@/lib/utils"

/**
 * Base skeleton primitive for dark mode.
 * Uses white/[0.06] for subtle shapes that work on dark backgrounds.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-white/[0.06]", className)}
      {...props}
    />
  )
}

/**
 * Skeleton card wrapper with dark mode styling.
 */
function SkeletonCard({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white/[0.02] border border-white/[0.04] p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Skeleton text line with configurable width.
 */
function SkeletonText({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("h-4 w-full animate-pulse rounded bg-white/[0.06]", className)}
      {...props}
    />
  )
}

/**
 * Skeleton circle for avatars and icons.
 */
function SkeletonCircle({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("h-9 w-9 animate-pulse rounded-full bg-white/[0.06]", className)}
      {...props}
    />
  )
}

export { Skeleton, SkeletonCard, SkeletonText, SkeletonCircle }
