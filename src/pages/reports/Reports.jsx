import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiBarChart2,
  FiPieChart,
  FiTrendingUp,
  FiDollarSign,
  FiHome,
  FiUsers,
  FiTarget,
  FiAward,
  FiActivity,
  FiDownload,
  FiFileText,
  FiFilter,
  FiUserCheck,
  FiCheckCircle,
  FiPercent,
  FiShoppingBag,
} from 'react-icons/fi'

import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import Tabs from '@/components/ui/Tabs'
import StatusBadge from '@/components/ui/StatusBadge'
import ProgressBar from '@/components/ui/ProgressBar'
import AchievementBadge from '@/components/ui/AchievementBadge'
import KPICard from '@/components/cards/KPICard'
import ChartCard from '@/components/cards/ChartCard'
import DataTable from '@/components/data/DataTable'
import {
  AreaChartView,
  LineChartView,
  BarChartView,
  PieChartView,
} from '@/components/charts'

import { formatCurrency, formatNumber, formatPercent, formatDate } from '@/utils/format'
import { exportData } from '@/utils/export'
import { achievementStyleFromPct } from '@/utils/achievement'
import { CHART_COLORS } from '@/constants'
import { reportsApi } from '@/services/crm'

/* ------------------------------------------------------------------ */
/* Static filter option sets                                          */
/* ------------------------------------------------------------------ */

// The reports endpoint takes no filter params, so the filter row is a purely
// presentational scope picker. Branch labels are intentionally not sourced from
// any mock metric module — only the "all" sentinel is offered.
const BRANCH_FILTER_OPTIONS = [{ value: 'All', label: 'All Branches' }]

const RANGE_OPTIONS = [
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '180', label: 'Last 6 months' },
  { value: '365', label: 'Last 12 months' },
  { value: 'ytd', label: 'Year to date' },
]

const REPORT_TABS = [
  { key: 'lead', label: 'Lead', icon: <FiUsers /> },
  { key: 'sales', label: 'Sales', icon: <FiShoppingBag /> },
  { key: 'revenue', label: 'Revenue', icon: <FiDollarSign /> },
  { key: 'branch', label: 'Branch', icon: <FiHome /> },
  { key: 'staff', label: 'Staff', icon: <FiUserCheck /> },
  { key: 'target', label: 'Target', icon: <FiTarget /> },
  { key: 'incentive', label: 'Incentive', icon: <FiAward /> },
]

/* ------------------------------------------------------------------ */
/* Per-tab table column definitions (mapped onto backend row shapes)  */
/* ------------------------------------------------------------------ */

