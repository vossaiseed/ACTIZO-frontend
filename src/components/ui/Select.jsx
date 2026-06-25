import { forwardRef, useId } from 'react'
import { FiChevronDown } from 'react-icons/fi'
import { cn } from '@/utils/cn'

/**
 * Native styled <select> with custom chevron.
 * options = [{ value, label }]. forwardRef for react-hook-form.
 */
const Select = forwardRef(function Select(
  { label, options = [], error, hint, placeholder, id, className, containerClassName, ...rest },
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

      <div className="relative">
        <select
          ref={ref}
          id={fieldId}
          aria-invalid={hasError || undefined}
          className={cn(
            'input-base cursor-pointer appearance-none pr-10',
            hasError &&
              'border-rose-400 focus:border-rose-400 focus:ring-rose-500/20 dark:border-rose-500/60',
            className,
          )}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={String(opt.value)} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <FiChevronDown
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint dark:text-slate-500"
          aria-hidden="true"
        />
      </div>

      {hasError ? (
        <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-soft dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  )
})

export default Select
