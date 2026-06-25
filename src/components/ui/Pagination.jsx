import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { cn } from '@/utils/cn'

/**
 * Build a compact page list with ellipsis, e.g. [1, '…', 4, 5, 6, '…', 20].
 */
const buildPages = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = new Set([1, total, current, current - 1, current + 1])
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p))
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => pages.add(p))

  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)

  const out = []
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) out.push(`gap-${p}`)
    out.push(p)
    prev = p
  }
  return out
}

/**
 * Pagination with "Showing X–Y of Z" + prev/next + numbered buttons.
 */
const Pagination = ({ page, pageSize, total, onPageChange, className }) => {
  const pageCount = Math.max(1, Math.ceil((total || 0) / (pageSize || 1)))
  const current = Math.min(Math.max(1, page), pageCount)

  const from = total === 0 ? 0 : (current - 1) * pageSize + 1
  const to = Math.min(current * pageSize, total)

  const go = (n) => {
    const next = Math.min(Math.max(1, n), pageCount)
    if (next !== current) onPageChange?.(next)
  }

  const pages = buildPages(current, pageCount)

  const navBtn =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-medium transition-colors ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ' +
    'disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-3 sm:flex-row',
        className,
      )}
    >
      <p className="text-sm text-ink-soft dark:text-slate-400">
        Showing{' '}
        <span className="font-semibold text-ink tabular-nums dark:text-slate-200">{from}</span>
        {'–'}
        <span className="font-semibold text-ink tabular-nums dark:text-slate-200">{to}</span> of{' '}
        <span className="font-semibold text-ink tabular-nums dark:text-slate-200">{total}</span>
      </p>

      <nav className="flex items-center gap-1.5" aria-label="Pagination">
        <button
          type="button"
          onClick={() => go(current - 1)}
          disabled={current <= 1}
          aria-label="Previous page"
          className={cn(
            navBtn,
            'border-line bg-white text-ink-soft hover:bg-surface-muted hover:text-ink',
            'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800',
          )}
        >
          <FiChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1">
          {pages.map((p) =>
            typeof p === 'string' ? (
              <span
                key={p}
                className="inline-flex h-9 min-w-9 items-center justify-center px-1 text-sm text-ink-faint dark:text-slate-600"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => go(p)}
                aria-current={p === current ? 'page' : undefined}
                className={cn(
                  navBtn,
                  'tabular-nums',
                  p === current
                    ? 'border-transparent bg-brand-500 text-white shadow-soft hover:bg-brand-600'
                    : 'border-line bg-white text-ink-soft hover:bg-surface-muted hover:text-ink dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800',
                )}
              >
                {p}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          onClick={() => go(current + 1)}
          disabled={current >= pageCount}
          aria-label="Next page"
          className={cn(
            navBtn,
            'border-line bg-white text-ink-soft hover:bg-surface-muted hover:text-ink',
            'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800',
          )}
        >
          <FiChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  )
}

export default Pagination
