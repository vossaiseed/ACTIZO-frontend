import { useEffect, useMemo, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import {
  FiAward,
  FiDollarSign,
  FiTrendingUp,
  FiUsers,
  FiBarChart2,
  FiPackage,
  FiDownload,
  FiChevronDown,
  FiFilter,
  FiRefreshCw,
  FiClock,
  FiStar,
} from 'react-icons/fi'

import {
  selectIncentives,
  setFilter,
  resetFilters,
  setPage,
  fetchIncentives,
  fetchIncentiveHistory,
  fetchIncentiveSummary,
} from '@/redux/slices/incentiveSlice'

import PageHeader from '@/components/common/PageHeader'
import SearchBar from '@/components/common/SearchBar'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import Dropdown from '@/components/ui/Dropdown'
import Avatar from '@/components/ui/Avatar'
import StatusBadge from '@/components/ui/StatusBadge'
import Pagination from '@/components/ui/Pagination'
import KPICard from '@/components/cards/KPICard'
import DataTable from '@/components/data/DataTable'
import EmptyState from '@/components/feedback/EmptyState'
import { SkeletonKPI } from '@/components/feedback/Skeleton'

import { formatCurrency, formatNumber } from '@/utils/format'
import { searchData, applyFilters, sortData, paginate } from '@/utils/helpers'
import { exportData } from '@/utils/export'

/* ------------------------------------------------------------------ */
/* Static option helpers                                              */
/* ------------------------------------------------------------------ */

// Incentives are computed: a staff has "Earned" once they exceed their target, else "Active".
const STATUS_OPTIONS = [
  { value: 'All', label: 'All Statuses' },
  { value: 'Earned', label: 'Earned' },
  { value: 'Active', label: 'Active' },
]

// Rows only carry `branchName`, so build branch options from the data.
const buildBranchOptions = (items) => [
  { value: 'All', label: 'All Branches' },
  ...[...new Set(items.map((i) => i.branchName))].filter(Boolean).sort().map((b) => ({ value: b, label: b })),
]

const SEARCH_KEYS = ['staffName', 'branchName', 'productName', 'status']
const FILTER_MAP = { branch: 'branchName', status: 'status' }

// Gradient fallbacks for avatars without a stored color.
const AVATAR_GRADIENTS = [
  'from-brand-400 to-brand-600',
  'from-violet-400 to-violet-600',
  'from-sky-400 to-sky-600',
  'from-emerald-400 to-emerald-600',
  'from-amber-400 to-amber-600',
  'from-rose-400 to-rose-600',
  'from-indigo-400 to-indigo-600',
]

const gradientFor = (name = '') =>
  AVATAR_GRADIENTS[(name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length]

/* ------------------------------------------------------------------ */
/* Top Performer highlight card (gradient / glass)                    */
/* ------------------------------------------------------------------ */

function TopPerformerCard({ performer }) {
  if (!performer) {
    return (
      <div className="card flex items-center justify-center p-6 sm:col-span-2 lg:col-span-1">
        <EmptyState
          icon={FiAward}
          title="No top performer"
          description="Top earner appears here once a staff member exceeds their target."
          className="py-4"
        />
      </div>
    )
  }

  const displayName = performer.name || performer.staffName || '—'
  const branch = performer.branchName || ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 p-5 text-white shadow-glow ring-1 ring-white/10 sm:col-span-2 lg:col-span-1"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/15 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-12 -left-6 h-28 w-28 rounded-full bg-white/10 blur-2xl"
      />

      <div className="relative flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-2xs font-semibold uppercase tracking-wider backdrop-blur-sm">
          <FiStar className="h-3 w-3" />
          Top Performer
        </span>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
          <FiAward className="h-5 w-5" />
        </span>
      </div>

      <div className="relative mt-4 flex items-center gap-3.5">
        <Avatar
          name={displayName}
          color={performer.avatarColor || gradientFor(displayName)}
          size="lg"
          className="ring-white/40"
        />
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold leading-tight">{displayName}</p>
          {branch && <p className="truncate text-sm text-white/80">{branch}</p>}
        </div>
      </div>

      <div className="relative mt-4">
        <p className="text-2xs font-medium uppercase tracking-wider text-white/70">Total Earned</p>
        <p className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {formatCurrency(performer.total)}
        </p>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                              */
/* ------------------------------------------------------------------ */

export default function Incentives() {
  const dispatch = useDispatch()
  const { items, history, summary, filters, page, pageSize, status } = useSelector(selectIncentives)

  const [sort, setSort] = useState({ key: 'amount', dir: 'desc' })
  const loading = status === 'loading' || status === 'idle'

  // Load computed incentives + breakdown + summary (role-scoped on the backend).
  useEffect(() => {
    dispatch(fetchIncentives())
    dispatch(fetchIncentiveHistory())
    dispatch(fetchIncentiveSummary())
  }, [dispatch])

  const branchOptions = useMemo(() => buildBranchOptions(items), [items])

  /* ----- Filtering / sorting / pagination pipeline ----- */
  const filtered = useMemo(() => {
    const searched = searchData(items, filters.search, SEARCH_KEYS)
    const byFilters = applyFilters(searched, filters, FILTER_MAP)
    return sortData(byFilters, sort.key, sort.dir)
  }, [items, filters, sort])

  const totalRows = filtered.length
  const pageRows = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize])

  /* ----- Breakdown pipeline (search + filters only) ----- */
  const breakdownRows = useMemo(() => {
    const searched = searchData(history, filters.search, SEARCH_KEYS)
    return applyFilters(searched, filters, FILTER_MAP)
  }, [history, filters])

  /* ----- Handlers ----- */
  const handleSearch = (value) => dispatch(setFilter({ key: 'search', value }))
  const handleFilter = (key) => (e) => dispatch(setFilter({ key, value: e.target.value }))
  const handleSort = (key) =>
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    )
  const handlePage = (n) => dispatch(setPage(n))

  const hasActiveFilters =
    filters.search || filters.branch !== 'All' || filters.status !== 'All'

  /* ----- Export ----- */
  const exportColumns = [
    { key: 'staffName', label: 'Staff' },
    { key: 'branchName', label: 'Branch' },
    { key: 'targetQty', label: 'Target (units)' },
    { key: 'achievedQty', label: 'Achieved (units)' },
    { key: 'extraQty', label: 'Extra (units)' },
    { key: 'amount', label: 'Incentive (₹)' },
    { key: 'status', label: 'Status' },
  ]

  const runExport = (format) => exportData(format, filtered, 'actizo-incentives', exportColumns)

  const exportItems = [
    { label: 'Export as CSV', icon: <FiDownload />, onClick: () => runExport('csv') },
    { label: 'Export as Excel', icon: <FiDownload />, onClick: () => runExport('excel') },
    { label: 'Export as PDF', icon: <FiDownload />, onClick: () => runExport('pdf') },
  ]

  /* ----- Incentive List columns (per staff) ----- */
  const columns = [
    {
      key: 'staffName',
      header: 'Staff',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.staffName} size="sm" color={row.avatarColor || gradientFor(row.staffName)} />
          <p className="truncate font-medium text-ink dark:text-slate-100">{row.staffName}</p>
        </div>
      ),
    },
    {
      key: 'branchName',
      header: 'Branch',
      sortable: true,
      render: (row) => (
        <span className="whitespace-nowrap text-ink-soft dark:text-slate-300">{row.branchName}</span>
      ),
    },
    {
      key: 'targetQty',
      header: 'Target',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="tabular-nums text-ink-soft dark:text-slate-300">{formatNumber(row.targetQty)}</span>
      ),
    },
    {
      key: 'achievedQty',
      header: 'Achieved',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="tabular-nums text-ink-soft dark:text-slate-300">{formatNumber(row.achievedQty)}</span>
      ),
    },
    {
      key: 'extraQty',
      header: 'Extra Units',
      sortable: true,
      align: 'right',
      render: (row) =>
        row.extraQty > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
            +{formatNumber(row.extraQty)}
          </span>
        ) : (
          <span className="text-ink-faint dark:text-slate-600">—</span>
        ),
    },
    {
      key: 'amount',
      header: 'Incentive',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="font-semibold tabular-nums text-ink dark:text-slate-100">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} withDot />,
    },
  ]

  /* ----- Breakdown columns (per product target) ----- */
  const breakdownColumns = [
    {
      key: 'staffName',
      header: 'Staff',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.staffName} size="sm" color={row.avatarColor || gradientFor(row.staffName)} />
          <span className="font-medium text-ink dark:text-slate-100">{row.staffName}</span>
        </div>
      ),
    },
    {
      key: 'branchName',
      header: 'Branch',
      render: (row) => (
        <span className="whitespace-nowrap text-ink-soft dark:text-slate-300">{row.branchName}</span>
      ),
    },
    {
      key: 'productName',
      header: 'Product',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-ink-soft dark:text-slate-300">
          <FiPackage className="h-3.5 w-3.5 text-ink-faint dark:text-slate-500" />
          {row.productName}
        </span>
      ),
    },
    {
      key: 'targetQty',
      header: 'Target',
      align: 'right',
      render: (row) => <span className="tabular-nums text-ink-soft dark:text-slate-300">{formatNumber(row.targetQty)}</span>,
    },
    {
      key: 'achievedQty',
      header: 'Achieved',
      align: 'right',
      render: (row) => <span className="tabular-nums text-ink-soft dark:text-slate-300">{formatNumber(row.achievedQty)}</span>,
    },
    {
      key: 'extraQty',
      header: 'Extra',
      align: 'right',
      render: (row) => (
        <span className="tabular-nums text-ink-soft dark:text-slate-300">{formatNumber(row.extraQty)}</span>
      ),
    },
    {
      key: 'rate',
      header: 'Rate / unit',
      align: 'right',
      render: (row) => (
        <span className="tabular-nums text-ink-soft dark:text-slate-300">{formatCurrency(row.rate)}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Incentive',
      align: 'right',
      render: (row) => (
        <span className="font-semibold tabular-nums text-ink dark:text-slate-100">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
  ]

  /* ----- Header actions ----- */
  const headerActions = (
    <Dropdown
      align="right"
      items={exportItems}
      trigger={
        <Button variant="outline" leftIcon={<FiDownload />} rightIcon={<FiChevronDown />}>
          Export
        </Button>
      }
    />
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6"
    >
      <PageHeader
        title="Incentives"
        subtitle="Auto-calculated from staff targets and completed sales — extra units sold beyond target × rate."
        icon={FiAward}
        actions={headerActions}
      />

      {/* ---------------- KPI cards + Top Performer ---------------- */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonKPI key={i} />
            ))}
            <div className="skeleton h-[168px] rounded-2xl sm:col-span-2 lg:col-span-1" />
          </>
        ) : (
          <>
            <KPICard
              label="Total Incentives"
              value={formatCurrency(summary.totalIncentives, { compact: true })}
              icon={FiDollarSign}
              tone="brand"
            />
            <KPICard
              label="Highest Incentive"
              value={formatCurrency(summary.highestIncentive, { compact: true })}
              icon={FiTrendingUp}
              tone="emerald"
            />
            <KPICard
              label="Staff Earning"
              value={`${formatNumber(summary.earningStaff || 0)} / ${formatNumber(summary.staffCount || 0)}`}
              icon={FiUsers}
              tone="violet"
            />
            <TopPerformerCard performer={summary.topPerformer} />
          </>
        )}
      </div>

      {/* ---------------- Incentive List table ---------------- */}
      <Card padding="md" className="flex flex-col">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20">
                <FiBarChart2 className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-display font-semibold text-ink dark:text-slate-100">
                  Incentive List
                </h3>
                <p className="mt-0.5 text-sm text-ink-soft dark:text-slate-400">
                  {formatNumber(totalRows)} staff
                  {hasActiveFilters ? ' (filtered)' : ''}
                </p>
              </div>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<FiRefreshCw />}
                onClick={() => dispatch(resetFilters())}
              >
                Reset
              </Button>
            )}
          </div>

          {/* Toolbar: search + filters */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-6">
              <SearchBar
                value={filters.search}
                onChange={handleSearch}
                placeholder="Search staff, branch…"
              />
            </div>
            <div className="md:col-span-3">
              <Select
                options={branchOptions}
                value={filters.branch}
                onChange={handleFilter('branch')}
                aria-label="Filter by branch"
              />
            </div>
            <div className="md:col-span-3">
              <Select
                options={STATUS_OPTIONS}
                value={filters.status}
                onChange={handleFilter('status')}
                aria-label="Filter by status"
              />
            </div>
          </div>
        </div>

        <div className="mt-5">
          <DataTable
            columns={columns}
            data={pageRows}
            loading={loading}
            sort={sort}
            onSort={handleSort}
            rowKey={(row) => row.id}
            emptyIcon={FiFilter}
            emptyTitle="No incentives yet"
            emptyDescription="Incentives appear automatically when a staff member's sales exceed their assigned target."
          />
        </div>

        {totalRows > 0 && (
          <div className="mt-5">
            <Pagination page={page} pageSize={pageSize} total={totalRows} onPageChange={handlePage} />
          </div>
        )}
      </Card>

      {/* ---------------- Incentive Breakdown (per product target) ---------------- */}
      <Card padding="md" className="flex flex-col">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20">
            <FiClock className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-display font-semibold text-ink dark:text-slate-100">
              Incentive Breakdown
            </h3>
            <p className="mt-0.5 text-sm text-ink-soft dark:text-slate-400">
              Per-product target vs achieved for each staff member
              {hasActiveFilters ? ' (filtered)' : ''}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <DataTable
            columns={breakdownColumns}
            data={breakdownRows}
            loading={loading}
            rowKey={(row) => row.id}
            emptyIcon={FiClock}
            emptyTitle="No target breakdown"
            emptyDescription="Assign product targets to staff to see their incentive breakdown here."
          />
        </div>
      </Card>
    </motion.div>
  )
}
