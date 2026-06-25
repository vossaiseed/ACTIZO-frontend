import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiChevronRight, FiHome } from 'react-icons/fi'
import { cn } from '@/utils/cn'

/**
 * Breadcrumb
 * - Pass `items=[{label, to?}]` to control crumbs explicitly, OR
 * - Omit `items` to auto-derive from the current location:
 *     first crumb is always Dashboard ('/'), remaining segments are title-cased.
 * - Chevron separators; the last crumb is rendered as plain (non-link) text.
 */
const titleCase = (segment) =>
  segment
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

function deriveItems(pathname) {
  const segments = pathname.split('/').filter(Boolean)
  const crumbs = [{ label: 'Dashboard', to: '/' }]

  let acc = ''
  segments.forEach((seg) => {
    acc += `/${seg}`
    crumbs.push({ label: titleCase(decodeURIComponent(seg)), to: acc })
  })

  return crumbs
}

function Breadcrumb({ items, className }) {
  const location = useLocation()
  const crumbs = items && items.length ? items : deriveItems(location.pathname)

  return (
    <nav aria-label="Breadcrumb" className={cn('min-w-0', className)}>
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          const isFirst = index === 0

          return (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-1 min-w-0">
              {index > 0 && (
                <FiChevronRight
                  aria-hidden="true"
                  className="h-3.5 w-3.5 shrink-0 text-ink-faint dark:text-slate-600"
                />
              )}

              {isLast || !crumb.to ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className="flex items-center gap-1.5 truncate font-semibold text-ink dark:text-slate-100"
                >
                  {isFirst && <FiHome className="h-3.5 w-3.5 shrink-0 text-brand-500" />}
                  <span className="truncate">{crumb.label}</span>
                </span>
              ) : (
                <Link
                  to={crumb.to}
                  className="flex items-center gap-1.5 truncate rounded-md px-1 py-0.5 font-medium text-ink-soft transition-colors hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:text-slate-400 dark:hover:text-brand-400"
                >
                  {isFirst && <FiHome className="h-3.5 w-3.5 shrink-0" />}
                  <span className="truncate">{crumb.label}</span>
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumb
