import { useState } from 'react'
import { cn } from '@/utils/cn'

const SIZES = {
  xs: 'h-7 w-7 text-2xs',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-lg',
}

const RING = {
  xs: 'ring-1',
  sm: 'ring-2',
  md: 'ring-2',
  lg: 'ring-2',
}

/** Compute up-to-2-letter initials from a name. */
export const getInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Gradient circle avatar with initials, optional image.
 * color = Tailwind gradient classes, e.g. 'from-brand-400 to-brand-600'.
 */
const Avatar = ({
  name = '',
  src,
  color = 'from-brand-400 to-brand-600',
  size = 'md',
  className,
  ...rest
}) => {
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = Boolean(src) && !imgFailed

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full',
        'font-semibold text-white ring-white/70 dark:ring-slate-900',
        RING[size] || RING.md,
        SIZES[size] || SIZES.md,
        !showImage && 'bg-gradient-to-br shadow-soft',
        !showImage && color,
        className,
      )}
      title={name || undefined}
      aria-label={name || undefined}
      {...rest}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="leading-none tracking-wide">{getInitials(name)}</span>
      )}
    </span>
  )
}

export default Avatar
