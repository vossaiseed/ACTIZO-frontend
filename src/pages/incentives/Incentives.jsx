import { useMemo, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import {
  FiAward,
  FiDollarSign,
  FiTrendingUp,
  FiCalendar,
  FiZap,
  FiBarChart2,
  FiLayers,
  FiGift,
  FiDownload,
  FiChevronDown,
  FiFilter,
  FiRefreshCw,
  FiClock,
  FiStar,
  FiPercent,
} from 'react-icons/fi'

import { selectIncentives, setFilter, resetFilters, setPage } from '@/redux/slices/incentiveSlice'

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

const STATUS_OPTIONS = [
  { value: 'All', label: 'All Statuses' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Pending', label: 'Pending' },
]

const TYPE_OPTIONS = [
  { value: 'All', label: 'All Types' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Special', label: 'Special' },
  { value: 'Project', label: 'Project' },
]

// Incentive rows only carry `branchName`, so build branch options from the data.
const buildBranchOptions = (items) => [
  { value: 'All', label: 'All Branches' },
  ...[...new Set(items.map((i) => i.branchName))].sort().map((b) => ({ value: b, label: b })),
]

// Search across the incentive rows.
const SEARCH_KEYS = ['id', 'staffName', 'branchName', 'month', 'type', 'status']

// Filter key -> item key map for applyFilters. ('search'/'month' handled separately.)
const FILTER_MAP = { branch: 'branchName', status: 'status', type: 'type' }

// Gradient fallbacks for avatars (incentive rows carry avatarColor; history rows do not).
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

const TYPE_ICON = {
  Monthly: FiCalendar,
  Special: FiZap,
  Project: FiLayers,
}

/* ------------------------------------------------------------------ */
/* Top Performer highlight card (gradient / glass)                    */
/* ------------------------------------------------------------------ */

function TopPerformerCard({ performer }) {
  if (!performer) {
    return (
      <div className="card flex items-center justify-center p-6">
        <EmptyState
          icon={FiAward}
          title="No top performer"
          description="Top earner will appear here once incentives are recorded."
          className="py-4"
        />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 p-5 text-white shadow-glow ring-1 ring-white/10 sm:col-span-2 lg:col-span-1"
    >
      {/* ambient shapes */}
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
          name={performer.staffName}
          color={performer.avatarColor || gradientFor(performer.staffName)}
          size="lg"
          className="ring-white/40"
        />
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold leading-tight">
            {performer.staffName}
          </p>
          <p className="truncate text-sm text-white/80">{performer.branchName}</p>
        </div>
      </div>

      <div className="relative mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xs font-medium uppercase tracking-wider text-white/70">
            Total Earned
          </p>
          <p className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {formatCurrency(performer.total)}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
          <FiPercent className="h-3 w-3" />
          {performer.incentiveRate}%
        </span>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                              */
/* ------------------------------------------------------------------ */

export default function Incentives() {
  const dispatch = useDispatch()
  const { items, history, summary, filters, page, pageSize } = useSelector(selectIncentives)

  // Local sort (this slice has no sort state) + simulated load flag for skeletons.
  const [sort, setSort] = useState({ key: 'total', dir: 'desc' })
  const [loading] = useState(false)

  const branchOptions = useMemo(() => buildBranchOptions(items), [items])

  /* ----- Filtering / sorting / pagination pipeline ----- */
  const filtered = useMemo(() => {
    const searched = searchData(items, filters.search, SEARCH_KEYS)
    const byFilters = applyFilters(searched, filters, FILTER_MAP)
    return sortData(byFilters, sort.key, sort.dir)
  }, [items, filters, sort])

  const totalRows = filtered.length
  const pageRows = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize])

  /* ----- History pipeline (search + filters only, capped) ----- */
  const historyRows = useMemo(() => {
    const searched = searchData(history, filters.search, SEARCH_KEYS)
    const byFilters = applyFilters(searched, filters, FILTER_MAP)
    return sortData(byFilters, 'month', 'desc').slice(0, 12)
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
    filters.search ||
    filters.branch !== 'All' ||
    filters.status !== 'All' ||
    filters.type !== 'All'

  /* ----- Export ----- */
  const exportColumns = [
    { key: 'id', label: 'Incentive ID' },
    { key: 'staffName', label: 'Staff' },
    { key: 'branchName', label: 'Branch' },
    { key: 'month', label: 'Month' },
    { key: 'baseSales', label: 'Base Sales (AED)' },
    { key: 'incentiveRate', label: 'Rate (%)' },
    { key: 'amount', label: 'Incentive (AED)' },
    { key: 'bonus', label: 'Bonus (AED)' },
    { key: 'total', label: 'Total (AED)' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status' },
  ]

  const runExport = (format) => exportData(format, filtered, 'actizo-incentives', exportColumns)

  const exportItems = [
    { label: 'Export as CSV', icon: <FiDownload />, onClick: () => runExport('csv') },
    { label: 'Export as Excel', icon: <FiDownload />, onClick: () => runExport('excel') },
    { label: 'Export as PDF', icon: <FiDownload />, onClick: () => runExport('pdf') },
  ]

  /* ----- Incentive List columns ----- */
  const columns = [
    {
      key: 'staffName',
      header: 'Staff',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar
            name={row.staffName}
            size="sm"
            color={row.avatarColor || gradientFor(row.staffName)}
          />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink dark:text-slate-100">{row.staffName}</p>
            <p className="truncate text-xs text-ink-faint dark:text-slate-500">{row.id}</p>
          </div>
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
      key: 'month',
      header: 'Month',
      sortable: true,
      render: (row) => (
        <span className="whitespace-nowrap text-ink-soft dark:text-slate-400">{row.month}</span>
      ),
    },
    {
      key: 'baseSales',
      header: 'Base Sales',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="tabular-nums text-ink-soft dark:text-slate-300">
          {formatCurrency(row.baseSales)}
        </span>
      ),
    },
    {
      key: 'incentiveRate',
      header: 'Rate',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="inline-flex items-center gap-0.5 rounded-md bg-brand-50 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
          {row.incentiveRate}%
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Incentive',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="tabular-nums text-ink dark:text-slate-200">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: 'bonus',
      header: 'Bonus',
      sortable: true,
      align: 'right',
      render: (row) =>
        row.bonus > 0 ? (
          <span className="inline-flex items-center gap-1 whitespace-nowrap tabular-nums text-emerald-600 dark:text-emerald-400">
            <FiGift className="h-3.5 w-3.5" />
            {formatCurrency(row.bonus)}
          </span>
        ) : (
          <span className="text-ink-faint dark:text-slate-600">—</span>
        ),
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="font-semibold tabular-nums text-ink dark:text-slate-100">
          {formatCurrency(row.total)}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (row) => {
        const Icon = TYPE_ICON[row.type] || FiCalendar
        return (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-ink-soft dark:text-slate-300">
            <Icon className="h-3.5 w-3.5 text-ink-faint dark:text-slate-500" />
            {row.type}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} withDot />,
    },
  ]

  /* ----- Incentive History columns ----- */
  const historyColumns = [
    {
      key: 'staffName',
      header: 'Staff',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.staffName} size="sm" color={gradientFor(row.staffName)} />
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
      key: 'month',
      header: 'Month',
      render: (row) => (
        <span className="whitespace-nowrap text-ink-soft dark:text-slate-400">{row.month}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => (
        <span className="font-semibold tabular-nums text-ink dark:text-slate-100">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => {
        const Icon = TYPE_ICON[row.type] || FiCalendar
        return (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-ink-soft dark:text-slate-300">
            <Icon className="h-3.5 w-3.5 text-ink-faint dark:text-slate-500" />
            {row.type}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} withDot />,
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
        subtitle="Track earned incentives, bonuses, and payouts across staff and branches."
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
              delta={11.2}
              icon={FiDollarSign}
              tone="brand"
            />
            <KPICard
              label="Highest Incentive"
              value={formatCurrency(summary.highestIncentive, { compact: true })}
              delta={4.7}
              icon={FiTrendingUp}
              tone="emerald"
            />
            <KPICard
              label="Monthly Incentive"
              value={formatCurrency(summary.monthlyIncentive, { compact: true })}
              delta={6.5}
              deltaSuffix="this month"
              icon={FiCalendar}
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
                  {formatNumber(totalRows)} record{totalRows === 1 ? '' : 's'}
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
            <div className="md:col-span-5">
              <SearchBar
                value={filters.search}
                onChange={handleSearch}
                placeholder="Search staff, branch, month…"
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
            <div className="md:col-span-2">
              <Select
                options={STATUS_OPTIONS}
                value={filters.status}
                onChange={handleFilter('status')}
                aria-label="Filter by status"
              />
            </div>
            <div className="md:col-span-2">
              <Select
                options={TYPE_OPTIONS}
                value={filters.type}
                onChange={handleFilter('type')}
                aria-label="Filter by type"
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
            emptyTitle="No incentives found"
            emptyDescription="No incentives match your current search and filters. Try clearing them to see all records."
          />
        </div>

        {totalRows > 0 && (
          <div className="mt-5">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={totalRows}
              onPageChange={handlePage}
            />
          </div>
        )}
      </Card>

      {/* ---------------- Incentive History table ---------------- */}
      <Card padding="md" className="flex flex-col">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20">
            <FiClock className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-display font-semibold text-ink dark:text-slate-100">
              Incentive History
            </h3>
            <p className="mt-0.5 text-sm text-ink-soft dark:text-slate-400">
              Recent payout records across all staff
              {hasActiveFilters ? ' (filtered)' : ''}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <DataTable
            columns={historyColumns}
            data={historyRows}
            loading={loading}
            rowKey={(row) => row.id}
            emptyIcon={FiClock}
            emptyTitle="No history records"
            emptyDescription="Past incentive payouts will appear here as they accumulate."
          />
        </div>
      </Card>
    </motion.div>
  )
}
