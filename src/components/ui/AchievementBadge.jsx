import { cn } from '@/utils/cn'
import { achievementTier, tierFromPct, ACHIEVEMENT_STYLES } from '@/utils/achievement'

/**
 * Color-coded achievement pill: red (below) / green (met) / blue (exceeded).
 *
 * Provide EITHER {achieved, target} (preferred) OR {pct}.
 * - withLabel: append the tier label ("Target Exceeded")
 * - children: custom content (overrides the default % text)
 */
const SIZES = {
  sm: 'px-2 py-0.5 text-2xs gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
}

export default function AchievementBadge({
  achieved,
  target,
  pct,
  withLabel = false,
  withDot = true,
  size = 'sm',
  className,
  children,
}) {
  const tier =
    achieved != null && target != null ? achievementTier(achieved, target) : tierFromPct(pct)
  const style = ACHIEVEMENT_STYLES[tier]

  const percent =
    pct != null
      ? Math.round(pct)
      : target
        ? Math.round((achieved / target) * 100)
        : 0

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold ring-1 ring-inset',
        style.chip,
        SIZES[size] || SIZES.sm,
        className,
      )}
    >
      {withDot && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', style.dot)} />}
      {children ?? (
        <>
          {percent}%{withLabel ? ` · ${style.label}` : ''}
        </>
      )}
    </span>
  )
}
