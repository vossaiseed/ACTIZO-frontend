import { useState, useId } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/utils/cn'

const SIDE_POS = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

const ARROW_POS = {
  top: 'top-full left-1/2 -translate-x-1/2 -mt-1',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1',
  left: 'left-full top-1/2 -translate-y-1/2 -ml-1',
  right: 'right-full top-1/2 -translate-y-1/2 -mr-1',
}

const OFFSET = {
  top: { y: 4 },
  bottom: { y: -4 },
  left: { x: 4 },
  right: { x: -4 },
}

/**
 * Hover/focus tooltip with a small dark bubble.
 */
const Tooltip = ({ content, side = 'top', className, children }) => {
  const [open, setOpen] = useState(false)
  const id = useId()

  if (content == null || content === '') return children

  const off = OFFSET[side] || OFFSET.top

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>

      <AnimatePresence>
        {open && (
          <motion.span
            id={id}
            role="tooltip"
            initial={{ opacity: 0, scale: 0.95, ...off }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, ...off }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className={cn(
              'pointer-events-none absolute z-50 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium shadow-card-hover',
              'bg-slate-900 text-white dark:bg-slate-700',
              SIDE_POS[side] || SIDE_POS.top,
              className,
            )}
          >
            {content}
            <span
              className={cn(
                'absolute h-2 w-2 rotate-45 bg-slate-900 dark:bg-slate-700',
                ARROW_POS[side] || ARROW_POS.top,
              )}
              aria-hidden="true"
            />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

export default Tooltip
