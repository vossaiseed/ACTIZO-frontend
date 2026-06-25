/**
 * Unified achievement color logic used across the whole app.
 *
 *   below target   (< 100%)  → RED
 *   target met     (= 100%)  → GREEN
 *   target exceeded(> 100%)  → BLUE
 *
 * Examples: 8/10 → red · 10/10 → green · 12/10 → blue
 */

export const ACHIEVEMENT_STYLES = {
  below: {
    key: 'below',
    label: 'Below Target',
    text: 'text-rose-600 dark:text-rose-400',
    badge: 'red', // <Badge tone>
    bar: 'rose', // <ProgressBar color>
    hex: '#f43f5e', // recharts fill
    chip: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
  met: {
    key: 'met',
    label: 'Target Achieved',
    text: 'text-emerald-600 dark:text-emerald-400',
    badge: 'green',
    bar: 'emerald',
    hex: '#10b981',
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  exceeded: {
    key: 'exceeded',
    label: 'Target Exceeded',
    text: 'text-blue-600 dark:text-blue-400',
    badge: 'blue',
    bar: 'blue',
    hex: '#3b82f6',
    chip: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
}

/** Tier from raw achieved / target values (most accurate). */
export const achievementTier = (achieved, target) => {
  if (target == null || target <= 0) return achieved > 0 ? 'exceeded' : 'below'
  if (achieved > target) return 'exceeded'
  if (achieved === target) return 'met'
  const pct = (achieved / target) * 100
  return pct >= 99.95 ? 'met' : 'below'
}

/** Tier from a completion percentage (when only % is known). */
export const tierFromPct = (pct) => {
  if (pct == null || isNaN(pct)) return 'below'
  if (pct >= 100.5) return 'exceeded'
  if (pct >= 99.5) return 'met'
  return 'below'
}

export const achievementStyle = (achieved, target) => ACHIEVEMENT_STYLES[achievementTier(achieved, target)]
export const achievementStyleFromPct = (pct) => ACHIEVEMENT_STYLES[tierFromPct(pct)]
