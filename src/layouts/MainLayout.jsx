import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/layout/Sidebar'
import MobileSidebar from '@/components/layout/MobileSidebar'
import Header from '@/components/layout/Header'
import GlobalSearch from '@/components/layout/GlobalSearch'

/**
 * MainLayout — the authenticated app shell.
 *
 * Layout: a flex row with the desktop Sidebar (sticky, in normal flow so it
 * pushes the content and naturally adapts to its collapsed width) and a main
 * column holding the sticky Header + scrollable content. Page transitions use
 * AnimatePresence keyed by the pathname. GlobalSearch is mounted exactly once
 * here.
 */
export default function MainLayout() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen bg-surface-base dark:bg-slate-950">
      {/* Desktop sidebar (hidden < lg internally) */}
      <Sidebar />

      {/* Mobile navigation drawer */}
      <MobileSidebar />

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="scrollbar-thin flex-1">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Command palette — single global mount */}
      <GlobalSearch />
    </div>
  )
}
