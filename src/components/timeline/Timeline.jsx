import { motion } from 'framer-motion'
import {
  FiPlusCircle,
  FiUserCheck,
  FiActivity,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi'
import { cn } from '@/utils/cn'
import { formatRelativeTime, formatDate } from '@/utils/format'
import StatusBadge from '@/components/ui/StatusBadge'

/**
 * Per-type dot styling + default icon. `created`=sky, `assigned`=indigo,
 * `status`=brand, `won`=emerald, `lost`=rose, default=brand.
 */
const TYPE_CONFIG = {
  created: {
    icon: FiPlusCircle,
    dot: 'bg-sky-50 text-sky-600 ring-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20',
  },
  assigned: {
    icon: FiUserCheck,
    dot: 'bg-indigo-50 text-indigo-600 ring-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/20',
  },
  status: {
    icon: FiActivity,
    dot: 'bg-brand-50 text-brand-600 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20',
  },
  won: {
    icon: FiCheckCircle,
    dot: 'bg-emerald-50 text-emerald-600 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20',
  },
  lost: {
    icon: FiXCircle,
    dot: 'bg-rose-50 text-rose-600 ring-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20',
  },
}

const DEFAULT_CONFIG = {
  icon: FiActivity,
  dot: 'bg-brand-50 text-brand-600 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20',
}

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
}

export default function Timeline({ items = [], className, dense = false }) {
  if (!items || items.length === 0) return null

  return (
    <motion.ol
      variants={container}
      initial="hidden"
      animate="show"
      className={cn('relative', className)}
    >
      {items.map((entry, index) => {
        const config = TYPE_CONFIG[entry.type] || DEFAULT_CONFIG
        const Icon = entry.icon || config.icon
        const isLast = index === items.length - 1

        return (
          <motion.li
            key={entry.id ?? index}
            variants={item}
            className={cn('relative flex gap-3', dense ? 'pb-4' : 'pb-6', isLast && 'pb-0')}
          >
            {/* Connector line */}
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  'absolute top-9 w-px bg-line dark:bg-slate-800',
                  dense ? 'left-[15px] bottom-1' : 'left-[17px] bottom-0',
                )}
              />
            )}

            {/* Dot / icon */}
            <span
              className={cn(
                'relative z-10 flex shrink-0 items-center justify-center rounded-full ring-1 ring-inset',
                dense ? 'h-8 w-8' : 'h-9 w-9',
                config.dot,
              )}
            >
              <Icon className={dense ? 'h-4 w-4' : 'h-[18px] w-[18px]'} strokeWidth={2.2} />
            </span>

            {/* Content */}
            <div className={cn('min-w-0 flex-1', dense ? 'pt-1' : 'pt-1.5')}>
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={cn(
                    'font-semibold text-ink dark:text-slate-100',
                    dense ? 'text-sm' : 'text-sm',
                  )}
                >
                  {entry.title}
                </p>
                {entry.status ? <StatusBadge status={entry.status} size="sm" /> : null}
              </div>

              {entry.description ? (
                <p className="mt-1 text-sm leading-relaxed text-ink-soft dark:text-slate-400">
                  {entry.description}
                </p>
              ) : null}

              {(entry.by || entry.date) && (
                <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-faint dark:text-slate-500">
                  {entry.by ? <span className="font-medium text-ink-soft dark:text-slate-400">{entry.by}</span> : null}
                  {entry.by && entry.date ? <span aria-hidden>•</span> : null}
                  {entry.date ? (
                    <span title={formatDate(entry.date, 'dd MMM yyyy, h:mm a')}>
                      {formatRelativeTime(entry.date)}
                    </span>
                  ) : null}
                </p>
              )}
            </div>
          </motion.li>
        )
      })}
    </motion.ol>
  )
}
