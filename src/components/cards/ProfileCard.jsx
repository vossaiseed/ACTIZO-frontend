import { motion } from 'framer-motion'
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi'
import { cn } from '@/utils/cn'
import Avatar from '@/components/ui/Avatar'

function ContactRow({ icon: Icon, children, href }) {
  if (!children) return null
  const content = (
    <span className="inline-flex min-w-0 items-center gap-2.5 text-sm text-ink-soft transition-colors dark:text-slate-400">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-soft ring-1 ring-line/70 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700/70">
        <Icon className="h-4 w-4" />
      </span>
      <span className="truncate">{children}</span>
    </span>
  )
  if (href) {
    return (
      <a href={href} className="block min-w-0 hover:[&_span]:text-brand-600 dark:hover:[&_span]:text-brand-300">
        {content}
      </a>
    )
  }
  return content
}

/**
 * Person profile card — avatar + identity, contact rows, stat grid, actions.
 * Used in staff profile / lists.
 */
export default function ProfileCard({ person = {}, stats = [], badges, actions, className, ...rest }) {
  const { name, role, branchName, avatarColor, email, phone } = person

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn('card overflow-hidden', className)}
      {...rest}
    >
      {/* Banner */}
      <div className="relative h-20 bg-brand-gradient">
        <div className="absolute inset-0 bg-mesh opacity-40" aria-hidden />
      </div>

      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        {/* Identity */}
        <div className="-mt-10 flex items-end gap-4">
          <div className="rounded-full ring-4 ring-white dark:ring-slate-900">
            <Avatar name={name} color={avatarColor} size="lg" />
          </div>
          {badges ? <div className="mb-1 flex flex-wrap items-center gap-1.5">{badges}</div> : null}
        </div>

        <div className="mt-3">
          <h3 className="truncate text-lg font-display font-semibold text-ink dark:text-slate-100">
            {name || 'Unknown'}
          </h3>
          <p className="mt-0.5 text-sm text-ink-soft dark:text-slate-400">
            {role}
            {role && branchName ? <span className="px-1.5 text-ink-faint dark:text-slate-600">•</span> : null}
            {branchName}
          </p>
        </div>

        {/* Contact */}
        {(email || phone || branchName) && (
          <div className="mt-4 space-y-2.5 border-t border-line pt-4 dark:border-slate-800">
            <ContactRow icon={FiMail} href={email ? `mailto:${email}` : undefined}>
              {email}
            </ContactRow>
            <ContactRow icon={FiPhone} href={phone ? `tel:${phone}` : undefined}>
              {phone}
            </ContactRow>
            <ContactRow icon={FiMapPin}>{branchName}</ContactRow>
          </div>
        )}

        {/* Stats */}
        {stats && stats.length > 0 && (
          <div
            className={cn(
              'mt-5 grid gap-3 border-t border-line pt-5 dark:border-slate-800',
              stats.length >= 3 ? 'grid-cols-3' : 'grid-cols-2',
            )}
          >
            {stats.map((stat, i) => (
              <div
                key={`${stat.label}-${i}`}
                className="rounded-xl bg-surface-muted/70 px-3 py-2.5 text-center ring-1 ring-line/60 dark:bg-slate-800/50 dark:ring-slate-700/50"
              >
                <p className="text-base font-display font-bold text-ink dark:text-slate-100 sm:text-lg">
                  {stat.value}
                </p>
                <p className="mt-0.5 truncate text-[11px] font-medium uppercase tracking-wide text-ink-faint dark:text-slate-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {actions ? (
          <div className="mt-5 flex items-center gap-2 border-t border-line pt-4 dark:border-slate-800">
            {actions}
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}
