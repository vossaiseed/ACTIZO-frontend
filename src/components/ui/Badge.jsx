import { cn } from '@/utils/cn'

const TONES = {
  brand:
    'bg-brand-50 text-brand-700 ring-brand-600/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20',
  gray:
    'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-500/20',
  green:
    'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20',
  red:
    'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20',
  amber:
    'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20',
  violet:
    'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/20',
  sky:
    'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20',
  blue:
    'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/20',
}

const DOTS = {
  brand: 'bg-brand-500',
  gray: 'bg-slate-400',
  green: 'bg-emerald-500',
  red: 'bg-rose-500',
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
  sky: 'bg-sky-500',
  blue: 'bg-blue-500',
}

const SIZES = {
  sm: 'px-2 py-0.5 text-2xs gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
}

/**
 * Pill badge with ring-1 outline. tone controls the color palette.
 */
const Badge = ({ tone = 'gray', size = 'sm', dot = false, className, children, ...rest }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full font-medium ring-1 ring-inset',
      TONES[tone] || TONES.gray,
      SIZES[size] || SIZES.sm,
      className,
    )}
    {...rest}
  >
    {dot && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOTS[tone] || DOTS.gray)} />}
    {children}
  </span>
)

export default Badge
