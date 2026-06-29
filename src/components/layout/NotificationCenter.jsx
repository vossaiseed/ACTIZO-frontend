import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiBell,
  FiUserPlus,
  FiTarget,
  FiCheckCircle,
  FiPhoneCall,
  FiAward,
  FiDollarSign,
  FiShoppingCart,
  FiZap,
  FiActivity,
  FiCheck,
} from 'react-icons/fi'
import { cn } from '@/utils/cn'
import { formatRelativeTime } from '@/utils/format'
import { notificationsApi } from '@/services/crm'

/** Icon + tint per notification type. */
const TYPE_META = {
  lead: { icon: FiUserPlus, tint: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300' },
  target: { icon: FiTarget, tint: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300' },
  won: { icon: FiCheckCircle, tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' },
  sale: { icon: FiShoppingCart, tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' },
  followup: { icon: FiPhoneCall, tint: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300' },
  incentive: { icon: FiAward, tint: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300' },
  finance: { icon: FiDollarSign, tint: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300' },
  campaign: { icon: FiZap, tint: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300' },
}

const fallbackMeta = {
  icon: FiActivity,
  tint: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

const POLL_MS = 20_000

/**
 * NotificationCenter — bell + unread badge that opens a popover of live
 * notifications from the backend. Polls every minute and on open; read-state
 * is persisted via the API.
 */
export default function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const rootRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const { data, meta } = await notificationsApi.list({ limit: 20 })
      setItems(data || [])
      setUnread(meta?.unread ?? (data || []).filter((n) => !n.read).length)
    } catch {
      /* silent — never break the shell on a notifications hiccup */
    }
  }, [])

  // Initial load + polling.
  useEffect(() => {
    load()
    const t = setInterval(load, POLL_MS)
    return () => clearInterval(t)
  }, [load])

  // Refresh when the popover is opened.
  useEffect(() => {
    if (open) load()
  }, [open, load])

  // Outside click + Esc close.
  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnread(0)
    try {
      await notificationsApi.markAllRead()
    } catch {
      load() // re-sync on failure
    }
  }

  const markRead = async (id) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnread((u) => Math.max(0, u - 1))
    try {
      await notificationsApi.markRead(id)
    } catch {
      load()
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
        className={cn(
          'relative grid h-9 w-9 place-items-center rounded-xl text-ink-soft transition-colors',
          'hover:bg-surface-muted hover:text-ink',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
          'dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
          open && 'bg-surface-muted text-ink dark:bg-slate-800 dark:text-slate-100',
        )}
      >
        <FiBell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-slate-900">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'absolute right-0 z-50 mt-2 w-[360px] max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-2xl',
              'border border-line bg-white shadow-card-hover dark:border-slate-700 dark:bg-slate-900',
            )}
            role="menu"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-line/70 px-4 py-3 dark:border-white/10">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm font-semibold text-ink dark:text-slate-100">
                  Notifications
                </h3>
                {unread > 0 && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                    {unread} new
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={markAllRead}
                disabled={unread === 0}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 transition hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-brand-400 dark:hover:text-brand-300"
              >
                <FiCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            </div>

            {/* List */}
            <div className="scrollbar-thin max-h-[min(60vh,420px)] overflow-y-auto py-1">
              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-surface-muted text-ink-faint dark:bg-slate-800 dark:text-slate-500">
                    <FiBell className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-medium text-ink-soft dark:text-slate-400">You're all caught up</p>
                  <p className="text-xs text-ink-faint dark:text-slate-500">New activity will show up here.</p>
                </div>
              ) : (
                items.map((n) => {
                  const meta = TYPE_META[n.type] || fallbackMeta
                  const Icon = meta.icon
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => markRead(n.id)}
                      className={cn(
                        'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
                        'hover:bg-surface-muted/70 dark:hover:bg-slate-800/60',
                        !n.read && 'bg-brand-50/40 dark:bg-brand-500/[0.06]',
                      )}
                    >
                      <span className={cn('mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl', meta.tint)}>
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-ink dark:text-slate-100">
                            {n.title}
                          </p>
                          {!n.read && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-soft dark:text-slate-400">
                          {n.message}
                        </p>
                        <p className="mt-1 text-[11px] font-medium text-ink-faint dark:text-slate-500">
                          {formatRelativeTime(n.time)}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-line/70 px-4 py-2.5 dark:border-white/10">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full rounded-lg py-1.5 text-center text-xs font-semibold text-brand-600 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
