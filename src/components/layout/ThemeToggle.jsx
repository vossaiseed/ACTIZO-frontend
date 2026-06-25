import { motion, AnimatePresence } from 'framer-motion'
import { FiSun, FiMoon } from 'react-icons/fi'
import { cn } from '@/utils/cn'
import { useTheme } from '@/hooks/useTheme'

/**
 * ThemeToggle — icon button that flips between light/dark with an animated
 * Sun/Moon swap.
 */
export default function ThemeToggle({ className }) {
  const { isDark, toggle } = useTheme()

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={cn(
        'relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl text-ink-soft transition-colors',
        'hover:bg-surface-muted hover:text-ink',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
        'dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute inset-0 grid place-items-center"
          >
            <FiMoon className="h-[18px] w-[18px]" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute inset-0 grid place-items-center"
          >
            <FiSun className="h-[18px] w-[18px]" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
