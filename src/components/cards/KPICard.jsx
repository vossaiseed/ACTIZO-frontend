import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi'
import { cn } from '@/utils/cn'
import { SkeletonKPI } from '@/components/feedback/Skeleton'

/**
 * Tone styling for the icon chip + ambient accent.
 */
const TONES = {
  brand: {
    chip: 'bg-brand-50 text-brand-600 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20',
    glow: 'from-brand-500/10',
  },
  emerald: {
    chip: 'bg-emerald-50 text-emerald-600 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20',
    glow: 'from-emerald-500/10',
  },
  rose: {
    chip: 'bg-rose-50 text-rose-600 ring-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20',
    glow: 'from-rose-500/10',
  },
  amber: {
    chip: 'bg-amber-50 text-amber-600 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20',
    glow: 'from-amber-500/10',
  },
  violet: {
    chip: 'bg-violet-50 text-violet-600 ring-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/20',
    glow: 'from-violet-500/10',
  },
  sky: {
    chip: 'bg-sky-50 text-sky-600 ring-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20',
    glow: 'from-sky-500/10',
  },
  blue: {
    chip: 'bg-blue-50 text-blue-600 ring-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/20',
    glow: 'from-blue-500/10',
  },
}

const isNumeric = (v) => typeof v === 'number' && Number.isFinite(v)

/**
 * Lightweight requestAnimationFrame count-up. Renders a formatted integer
 * with thousands separators while animating from 0 → target.
 */
function CountUp({ value, duration = 1100 }) {
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(reduce ? value : 0)
  const frame = useRef()
  const prev = useRef(0)

  useEffect(() => {
    if (reduce) {
      setDisplay(value)
      return
    }
    const start = performance.now()
    const from = prev.current
    const to = value
    // easeOutCubic for a smooth premium settle
    const ease = (t) => 1 - Math.pow(1 - t, 3)

    const tick = (now) => {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      const current = from + (to - from) * ease(t)
      setDisplay(current)
      if (t < 1) {
        frame.current = requestAnimationFrame(tick)
      } else {
        prev.current = to
        setDisplay(to)
      }
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [value, duration, reduce])

  const rounded = Math.round(display)
  return <>{rounded.toLocaleString('en-US')}</>
}

export default function KPICard({
  label,
  value,
  delta,
  deltaSuffix = 'vs last month',
  icon: Icon,
  tone = 'brand',
  prefix,
  suffix,
  loading = false,
  onClick,
  className,
  ...rest
}) {
  if (loading) return <SkeletonKPI />

  const t = TONES[tone] || TONES.brand
  const hasDelta = typeof delta === 'number' && Number.isFinite(delta)
  const up = hasDelta && delta >= 0
  const interactive = typeof onClick === 'function'

  return (
    <motion.div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick(e)
              }
            }
          : undefined
      }
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className={cn(
        'card group relative overflow-hidden p-5',
        'transition-shadow duration-300 hover:shadow-card-hover',
        interactive &&
          'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900',
        className,
      )}
      {...rest}
    >
      {/* ambient tone glow */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br to-transparent opacity-70 blur-2xl transition-opacity duration-300 group-hover:opacity-100',
          t.glow,
        )}
      />

      <div className="relative flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-soft dark:text-slate-400">{label}</p>
        {Icon ? (
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-105',
              t.chip,
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={2.2} />
          </span>
        ) : null}
      </div>

      <div className="relative mt-3 flex items-end gap-1.5">
        <span className="text-2xl font-display font-bold tracking-tight text-ink dark:text-slate-50 sm:text-3xl">
          {prefix ? <span className="mr-0.5 text-ink-soft dark:text-slate-400">{prefix}</span> : null}
          {isNumeric(value) ? <CountUp value={value} /> : value}
          {suffix ? <span className="ml-0.5 text-lg font-semibold text-ink-soft dark:text-slate-400">{suffix}</span> : null}
        </span>
      </div>

      {hasDelta ? (
        <div className="relative mt-3 flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ring-1',
              up
                ? 'bg-emerald-50 text-emerald-600 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-600 ring-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300',
            )}
          >
            {up ? <FiArrowUpRight className="h-3.5 w-3.5" /> : <FiArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(delta)}%
          </span>
          {deltaSuffix ? (
            <span className="text-xs text-ink-faint dark:text-slate-500">{deltaSuffix}</span>
          ) : null}
        </div>
      ) : null}
    </motion.div>
  )
}
