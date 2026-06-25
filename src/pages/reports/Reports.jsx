import { useMemo, useState } from 'react'
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
  FiCalendar,
  FiFilter,
  FiUserCheck,
  FiUserPlus,
  FiCheckCircle,
  FiPercent,
  FiShoppingBag,
  FiZap,
  FiUser,
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

/* ---- data modules ---- */
import {
  leads,
  leadCountsByStatus,
  LEAD_STATUSES,
} from '@/data/leads'
import {
  sales,
  totalSales,
  totalRevenue,
  monthlyRevenue,
  avgOrderValue,
  revenueTrend,
  staffSales,
} from '@/data/sales'
import { branches, branchOptions } from '@/data/branches'
import { staff, topPerformers } from '@/data/staff'
import {
  generalTargets,
  specialTargets,
  targetSummary,
} from '@/data/targets'
import {
  incentives,
  totalIncentives,
  highestIncentive,
  topPerformer,
  incentiveTrend,
} from '@/data/incentives'
import { financeKpis, monthlyOverview } from '@/data/finance'

/* ------------------------------------------------------------------ */
/* Static filter option sets                                          */
/* ------------------------------------------------------------------ */

const BRANCH_FILTER_OPTIONS = [{ value: 'All', label: 'All Branches' }, ...branchOptions]

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

  /* -------------------------------------------------------------- */
  /* Per-domain derived datasets (memoised)                          */
  /* -------------------------------------------------------------- */

  // Lead — pipeline distribution by status
  const leadByStatus = useMemo(
    () =>
      LEAD_STATUSES.map((s, i) => ({
        name: s,
        value: leadCountsByStatus[s] || 0,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      })),
    [],
  )

  const wonLeadCount = leadCountsByStatus.Won || 0
  const leadConversion = leads.length ? (wonLeadCount / leads.length) * 100 : 0
  const wonValue = useMemo(
    () => leads.filter((l) => l.status === 'Won').reduce((s, l) => s + l.value, 0),
    [],
  )

  // Branch — total network revenue
  const totalBranchRevenue = useMemo(
    () => branches.reduce((s, b) => s + b.totalRevenue, 0),
    [],
  )

  // Staff — top performers by revenue
  const topStaffRevenue = useMemo(
    () => staffSales.slice(0, 8).map((s) => ({ name: s.name.split(' ')[0], revenue: s.revenue })),
    [],
  )

  // Target — target vs achievement by product
  const targetVsAchievement = useMemo(
    () =>
      generalTargets.slice(0, 8).map((t) => ({
        name: t.product,
        target: t.targetQty,
        achieved: t.achievedQty,
      })),
    [],
  )

  /* -------------------------------------------------------------- */
  /* Report registry — each tab maps to a table dataset + columns   */
  /* -------------------------------------------------------------- */

  const REPORTS = useMemo(
    () => ({
      lead: {
        name: 'actizo-lead-report',
        rows: leads.slice(0, 12).map((l) => ({
          id: l.id,
          name: l.name,
          company: l.company || '—',
          source: l.source,
          branchName: l.branchName,
          staffName: l.staffName,
          status: l.status,
          priority: l.priority,
          value: l.value,
          createdDate: l.createdDate,
        })),
        columns: [
          { key: 'id', header: 'Lead ID', label: 'Lead ID' },
          { key: 'name', header: 'Name', label: 'Name' },
          { key: 'company', header: 'Company', label: 'Company' },
          { key: 'source', header: 'Source', label: 'Source' },
          { key: 'branchName', header: 'Branch', label: 'Branch' },
          { key: 'staffName', header: 'Owner', label: 'Owner' },
          {
            key: 'status',
            header: 'Status',
            label: 'Status',
            render: (r) => <StatusBadge status={r.status} withDot />,
          },
          {
            key: 'value',
            header: 'Value',
            label: 'Value (AED)',
            align: 'right',
            render: (r) => (
              <span className="font-semibold tabular-nums text-ink dark:text-slate-100">
                {formatCurrency(r.value, { compact: true })}
              </span>
            ),
          },
          {
            key: 'createdDate',
            header: 'Created',
            label: 'Created',
            render: (r) => (
              <span className="whitespace-nowrap text-ink-soft dark:text-slate-400">
                {formatDate(r.createdDate)}
              </span>
            ),
          },
        ],
      },
      sales: {
        name: 'actizo-sales-report',
        rows: sales.slice(0, 12).map((s) => ({
          id: s.id,
          customer: s.customer,
          product: s.product,
          branchName: s.branchName,
          staffName: s.staffName,
          quantity: s.quantity,
          unit: s.unit,
          amount: s.amount,
          status: s.status,
          date: s.date,
        })),
        columns: [
          { key: 'id', header: 'Sale ID', label: 'Sale ID' },
          { key: 'customer', header: 'Customer', label: 'Customer' },
          { key: 'product', header: 'Product', label: 'Product' },
          { key: 'branchName', header: 'Branch', label: 'Branch' },
          { key: 'staffName', header: 'Staff', label: 'Staff' },
          {
            key: 'quantity',
            header: 'Qty',
            label: 'Quantity',
            align: 'right',
            render: (r) => (
              <span className="tabular-nums text-ink dark:text-slate-200">
                {formatNumber(r.quantity)}
                <span className="ml-1 text-xs text-ink-faint dark:text-slate-500">{r.unit}</span>
              </span>
            ),
          },
          {
            key: 'amount',
            header: 'Amount',
            label: 'Amount (AED)',
            align: 'right',
            render: (r) => (
              <span className="font-semibold tabular-nums text-ink dark:text-slate-100">
                {formatCurrency(r.amount)}
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
                {formatDate(r.date)}
              </span>
            ),
          },
        ],
      },
      revenue: {
        name: 'actizo-revenue-report',
        rows: monthlyOverview.map((m) => ({
          month: m.month,
          revenue: m.revenue,
          expense: m.expense,
          profit: m.profit,
          margin: m.revenue ? (m.profit / m.revenue) * 100 : 0,
        })),
        columns: [
          { key: 'month', header: 'Month', label: 'Month' },
          {
            key: 'revenue',
            header: 'Revenue',
            label: 'Revenue (AED)',
            align: 'right',
            render: (r) => (
              <span className="font-semibold tabular-nums text-ink dark:text-slate-100">
                {formatCurrency(r.revenue, { compact: true })}
              </span>
            ),
          },
          {
            key: 'expense',
            header: 'Expense',
            label: 'Expense (AED)',
            align: 'right',
            render: (r) => (
              <span className="tabular-nums text-ink-soft dark:text-slate-300">
                {formatCurrency(r.expense, { compact: true })}
              </span>
            ),
          },
          {
            key: 'profit',
            header: 'Profit',
            label: 'Profit (AED)',
            align: 'right',
            render: (r) => (
              <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatCurrency(r.profit, { compact: true })}
              </span>
            ),
          },
          {
            key: 'margin',
            header: 'Margin',
            label: 'Margin %',
            align: 'right',
            render: (r) => (
              <span className="tabular-nums text-ink dark:text-slate-200">
                {formatPercent(r.margin)}
              </span>
            ),
          },
        ],
      },
      branch: {
        name: 'actizo-branch-report',
        rows: branches.map((b) => ({
          code: b.code,
          name: b.name,
          region: b.region,
          manager: b.manager,
          staffCount: b.staffCount,
          totalRevenue: b.totalRevenue,
          targetAchievement: b.targetAchievement,
          status: b.status === 'active' ? 'Active' : b.status,
        })),
        columns: [
          {
            key: 'code',
            header: 'Code',
            label: 'Code',
            render: (r) => (
              <span className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">
                {r.code}
              </span>
            ),
          },
          { key: 'name', header: 'Branch', label: 'Branch' },
          { key: 'region', header: 'Region', label: 'Region' },
          { key: 'manager', header: 'Manager', label: 'Manager' },
          {
            key: 'staffCount',
            header: 'Staff',
            label: 'Staff',
            align: 'right',
            render: (r) => <span className="tabular-nums">{r.staffCount}</span>,
          },
          {
            key: 'totalRevenue',
            header: 'Revenue',
            label: 'Total Revenue (AED)',
            align: 'right',
            render: (r) => (
              <span className="font-semibold tabular-nums text-ink dark:text-slate-100">
                {formatCurrency(r.totalRevenue, { compact: true })}
              </span>
            ),
          },
          {
            key: 'targetAchievement',
            header: 'Achievement',
            label: 'Achievement %',
            align: 'right',
            render: (r) => {
              const style = achievementStyleFromPct(r.targetAchievement)
              return (
                <div className="flex items-center justify-end gap-2.5">
                  <div className="hidden w-20 sm:block">
                    <ProgressBar value={r.targetAchievement} color={style.bar} size="sm" />
                  </div>
                  <span className={`w-12 text-right text-sm font-semibold tabular-nums ${style.text}`}>
                    {formatPercent(r.targetAchievement, 0)}
                  </span>
                </div>
              )
            },
          },
          {
            key: 'status',
            header: 'Status',
            label: 'Status',
            render: (r) => <StatusBadge status={r.status} withDot />,
          },
        ],
      },
      staff: {
        name: 'actizo-staff-report',
        rows: topPerformers.slice(0, 12).map((s) => ({
          id: s.id,
          name: s.name,
          role: s.role,
          branchName: s.branchName,
          assignedLeads: s.assignedLeads,
          wonLeads: s.wonLeads,
          conversionRate: s.conversionRate,
          revenue: s.revenue,
          performanceScore: s.performanceScore,
        })),
        columns: [
          { key: 'name', header: 'Staff', label: 'Staff' },
          { key: 'role', header: 'Role', label: 'Role' },
          { key: 'branchName', header: 'Branch', label: 'Branch' },
          {
            key: 'wonLeads',
            header: 'Won',
            label: 'Won Leads',
            align: 'right',
            render: (r) => (
              <span className="tabular-nums text-ink dark:text-slate-200">
                {r.wonLeads}
                <span className="text-ink-faint dark:text-slate-500"> / {r.assignedLeads}</span>
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
                {formatPercent(r.conversionRate)}
              </span>
            ),
          },
          {
            key: 'revenue',
            header: 'Revenue',
            label: 'Revenue (AED)',
            align: 'right',
            render: (r) => (
              <span className="font-semibold tabular-nums text-ink dark:text-slate-100">
                {formatCurrency(r.revenue, { compact: true })}
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
                {formatNumber(r.performanceScore)}
              </span>
            ),
          },
        ],
      },
      target: {
        name: 'actizo-target-report',
        rows: [
          ...generalTargets.slice(0, 6).map((t) => ({
            id: t.id,
            objective: t.product,
            scope: t.scope,
            owner: t.scope === 'Staff' ? t.staffName : t.branchName,
            target: `${formatNumber(t.targetQty)} ${t.unit}`,
            achieved: `${formatNumber(t.achievedQty)} ${t.unit}`,
            completion: t.completion,
            status: t.status,
          })),
          ...specialTargets.slice(0, 4).map((t) => ({
            id: t.id,
            objective: t.name,
            scope: t.type,
            owner: t.branchName,
            target: formatCurrency(t.targetValue, { compact: true }),
            achieved: formatCurrency(t.achievedValue, { compact: true }),
            completion: t.completion,
            status: t.status,
          })),
        ],
        columns: [
          { key: 'objective', header: 'Objective', label: 'Objective' },
          {
            key: 'scope',
            header: 'Type',
            label: 'Type',
            render: (r) => (
              <span className="whitespace-nowrap text-ink-soft dark:text-slate-300">{r.scope}</span>
            ),
          },
          { key: 'owner', header: 'Owner', label: 'Owner' },
          {
            key: 'target',
            header: 'Target',
            label: 'Target',
            align: 'right',
            render: (r) => <span className="tabular-nums text-ink-soft dark:text-slate-300">{r.target}</span>,
          },
          {
            key: 'achieved',
            header: 'Achieved',
            label: 'Achieved',
            align: 'right',
            render: (r) => (
              <span className="font-semibold tabular-nums text-ink dark:text-slate-100">{r.achieved}</span>
            ),
          },
          {
            key: 'completion',
            header: 'Completion',
            label: 'Completion %',
            align: 'right',
            render: (r) => {
              const style = achievementStyleFromPct(r.completion)
              return (
                <div className="flex items-center justify-end gap-2.5">
                  <div className="hidden w-20 sm:block">
                    <ProgressBar value={r.completion} color={style.bar} size="sm" />
                  </div>
                  <span className={`w-14 text-right text-sm font-semibold tabular-nums ${style.text}`}>
                    {formatPercent(r.completion, 0)}
                  </span>
                </div>
              )
            },
          },
          {
            key: 'status',
            header: 'Status',
            label: 'Status',
            render: (r) => <AchievementBadge pct={r.completion} withLabel />,
          },
        ],
      },
      incentive: {
        name: 'actizo-incentive-report',
        rows: incentives.slice(0, 12).map((i) => ({
          id: i.id,
          staffName: i.staffName,
          branchName: i.branchName,
          month: i.month,
          baseSales: i.baseSales,
          incentiveRate: i.incentiveRate,
          bonus: i.bonus,
          total: i.total,
          type: i.type,
          status: i.status,
        })),
        columns: [
          { key: 'staffName', header: 'Staff', label: 'Staff' },
          { key: 'branchName', header: 'Branch', label: 'Branch' },
          {
            key: 'baseSales',
            header: 'Base Sales',
            label: 'Base Sales (AED)',
            align: 'right',
            render: (r) => (
              <span className="tabular-nums text-ink-soft dark:text-slate-300">
                {formatCurrency(r.baseSales, { compact: true })}
              </span>
            ),
          },
          {
            key: 'incentiveRate',
            header: 'Rate',
            label: 'Rate %',
            align: 'right',
            render: (r) => (
              <span className="tabular-nums text-ink dark:text-slate-200">{formatPercent(r.incentiveRate)}</span>
            ),
          },
          {
            key: 'bonus',
            header: 'Bonus',
            label: 'Bonus (AED)',
            align: 'right',
            render: (r) => (
              <span className="tabular-nums text-ink-soft dark:text-slate-300">
                {r.bonus ? formatCurrency(r.bonus) : '—'}
              </span>
            ),
          },
          {
            key: 'total',
            header: 'Total',
            label: 'Total Incentive (AED)',
            align: 'right',
            render: (r) => (
              <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatCurrency(r.total)}
              </span>
            ),
          },
          {
            key: 'type',
            header: 'Type',
            label: 'Type',
            render: (r) => (
              <span className="whitespace-nowrap text-ink-soft dark:text-slate-300">{r.type}</span>
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
    }),
    [],
  )

  const activeReport = REPORTS[activeTab]

  /* -------------------------------------------------------------- */
  /* Export — uses the active report's exact rows + labelled columns */
  /* -------------------------------------------------------------- */

  const runExport = (format) => {
    const exportColumns = activeReport.columns.map((c) => ({
      key: c.key,
      label: c.label || c.header,
    }))
    exportData(format, activeReport.rows, activeReport.name, exportColumns)
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
  /* Per-tab content blocks                                          */
  /* -------------------------------------------------------------- */

  const TAB_CONTENT = {
    /* ----------------------------- LEAD ----------------------------- */
    lead: (
      <>
        <KpiGrid>
          <KPICard label="Total Leads" value={leads.length} delta={12.4} icon={FiUsers} tone="brand" />
          <KPICard
            label="Won Leads"
            value={wonLeadCount}
            delta={16.8}
            icon={FiCheckCircle}
            tone="emerald"
          />
          <KPICard
            label="Conversion Rate"
            value={formatPercent(leadConversion)}
            delta={2.3}
            icon={FiPercent}
            tone="violet"
          />
          <KPICard
            label="Won Pipeline Value"
            value={formatCurrency(wonValue, { compact: true })}
            delta={9.1}
            icon={FiDollarSign}
            tone="sky"
          />
        </KpiGrid>

        <ChartCard
          title="Lead Pipeline"
          subtitle="Distribution of leads across the pipeline"
          icon={FiPieChart}
        >
          <PieChartView data={leadByStatus} dataKey="value" nameKey="name" />
        </ChartCard>
      </>
    ),

    /* ----------------------------- SALES ----------------------------- */
    sales: (
      <>
        <KpiGrid>
          <KPICard label="Total Sales" value={totalSales} delta={9.4} icon={FiShoppingBag} tone="brand" />
          <KPICard
            label="Total Revenue"
            value={formatCurrency(totalRevenue, { compact: true })}
            delta={12.8}
            icon={FiDollarSign}
            tone="emerald"
          />
          <KPICard
            label="Monthly Revenue"
            value={formatCurrency(monthlyRevenue, { compact: true })}
            delta={6.1}
            icon={FiCalendar}
            tone="sky"
          />
          <KPICard
            label="Avg Order Value"
            value={formatCurrency(avgOrderValue, { compact: true })}
            delta={-1.5}
            icon={FiActivity}
            tone="amber"
          />
        </KpiGrid>

        <ChartCard
          title="Revenue Overview"
          subtitle="Monthly sales against target"
          icon={FiTrendingUp}
          legend={
            <>
              <LegendDot color={CHART_COLORS[0]} label="Revenue" />
              <LegendDot color={CHART_COLORS[6]} label="Target" />
            </>
          }
        >
          <AreaChartView
            data={revenueTrend}
            xKey="month"
            areas={[
              { key: 'revenue', color: CHART_COLORS[0], name: 'Revenue' },
              { key: 'target', color: CHART_COLORS[6], name: 'Target' },
            ]}
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
            value={formatCurrency(financeKpis.revenue, { compact: true })}
            delta={14.2}
            icon={FiDollarSign}
            tone="brand"
          />
          <KPICard
            label="Net Profit"
            value={formatCurrency(financeKpis.profit, { compact: true })}
            delta={11.4}
            icon={FiTrendingUp}
            tone="emerald"
          />
          <KPICard
            label="Profit Margin"
            value={formatPercent(financeKpis.profitMargin)}
            delta={1.8}
            icon={FiPercent}
            tone="violet"
          />
          <KPICard
            label="Total Expenses"
            value={formatCurrency(financeKpis.expenses, { compact: true })}
            delta={4.6}
            deltaSuffix="vs last month"
            icon={FiActivity}
            tone="amber"
          />
        </KpiGrid>

        <ChartCard
          title="Revenue Overview"
          subtitle="Monthly revenue versus expenses"
          icon={FiBarChart2}
          legend={
            <>
              <LegendDot color={CHART_COLORS[0]} label="Revenue" />
              <LegendDot color={CHART_COLORS[6]} label="Expense" />
            </>
          }
        >
          <AreaChartView
            data={monthlyOverview}
            xKey="month"
            areas={[
              { key: 'revenue', color: CHART_COLORS[0], name: 'Revenue' },
              { key: 'expense', color: CHART_COLORS[6], name: 'Expense' },
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
          <KPICard label="Total Branches" value={branches.length} icon={FiHome} tone="brand" />
          <KPICard
            label="Network Revenue"
            value={formatCurrency(totalBranchRevenue, { compact: true })}
            delta={13.5}
            icon={FiDollarSign}
            tone="emerald"
          />
          <KPICard
            label="Avg Achievement"
            value={formatPercent(
              branches.reduce((s, b) => s + b.targetAchievement, 0) / branches.length,
            )}
            delta={3.4}
            icon={FiTarget}
            tone="violet"
          />
          <KPICard
            label="Total Staff"
            value={staff.length}
            delta={6.5}
            icon={FiUsers}
            tone="sky"
          />
        </KpiGrid>

        <ChartCard
          title="Branch Performance"
          subtitle="Total revenue by branch"
          icon={FiBarChart2}
          legend={<LegendDot color={CHART_COLORS[0]} label="Revenue" />}
        >
          <BarChartView
            data={branches.map((b) => ({ city: b.city, revenue: b.totalRevenue }))}
            xKey="city"
            bars={[{ key: 'revenue', color: CHART_COLORS[0], name: 'Revenue' }]}
            tooltipFormatter={(v) => formatCurrency(v, { compact: true })}
          />
        </ChartCard>
      </>
    ),

    /* ----------------------------- STAFF ----------------------------- */
    staff: (
      <>
        <KpiGrid>
          <KPICard label="Total Staff" value={staff.length} delta={6.5} icon={FiUsers} tone="brand" />
          <KPICard
            label="Top Performer"
            value={topPerformers[0]?.performanceScore ?? 0}
            suffix="pts"
            icon={FiAward}
            tone="violet"
          />
          <KPICard
            label="Avg Conversion"
            value={formatPercent(
              staff.reduce((s, m) => s + m.conversionRate, 0) / staff.length,
            )}
            delta={2.1}
            icon={FiPercent}
            tone="emerald"
          />
          <KPICard
            label="Total Won Leads"
            value={staff.reduce((s, m) => s + m.wonLeads, 0)}
            delta={14.7}
            icon={FiUserCheck}
            tone="sky"
          />
        </KpiGrid>

        <ChartCard
          title="Top Staff by Revenue"
          subtitle="Leading sales representatives"
          icon={FiBarChart2}
          legend={<LegendDot color={CHART_COLORS[0]} label="Revenue" />}
        >
          <BarChartView
            data={topStaffRevenue}
            xKey="name"
            bars={[{ key: 'revenue', color: CHART_COLORS[0], name: 'Revenue' }]}
            tooltipFormatter={(v) => formatCurrency(v, { compact: true })}
          />
        </ChartCard>
      </>
    ),

    /* ---------------------------- TARGET ----------------------------- */
    target: (
      <>
        <KpiGrid>
          <KPICard label="Total Targets" value={targetSummary.total} icon={FiTarget} tone="brand" />
          <KPICard
            label="Achieved"
            value={targetSummary.achieved}
            delta={8.2}
            icon={FiCheckCircle}
            tone="emerald"
          />
          <KPICard
            label="Overachieved"
            value={targetSummary.overachieved}
            icon={FiZap}
            tone="violet"
          />
          <KPICard
            label="Avg Completion"
            value={formatPercent(targetSummary.avgCompletion)}
            delta={4.1}
            icon={FiPercent}
            tone="sky"
          />
        </KpiGrid>

        <ChartCard
          title="Target vs Achievement"
          subtitle="Quantity targets by product"
          icon={FiBarChart2}
          legend={
            <>
              <LegendDot color={CHART_COLORS[2]} label="Target" />
              <LegendDot color="#3b82f6" label="Achieved" />
            </>
          }
        >
          <BarChartView
            data={targetVsAchievement}
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
            value={formatCurrency(totalIncentives, { compact: true })}
            delta={10.3}
            icon={FiAward}
            tone="brand"
          />
          <KPICard
            label="Highest Payout"
            value={formatCurrency(highestIncentive, { compact: true })}
            icon={FiZap}
            tone="violet"
          />
          <KPICard
            label="Top Performer"
            value={topPerformer?.staffName?.split(' ')[0] ?? '—'}
            icon={FiUser}
            tone="emerald"
          />
          <KPICard
            label="Paid This Month"
            value={incentives.filter((i) => i.status === 'Paid').length}
            suffix="staff"
            icon={FiUserPlus}
            tone="sky"
          />
        </KpiGrid>

        <ChartCard
          title="Incentive Trend"
          subtitle="Company-wide incentive payouts"
          icon={FiTrendingUp}
          legend={<LegendDot color={CHART_COLORS[0]} label="Incentive" />}
        >
          <LineChartView
            data={incentiveTrend}
            xKey="month"
            lines={[{ key: 'incentive', color: CHART_COLORS[0], name: 'Incentive' }]}
            tooltipFormatter={(v) => formatCurrency(v, { compact: true })}
          />
        </ChartCard>
      </>
    ),
  }

  const activeTabMeta = REPORT_TABS.find((t) => t.key === activeTab)

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
                subtitle={`${formatNumber(activeReport.rows.length)} record${activeReport.rows.length === 1 ? '' : 's'} in this preview`}
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
                columns={activeReport.columns}
                data={activeReport.rows}
                rowKey={(row) => row.id ?? row.code ?? row.month ?? row.staffName ?? row.objective}
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
