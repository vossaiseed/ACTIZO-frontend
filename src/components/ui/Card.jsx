import { cn } from '@/utils/cn'

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
}

const HEADER_PAD = {
  none: 'px-5 pt-5 pb-0',
  sm: 'px-4 pt-4 pb-0',
  md: 'px-5 pt-5 pb-0 sm:px-6 sm:pt-6',
  lg: 'px-6 pt-6 pb-0 sm:px-8 sm:pt-8',
}

const BODY_PAD = {
  none: '',
  sm: 'px-4 py-4',
  md: 'px-5 py-5 sm:px-6 sm:py-6',
  lg: 'px-6 py-6 sm:px-8 sm:py-8',
}

/**
 * Premium surface card. If title/subtitle/action/icon are present,
 * a header row is rendered above the body (children).
 */
const Card = ({
  title,
  subtitle,
  icon,
  action,
  hover = false,
  padding = 'md',
  as: Tag = 'div',
  className,
  children,
  ...rest
}) => {
  const hasHeader = title != null || subtitle != null || action != null || icon != null
  const pad = PADDING[padding] ?? PADDING.md

  return (
    <Tag
      className={cn('card overflow-hidden', hover && 'card-hover', className)}
      {...rest}
    >
      {hasHeader && (
        <div
          className={cn(
            'flex items-start justify-between gap-4',
            HEADER_PAD[padding] ?? HEADER_PAD.md,
          )}
        >
          <div className="flex min-w-0 items-start gap-3">
            {icon && (
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="truncate text-base font-semibold text-ink dark:text-slate-100">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-0.5 truncate text-sm text-ink-soft dark:text-slate-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      {hasHeader ? (
        <div className={cn(BODY_PAD[padding] ?? BODY_PAD.md)}>{children}</div>
      ) : (
        <div className={pad}>{children}</div>
      )}
    </Tag>
  )
}

export default Card
