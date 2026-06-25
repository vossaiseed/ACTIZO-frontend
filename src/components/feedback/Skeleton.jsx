import { cn } from '@/utils/cn'

const ROUNDED = {
  none: 'rounded-none',
  sm: 'rounded-md',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  xl: 'rounded-2xl',
  full: 'rounded-full',
}

/**
 * Base shimmer block. Compose with width/height utilities via className.
 */
export default function Skeleton({ className, rounded = 'md', ...rest }) {
  return (
    <span
      aria-hidden="true"
      className={cn('skeleton block', ROUNDED[rounded] || ROUNDED.md, className)}
      {...rest}
    />
  )
}

/* ---------------------------------------------------------------- */

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('space-y-2.5', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }) {
  return (
    <div className={cn('card p-5', className)} aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton rounded="lg" className="h-11 w-11" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <div className="mt-5">
        <SkeletonText lines={3} />
      </div>
    </div>
  )
}

export function SkeletonKPI({ className }) {
  return (
    <div className={cn('card p-5', className)} aria-hidden="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton rounded="lg" className="h-10 w-10" />
      </div>
      <Skeleton className="mt-4 h-8 w-28" />
      <Skeleton className="mt-3 h-3 w-32" rounded="full" />
    </div>
  )
}

export function SkeletonChart({ height = 300, className }) {
  return (
    <div className={cn('card p-5', className)} aria-hidden="true">
      <div className="mb-5 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton rounded="lg" className="h-8 w-24" />
      </div>
      <div
        className="flex items-end gap-2.5"
        style={{ height: `${height}px` }}
      >
        {Array.from({ length: 12 }).map((_, i) => {
          // Deterministic varied bar heights for a chart-like silhouette.
          const h = 35 + ((i * 37) % 60)
          return (
            <Skeleton
              key={i}
              rounded="sm"
              className="flex-1"
              style={{ height: `${h}%` }}
            />
          )
        })}
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 6, cols = 5, className }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-line bg-white dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
      aria-hidden="true"
    >
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-line bg-brand-50/60 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-800/60">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn('h-3', i === 0 ? 'w-1/4' : 'flex-1')}
          />
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-line dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-5 py-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className={cn(
                  'flex items-center gap-3',
                  c === 0 ? 'w-1/4' : 'flex-1',
                )}
              >
                {c === 0 ? (
                  <Skeleton rounded="full" className="h-9 w-9 flex-none" />
                ) : null}
                <Skeleton className={cn('h-3.5', c === 0 ? 'flex-1' : 'w-full')} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
