import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiChevronDown,
  FiUser,
  FiSettings,
  FiLogOut,
  FiSun,
  FiMoon,
} from 'react-icons/fi'
import { cn } from '@/utils/cn'
import { useTheme } from '@/hooks/useTheme'
import { logout, selectUser } from '@/redux/slices/authSlice'
import Avatar from '@/components/ui/Avatar'

const DEMO_USER = {
  name: 'Branch Manager',
  role: 'Branch Manager',
  email: 'manager@actizo.com',
  avatarColor: 'from-indigo-400 to-indigo-600',
}

/**
 * ProfileDropdown — avatar trigger that opens a menu with the user header,
 * Profile, Settings, a theme toggle row and Logout.
 */
export default function ProfileDropdown() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isDark, toggle } = useTheme()
  const user = useSelector(selectUser) || DEMO_USER

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

  const handleLogout = () => {
    setOpen(false)
    dispatch(logout())
    navigate('/login')
  }

  const itemClass = cn(
    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors',
    'hover:bg-surface-muted hover:text-ink dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100',
  )

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        className={cn(
          'flex items-center gap-2 rounded-xl p-1 pr-1.5 transition-colors sm:pr-2',
          'hover:bg-surface-muted dark:hover:bg-slate-800',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
          open && 'bg-surface-muted dark:bg-slate-800',
        )}
      >
        <Avatar name={user.name} color={user.avatarColor} size="sm" />
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-[120px] truncate text-sm font-semibold leading-tight text-ink dark:text-slate-100">
            {user.name}
          </span>
          <span className="block max-w-[120px] truncate text-xs leading-tight text-ink-soft dark:text-slate-400">
            {user.role}
          </span>
        </span>
        <FiChevronDown
          className={cn(
            'hidden h-4 w-4 shrink-0 text-ink-faint transition-transform duration-200 sm:block',
            open && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl glass p-1.5 shadow-card-hover"
            role="menu"
          >
            {/* User header */}
            <div className="flex items-center gap-3 rounded-xl bg-surface-muted/60 px-3 py-3 dark:bg-slate-800/60">
              <Avatar name={user.name} color={user.avatarColor} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink dark:text-slate-100">
                  {user.name}
                </p>
                <p className="truncate text-xs text-ink-soft dark:text-slate-400">
                  {user.email || DEMO_USER.email}
                </p>
              </div>
            </div>

            <div className="my-1.5 space-y-0.5">
              <Link to="/settings" onClick={() => setOpen(false)} className={itemClass} role="menuitem">
                <FiUser className="h-[18px] w-[18px] shrink-0" />
                Profile
              </Link>
              <Link to="/settings" onClick={() => setOpen(false)} className={itemClass} role="menuitem">
                <FiSettings className="h-[18px] w-[18px] shrink-0" />
                Settings
              </Link>

              {/* Theme toggle row */}
              <button type="button" onClick={toggle} className={itemClass} role="menuitem">
                {isDark ? (
                  <FiSun className="h-[18px] w-[18px] shrink-0" />
                ) : (
                  <FiMoon className="h-[18px] w-[18px] shrink-0" />
                )}
                <span className="flex-1 text-left">{isDark ? 'Light mode' : 'Dark mode'}</span>
              </button>
            </div>

            <div className="border-t border-line/70 pt-1 dark:border-white/10">
              <button
                type="button"
                onClick={handleLogout}
                role="menuitem"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
              >
                <FiLogOut className="h-[18px] w-[18px] shrink-0" />
                Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
