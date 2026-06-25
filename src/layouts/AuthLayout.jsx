import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated } from '@/redux/slices/authSlice'
import { ActizoMark } from '@/components/layout/Sidebar'
import ThemeToggle from '@/components/layout/ThemeToggle'

/**
 * AuthLayout — immersive full-bleed brand background with a centered card slot.
 * The actual login card is rendered by the page via <Outlet />.
 */
export default function AuthLayout() {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  if (isAuthenticated) return <Navigate to="/" replace />

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950">
      {/* Layered background */}
      <div className="absolute inset-0 bg-brand-gradient" aria-hidden />
      <div className="absolute inset-0 bg-mesh opacity-70" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-500/20 via-transparent to-slate-950/70" aria-hidden />

      {/* Floating orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="animate-float absolute -left-20 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="animate-float absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-brand-300/20 blur-3xl" style={{ animationDelay: '1.4s' }} />
        <div className="animate-float absolute right-1/3 top-1/4 h-28 w-28 rounded-3xl border border-white/20 bg-white/5 backdrop-blur-sm" style={{ animationDelay: '0.7s' }} />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-2.5 text-white">
          <ActizoMark className="ring-white/40" />
          <div className="leading-none">
            <span className="block font-display text-lg font-bold tracking-tight">ACTIZO</span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-white/70">
              CRM Suite
            </span>
          </div>
        </div>
        <div className="rounded-xl bg-white/10 p-0.5 backdrop-blur-sm ring-1 ring-white/20">
          <ThemeToggle />
        </div>
      </header>

      {/* Centered card */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative z-10 pb-5 text-center text-xs text-white/60">
        © {new Date().getFullYear()} ACTIZO CRM · Enterprise Sales Intelligence
      </footer>
    </div>
  )
}
