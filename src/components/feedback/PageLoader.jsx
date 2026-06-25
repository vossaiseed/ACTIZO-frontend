import { motion } from 'framer-motion'
import { FiZap } from 'react-icons/fi'
import { APP_NAME, APP_TAGLINE } from '@/constants'
import { cn } from '@/utils/cn'

/**
 * Full-viewport, brand-tinted loader used as the route <Suspense> fallback.
 * Animated ACTIZO mark with a rotating brand ring + pulsing glow.
 */
export default function PageLoader({ label = 'Loading workspace…', className }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6',
        'bg-surface-base bg-mesh dark:bg-slate-950',
        className,
      )}
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        {/* Soft pulsing glow */}
        <motion.span
          className="absolute inset-0 rounded-3xl bg-brand-500/20 blur-2xl"
          animate={{ opacity: [0.4, 0.85, 0.4], scale: [0.9, 1.05, 0.9] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Rotating accent ring */}
        <motion.span
          className="absolute inset-0 rounded-3xl border-[3px] border-brand-500/15 border-t-brand-500 dark:border-brand-400/15 dark:border-t-brand-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
        />

        {/* Brand mark */}
        <motion.div
          className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <FiZap className="h-8 w-8" strokeWidth={2.4} />
        </motion.div>
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <motion.p
          className="text-xl font-display font-bold tracking-tight gradient-text"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {APP_NAME}
        </motion.p>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink-faint dark:text-slate-500">
          {APP_TAGLINE}
        </p>
      </div>

      {/* Animated dots loader */}
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-brand-500 dark:bg-brand-400"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.15,
            }}
          />
        ))}
      </div>

      <span className="sr-only">{label}</span>
    </div>
  )
}
