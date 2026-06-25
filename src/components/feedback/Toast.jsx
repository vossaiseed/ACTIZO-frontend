import {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
  useEffect,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiCheckCircle,
  FiXCircle,
  FiInfo,
  FiAlertTriangle,
  FiX,
} from 'react-icons/fi'
import { cn } from '@/utils/cn'

const DEFAULT_DURATION = 3500

/**
 * Per-variant styling: icon, accent bar, icon chip and progress colors.
 * All tuned for both light and dark surfaces.
 */
const VARIANTS = {
  success: {
    Icon: FiCheckCircle,
    accent: 'bg-emerald-500',
    iconWrap:
      'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    progress: 'bg-emerald-500',
  },
  error: {
    Icon: FiXCircle,
    accent: 'bg-rose-500',
    iconWrap:
      'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
    progress: 'bg-rose-500',
  },
  info: {
    Icon: FiInfo,
    accent: 'bg-brand-500',
    iconWrap:
      'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
    progress: 'bg-brand-500',
  },
  warning: {
    Icon: FiAlertTriangle,
    accent: 'bg-amber-500',
    iconWrap:
      'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    progress: 'bg-amber-500',
  },
}

const DEFAULT_TITLES = {
  success: 'Success',
  error: 'Something went wrong',
  info: 'Heads up',
  warning: 'Warning',
}

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>')
  }
  return ctx
}

function ToastItem({ toast, onDismiss }) {
  const { id, variant, message, title, duration } = toast
  const config = VARIANTS[variant] || VARIANTS.info
  const { Icon } = config
  const timerRef = useRef(null)
  const [paused, setPaused] = useState(false)

  // Auto-dismiss with pause-on-hover support.
  useEffect(() => {
    if (paused || duration === 0 || duration === Infinity) return undefined
    timerRef.current = setTimeout(() => onDismiss(id), duration)
    return () => clearTimeout(timerRef.current)
  }, [paused, duration, id, onDismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 48, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 48, scale: 0.94, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-auto relative w-full overflow-hidden rounded-2xl',
        'bg-white/95 backdrop-blur-xl border border-line shadow-card-hover',
        'dark:bg-slate-900/95 dark:border-slate-800',
      )}
    >
      {/* Colored left accent */}
      <span className={cn('absolute inset-y-0 left-0 w-1', config.accent)} />

      <div className="flex items-start gap-3 p-4 pl-5">
        <span
          className={cn(
            'mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-xl',
            config.iconWrap,
          )}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.4} />
        </span>

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-semibold text-ink dark:text-slate-100">
            {title || DEFAULT_TITLES[variant] || DEFAULT_TITLES.info}
          </p>
          {message ? (
            <p className="mt-0.5 break-words text-sm leading-relaxed text-ink-soft dark:text-slate-400">
              {message}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => onDismiss(id)}
          aria-label="Dismiss notification"
          className={cn(
            'flex-none rounded-lg p-1.5 text-ink-faint transition-colors',
            'hover:bg-surface-muted hover:text-ink',
            'dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200',
          )}
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>

      {/* Auto-dismiss progress bar */}
      {duration !== 0 && duration !== Infinity ? (
        <motion.span
          className={cn('absolute bottom-0 left-0 h-0.5', config.progress)}
          initial={{ width: '100%' }}
          animate={{ width: paused ? undefined : '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      ) : null}
    </motion.div>
  )
}

export function ToastProvider({ children, max = 5 }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (variant, message, opts = {}) => {
      const id = ++idRef.current
      const toast = {
        id,
        variant,
        message,
        title: opts.title,
        duration:
          opts.duration === undefined ? DEFAULT_DURATION : opts.duration,
      }
      setToasts((prev) => {
        const next = [...prev, toast]
        // Cap the visible stack — drop the oldest when exceeding max.
        return next.length > max ? next.slice(next.length - max) : next
      })
      return id
    },
    [max],
  )

  const api = useRef(null)
  if (!api.current) {
    api.current = {
      success: (msg, opts) => push('success', msg, opts),
      error: (msg, opts) => push('error', msg, opts),
      info: (msg, opts) => push('info', msg, opts),
      warning: (msg, opts) => push('warning', msg, opts),
      dismiss,
    }
  }

  const portalTarget = typeof document !== 'undefined' ? document.body : null

  return (
    <ToastContext.Provider value={api.current}>
      {children}
      {portalTarget
        ? createPortal(
            <div
              aria-live="assertive"
              className="pointer-events-none fixed inset-x-0 top-0 z-[9999] flex flex-col items-end gap-3 p-4 sm:inset-x-auto sm:right-0 sm:top-0 sm:w-[400px] sm:max-w-[calc(100vw-2rem)]"
            >
              <AnimatePresence initial={false}>
                {toasts.map((toast) => (
                  <ToastItem
                    key={toast.id}
                    toast={toast}
                    onDismiss={dismiss}
                  />
                ))}
              </AnimatePresence>
            </div>,
            portalTarget,
          )
        : null}
    </ToastContext.Provider>
  )
}

export default ToastProvider
