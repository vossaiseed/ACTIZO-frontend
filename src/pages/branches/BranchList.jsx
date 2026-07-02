import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiHome,
  FiDollarSign,
  FiTarget,
  FiUsers,
  FiUser,
  FiDownload,
  FiGrid,
  FiList,
  FiMapPin,
  FiArrowUpRight,
  FiShoppingBag,
  FiZap,
} from 'react-icons/fi'

import { cn } from '@/utils/cn'
import { formatCurrency, formatNumber } from '@/utils/format'
import { searchData, applyFilters, sum } from '@/utils/helpers'
import { exportData } from '@/utils/export'
import { achievementStyleFromPct } from '@/utils/achievement'
import { REGIONS } from '@/constants'

import {
  fetchBranches,
  selectBranches,
  selectBranchStatus,
  setFilter,
} from '@/redux/slices/branchSlice'

import PageHeader from '@/components/common/PageHeader'
import SearchBar from '@/components/common/SearchBar'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import StatusBadge from '@/components/ui/StatusBadge'
import ProgressBar from '@/components/ui/ProgressBar'
import AchievementBadge from '@/components/ui/AchievementBadge'
import DataTable from '@/components/data/DataTable'
import KPICard from '@/components/cards/KPICard'
import EmptyState from '@/components/feedback/EmptyState'
import Loader from '@/components/feedback/Loader'

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */
const ALL = { value: 'All', label: 'All' }
const REGION_OPTS = [ALL, ...REGIONS.map((r) => ({ value: r, label: r }))]
const STATUS_OPTS = [ALL, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]

const SEARCH_KEYS = ['name', 'city', 'region', 'manager', 'code', 'email']

const FILTER_MAP = { region: 'region', status: 'status' }

const EXPORT_COLUMNS = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Branch' },
  { key: 'city', label: 'City' },
  { key: 'region', label: 'Region' },
  { key: 'manager', label: 'Manager' },
  { key: 'staffCount', label: 'Staff' },
  { key: 'totalLeads', label: 'Leads' },
  { key: 'totalSales', label: 'Sales' },
  { key: 'monthlyRevenue', label: 'Monthly Revenue (₹)' },
  { key: 'totalRevenue', label: 'Total Revenue (₹)' },
  { key: 'targetRevenue', label: 'Assigned Target (₹)' },
  { key: 'targetAchievement', label: 'Target %' },
  { key: 'status', label: 'Status' },
]

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

const pageMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' },
}

const gridContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const gridItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

/* ------------------------------------------------------------------ */
/* Mini stat (inside branch card)                                      */
/* ------------------------------------------------------------------ */
function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-surface-muted/60 px-3 py-2 ring-1 ring-line/60 dark:bg-slate-800/50 dark:ring-slate-700/50">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-500/15 dark:bg-brand-500/10 dark:text-brand-300">
        <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-ink-faint dark:text-slate-500">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-ink dark:text-slate-100">{value}</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Branch card                                                         */
