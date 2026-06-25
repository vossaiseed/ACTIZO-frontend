import { motion } from 'framer-motion'
import { useId } from 'react'
import { cn } from '@/utils/cn'

/**
 * Controlled tab bar.
 * tabs = [{ key, label, icon?, count? }]
 * variant 'pills' (brand active bg) | 'underline' (animated indicator via layoutId).
 */
const Tabs = ({ tabs = [], active, onChange, variant = 'pills', className }) => {
  const groupId = useId()

  if (variant === 'underline') {
    return (
      <div
        role="tablist"
        className={cn(
          'relative flex items-center gap-1 overflow-x-auto border-b border-line scrollbar-thin dark:border-slate-800',
          className,
        )}
      >
        {tabs.map((tab) => {
          const isActive = tab.key === active
          return (
            <button
              key={tab.key}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => onChange?.(tab.key)}
              className={cn(
                'relative inline-flex shrink-0 items-center gap-2 px-3.5 pb-3 pt-2 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:rounded-lg',
                isActive
                  ? 'text-brand-600 dark:text-brand-300'
                  : 'text-ink-soft hover:text-ink dark:text-slate-400 dark:hover:text-slate-200',
              )}
            >
              {tab.icon && <span className="inline-flex h-4 w-4 items-center justify-center">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count != null && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-2xs font-semibold tabular-nums',
                    isActive
                      ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                  )}
                >
                  {tab.count}
                </span>
              )}
              {isActive && (
                <motion.span
                  layoutId={`tab-underline-${groupId}`}
                  className="absolute inset-x-1.5 -bottom-px h-0.5 rounded-full bg-brand-500"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
            </button>
          )
        })}
      </div>
    )
  }

  // pills
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex flex-wrap items-center gap-1 rounded-xl border border-line bg-surface-muted p-1',
        'dark:border-slate-800 dark:bg-slate-800/60',
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active
        return (
          <button
            key={tab.key}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange?.(tab.key)}
            className={cn(
              'relative inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
              isActive
                ? 'text-white'
                : 'text-ink-soft hover:text-ink dark:text-slate-400 dark:hover:text-slate-100',
            )}
          >
            {isActive && (
              <motion.span
                layoutId={`tab-pill-${groupId}`}
                className="absolute inset-0 rounded-lg bg-brand-500 shadow-soft"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-2">
              {tab.icon && <span className="inline-flex h-4 w-4 items-center justify-center">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count != null && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-2xs font-semibold tabular-nums',
                    isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default Tabs
