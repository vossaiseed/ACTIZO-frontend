import { forwardRef, useId } from 'react'
import { cn } from '@/utils/cn'

/**
 * Multi-line text input. forwardRef for react-hook-form.
 */
const Textarea = forwardRef(function Textarea(
  { label, error, hint, rows = 4, id, className, containerClassName, ...rest },
  ref,
) {
  const autoId = useId()
  const fieldId = id || autoId
  const hasError = Boolean(error)

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label
          htmlFor={fieldId}
          className="mb-1.5 block text-sm font-medium text-ink dark:text-slate-200"
        >
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={hasError || undefined}
        className={cn(
          'input-base resize-y leading-relaxed',
          hasError &&
            'border-rose-400 focus:border-rose-400 focus:ring-rose-500/20 dark:border-rose-500/60',
          className,
        )}
        {...rest}
      />

      {hasError ? (
        <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-soft dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  )
})

export default Textarea