/* ------------------------------------------------------------------ */
function BranchCard({ branch, onClick }) {
  // Analytics fields (staffCount, totals, revenue, targetAchievement) are not on
  // the list payload — guard with fallbacks so the card never crashes.
  const pct = branch.targetAchievement || 0
  return (
    <motion.button
      type="button"
      variants={gridItem}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      onClick={onClick}
      className="card group relative flex w-full flex-col overflow-hidden p-5 text-left transition-shadow duration-300 hover:shadow-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
    >
      {/* ambient brand glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-gradient-to-br from-brand-500/15 to-transparent opacity-70 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-soft ring-1 ring-black/5"
            style={{ background: branch.color || '#36bab3' }}
          >
            <FiHome className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-semibold text-ink dark:text-slate-100">
              {branch.name}
            </h3>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-ink-soft dark:text-slate-400">
              <FiMapPin className="h-3.5 w-3.5 shrink-0" />
              {branch.city} • {branch.region}
            </p>
          </div>
        </div>
        <Badge tone="gray" size="md" className="shrink-0 font-mono">
          {branch.code}
        </Badge>
      </div>

      {/* manager */}
      <p className="relative mt-3 flex items-center gap-1.5 text-xs text-ink-soft dark:text-slate-400">
        <FiUser className="h-3.5 w-3.5 shrink-0" />
        <span className="text-ink-faint dark:text-slate-500">Manager</span>
        <span className="truncate font-medium text-ink dark:text-slate-200">{branch.manager}</span>
      </p>

      {/* mini stats */}
      <div className="relative mt-4 grid grid-cols-2 gap-2.5">
        <MiniStat icon={FiUsers} label="Staff" value={formatNumber(branch.staffCount)} />
        <MiniStat icon={FiZap} label="Leads" value={formatNumber(branch.totalLeads)} />
        <MiniStat icon={FiShoppingBag} label="Sales" value={formatNumber(branch.totalSales)} />
        <MiniStat
          icon={FiDollarSign}
          label="Revenue"
          value={formatCurrency(branch.totalRevenue, { compact: true })}
        />
      </div>

      {/* target achievement */}
      <div className="relative mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium text-ink-soft dark:text-slate-400">
            <FiTarget className="h-3.5 w-3.5" /> Target Achievement
          </span>
          <span className={cn('text-xs font-semibold tabular-nums', achievementStyleFromPct(pct).text)}>
            {pct}%
          </span>
        </div>
        <ProgressBar value={pct} color={achievementStyleFromPct(pct).bar} size="md" />
        <div className="mt-2 flex items-center justify-between rounded-lg bg-surface-muted/60 px-3 py-2 ring-1 ring-line/60 dark:bg-slate-800/50 dark:ring-slate-700/50">
          <span className="flex items-center gap-1.5 text-xs font-medium text-ink-soft dark:text-slate-400">
            <FiTarget className="h-3.5 w-3.5" /> Target Progress
          </span>
          <span className="font-display text-sm font-bold text-ink dark:text-slate-100">
            {branch.targetRevenue ? (
              <>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(branch.totalRevenue || 0, { compact: true })}
                </span>
                <span className="text-ink-faint dark:text-slate-500"> / </span>
                {formatCurrency(branch.targetRevenue, { compact: true })}
              </>
            ) : (
              '—'
            )}
          </span>
        </div>
      </div>

      {/* footer */}
      <div className="relative mt-4 flex items-center justify-between border-t border-line pt-3.5 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <StatusBadge status={cap(branch.status)} size="md" withDot />
          <AchievementBadge pct={pct} size="md" />
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition-transform group-hover:translate-x-0.5 dark:text-brand-300">
          View <FiArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </motion.button>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function BranchList() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const branches = useSelector(selectBranches)
  const filters = useSelector((s) => s.branches.filters)
  const branchStatus = useSelector(selectBranchStatus)

  const loading = branchStatus === 'loading' || branchStatus === 'idle'
  const [view, setView] = useState('grid')

  // Load branches from the API on mount.
  useEffect(() => {
    dispatch(fetchBranches())
  }, [dispatch])

  const onFilter = (key, value) => dispatch(setFilter({ key, value }))

  /* ---- Filtered list ---- */
  const filtered = useMemo(() => {
    let rows = searchData(branches, filters.search, SEARCH_KEYS)
    rows = applyFilters(rows, { region: filters.region, status: filters.status }, FILTER_MAP)
    return rows
  }, [branches, filters.search, filters.region, filters.status])

  /* ---- KPIs (over full branch set) ---- */
  const kpis = useMemo(() => {
    const totalRevenue = sum(branches, 'totalRevenue')
    const totalStaff = sum(branches, 'staffCount')
    const avgTarget = branches.length
      ? Math.round(sum(branches, 'targetAchievement') / branches.length)
      : 0
    return {
      totalBranches: branches.length,
      totalRevenue,
      avgTarget,
      totalStaff,
    }
  }, [branches])

  const handleExport = () => exportData('csv', filtered, 'branches', EXPORT_COLUMNS)

  /* ---- Table columns ---- */
  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Branch',
        sortable: true,
        render: (b) => (
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-soft"
              style={{ background: b.color || '#36bab3' }}
            >
              <FiHome className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink dark:text-slate-100">{b.name}</p>
              <p className="truncate text-xs text-ink-soft dark:text-slate-400">
                {b.city} • {b.region}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: 'code',
        header: 'Code',
        render: (b) => (
          <Badge tone="gray" size="sm" className="font-mono">
            {b.code}
          </Badge>
        ),
      },
      { key: 'manager', header: 'Manager', sortable: true },
      {
        key: 'staffCount',
        header: 'Staff',
        sortable: true,
        align: 'right',
        render: (b) => formatNumber(b.staffCount),
      },
      {
        key: 'totalLeads',
        header: 'Leads',
        sortable: true,
        align: 'right',
        render: (b) => formatNumber(b.totalLeads),
      },
      {
        key: 'totalRevenue',
        header: 'Revenue',
        sortable: true,
        align: 'right',
        render: (b) => (
          <span className="font-semibold text-ink dark:text-slate-100">
            {formatCurrency(b.totalRevenue, { compact: true })}
          </span>
        ),
      },
      {
        key: 'targetAchievement',
        header: 'Target',
        sortable: true,
        width: 180,
        render: (b) => {
          const pct = b.targetAchievement || 0
          return (
            <div className="min-w-[150px]">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-semibold text-ink dark:text-slate-200">
                  {b.targetRevenue
                    ? `${formatCurrency(b.totalRevenue || 0, { compact: true })} / ${formatCurrency(b.targetRevenue, { compact: true })}`
                    : '—'}
                </span>
                <span className={cn('font-semibold tabular-nums', achievementStyleFromPct(pct).text)}>
                  {pct}%
                </span>
              </div>
              <ProgressBar value={pct} color={achievementStyleFromPct(pct).bar} size="sm" />
            </div>
          )
        },
      },
      {
        key: 'status',
        header: 'Status',
        align: 'center',
        render: (b) => <StatusBadge status={cap(b.status)} size="sm" withDot />,
      },
    ],
    [],
  )

  return (
    <motion.div {...pageMotion} className="space-y-6">
      <PageHeader
        title="Branches"
        subtitle="Monitor performance across all regional branches"
        icon={FiHome}
        actions={
          <>
            <div className="inline-flex items-center rounded-xl border border-line bg-white p-1 shadow-soft dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setView('grid')}
                aria-label="Grid view"
                aria-pressed={view === 'grid'}
                className={cn(
                  'flex h-8 w-9 items-center justify-center rounded-lg transition-colors',
                  view === 'grid'
                    ? 'bg-brand-500 text-white shadow-soft'
                    : 'text-ink-soft hover:bg-surface-muted hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
                )}
              >
                <FiGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView('table')}
                aria-label="Table view"
                aria-pressed={view === 'table'}
                className={cn(
                  'flex h-8 w-9 items-center justify-center rounded-lg transition-colors',
                  view === 'table'
                    ? 'bg-brand-500 text-white shadow-soft'
                    : 'text-ink-soft hover:bg-surface-muted hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
                )}
              >
                <FiList className="h-4 w-4" />
              </button>
            </div>
            <Button variant="outline" leftIcon={<FiDownload />} onClick={handleExport}>
              Export
            </Button>
          </>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Total Branches" value={kpis.totalBranches} icon={FiHome} tone="brand" />
        <KPICard
          label="Total Revenue"
          value={formatCurrency(kpis.totalRevenue, { compact: true })}
          icon={FiDollarSign}
          tone="emerald"
        />
        <KPICard
          label="Avg Target Achievement"
          value={kpis.avgTarget}
          suffix="%"
          icon={FiTarget}
          tone="violet"
        />
        <KPICard label="Total Staff" value={kpis.totalStaff} icon={FiUsers} tone="sky" />
      </div>

      {/* Filters toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center">
        <div className="lg:max-w-md lg:flex-1">
          <SearchBar
            value={filters.search}
            onChange={(v) => onFilter('search', v)}
            placeholder="Search branches, cities, managers…"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center lg:ml-auto">
          <Select
            options={REGION_OPTS}
            value={filters.region}
            onChange={(e) => onFilter('region', e.target.value)}
            containerClassName="sm:w-44"
            aria-label="Filter by region"
          />
          <Select
            options={STATUS_OPTS}
            value={filters.status}
            onChange={(e) => onFilter('status', e.target.value)}
            containerClassName="sm:w-44"
            aria-label="Filter by status"
          />
        </div>
      </div>

      {/* Result count */}
      <p className="-mt-2 text-sm text-ink-soft dark:text-slate-400">
        Showing <span className="font-semibold text-ink dark:text-slate-200">{filtered.length}</span> of{' '}
        {branches.length} branches
      </p>

      {/* Content */}
      {loading && branches.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-center py-20">
            <Loader size="lg" label="Loading branches…" />
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
          <EmptyState
            icon={FiHome}
            title="No branches found"
            description="Try adjusting your search or filters to find the branch you are looking for."
            className="py-16"
          />
        </div>
      ) : view === 'grid' ? (
        <motion.div
          variants={gridContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3"
        >
          {filtered.map((branch) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              onClick={() => navigate(`/branches/${branch.id}`)}
            />
          ))}
        </motion.div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          rowKey={(b) => b.id}
          onRowClick={(b) => navigate(`/branches/${b.id}`)}
          emptyTitle="No branches found"
          emptyIcon={FiHome}
        />
      )}
    </motion.div>
  )
}
