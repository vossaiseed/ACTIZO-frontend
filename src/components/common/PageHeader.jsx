import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import Breadcrumb from '@/components/common/Breadcrumb'

/**
 * PageHeader — standard top of every app page.
 * props: { title, subtitle?, icon?(component), breadcrumb=true, actions?(node), className }
 * Renders Breadcrumb (when breadcrumb), then a row: icon + big font-display title + subtitle (left),
 * actions (right). Subtle fade-in.
 */
function PageHeader({
  title,
  subtitle,
  icon: Icon,
  breadcrumb = true,
  actions,
  className,
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn('space-y-4', className)}
    >
      {breadcrumb && <Breadcrumb />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3.5">
          {Icon && (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-soft ring-1 ring-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:ring-brand-500/20">
              <Icon className="h-5 w-5" />
            </span>
          )}

          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-bold tracking-tight text-ink dark:text-slate-100 sm:text-[28px] sm:leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-0.5 truncate text-sm text-ink-soft dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            {actions}
          </div>
        )}
      </div>
    </motion.header>
  )
}

export default PageHeader
