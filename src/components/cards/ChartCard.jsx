import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import { SkeletonChart } from '@/components/feedback/Skeleton'

/**
 * Card wrapper for any chart (a Recharts tree inside <ResponsiveContainer>,
 * or one of the chart views). Provides a consistent premium header, an
 * optional legend row, and a fixed-height body.
 */
export default function ChartCard({
  title,
  subtitle,
  icon: Icon,
  action,
  legend,
  height = 300,
  loading = false,
  className,
  children,
  ...rest
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn('card flex flex-col p-5 sm:p-6', className)}
      {...rest}
    >
      {/* Header */}
      {(title || subtitle || action || Icon) && (
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {Icon ? (
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20">
                <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
              </span>
            ) : null}
            <div className="min-w-0">
              {title ? (
                <h3 className="truncate text-base font-display font-semibold text-ink dark:text-slate-100">
                  {title}
                </h3>
              ) : null}
              {subtitle ? (
                <p className="mt-0.5 truncate text-sm text-ink-soft dark:text-slate-400">{subtitle}</p>
              ) : null}
            </div>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}

      {/* Optional legend row */}
      {legend ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">{legend}</div>
      ) : null}

      {/* Body */}
      <div
        className={cn('relative w-full', (title || subtitle || action || Icon || legend) && 'mt-5')}
        style={{ height }}
      >
        {loading ? <SkeletonChart height={height} /> : children}
      </div>
    </motion.div>
  )
}
