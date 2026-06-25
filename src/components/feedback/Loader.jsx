import { cn } from '@/utils/cn'

const SIZES = {
  sm: { box: 'h-4 w-4', border: 'border-2', text: 'text-xs' },
  md: { box: 'h-6 w-6', border: 'border-2', text: 'text-sm' },
  lg: { box: 'h-9 w-9', border: 'border-[3px]', text: 'text-base' },
}

/**
 * Bare brand spinner ring. Exported separately so callers (e.g. Button)
 * can drop a spinner inline without label/layout chrome.
 */
export function Spinner({ size = 'md', className }) {
  const s = SIZES[size] || SIZES.md
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full align-[-0.125em]',
        'border-brand-500/25 border-t-brand-500',
        'dark:border-brand-400/20 dark:border-t-brand-400',
        s.box,
        s.border,
        className,
      )}
    />
  )
}

/**
 * Inline loader: brand spinner with an optional label, centered as a row.
 */
export default function Loader({ size = 'md', label, className }) {
  const s = SIZES[size] || SIZES.md
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center gap-2.5 text-ink-soft dark:text-slate-400',
        className,
      )}
    >
      <Spinner size={size} />
      {label ? (
        <span className={cn('font-medium', s.text)}>{label}</span>
      ) : null}
    </div>
  )
}
