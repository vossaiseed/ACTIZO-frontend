import { useDispatch, useSelector } from 'react-redux'
import { FiMenu, FiSearch, FiSidebar } from 'react-icons/fi'
import { cn } from '@/utils/cn'
import { toggleMobileNav, toggleSidebar, selectSidebarCollapsed } from '@/redux/slices/uiSlice'
import Breadcrumb from '@/components/common/Breadcrumb'
import ThemeToggle from '@/components/layout/ThemeToggle'
import NotificationCenter from '@/components/layout/NotificationCenter'
import ProfileDropdown from '@/components/layout/ProfileDropdown'

/**
 * Header — sticky top bar (glass) for the app shell.
 * The search trigger fires a window CustomEvent 'open-global-search'; the
 * GlobalSearch palette (mounted once in MainLayout) listens for it. This keeps
 * the palette fully self-contained and avoids duplicate mounts.
 */
export default function Header() {
  const dispatch = useDispatch()
  const collapsed = useSelector(selectSidebarCollapsed)

  const openSearch = () => window.dispatchEvent(new CustomEvent('open-global-search'))

  return (
    <header className="glass-soft sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-line px-4 sm:px-6 dark:border-slate-800">
      {/* Left cluster */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {/* Mobile menu */}
        <button
          type="button"
          onClick={() => dispatch(toggleMobileNav())}
          aria-label="Open navigation"
          className="grid h-9 w-9 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <FiMenu className="h-5 w-5" />
        </button>

        {/* Desktop collapse */}
        <button
          type="button"
          onClick={() => dispatch(toggleSidebar())}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden h-9 w-9 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 lg:grid dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <FiSidebar className="h-[18px] w-[18px]" />
        </button>

        {/* Breadcrumb / page context (desktop) */}
        <div className="ml-1 hidden min-w-0 md:block">
          <Breadcrumb />
        </div>
      </div>

      {/* Right cluster */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {/* Search trigger — pill on >=sm, icon on mobile */}
        <button
          type="button"
          onClick={openSearch}
          aria-label="Search"
          className={cn(
            'group hidden items-center gap-2 rounded-xl border border-line bg-white/70 px-3 py-2 text-sm text-ink-faint transition-all',
            'hover:border-brand-300 hover:text-ink-soft sm:flex',
            'dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-500 dark:hover:border-brand-500/50 dark:hover:text-slate-300',
          )}
        >
          <FiSearch className="h-4 w-4 transition-colors group-hover:text-brand-500" />
          <span className="hidden lg:inline">Search…</span>
          <kbd className="ml-2 hidden rounded-md border border-line bg-surface-muted px-1.5 py-0.5 text-[11px] font-medium text-ink-soft lg:inline-block dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Search (mobile icon) */}
        <button
          type="button"
          onClick={openSearch}
          aria-label="Search"
          className="grid h-9 w-9 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 sm:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <FiSearch className="h-5 w-5" />
        </button>

        <ThemeToggle />
        <NotificationCenter />

        <span className="mx-1 hidden h-6 w-px bg-line sm:block dark:bg-slate-800" aria-hidden="true" />

        <ProfileDropdown />
      </div>
    </header>
  )
}
