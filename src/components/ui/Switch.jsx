import { useId } from 'react'
import { cn } from '@/utils/cn'

/**
 * Accessible toggle switch. Brand-colored when on.
 */
const Switch = ({ checked = false, onChange, label, disabled = false, id, className, ...rest }) => {
  const autoId = useId()
  const switchId = id || autoId

  const toggle = () => {
    if (!disabled) onChange?.(!checked)
  }

  const control = (
    <button
      id={switchId}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={!label ? 'Toggle' : undefined}
      disabled={disabled}
      onClick={toggle}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-smooth',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2',
        'focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-700',
      )}
      {...rest}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow-soft transition-transform duration-200 ease-smooth',
          checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5',
        )}
      />
    </button>
  )

  if (!label) return <span className={cn('inline-flex', className)}>{control}</span>

  return (
    <label
      htmlFor={switchId}
      className={cn(
        'inline-flex cursor-pointer select-none items-center gap-3',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      {control}
      <span className="text-sm font-medium text-ink dark:text-slate-200">{label}</span>
    </label>
  )
}

export default Switch
