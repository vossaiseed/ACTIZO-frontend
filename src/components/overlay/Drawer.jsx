import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX } from 'react-icons/fi'
import { cn } from '@/utils/cn'

const WIDTHS = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-xl',
}

/**
 * Drawer — slide-in side panel with backdrop blur, Esc + backdrop close and
 * body-scroll lock. Rendered through a portal to document.body.
 */
const Drawer = ({
  open,
  onClose,
  title,
  side = 'right',
  width = 'md',
  footer,
  children,
  className,
}) => {
  // Esc to close
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (typeof document === 'undefined') return null

  const isLeft = side === 'left'
  const offscreen = isLeft ? '-100%' : '100%'

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100]"
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === 'string' ? title : undefined}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm dark:bg-slate-950/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={() => onClose?.()}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: offscreen }}
            animate={{ x: 0 }}
            exit={{ x: offscreen }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'absolute inset-y-0 flex w-full flex-col bg-white shadow-card-hover',
              'border-line dark:bg-slate-900',
              isLeft ? 'left-0 border-r' : 'right-0 border-l',
              'dark:border-slate-800',
              WIDTHS[width] || WIDTHS.md,
              className,
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-5 dark:border-slate-800">
              {title ? (
                <h3 className="font-display text-lg font-semibold leading-tight text-ink dark:text-slate-100">
                  {title}
                </h3>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => onClose?.()}
                aria-label="Close"
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-soft transition',
                  'hover:bg-surface-muted hover:text-ink',
                  'focus:outline-none focus:ring-2 focus:ring-brand-500/40',
                  'dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
                )}
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-5 text-sm text-ink dark:text-slate-200">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 border-t border-line bg-surface-base/60 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/40">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export default Drawer
