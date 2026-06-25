import { forwardRef, useId } from 'react'
import { cn } from '@/utils/cn'

/**
 * Form input with label, hint, error, and optional leading/trailing icons.
 * forwardRef so it works with react-hook-form register().
 */
const Input = forwardRef(function Input(
  { label, type = 'text', error, hint, leftIcon, rightIcon, id, className, containerClassName, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id || autoId
  const hasError = Boolean(error)

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-ink dark:text-slate-200"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint dark:text-slate-500">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          aria-invalid={hasError || undefined}
          className={cn(
            'input-base',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            hasError &&
              'border-rose-400 focus:border-rose-400 focus:ring-rose-500/20 dark:border-rose-500/60',
            className,
          )}
          {...rest}
        />

        {rightIcon && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint dark:text-slate-500">
            {rightIcon}
          </span>
        )}
      </div>

      {hasError ? (
        <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-soft dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  )
})

export default Input
