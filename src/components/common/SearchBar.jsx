import React from 'react'
import { FiSearch, FiX } from 'react-icons/fi'
import { cn } from '@/utils/cn'

/**
 * SearchBar — controlled search input.
 * props: { value, onChange(string), placeholder='Search…', onClear?, className, size='sm'|'md' }
 * Leading FiSearch icon; trailing clear (FiX) appears only when value is non-empty.
 */
const SIZES = {
  sm: {
    wrap: 'h-9 text-sm',
    pad: 'pl-9 pr-9',
    icon: 'h-4 w-4',
    leftPos: 'left-3',
    rightPos: 'right-1.5',
    clear: 'h-6 w-6',
    clearIcon: 'h-3.5 w-3.5',
  },
  md: {
    wrap: 'h-11 text-sm',
    pad: 'pl-11 pr-11',
    icon: 'h-[18px] w-[18px]',
    leftPos: 'left-3.5',
    rightPos: 'right-2',
    clear: 'h-7 w-7',
    clearIcon: 'h-4 w-4',
  },
}

function SearchBar({
  value = '',
  onChange,
  placeholder = 'Search…',
  onClear,
  size = 'md',
  className,
  ...rest
}) {
  const s = SIZES[size] || SIZES.md
  const hasValue = Boolean(value)

  const handleClear = () => {
    onChange?.('')
    onClear?.()
  }

  return (
    <div className={cn('group relative w-full', className)}>
      <span
        className={cn(
          'pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-faint transition-colors group-focus-within:text-brand-500 dark:text-slate-500',
          s.leftPos
        )}
      >
        <FiSearch className={s.icon} />
      </span>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-xl border border-line bg-white text-ink placeholder:text-ink-faint',
          'shadow-soft transition-all duration-200',
          'focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30',
          'dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-brand-500',
          s.wrap,
          s.pad
        )}
        {...rest}
      />

      {hasValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className={cn(
            'absolute top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg text-ink-soft transition-colors',
            'hover:bg-surface-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
            'dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
            s.rightPos,
            s.clear
          )}
        >
          <FiX className={s.clearIcon} />
        </button>
      )}
    </div>
  )
}

export default SearchBar
