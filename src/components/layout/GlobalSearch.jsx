import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiSearch,
  FiCornerDownLeft,
  FiArrowUp,
  FiArrowDown,
  FiCompass,
  FiUsers,
  FiUserCheck,
  FiHome,
} from 'react-icons/fi'
import { cn } from '@/utils/cn'
import Modal from '@/components/overlay/Modal'
import { searchData } from '@/utils/helpers'
import { leads } from '@/data/leads'
import { staff } from '@/data/staff'
import { branches } from '@/data/branches'
import { NAV_FLAT } from '@/constants/navigation'

const MAX_PER_GROUP = 5

/**
 * GlobalSearch — command palette opened by ⌘K / Ctrl+K (global keydown) and by a
 * window CustomEvent 'open-global-search' (dispatched by the Header search
 * button). It is self-contained: mount it ONCE (in MainLayout). The Header
 * trigger should do: window.dispatchEvent(new CustomEvent('open-global-search')).
 */
export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Open on ⌘K / Ctrl+K + via custom event; close on toggle.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-global-search', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-global-search', onOpen)
    }
  }, [])

  // Reset query/highlight whenever it opens; focus input.
  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      const t = setTimeout(() => inputRef.current?.focus(), 40)
      return () => clearTimeout(t)
    }
  }, [open])

  // Build grouped results.
  const groups = useMemo(() => {
    const q = query.trim()

    const navResults = (
      q ? searchData(NAV_FLAT, q, ['label']) : NAV_FLAT
    )
      .slice(0, MAX_PER_GROUP)
      .map((n) => ({
        id: `nav-${n.to}`,
        title: n.label,
        subtitle: 'Navigate',
        to: n.to,
        Icon: n.icon,
      }))

    if (!q) {
      return [{ key: 'pages', label: 'Quick navigation', GroupIcon: FiCompass, items: navResults }]
    }

    const leadResults = searchData(leads, q, ['name', 'company', 'email', 'mobile'])
      .slice(0, MAX_PER_GROUP)
      .map((l) => ({
        id: `lead-${l.id}`,
        title: l.name,
        subtitle: [l.company || 'Lead', l.branchName].filter(Boolean).join(' · '),
        to: `/leads/${l.id}`,
        Icon: FiUsers,
      }))

    const staffResults = searchData(staff, q, ['name', 'role', 'email', 'branchName'])
      .slice(0, MAX_PER_GROUP)
      .map((s) => ({
        id: `staff-${s.id}`,
        title: s.name,
        subtitle: `${s.role} · ${s.branchName}`,
        to: `/staff/${s.id}`,
        Icon: FiUserCheck,
      }))

    const branchResults = searchData(branches, q, ['name', 'city', 'region', 'manager', 'code'])
      .slice(0, MAX_PER_GROUP)
      .map((b) => ({
        id: `branch-${b.id}`,
        title: b.name,
        subtitle: `${b.city} · ${b.region}`,
        to: `/branches/${b.id}`,
        Icon: FiHome,
      }))

    return [
      { key: 'pages', label: 'Pages', GroupIcon: FiCompass, items: navResults },
      { key: 'leads', label: 'Leads', GroupIcon: FiUsers, items: leadResults },
      { key: 'staff', label: 'Staff', GroupIcon: FiUserCheck, items: staffResults },
      { key: 'branches', label: 'Branches', GroupIcon: FiHome, items: branchResults },
    ].filter((g) => g.items.length > 0)
  }, [query])

  // Flatten for keyboard navigation.
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups])

  // Keep highlight in range when results change.
  useEffect(() => {
    setActive((a) => (flat.length === 0 ? 0 : Math.min(a, flat.length - 1)))
  }, [flat.length])

  const go = useCallback(
    (item) => {
      if (!item) return
      setOpen(false)
      navigate(item.to)
    },
    [navigate],
  )

  const onInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (flat.length ? (a + 1) % flat.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (flat.length ? (a - 1 + flat.length) % flat.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      go(flat[active])
    }
  }

  // Scroll the active item into view.
  useEffect(() => {
    if (!open) return
    const node = listRef.current?.querySelector(`[data-index="${active}"]`)
    node?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  let runningIndex = -1

  return (
    <Modal open={open} onClose={() => setOpen(false)} size="lg" hideClose className="!overflow-visible">
      <div className="-mx-6 -my-5">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-line px-5 py-4 dark:border-slate-800">
          <FiSearch className="h-5 w-5 shrink-0 text-ink-faint dark:text-slate-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={onInputKeyDown}
            placeholder="Search pages, leads, staff, branches…"
            className="h-7 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-faint dark:text-slate-100 dark:placeholder:text-slate-500"
            aria-label="Global search"
          />
          <kbd className="hidden rounded-md border border-line bg-surface-muted px-1.5 py-0.5 text-[11px] font-medium text-ink-soft sm:inline-block dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="scrollbar-thin max-h-[min(56vh,440px)] overflow-y-auto p-2">
          {flat.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-300">
                <FiSearch className="h-5 w-5" />
              </span>
              <p className="text-sm font-semibold text-ink dark:text-slate-100">No results found</p>
              <p className="text-xs text-ink-soft dark:text-slate-400">
                Try a different search term.
              </p>
            </div>
          ) : (
            groups.map((group) => {
              const GroupIcon = group.GroupIcon
              return (
                <div key={group.key} className="mb-1.5 last:mb-0">
                  <p className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint dark:text-slate-600">
                    <GroupIcon className="h-3 w-3" />
                    {group.label}
                  </p>
                  {group.items.map((item) => {
                    runningIndex += 1
                    const index = runningIndex
                    const isActive = index === active
                    const ItemIcon = item.Icon
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-index={index}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => go(item)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                          isActive
                            ? 'bg-brand-50 dark:bg-brand-500/15'
                            : 'hover:bg-surface-muted/70 dark:hover:bg-slate-800/60',
                        )}
                      >
                        <span
                          className={cn(
                            'grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors',
                            isActive
                              ? 'bg-brand-500 text-white'
                              : 'bg-surface-muted text-ink-soft dark:bg-slate-800 dark:text-slate-400',
                          )}
                        >
                          <ItemIcon className="h-[18px] w-[18px]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink dark:text-slate-100">
                            {item.title}
                          </span>
                          <span className="block truncate text-xs text-ink-soft dark:text-slate-400">
                            {item.subtitle}
                          </span>
                        </span>
                        {isActive && (
                          <motion.span
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="hidden items-center gap-1 text-[11px] font-medium text-brand-600 sm:flex dark:text-brand-300"
                          >
                            <FiCornerDownLeft className="h-3.5 w-3.5" />
                            Enter
                          </motion.span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>

        {/* Footer hint bar */}
        <div className="flex items-center justify-between gap-4 border-t border-line bg-surface-base/60 px-5 py-2.5 text-[11px] text-ink-soft dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="grid h-5 w-5 place-items-center rounded border border-line bg-white dark:border-slate-700 dark:bg-slate-800">
                <FiArrowUp className="h-3 w-3" />
              </kbd>
              <kbd className="grid h-5 w-5 place-items-center rounded border border-line bg-white dark:border-slate-700 dark:bg-slate-800">
                <FiArrowDown className="h-3 w-3" />
              </kbd>
              to navigate
            </span>
            <span className="hidden items-center gap-1 sm:flex">
              <kbd className="grid h-5 w-5 place-items-center rounded border border-line bg-white dark:border-slate-700 dark:bg-slate-800">
                <FiCornerDownLeft className="h-3 w-3" />
              </kbd>
              to select
            </span>
          </div>
          <span className="font-medium">ACTIZO Command</span>
        </div>
      </div>
    </Modal>
  )
}
