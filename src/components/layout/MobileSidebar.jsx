import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { FiLogOut } from 'react-icons/fi'
import { cn } from '@/utils/cn'
import { filterNavSections, filterNavFooter } from '@/constants/navigation'
import { setMobileNav } from '@/redux/slices/uiSlice'
import { logout, selectUser, selectPermissions } from '@/redux/slices/authSlice'
import Drawer from '@/components/overlay/Drawer'
import Avatar from '@/components/ui/Avatar'
import { ActizoMark } from '@/components/layout/Sidebar'

const DEMO_USER = {
  name: 'Branch Manager',
  role: 'Branch Manager',
  avatarColor: 'from-indigo-400 to-indigo-600',
}

function MobileNavItem({ item, onNavigate }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn('nav-item', isActive && 'nav-item-active')
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              'h-[18px] w-[18px] shrink-0',
              isActive ? 'text-brand-600 dark:text-brand-300' : 'text-ink-soft dark:text-slate-400',
            )}
          />
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

/**
 * MobileSidebar — the navigation for small screens, presented as a left Drawer.
 * Driven by `ui.mobileNavOpen`; auto-closes whenever the route changes.
 */
export default function MobileSidebar() {
  const open = useSelector((s) => s.ui.mobileNavOpen)
  const user = useSelector(selectUser) || DEMO_USER
  const permissions = useSelector(selectPermissions)
  const sections = filterNavSections(permissions)
  const footerItems = filterNavFooter(permissions)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const close = () => dispatch(setMobileNav(false))

  // Auto-close when the route changes.
  useEffect(() => {
    dispatch(setMobileNav(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
    close()
  }

  return (
    <Drawer
      open={open}
      onClose={close}
      side="left"
      width="sm"
      title={
        <span className="flex items-center gap-2.5">
          <ActizoMark />
          <span className="leading-none">
            <span className="block font-display text-lg font-bold tracking-tight text-ink dark:text-slate-100">
              ACTIZO
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-ink-faint dark:text-slate-500">
              CRM Suite
            </span>
          </span>
        </span>
      }
      footer={
        <div className="flex w-full items-center gap-2.5">
          <Avatar name={user.name} color={user.avatarColor} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink dark:text-slate-100">
              {user.name}
            </p>
            <p className="truncate text-xs text-ink-soft dark:text-slate-400">{user.role}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-ink-soft transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
          >
            <FiLogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      }
    >
      <nav className="-mx-2 space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint dark:text-slate-600">
              {section.title}
            </p>
            {section.items.map((item) => (
              <MobileNavItem key={item.to} item={item} onNavigate={close} />
            ))}
          </div>
        ))}

        <div className="space-y-1 border-t border-line pt-4 dark:border-slate-800">
          {footerItems.map((item) => (
            <MobileNavItem key={item.to} item={item} onNavigate={close} />
          ))}
        </div>
      </nav>
    </Drawer>
  )
}
