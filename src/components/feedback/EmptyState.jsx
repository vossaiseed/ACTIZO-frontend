import { motion } from 'framer-motion'
import { FiInbox } from 'react-icons/fi'
import { cn } from '@/utils/cn'

/**
 * Friendly, premium empty placeholder: a brand-tinted icon circle,
 * title, optional description, and an optional action node.
 */
export default function EmptyState({
  icon: Icon = FiInbox,
  title,
  description,
  action,
  className,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn(
        'flex flex-col items-center justify-center px-6 py-14 text-center',
        className,
      )}
    >
      <div className="relative mb-5">
        {/* Soft halo */}
        <span className="absolute inset-0 -z-10 rounded-full bg-brand-500/10 blur-xl" />
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 ring-1 ring-inset ring-brand-500/15 dark:bg-brand-500/10 dark:text-brand-400 dark:ring-brand-400/15">
          <Icon className="h-7 w-7" strokeWidth={1.8} />
        </div>
      </div>

      <h3 className="text-base font-semibold text-ink dark:text-slate-100">
        {title}
      </h3>

      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft dark:text-slate-400">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-6">{action}</div> : null}
    </motion.div>
  )
}
