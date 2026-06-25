import { getStatusStyle } from '@/constants'
import { cn } from '@/utils/cn'

const SIZES = {
  sm: 'px-2 py-0.5 text-2xs gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
}

/**
 * Status pill driven by getStatusStyle(status) from @/constants.
 * Never hardcode status colors elsewhere — use this.
 */
const StatusBadge = ({ status, withDot = false, size = 'sm', className, ...rest }) => {
  if (status == null || status === '') return null

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium ring-1 ring-inset',
        SIZES[size] || SIZES.sm,
        getStatusStyle(status),
        className,
      )}
      {...rest}
    >
      {withDot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" />}
      {status}
    </span>
  )
}

export default StatusBadge
