import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

/**
 * Premium polymorphic button.
 * Renders <Link> when `to` is given, <a> when `href` is given, else <button>.
 */
const VARIANTS = {
  primary:
    'bg-brand-500 text-white shadow-soft hover:bg-brand-600 active:bg-brand-700 ' +
    'border border-transparent dark:shadow-none',
  secondary:
    'bg-surface-muted text-ink hover:bg-slate-200 active:bg-slate-300 border border-transparent ' +
    'dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:active:bg-slate-700/80',
  outline:
    'bg-white text-ink border border-line hover:bg-surface-muted hover:border-slate-300 active:bg-slate-100 ' +
    'dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:border-slate-600',
  ghost:
    'bg-transparent text-ink-soft hover:bg-surface-muted hover:text-ink active:bg-slate-200 border border-transparent ' +
    'dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
  danger:
    'bg-rose-500 text-white shadow-soft hover:bg-rose-600 active:bg-rose-700 border border-transparent',
  success:
    'bg-emerald-500 text-white shadow-soft hover:bg-emerald-600 active:bg-emerald-700 border border-transparent',
}

const SIZES = {
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
  icon: 'h-10 w-10 p-0 justify-center rounded-xl',
}

const Spinner = ({ className }) => (
  <svg
    className={cn('animate-spin', className)}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" />
    <path
      className="opacity-90"
      fill="currentColor"
      d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
)

const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    to,
    href,
    loading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    type = 'button',
    className,
    children,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading
  const iconSize = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'

  const classes = cn(
    'group relative inline-flex select-none items-center justify-center whitespace-nowrap font-medium',
    'transition-all duration-200 ease-smooth',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2',
    'focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98]',
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    fullWidth && 'w-full',
    className,
  )

  const inner = (
    <>
      {loading && <Spinner className={cn(iconSize, '-ml-0.5')} />}
      {!loading && leftIcon && (
        <span className={cn('inline-flex shrink-0', iconSize)} aria-hidden="true">
          {leftIcon}
        </span>
      )}
      {children != null && size !== 'icon' && <span className="truncate">{children}</span>}
      {size === 'icon' && !loading && !leftIcon && children}
      {!loading && rightIcon && (
        <span
          className={cn(
            'inline-flex shrink-0 transition-transform duration-200 group-hover:translate-x-0.5',
            iconSize,
          )}
          aria-hidden="true"
        >
          {rightIcon}
        </span>
      )}
    </>
  )

  // Link
  if (to && !isDisabled) {
    return (
      <Link ref={ref} to={to} className={classes} {...rest}>
        {inner}
      </Link>
    )
  }

  // Anchor
  if (href && !isDisabled) {
    return (
      <a ref={ref} href={href} className={classes} {...rest}>
        {inner}
      </a>
    )
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      {inner}
    </button>
  )
})

export default Button
