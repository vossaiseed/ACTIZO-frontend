import { useEffect, useMemo, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import {
  FiShoppingCart,
  FiShoppingBag,
  FiDollarSign,
  FiPercent,
  FiCreditCard,
  FiTrendingUp,
  FiBarChart2,
  FiDownload,
  FiAward,
  FiPackage,
  FiUsers,
  FiChevronDown,
  FiFilter,
  FiRefreshCw,
  FiPlus,
} from 'react-icons/fi'

import {
  selectSales,
  selectSalesStatus,
  fetchSales,
  fetchSalesStats,
  setFilter,
  resetFilters,
  setSort,
  setPage,
} from '@/redux/slices/salesSlice'
import { fetchBranches, selectBranchOptions } from '@/redux/slices/branchSlice'
import { fetchProducts, selectProductOptions } from '@/redux/slices/productSlice'
import { fetchStaff } from '@/redux/slices/staffSlice'

import PageHeader from '@/components/common/PageHeader'
import SearchBar from '@/components/common/SearchBar'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import Dropdown from '@/components/ui/Dropdown'
import Avatar from '@/components/ui/Avatar'
import StatusBadge from '@/components/ui/StatusBadge'
import ProgressBar from '@/components/ui/ProgressBar'
import Pagination from '@/components/ui/Pagination'
import KPICard from '@/components/cards/KPICard'
import ChartCard from '@/components/cards/ChartCard'
import DataTable from '@/components/data/DataTable'
import EmptyState from '@/components/feedback/EmptyState'
import { SkeletonKPI } from '@/components/feedback/Skeleton'
import { AreaChartView } from '@/components/charts'
import RecordSaleModal from '@/components/sales/RecordSaleModal'

import { cn } from '@/utils/cn'
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDate,
} from '@/utils/format'
import { searchData, applyFilters, sortData, paginate } from '@/utils/helpers'
import { exportData } from '@/utils/export'
import { CHART_COLORS } from '@/constants'

/* ------------------------------------------------------------------ */
/* Static option helpers                                              */
/* ------------------------------------------------------------------ */