const REPORT_META = {
  lead: {
    name: 'actizo-lead-report',
    rowKey: (r) => r.refCode,
    columns: [
      { key: 'refCode', header: 'Lead ID', label: 'Lead ID' },
      { key: 'name', header: 'Name', label: 'Name' },
      { key: 'source', header: 'Source', label: 'Source' },
      { key: 'branchName', header: 'Branch', label: 'Branch' },
      { key: 'staffName', header: 'Owner', label: 'Owner' },
      { key: 'priority', header: 'Priority', label: 'Priority' },
      {
        key: 'status',
        header: 'Status',
        label: 'Status',
        render: (r) => <StatusBadge status={r.status} withDot />,
      },
      {
        key: 'value',
        header: 'Value',
        label: 'Value (₹)',
        align: 'right',
        render: (r) => (
          <span className="font-semibold tabular-nums text-ink dark:text-slate-100">
            {formatCurrency(r.value || 0, { compact: true })}
          </span>
        ),
      },
      {
        key: 'createdDate',
        header: 'Created',
        label: 'Created',
        render: (r) => (
          <span className="whitespace-nowrap text-ink-soft dark:text-slate-400">
            {r.createdDate ? formatDate(r.createdDate) : '—'}
          </span>
        ),
      },
    ],
  },
  sales: {
    name: 'actizo-sales-report',
    rowKey: (r) => r.refCode,
    columns: [
      { key: 'refCode', header: 'Sale ID', label: 'Sale ID' },
      { key: 'customer', header: 'Customer', label: 'Customer' },
      { key: 'product', header: 'Product', label: 'Product' },
      { key: 'branchName', header: 'Branch', label: 'Branch' },
      {
        key: 'amount',
        header: 'Amount',
        label: 'Amount (₹)',
        align: 'right',
        render: (r) => (
          <span className="font-semibold tabular-nums text-ink dark:text-slate-100">
            {formatCurrency(r.amount || 0)}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        label: 'Status',
        render: (r) => <StatusBadge status={r.status} withDot />,
      },
      {
        key: 'date',
        header: 'Date',
        label: 'Date',
        render: (r) => (
          <span className="whitespace-nowrap text-ink-soft dark:text-slate-400">
            {r.date ? formatDate(r.date) : '—'}
          </span>
        ),
      },
    ],
  },
  revenue: {
    name: 'actizo-revenue-report',
    rowKey: (r) => r.month ?? r.id,
    columns: [
      { key: 'month', header: 'Month', label: 'Month' },
      {
        key: 'revenue',
        header: 'Revenue',
        label: 'Revenue (₹)',
        align: 'right',
        render: (r) => (
          <span className="font-semibold tabular-nums text-ink dark:text-slate-100">
            {formatCurrency(r.revenue || 0, { compact: true })}
          </span>
        ),
      },
      {
        key: 'profit',
        header: 'Profit',
        label: 'Profit (₹)',
        align: 'right',
        render: (r) => (
          <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(r.profit || 0, { compact: true })}
          </span>
        ),
      },
      {
        key: 'margin',
        header: 'Margin',
        label: 'Margin %',
        align: 'right',
        render: (r) => {
          const margin = r.revenue ? ((r.profit || 0) / r.revenue) * 100 : 0
          return (
            <span className="tabular-nums text-ink dark:text-slate-200">
              {formatPercent(margin)}
            </span>
          )
        },
      },
    ],
  },
  branch: {
    name: 'actizo-branch-report',
    rowKey: (r) => r.name,
    columns: [
      { key: 'name', header: 'Branch', label: 'Branch' },
      { key: 'city', header: 'City', label: 'City' },
      { key: 'region', header: 'Region', label: 'Region' },
      {
        key: 'totalRevenue',
        header: 'Revenue',
        label: 'Total Revenue (₹)',
        align: 'right',
        render: (r) => (
          <span className="font-semibold tabular-nums text-ink dark:text-slate-100">
            {formatCurrency(r.totalRevenue || 0, { compact: true })}
          </span>
        ),
      },
      {
        key: 'conversionRate',
        header: 'Conversion',
        label: 'Conversion %',
        align: 'right',
        render: (r) => (
          <span className="tabular-nums text-ink dark:text-slate-200">
            {formatPercent(r.conversionRate || 0)}
          </span>
        ),
      },
      {
        key: 'targetAchievement',
        header: 'Achievement',
        label: 'Achievement %',
        align: 'right',
        render: (r) => {
          const pct = r.targetAchievement || 0
          const style = achievementStyleFromPct(pct)
          return (
            <div className="flex items-center justify-end gap-2.5">
              <div className="hidden w-20 sm:block">
                <ProgressBar value={pct} color={style.bar} size="sm" />
              </div>
              <span className={`w-12 text-right text-sm font-semibold tabular-nums ${style.text}`}>
                {formatPercent(pct, 0)}
              </span>
            </div>
          )
        },
      },
    ],
  },
  staff: {
    name: 'actizo-staff-report',
    rowKey: (r) => r.name,
    columns: [
      { key: 'name', header: 'Staff', label: 'Staff' },
      { key: 'role', header: 'Role', label: 'Role' },
      { key: 'branchName', header: 'Branch', label: 'Branch' },
      {
        key: 'conversionRate',
        header: 'Conversion',
        label: 'Conversion %',
        align: 'right',
        render: (r) => (
          <span className="tabular-nums text-ink dark:text-slate-200">
            {formatPercent(r.conversionRate || 0)}
          </span>
        ),
      },
      {
        key: 'revenue',
        header: 'Revenue',
        label: 'Revenue (₹)',
        align: 'right',
        render: (r) => (
          <span className="font-semibold tabular-nums text-ink dark:text-slate-100">
            {formatCurrency(r.revenue || 0, { compact: true })}
          </span>
        ),
      },
      {
        key: 'performanceScore',
        header: 'Score',
        label: 'Performance Score',
        align: 'right',
        render: (r) => (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300">
            {formatNumber(r.performanceScore || 0)}
          </span>
        ),
      },
    ],
  },
  target: {
    name: 'actizo-target-report',
    rowKey: (r) => `${r.product ?? r.objective ?? ''}-${r.period ?? ''}`,
    columns: [
      { key: 'product', header: 'Objective', label: 'Objective' },
      {
        key: 'scope',
        header: 'Type',
        label: 'Type',
        render: (r) => (
          <span className="whitespace-nowrap text-ink-soft dark:text-slate-300">{r.scope || '—'}</span>
        ),
      },
      { key: 'branchName', header: 'Branch', label: 'Branch' },
      {
        key: 'targetQty',
        header: 'Target',
        label: 'Target',
        align: 'right',
        render: (r) => (
          <span className="tabular-nums text-ink-soft dark:text-slate-300">
            {formatNumber(r.targetQty || 0)}
          </span>
        ),
      },
      {
        key: 'achievedQty',
        header: 'Achieved',
        label: 'Achieved',
        align: 'right',
        render: (r) => (
          <span className="font-semibold tabular-nums text-ink dark:text-slate-100">
            {formatNumber(r.achievedQty || 0)}
          </span>
        ),
      },
      {
        key: 'completion',
        header: 'Completion',
        label: 'Completion %',
        align: 'right',
        render: (r) => {
          const pct = r.completion || 0
          const style = achievementStyleFromPct(pct)
          return (
            <div className="flex items-center justify-end gap-2.5">
              <div className="hidden w-20 sm:block">
                <ProgressBar value={pct} color={style.bar} size="sm" />
              </div>
              <span className={`w-14 text-right text-sm font-semibold tabular-nums ${style.text}`}>
                {formatPercent(pct, 0)}
              </span>
            </div>
          )
        },
      },
      {
        key: 'status',
        header: 'Status',
        label: 'Status',
        render: (r) => <AchievementBadge pct={r.completion || 0} withLabel />,
      },
    ],
  },
  incentive: {
    name: 'actizo-incentive-report',
    rowKey: (r) => `${r.staffName ?? ''}-${r.month ?? ''}`,
    columns: [
      { key: 'staffName', header: 'Staff', label: 'Staff' },
      { key: 'branchName', header: 'Branch', label: 'Branch' },
      { key: 'month', header: 'Month', label: 'Month' },
      {
        key: 'total',
        header: 'Total',
        label: 'Total Incentive (₹)',
        align: 'right',
        render: (r) => (
          <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(r.total || 0)}
          </span>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        label: 'Type',
        render: (r) => (
          <span className="whitespace-nowrap text-ink-soft dark:text-slate-300">{r.type || '—'}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        label: 'Status',
        render: (r) => <StatusBadge status={r.status} withDot />,
      },
    ],
  },
}

/* ------------------------------------------------------------------ */
/* Small presentational helpers                                       */
/* ------------------------------------------------------------------ */

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft dark:text-slate-400">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

function SectionHeading({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h3 className="text-base font-display font-semibold text-ink dark:text-slate-100">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-sm text-ink-soft dark:text-slate-400">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function Reports() {
  const [activeTab, setActiveTab] = useState('lead')
  const [range, setRange] = useState('90')
  const [branch, setBranch] = useState('All')

  // Live report fetched from the backend for the active tab/type.
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch on mount + whenever the selected report type changes. The backend
  // `:type` names match REPORT_TABS keys exactly (lead/sales/revenue/branch/
  // staff/target/incentive), so no key remap is required.
  useEffect(() => {
    let active = true
    setLoading(true)
    setReport(null)
    reportsApi
      .get(activeTab)
      .then(({ data }) => {
        if (active) setReport(data)
      })
      .catch(() => {
        if (active) setReport(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [activeTab])

  /* -------------------------------------------------------------- */
  /* Safe accessors onto the fetched report                          */
  /* -------------------------------------------------------------- */

  const summary = report?.summary || {}
  const charts = report?.charts || {}
  const rows = report?.rows || []

  const activeMeta = REPORT_META[activeTab]
  const activeTabMeta = REPORT_TABS.find((t) => t.key === activeTab)

  // Lead pipeline pie — colour each status slice from the chart palette.
  const leadByStatus = useMemo(
    () =>
      (charts.byStatus || []).map((s, i) => ({
        name: s.name,
        value: s.value || 0,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      })),
    [charts.byStatus],
  )

  /* -------------------------------------------------------------- */
  /* Export — uses the active report's exact rows + labelled columns */
  /* -------------------------------------------------------------- */

  const runExport = (format) => {
    const exportColumns = activeMeta.columns.map((c) => ({
      key: c.key,
      label: c.label || c.header,
    }))
    exportData(format, rows, activeMeta.name, exportColumns)
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs font-medium text-ink-faint dark:text-slate-500 lg:inline">
        Export report
      </span>
      <div className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white p-1 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<FiFileText />}
          onClick={() => runExport('pdf')}
        >
          PDF
        </Button>
        <span className="h-5 w-px bg-line dark:bg-slate-700" />
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<FiDownload />}
          onClick={() => runExport('excel')}
        >
          Excel
        </Button>
        <span className="h-5 w-px bg-line dark:bg-slate-700" />
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<FiDownload />}
          onClick={() => runExport('csv')}
        >
          CSV
        </Button>
      </div>
    </div>
  )

  /* -------------------------------------------------------------- */
  /* Per-tab content blocks (summary cards + charts)                 */
  /* -------------------------------------------------------------- */

  const TAB_CONTENT = {
    /* ----------------------------- LEAD ----------------------------- */
    lead: (
      <>
        <KpiGrid>
          <KPICard label="Total Leads" value={summary.total || 0} icon={FiUsers} tone="brand" />
          <KPICard label="Won Leads" value={summary.won || 0} icon={FiCheckCircle} tone="emerald" />
          <KPICard label="Lost Leads" value={summary.lost || 0} icon={FiActivity} tone="amber" />
          <KPICard
            label="Conversion Rate"
            value={formatPercent(summary.total ? ((summary.won || 0) / summary.total) * 100 : 0)}
            icon={FiPercent}
            tone="violet"
          />
        </KpiGrid>

        <ChartCard
          title="Lead Pipeline"
          subtitle="Distribution of leads across the pipeline"
          icon={FiPieChart}
          loading={loading}
        >
          <PieChartView data={leadByStatus} dataKey="value" nameKey="name" />
        </ChartCard>
      </>
    ),

    /* ----------------------------- SALES ----------------------------- */
    sales: (
      <>
        <KpiGrid>
          <KPICard label="Total Sales" value={summary.totalSales || 0} icon={FiShoppingBag} tone="brand" />
          <KPICard
            label="Total Revenue"
            value={formatCurrency(summary.totalRevenue || 0, { compact: true })}
            icon={FiDollarSign}
            tone="emerald"
          />
        </KpiGrid>

        <ChartCard
          title="Revenue by Product"
          subtitle="Completed sales revenue per product"
          icon={FiBarChart2}
          loading={loading}
          legend={<LegendDot color={CHART_COLORS[0]} label="Revenue" />}
        >
          <BarChartView
            data={charts.byProduct || []}
            xKey="name"
            bars={[{ key: 'value', color: CHART_COLORS[0], name: 'Revenue' }]}
            tooltipFormatter={(v) => formatCurrency(v, { compact: true })}
          />
        </ChartCard>
      </>
    ),

    /* ---------------------------- REVENUE ---------------------------- */
    revenue: (
      <>
        <KpiGrid>
          <KPICard
            label="Total Revenue"
            value={formatCurrency(summary.revenue || 0, { compact: true })}
            icon={FiDollarSign}
            tone="brand"
          />
          <KPICard
            label="Net Profit"
            value={formatCurrency(summary.profit || 0, { compact: true })}
            icon={FiTrendingUp}
            tone="emerald"
          />
          <KPICard
            label="Profit Margin"
            value={formatPercent(summary.revenue ? ((summary.profit || 0) / summary.revenue) * 100 : 0)}
            icon={FiPercent}
            tone="violet"
          />
        </KpiGrid>

        <ChartCard
          title="Revenue Overview"
          subtitle="Monthly revenue versus profit"
          icon={FiBarChart2}
          loading={loading}
          legend={
            <>
              <LegendDot color={CHART_COLORS[0]} label="Revenue" />
              <LegendDot color={CHART_COLORS[6]} label="Profit" />
            </>
          }
        >
          <AreaChartView
            data={charts.trend || []}
            xKey="month"
            areas={[
              { key: 'revenue', color: CHART_COLORS[0], name: 'Revenue' },
              { key: 'profit', color: CHART_COLORS[6], name: 'Profit' },
            ]}
            tooltipFormatter={(v) => formatCurrency(v, { compact: true })}
          />
        </ChartCard>
      </>
    ),

    /* ---------------------------- BRANCH ----------------------------- */
    branch: (
      <>
        <KpiGrid>
          <KPICard label="Total Branches" value={summary.branches || 0} icon={FiHome} tone="brand" />
          <KPICard
            label="Network Revenue"
            value={formatCurrency(summary.totalRevenue || 0, { compact: true })}
            icon={FiDollarSign}
            tone="emerald"
          />
        </KpiGrid>

        <ChartCard
          title="Branch Performance"
          subtitle="Monthly revenue by branch"
          icon={FiBarChart2}
          loading={loading}
          legend={<LegendDot color={CHART_COLORS[0]} label="Revenue" />}
        >
          <BarChartView
            data={charts.revenue || []}
            xKey="name"
            bars={[{ key: 'value', color: CHART_COLORS[0], name: 'Revenue' }]}
            tooltipFormatter={(v) => formatCurrency(v, { compact: true })}
          />
        </ChartCard>
      </>
    ),

    /* ----------------------------- STAFF ----------------------------- */
    staff: (
      <>
        <KpiGrid>
          <KPICard label="Total Staff" value={summary.staff || 0} icon={FiUsers} tone="brand" />
          <KPICard
            label="Total Revenue"
            value={formatCurrency(summary.totalRevenue || 0, { compact: true })}
            icon={FiDollarSign}
            tone="emerald"
          />
        </KpiGrid>

        <ChartCard
          title="Top Staff by Revenue"
          subtitle="Leading sales representatives"
          icon={FiBarChart2}
          loading={loading}
          legend={<LegendDot color={CHART_COLORS[0]} label="Revenue" />}
        >
          <BarChartView
            data={charts.topByRevenue || []}
            xKey="name"
            bars={[{ key: 'value', color: CHART_COLORS[0], name: 'Revenue' }]}
            tooltipFormatter={(v) => formatCurrency(v, { compact: true })}
          />
        </ChartCard>
      </>
    ),

    /* ---------------------------- TARGET ----------------------------- */
    target: (
      <>
        <KpiGrid>
          <KPICard label="Total Targets" value={summary.total || 0} icon={FiTarget} tone="brand" />
          <KPICard label="Achieved" value={summary.achieved || 0} icon={FiCheckCircle} tone="emerald" />
        </KpiGrid>

        <ChartCard
          title="Target vs Achievement"
          subtitle="Quantity targets by product"
          icon={FiBarChart2}
          loading={loading}
          legend={
            <>
              <LegendDot color={CHART_COLORS[2]} label="Target" />
              <LegendDot color="#3b82f6" label="Achieved" />
            </>
          }
        >
          <BarChartView
            data={charts.completion || []}
            xKey="name"
            horizontal
            bars={[
              { key: 'target', color: CHART_COLORS[2], name: 'Target' },
              { key: 'achieved', color: '#3b82f6', name: 'Achieved' },
            ]}
          />
        </ChartCard>
      </>
    ),

    /* --------------------------- INCENTIVE --------------------------- */
    incentive: (
      <>
        <KpiGrid>
          <KPICard
            label="Total Incentives"
            value={formatCurrency(summary.total || 0, { compact: true })}
            icon={FiAward}
            tone="brand"
          />
          <KPICard label="Paid Records" value={summary.paid || 0} icon={FiCheckCircle} tone="emerald" />
        </KpiGrid>

        <ChartCard
          title="Incentives by Branch"
          subtitle="Company-wide incentive payouts per branch"
          icon={FiTrendingUp}
          loading={loading}
          legend={<LegendDot color={CHART_COLORS[0]} label="Incentive" />}
        >
          <LineChartView
            data={charts.byBranch || []}
            xKey="name"
            lines={[{ key: 'value', color: CHART_COLORS[0], name: 'Incentive' }]}
            tooltipFormatter={(v) => formatCurrency(v, { compact: true })}
          />
        </ChartCard>
      </>
    ),
  }

  /* -------------------------------------------------------------- */
  /* Render                                                          */
  /* -------------------------------------------------------------- */

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6"
    >
      <PageHeader
        title="Reports & Analytics"
        subtitle="Explore performance insights across leads, sales, revenue, branches, staff, and more."
        icon={FiBarChart2}
        actions={headerActions}
      />

      {/* ---------- Filter row ---------- */}
      <Card padding="md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-2.5 text-sm font-medium text-ink-soft dark:text-slate-400">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20">
              <FiFilter className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink dark:text-slate-100">Report Filters</p>
              <p className="text-xs text-ink-faint dark:text-slate-500">
                Refine the analytics window and scope
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5 lg:w-[28rem]">
            <Select
              options={RANGE_OPTIONS}
              value={range}
              onChange={(e) => setRange(e.target.value)}
              aria-label="Select date range"
            />
            <Select
              options={BRANCH_FILTER_OPTIONS}
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              aria-label="Filter by branch"
            />
          </div>
        </div>
      </Card>

      {/* ---------- Category tabs ---------- */}
      <Tabs tabs={REPORT_TABS} active={activeTab} onChange={setActiveTab} variant="underline" />

      {/* ---------- Animated tab body ---------- */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="space-y-6"
        >
          {TAB_CONTENT[activeTab]}

          {/* ---------- Data table preview ---------- */}
          <Card padding="md" className="flex flex-col">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SectionHeading
                icon={activeTabMeta?.key === 'incentive' ? FiAward : FiFileText}
                title={`${activeTabMeta?.label} Report`}
                subtitle={`${formatNumber(rows.length)} record${rows.length === 1 ? '' : 's'} in this preview`}
              />
              <div className="flex items-center gap-1.5 rounded-xl border border-line bg-surface-muted/60 p-1 dark:border-slate-800 dark:bg-slate-800/40">
                <Button variant="ghost" size="sm" leftIcon={<FiFileText />} onClick={() => runExport('pdf')}>
                  PDF
                </Button>
                <Button variant="ghost" size="sm" leftIcon={<FiDownload />} onClick={() => runExport('excel')}>
                  Excel
                </Button>
                <Button variant="ghost" size="sm" leftIcon={<FiDownload />} onClick={() => runExport('csv')}>
                  CSV
                </Button>
              </div>
            </div>

            <div className="mt-5">
              <DataTable
                columns={activeMeta.columns}
                data={rows}
                loading={loading}
                rowKey={activeMeta.rowKey}
                emptyIcon={FiFilter}
                emptyTitle="No data available"
                emptyDescription="There are no records to display for this report yet."
              />
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Layout primitives (local)                                          */
/* ------------------------------------------------------------------ */

function KpiGrid({ children }) {
  return <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{children}</div>
}
