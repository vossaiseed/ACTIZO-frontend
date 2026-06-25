import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/utils/cn'

/**
 * Dropdown menu.
 * trigger = node (the clickable element)
 * items = [{ label, icon?, onClick?, to?, danger?, divider? }]
 * Handles open state, outside-click, and Esc. Animated menu.
 */
const Dropdown = ({ trigger, items = [], align = 'right', width, className, menuClassName }) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) close()
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') close()
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, close])

  const handleItem = (item) => {
    if (item.onClick) item.onClick()
    close()
  }

  return (
    <div ref={rootRef} className={cn('relative inline-flex', className)}>
      <span
        onClick={() => setOpen((v) => !v)}
        className="inline-flex"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {trigger}
      </span>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={width ? { width } : undefined}
            className={cn(
              'absolute top-full z-50 mt-2 min-w-[12rem] origin-top overflow-hidden rounded-xl p-1.5',
              'border border-line bg-white shadow-card-hover dark:border-slate-700 dark:bg-slate-900',
              align === 'right' ? 'right-0' : 'left-0',
              menuClassName,
            )}
          >
            {items.map((item, i) => {
              if (item.divider) {
                return (
                  <div
                    key={`divider-${i}`}
                    className="my-1.5 h-px bg-line dark:bg-slate-800"
                    role="separator"
                  />
                )
              }

              const baseClasses = cn(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
                item.danger
                  ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10'
                  : 'text-ink-soft hover:bg-surface-muted hover:text-ink dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100',
              )

              const content = (
                <>
                  {item.icon && (
                    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center">
                      {item.icon}
                    </span>
                  )}
                  <span className="truncate">{item.label}</span>
                </>
              )

              if (item.to) {
                return (
                  <Link
                    key={item.label || i}
                    to={item.to}
                    role="menuitem"
                    onClick={close}
                    className={baseClasses}
                  >
                    {content}
                  </Link>
                )
              }

              return (
                <button
                  key={item.label || i}
                  type="button"
                  role="menuitem"
                  onClick={() => handleItem(item)}
                  className={baseClasses}
                >
                  {content}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Dropdown
