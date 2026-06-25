import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

const COLORS = {
  brand: 'bg-brand-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  violet: 'bg-violet-500',
  sky: 'bg-sky-500',
  blue: 'bg-blue-500',
}

const SIZES = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-3.5',
}

/**
 * Animated progress bar. Visual fill caps at 100%; label may exceed it.
 */
const ProgressBar = ({
  value = 0,
  max = 100,
  color = 'brand',
  size = 'md',
  showLabel = false,
  label,
  className,
  animated = true,
  ...rest
}) => {
  const raw = max > 0 ? (value / max) * 100 : 0
  const pct = Math.round(raw * 10) / 10
  const capped = Math.max(0, Math.min(100, pct))

  return (
    <div className={cn('w-full', className)} {...rest}>
      {(showLabel || label) && (
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-ink-soft dark:text-slate-400">
            {label}
          </span>
          {showLabel && (
            <span className="text-xs font-semibold tabular-nums text-ink dark:text-slate-200">
              {pct}%
            </span>
          )}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          'w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800',
          SIZES[size] || SIZES.md,
        )}
      >
        <motion.div
          className={cn('h-full rounded-full', COLORS[color] || COLORS.brand)}
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${capped}%` }}
          transition={{ duration: animated ? 0.8 : 0, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
