export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}

export function StatsSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full" />
      ))}
    </div>
  )
}
