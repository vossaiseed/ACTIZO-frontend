import React from 'react'
import { motion } from 'framer-motion'
import { FiChevronUp, FiChevronDown } from 'react-icons/fi'
import { cn } from '@/utils/cn'
import { SkeletonTable } from '@/components/feedback/Skeleton'
import EmptyState from '@/components/feedback/EmptyState'

/**
 * DataTable — premium, sortable, responsive table.
 *
 * props:
 *  - columns: [{ key, header, sortable?, align?='left', width?, className?, render?(row, index)=>node }]
 *  - data: row[]
 *  - rowKey?(row)=>string        (default row.id)
 *  - sort?: { key, dir }         dir ∈ 'asc' | 'desc'
 *  - onSort?(key)
 *  - loading?                    → SkeletonTable
 *  - onRowClick?(row)            → hover bg + cursor-pointer rows
 *  - emptyTitle?, emptyDescription?, emptyIcon?   → EmptyState when data empty
 *  - dense?, stickyHeader?, className
 */
const ALIGN = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

const JUSTIFY = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
}

function DataTable({
  columns = [],
  data = [],
  rowKey,
  sort,
  onSort,
  loading = false,
  onRowClick,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search or filters to find what you are looking for.',
  emptyIcon,
  dense = false,
  stickyHeader = false,
  className,
}) {
  const getRowKey = (row, index) => {
    if (typeof rowKey === 'function') return rowKey(row)
    return row?.id ?? index
  }

  const cellPadX = 'px-4'
  const cellPadY = dense ? 'py-2.5' : 'py-3.5'

  if (loading) {
    return (
      <div
        className={cn(
          'overflow-hidden rounded-2xl border border-line bg-white shadow-card dark:border-slate-800 dark:bg-slate-900',
          className
        )}
      >
        <SkeletonTable rows={6} cols={Math.max(columns.length, 4)} />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-line bg-white shadow-card dark:border-slate-800 dark:bg-slate-900',
          className
        )}
      >
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          className="py-16"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-line bg-white shadow-card dark:border-slate-800 dark:bg-slate-900',
        className
      )}
    >
      <div className="scrollbar-thin w-full overflow-x-auto">
        <table className="w-full min-w-full border-collapse text-sm">
          <thead
            className={cn(
              'bg-brand-50/60 dark:bg-slate-800/60',
              stickyHeader && 'sticky top-0 z-10 backdrop-blur'
            )}
          >
            <tr className="border-b border-line dark:border-slate-800">
              {columns.map((col) => {
                const align = col.align || 'left'
                const isSortable = Boolean(col.sortable)
                const isSorted = sort?.key === col.key
                const dir = isSorted ? sort?.dir : null

                return (
                  <th
                    key={col.key}
                    scope="col"
                    style={col.width ? { width: col.width } : undefined}
                    className={cn(
                      cellPadX,
                      dense ? 'py-2.5' : 'py-3',
                      'whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider text-ink-soft dark:text-slate-400',
                      ALIGN[align],
                      col.className
                    )}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => onSort?.(col.key)}
                        className={cn(
                          'group/sort inline-flex select-none items-center gap-1 rounded-md transition-colors hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:hover:text-brand-400',
                          JUSTIFY[align],
                          isSorted && 'text-brand-600 dark:text-brand-400'
                        )}
                      >
                        <span>{col.header}</span>
                        <span className="flex flex-col -space-y-1.5">
                          <FiChevronUp
                            className={cn(
                              'h-3 w-3 transition-colors',
                              isSorted && dir === 'asc'
                                ? 'text-brand-600 dark:text-brand-400'
                                : 'text-ink-faint/60 group-hover/sort:text-ink-soft dark:text-slate-600'
                            )}
                          />
                          <FiChevronDown
                            className={cn(
                              'h-3 w-3 transition-colors',
                              isSorted && dir === 'desc'
                                ? 'text-brand-600 dark:text-brand-400'
                                : 'text-ink-faint/60 group-hover/sort:text-ink-soft dark:text-slate-600'
                            )}
                          />
                        </span>
                      </button>
                    ) : (
                      <span>{col.header}</span>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-line dark:divide-slate-800">
            {data.map((row, rowIndex) => (
              <motion.tr
                key={getRowKey(row, rowIndex)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: Math.min(rowIndex * 0.02, 0.2) }}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'transition-colors',
                  onRowClick
                    ? 'cursor-pointer hover:bg-brand-50/40 dark:hover:bg-slate-800/50'
                    : 'hover:bg-surface-muted/50 dark:hover:bg-slate-800/30'
                )}
              >
                {columns.map((col) => {
                  const align = col.align || 'left'
                  return (
                    <td
                      key={col.key}
                      className={cn(
                        cellPadX,
                        cellPadY,
                        'align-middle text-ink dark:text-slate-200',
                        ALIGN[align],
                        col.className
                      )}
                    >
                      {col.render
                        ? col.render(row, rowIndex)
                        : row?.[col.key] ?? '—'}
                    </td>
                  )
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DataTable
