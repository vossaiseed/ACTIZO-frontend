import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiHome, FiZap, FiCompass } from 'react-icons/fi'

import { APP_NAME } from '@/constants'
import Button from '@/components/ui/Button'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-surface-base px-4 py-12 dark:bg-slate-950">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-60 dark:opacity-30" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-400/20 blur-3xl dark:bg-brand-500/10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-brand-300/20 blur-3xl dark:bg-brand-500/10"
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-lg text-center"
      >
        {/* Brand mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 }}
          className="mb-8 inline-flex items-center gap-2.5"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-glow">
            <FiZap className="h-6 w-6" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-ink dark:text-slate-100">
            {APP_NAME}
          </span>
        </motion.div>

        {/* 404 */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          className="gradient-text select-none font-display text-[6.5rem] font-extrabold leading-none tracking-tighter sm:text-[9rem]"
        >
          404
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.18 }}
        >
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full bg-white/70 px-3.5 py-1.5 text-xs font-medium text-ink-soft shadow-soft ring-1 ring-line backdrop-blur dark:bg-slate-900/70 dark:text-slate-400 dark:ring-slate-800">
            <FiCompass className="h-3.5 w-3.5 text-brand-500" />
            Page not found
          </div>

          <h2 className="font-display text-2xl font-bold tracking-tight text-ink dark:text-slate-100 sm:text-3xl">
            We can&apos;t find that page
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft dark:text-slate-400 sm:text-base">
            The page you&apos;re looking for may have been moved, renamed, or never
            existed. Let&apos;s get you back on track.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.26 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button
            to="/"
            size="lg"
            leftIcon={<FiHome className="h-5 w-5" />}
            className="w-full sm:w-auto"
          >
            Back to Dashboard
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(-1)}
            leftIcon={<FiArrowLeft className="h-5 w-5" />}
            className="w-full sm:w-auto"
          >
            Go back
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.34 }}
          className="mt-8 text-xs text-ink-faint dark:text-slate-600"
        >
          Error code: 404 · {APP_NAME}
        </motion.p>
      </motion.div>
    </div>
  )
}
