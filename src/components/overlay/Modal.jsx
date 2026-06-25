import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX } from 'react-icons/fi'
import { cn } from '@/utils/cn'

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

/**
 * Modal — portal overlay with backdrop blur, scale/fade panel, Esc + backdrop
 * close and body-scroll lock.
 */
const Modal = ({
  open,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  hideClose = false,
  children,
  className,
}) => {
  const panelRef = useRef(null)

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

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
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
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative z-[101] flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden',
              'rounded-2xl border border-line bg-white shadow-card-hover',
              'dark:border-slate-800 dark:bg-slate-900',
              SIZES[size] || SIZES.md,
              className,
            )}
          >
            {/* Header */}
            {(title || description || !hideClose) && (
              <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6 sm:py-5 dark:border-slate-800">
                <div className="min-w-0">
                  {title && (
                    <h3 className="font-display text-lg font-semibold leading-tight text-ink dark:text-slate-100">
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-ink-soft dark:text-slate-400">
                      {description}
                    </p>
                  )}
                </div>
                {!hideClose && (
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
                )}
              </div>
            )}

            {/* Body */}
            <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-5 text-sm text-ink dark:text-slate-200 sm:px-6">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 border-t border-line bg-surface-base/60 px-5 py-4 sm:px-6 dark:border-slate-800 dark:bg-slate-950/40">
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

export default Modal