const SALE_STATUS_OPTIONS = [
  { value: 'All', label: 'All Statuses' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Refunded', label: 'Refunded' },
]

const ALL_BRANCHES = { value: 'All', label: 'All Branches' }
const ALL_PRODUCTS = { value: 'All', label: 'All Products' }

const MONTH_OPTIONS = [
  { value: 'Jun', label: 'June 2026' },
  { value: 'May', label: 'May 2026' },
  { value: 'Apr', label: 'April 2026' },
  { value: 'Mar', label: 'March 2026' },
  { value: 'Feb', label: 'February 2026' },
  { value: 'Jan', label: 'January 2026' },
]

// Search keys across the sales rows.
const SEARCH_KEYS = ['id', 'customer', 'product', 'branchName', 'staffName', 'paymentMode', 'status']

// Filter key -> item key map for applyFilters.
const FILTER_MAP = { branch: 'branchId', status: 'status', product: 'productId' }

// Gradient palette for staff avatars (staffSales rows carry no avatarColor).
const AVATAR_GRADIENTS = [
  'from-brand-400 to-brand-600',
  'from-violet-400 to-violet-600',
  'from-sky-400 to-sky-600',
  'from-emerald-400 to-emerald-600',
  'from-amber-400 to-amber-600',
  'from-rose-400 to-rose-600',
  'from-indigo-400 to-indigo-600',
]

/* ------------------------------------------------------------------ */
/* Small chart legend chip                                            */
/* ------------------------------------------------------------------ */

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft dark:text-slate-400">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                              */
/* ------------------------------------------------------------------ */

export default function Sales() {
  const dispatch = useDispatch()
  const { items, kpis, charts, topProducts, staffSales, filters, sort, page, pageSize } =
    useSelector(selectSales)
  const salesStatus = useSelector(selectSalesStatus)

  // Branch / product filter options sourced from the backend (real ids).
  const branchOptions = useSelector(selectBranchOptions)
  const productOptions = useSelector(selectProductOptions)
  const BRANCH_FILTER_OPTIONS = useMemo(() => [ALL_BRANCHES, ...branchOptions], [branchOptions])
  const PRODUCT_FILTER_OPTIONS = useMemo(() => [ALL_PRODUCTS, ...productOptions], [productOptions])

  const [month, setMonth] = useState('Jun')
  const [recordOpen, setRecordOpen] = useState(false)
  const loading = salesStatus === 'loading' || salesStatus === 'idle'

  // Load sales + stats + reference data (branches/products/staff) for the
  // record-sale form on mount.
  useEffect(() => {
    dispatch(fetchSales())
    dispatch(fetchSalesStats())
    dispatch(fetchProducts())
    dispatch(fetchBranches())
    dispatch(fetchStaff())
  }, [dispatch])

  /* ----- Filtering / sorting / pagination pipeline ----- */
  const filtered = useMemo(() => {
    const searched = searchData(items, filters.search, SEARCH_KEYS)
    const byFilters = applyFilters(searched, filters, FILTER_MAP)
    return sortData(byFilters, sort.key, sort.dir)
  }, [items, filters, sort])

  const totalRows = filtered.length
  const pageRows = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize])

  /* ----- KPI derived values ----- */
  const topProductMax = topProducts.length ? topProducts[0].revenue : 0
  const totalProductRevenue = useMemo(
    () => topProducts.reduce((acc, p) => acc + p.revenue, 0),
    [topProducts],
  )
  const staffMax = staffSales.length ? staffSales[0].revenue : 0

  /* ----- Handlers ----- */
  const handleSearch = (value) => dispatch(setFilter({ key: 'search', value }))
  const handleFilter = (key) => (e) => dispatch(setFilter({ key, value: e.target.value }))
  const handleSort = (key) => dispatch(setSort(key))
  const handlePage = (n) => dispatch(setPage(n))

  const hasActiveFilters =
    filters.search ||
    filters.branch !== 'All' ||
    filters.status !== 'All' ||
    filters.product !== 'All'

  /* ----- Export ----- */
  const exportColumns = [
    { key: 'id', label: 'Sale ID' },
    { key: 'customer', label: 'Customer' },
    { key: 'product', label: 'Product' },
    { key: 'branchName', label: 'Branch' },
    { key: 'staffName', label: 'Staff' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'unit', label: 'Unit' },
    { key: 'amount', label: 'Amount (AED)' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status' },
    { key: 'paymentMode', label: 'Payment Mode' },
  ]

  const runExport = (format) => exportData(format, filtered, 'actizo-sales', exportColumns)

  const exportItems = [
    { label: 'Export as CSV', icon: <FiDownload />, onClick: () => runExport('csv') },
    { label: 'Export as Excel', icon: <FiDownload />, onClick: () => runExport('excel') },
    { label: 'Export as PDF', icon: <FiDownload />, onClick: () => runExport('pdf') },
  ]

  /* ----- Table columns ----- */
  const columns = [
    {
      key: 'id',
      header: 'Sale ID',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">
          {row.id}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar
            name={row.customer}
            size="sm"
            color={AVATAR_GRADIENTS[(row.customer?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length]}
          />
          <span className="font-medium text-ink dark:text-slate-100">{row.customer}</span>
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      sortable: true,
      render: (row) => (
        <span className="text-ink-soft dark:text-slate-300">{row.product}</span>
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
      key: 'staffName',
      header: 'Staff',
      sortable: true,
      render: (row) => (
        <span className="whitespace-nowrap text-ink-soft dark:text-slate-300">{row.staffName}</span>
      ),
    },
    {
      key: 'quantity',
      header: 'Qty',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="tabular-nums text-ink dark:text-slate-200">
          {formatNumber(row.quantity)}
          <span className="ml-1 text-xs text-ink-faint dark:text-slate-500">{row.unit}</span>
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="font-semibold tabular-nums text-ink dark:text-slate-100">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (row) => (
        <span className="whitespace-nowrap text-ink-soft dark:text-slate-400">
          {formatDate(row.date)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} withDot />,
    },
    {
      key: 'paymentMode',
      header: 'Payment',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-ink-soft dark:text-slate-300">
          <FiCreditCard className="h-3.5 w-3.5 text-ink-faint dark:text-slate-500" />
          {row.paymentMode}
        </span>
      ),
    },
  ]

  /* ----- Header actions ----- */
  const headerActions = (
    <>
      <div className="hidden w-44 sm:block">
        <Select
          options={MONTH_OPTIONS}
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          aria-label="Select month"
        />
      </div>
      <Dropdown
        align="right"
        items={exportItems}
        trigger={
          <Button variant="outline" leftIcon={<FiDownload />} rightIcon={<FiChevronDown />}>
            Export
          </Button>
        }
      />
      <Button variant="primary" leftIcon={<FiPlus />} onClick={() => setRecordOpen(true)}>
        Record Sale
      </Button>
    </>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6"
    >
      <PageHeader
        title="Sales"
        subtitle="Track revenue, orders, and performance across every branch and product."
        icon={FiShoppingCart}
        actions={headerActions}
      />

      {/* ---------------- KPI cards ---------------- */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonKPI key={i} />)
        ) : (
          <>
            <KPICard
              label="Total Sales"
              value={kpis.totalSales}
              icon={FiShoppingCart}
              tone="brand"
            />
            <KPICard
              label="Total Revenue"
              value={formatCurrency(kpis.totalRevenue, { compact: true })}
              icon={FiDollarSign}
              tone="emerald"
            />
            <KPICard
              label="Conversion Rate"
              value={formatPercent(kpis.conversionRate)}
              icon={FiPercent}
              tone="violet"
            />
            <KPICard
              label="Avg Order Value"
              value={formatCurrency(kpis.avgOrderValue, { compact: true })}
              icon={FiShoppingBag}
              tone="amber"
            />
          </>
        )}
      </div>

      {/* ---------------- Revenue Overview ---------------- */}
      <ChartCard
        title="Revenue Overview"
        subtitle="Monthly sales against target"
        icon={FiTrendingUp}
        loading={loading}
        legend={
          <>
            <LegendDot color={CHART_COLORS[0]} label="Sales" />
            <LegendDot color={CHART_COLORS[6]} label="Target" />
          </>
        }
      >
        <AreaChartView
          data={charts.monthlySalesTrend}
          xKey="month"
          areas={[
            { key: 'sales', color: CHART_COLORS[0], name: 'Sales' },
            { key: 'target', color: CHART_COLORS[6], name: 'Target' },
          ]}
          tooltipFormatter={(v) => formatCurrency(v, { compact: true })}
        />
      </ChartCard>

      {/* ---------------- Top Products & Top Staff ---------------- */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        {/* Top Products */}
        <Card padding="md" className="flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20">
                <FiAward className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-display font-semibold text-ink dark:text-slate-100">
                  Top Products
                </h3>
                <p className="mt-0.5 text-sm text-ink-soft dark:text-slate-400">
                  Best performers by revenue share
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {topProducts.length === 0 ? (
              <EmptyState
                icon={FiPackage}
                title="No products yet"
                description="Product performance will appear here once sales are recorded."
                className="py-8"
              />
            ) : (
              topProducts.map((p, i) => {
                const share = totalProductRevenue ? (p.revenue / totalProductRevenue) * 100 : 0
                return (
                  <motion.div
                    key={p.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
                    className="group"
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-2xs font-bold',
                            i === 0
                              ? 'bg-brand-500 text-white'
                              : 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300',
                          )}
                        >
                          {i + 1}
                        </span>
                        <span className="truncate text-sm font-medium text-ink dark:text-slate-100">
                          {p.name}
                        </span>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-ink dark:text-slate-100">
                        {formatCurrency(p.revenue, { compact: true })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 pl-[2.125rem]">
                      <ProgressBar
                        value={p.revenue}
                        max={topProductMax || 1}
                        size="sm"
                        color="brand"
                        className="flex-1"
                      />
                      <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums text-ink-soft dark:text-slate-400">
                        {formatPercent(share, 0)}
                      </span>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </Card>

        {/* Top Staff */}
        <Card padding="md" className="flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20">
                <FiUsers className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-display font-semibold text-ink dark:text-slate-100">
                  Top Staff
                </h3>
                <p className="mt-0.5 text-sm text-ink-soft dark:text-slate-400">
                  Leading sales representatives
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-2.5">
            {staffSales.length === 0 ? (
              <EmptyState
                icon={FiUsers}
                title="No staff data"
                description="Staff sales performance will appear here once records are available."
                className="py-8"
              />
            ) : (
              staffSales.slice(0, 6).map((s, i) => (
                <motion.div
                  key={`${s.name}-${i}`}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
                  className="flex items-center gap-3 rounded-xl border border-transparent p-2 transition-colors hover:border-line hover:bg-surface-muted/60 dark:hover:border-slate-800 dark:hover:bg-slate-800/40"
                >
                  <div className="relative shrink-0">
                    <Avatar
                      name={s.name}
                      size="md"
                      color={AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]}
                    />
                    {i === 0 && (
                      <span className="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-amber-400 text-[9px] text-white ring-2 ring-white dark:ring-slate-900">
                        <FiAward className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink dark:text-slate-100">
                      {s.name}
                    </p>
                    <p className="truncate text-xs text-ink-soft dark:text-slate-400">{s.branch}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums text-ink dark:text-slate-100">
                      {formatCurrency(s.revenue, { compact: true })}
                    </p>
                    <p className="text-xs text-ink-faint dark:text-slate-500">
                      {formatNumber(s.orders)} orders
                    </p>
                  </div>
                  <div className="hidden w-24 shrink-0 sm:block">
                    <ProgressBar
                      value={s.revenue}
                      max={staffMax || 1}
                      size="sm"
                      color="brand"
                    />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* ---------------- Recent Sales table ---------------- */}
      <Card padding="md" className="flex flex-col">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20">
                <FiBarChart2 className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-display font-semibold text-ink dark:text-slate-100">
                  Recent Sales
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
            <div className="md:col-span-4">
              <SearchBar
                value={filters.search}
                onChange={handleSearch}
                placeholder="Search sales, customers, staff…"
              />
            </div>
            <div className="md:col-span-3">
              <Select
                options={BRANCH_FILTER_OPTIONS}
                value={filters.branch}
                onChange={handleFilter('branch')}
                aria-label="Filter by branch"
              />
            </div>
            <div className="md:col-span-3">
              <Select
                options={PRODUCT_FILTER_OPTIONS}
                value={filters.product}
                onChange={handleFilter('product')}
                aria-label="Filter by product"
              />
            </div>
            <div className="md:col-span-2">
              <Select
                options={SALE_STATUS_OPTIONS}
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
            emptyTitle="No sales found"
            emptyDescription="No sales match your current search and filters. Try clearing them to see all records."
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

      <RecordSaleModal open={recordOpen} onClose={() => setRecordOpen(false)} />
    </motion.div>
  )
}
