import { useDispatch, useSelector } from 'react-redux'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronLeft, FiChevronsLeft, FiLogOut } from 'react-icons/fi'
import { cn } from '@/utils/cn'
import { filterNavSections, filterNavFooter } from '@/constants/navigation'
import {
  selectSidebarCollapsed,
  toggleSidebar,
} from '@/redux/slices/uiSlice'
import { logout, selectUser, selectPermissions } from '@/redux/slices/authSlice'
import Avatar from '@/components/ui/Avatar'
import Tooltip from '@/components/ui/Tooltip'

const DEMO_USER = {
  name: 'Branch Manager',
  role: 'Branch Manager',
  avatarColor: 'from-indigo-400 to-indigo-600',
}

/**
 * ActizoMark — teal gradient square logo mark with a stylized 'A' / chevron glyph.
 */
function ActizoMark({ className }) {
  return (
    <span
      className={cn(
        'relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl',
        'bg-brand-gradient text-white shadow-glow ring-1 ring-white/30',
        className,
      )}
      aria-hidden="true"
    >
      <span className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent" />
      <svg viewBox="0 0 24 24" className="relative h-5 w-5" fill="none">
        <path
          d="M5 19 12 5l7 14"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M8.5 14.5h7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </span>
  )
}

/** Single nav row — switches to icon-only + tooltip when collapsed. */
function NavItem({ item, collapsed }) {
  const Icon = item.icon
  const link = (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        cn(
          'nav-item group/navitem relative',
          collapsed && 'justify-center px-0',
          isActive && 'nav-item-active',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="sidebar-active-pill"
              className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-500"
              transition={{ type: 'spring', stiffness: 500, damping: 38 }}
            />
          )}
          <Icon
            className={cn(
              'h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover/navitem:scale-110',
              isActive ? 'text-brand-600 dark:text-brand-300' : 'text-ink-soft dark:text-slate-400',
            )}
          />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  )

  if (collapsed) {
    return (
      <Tooltip content={item.label} side="right">
        {link}
      </Tooltip>
    )
  }
  return link
}

/**
 * Sidebar — desktop collapsible navigation (hidden below lg).
 * Sticky, full-height, smooth width transition between expanded (w-64) and
 * collapsed (w-[76px]).
 */
export default function Sidebar() {
  const collapsed = useSelector(selectSidebarCollapsed)
  const user = useSelector(selectUser) || DEMO_USER
  const permissions = useSelector(selectPermissions)
  const sections = filterNavSections(permissions)
  const footerItems = filterNavFooter(permissions)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 256 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r border-line bg-white/90 backdrop-blur-xl lg:flex',
        'dark:border-slate-800 dark:bg-slate-900/80',
      )}
    >
      {/* Logo / brand */}
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-line px-4 dark:border-slate-800',
          collapsed && 'justify-center px-0',
        )}
      >
        <NavLink to="/" className="flex min-w-0 items-center gap-2.5" aria-label="ACTIZO home">
          <ActizoMark />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.2 }}
                className="min-w-0 leading-none"
              >
                <span className="block truncate font-display text-lg font-bold tracking-tight text-ink dark:text-slate-100">
                  ACTIZO
                </span>
                <span className="block truncate text-[10px] font-medium uppercase tracking-[0.18em] text-ink-faint dark:text-slate-500">
                  CRM Suite
                </span>
              </motion.span>
            )}
          </AnimatePresence>
        </NavLink>
      </div>

      {/* Nav sections */}
      <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!collapsed ? (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint dark:text-slate-600">
                {section.title}
              </p>
            ) : (
              <div className="mx-auto mb-1 h-px w-6 bg-line dark:bg-slate-800" />
            )}
            {section.items.map((item) => (
              <NavItem key={item.to} item={item} collapsed={collapsed} />
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 space-y-3 border-t border-line px-3 py-4 dark:border-slate-800">
        {/* Collapse toggle */}
        <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} side="right">
          <button
            type="button"
            onClick={() => dispatch(toggleSidebar())}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'nav-item w-full text-ink-soft',
              collapsed && 'justify-center px-0',
            )}
          >
            <FiChevronsLeft
              className={cn(
                'h-[18px] w-[18px] shrink-0 transition-transform duration-300',
                collapsed && 'rotate-180',
              )}
            />
            {!collapsed && <span>Collapse</span>}
          </button>
        </Tooltip>

        {/* Settings (NAV_FOOTER) */}
        {footerItems.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} />
        ))}

        {/* User mini block + logout */}
        <div className="border-t border-line pt-3 dark:border-slate-800">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <Tooltip content={`${user.name} · ${user.role}`} side="right">
                <Avatar name={user.name} color={user.avatarColor} size="sm" />
              </Tooltip>
              <Tooltip content="Log out" side="right">
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Log out"
                  className="grid h-9 w-9 place-items-center rounded-xl text-ink-soft transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                >
                  <FiLogOut className="h-[18px] w-[18px]" />
                </button>
              </Tooltip>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-xl bg-surface-muted/60 p-2 dark:bg-slate-800/50">
              <Avatar name={user.name} color={user.avatarColor} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink dark:text-slate-100">
                  {user.name}
                </p>
                <p className="truncate text-xs text-ink-soft dark:text-slate-400">{user.role}</p>
              </div>
              <Tooltip content="Log out" side="top">
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Log out"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-soft transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                >
                  <FiLogOut className="h-4 w-4" />
                </button>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  )
}

export { ActizoMark }
