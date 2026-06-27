import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiHeart,
  FiDownload,
  FiChevronDown,
  FiBarChart2,
} from 'react-icons/fi'

import { fetchFinance, selectFinance } from '@/redux/slices/financeSlice'

import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Dropdown from '@/components/ui/Dropdown'
import KPICard from '@/components/cards/KPICard'
import ChartCard from '@/components/cards/ChartCard'
import AchievementBadge from '@/components/ui/AchievementBadge'
import { SkeletonKPI } from '@/components/feedback/Skeleton'
import { BarChartView } from '@/components/charts'
import { useToast } from '@/components/feedback/Toast'

import { cn } from '@/utils/cn'
import { formatCurrency, formatPercent } from '@/utils/format'
import { exportData } from '@/utils/export'
import { achievementStyleFromPct } from '@/utils/achievement'
import { CHART_COLORS } from '@/constants'

/* ------------------------------------------------------------------ */
/* Static helpers                                                      */
/* ------------------------------------------------------------------ */

const PERIOD_OPTIONS = [
  { value: 'h1-2026', label: 'Jan – Jun 2026' },
  { value: 'q2-2026', label: 'Q2 2026' },
  { value: 'q1-2026', label: 'Q1 2026' },
  { value: 'ytd-2026', label: 'Year to date' },
  { value: 'fy-2025', label: 'FY 2025' },
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
/* Financial Health Score KPI card                                    */
/* Score is a /100 metric → colored with the unified achievement rule */
/* (below 100% = red, 100% = green, above 100% = blue).               */
/* ------------------------------------------------------------------ */

function HealthScoreCard({ score, margin }) {
  const pct = Math.max(0, Math.min(100, score))
  const style = achievementStyleFromPct(pct)

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className="card group relative overflow-hidden p-5 transition-shadow duration-300 hover:shadow-card-hover"
    >
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-soft dark:text-slate-400">
          Financial Health Score
        </p>
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-105',
            style.chip,
          )}
        >
          <FiHeart className="h-5 w-5" strokeWidth={2.2} />
        </span>
      </div>

      <div className="relative mt-3 flex items-end gap-1.5">
        <span className={cn('text-2xl font-display font-bold tracking-tight sm:text-3xl', style.text)}>
          {pct}
        </span>
        <span className="mb-0.5 text-sm font-medium text-ink-faint dark:text-slate-500">/ 100</span>
      </div>

      <div className="relative mt-3 flex items-center gap-2">
        <AchievementBadge pct={pct} withLabel />
        <span className="text-xs text-ink-faint dark:text-slate-500">
          {formatPercent(margin)} margin
        </span>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Finance() {
  const dispatch = useDispatch()
  const { kpis, charts, status } = useSelector(selectFinance)
  const toast = useToast()

  const [period, setPeriod] = useState('h1-2026')

  // Loading is driven by the fetch status (idle until the first request resolves).
  const loading = status === 'loading' || status === 'idle'

  // Fetch the live finance overview + charts on mount.
  useEffect(() => {
    dispatch(fetchFinance())
  }, [dispatch])

  const revenueVsExpense = charts.revenueVsExpense || []

  const profitPositive = kpis.profit >= 0

  /* ----- Export ----- */
  const runExport = (format) => {
    const rows = revenueVsExpense.map((m) => ({
      month: m.month,
      revenue: m.revenue,
      expense: m.expense,
    }))
    const columns = [
      { key: 'month', label: 'Month' },
      { key: 'revenue', label: 'Revenue (₹)' },
      { key: 'expense', label: 'Expense (₹)' },
    ]
    exportData(format, rows, 'actizo-finance', columns)
    toast.success(`Exported financial overview as ${format.toUpperCase()}.`)
  }

  const exportItems = [
    { label: 'Export as CSV', icon: <FiDownload />, onClick: () => runExport('csv') },
    { label: 'Export as Excel', icon: <FiDownload />, onClick: () => runExport('excel') },
    { label: 'Export as PDF', icon: <FiDownload />, onClick: () => runExport('pdf') },
  ]

  /* ----- Header actions ----- */
  const headerActions = (
    <>
      <div className="hidden w-44 sm:block">
        <Select
          options={PERIOD_OPTIONS}
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          aria-label="Select period"
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
        title="Finance"
        subtitle="Revenue, profitability & financial health"
        icon={FiDollarSign}
        actions={headerActions}
      />

      {/* ---------------- KPI cards ---------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonKPI key={i} />)
        ) : (
          <>
            <KPICard
              label="Total Revenue"
              value={formatCurrency(kpis.revenue, { compact: true })}
              icon={FiDollarSign}
              tone="brand"
            />
            <KPICard
              label="Expenses"
              value={formatCurrency(kpis.expenses, { compact: true })}
              icon={FiTrendingDown}
              tone="amber"
            />
            <KPICard
              label="Profit & Loss"
              value={formatCurrency(kpis.profit, { compact: true })}
              deltaSuffix={`${formatPercent(kpis.profitMargin)} margin`}
              icon={profitPositive ? FiTrendingUp : FiTrendingDown}
              tone={profitPositive ? 'emerald' : 'rose'}
            />
            <HealthScoreCard score={kpis.healthScore} margin={kpis.profitMargin} />
          </>
        )}
      </div>

      {/* ---------------- Revenue Overview (single chart) ---------------- */}
      <ChartCard
        title="Revenue Overview"
        subtitle="Revenue vs expense across the period"
        icon={FiBarChart2}
        loading={loading}
        legend={
          <>
            <LegendDot color={CHART_COLORS[0]} label="Revenue" />
            <LegendDot color={CHART_COLORS[6]} label="Expense" />
          </>
        }
      >
        <BarChartView
          data={revenueVsExpense}
          xKey="month"
          bars={[
            { key: 'revenue', color: CHART_COLORS[0], name: 'Revenue' },
            { key: 'expense', color: CHART_COLORS[6], name: 'Expense' },
          ]}
          tooltipFormatter={(v) => formatCurrency(v, { compact: true })}
        />
      </ChartCard>
    </motion.div>
  )
}
