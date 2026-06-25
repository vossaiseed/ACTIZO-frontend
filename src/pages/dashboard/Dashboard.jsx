import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  FiUsers,
  FiUserPlus,
  FiPhoneCall,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiDollarSign,
  FiTrendingUp,
  FiHome,
  FiBriefcase,
  FiTarget,
  FiDownload,
  FiActivity,
  FiArrowRight,
  FiCalendar,
  FiBarChart2,
  FiPieChart,
  FiAward,
  FiShoppingCart,
  FiPhone,
  FiEdit3,
  FiZap,
  FiChevronRight,
} from 'react-icons/fi'

import { selectDashboard } from '@/redux/slices/dashboardSlice'
import { selectUser } from '@/redux/slices/authSlice'
import { totalSales as totalSalesCount } from '@/data/sales'
import { achievementStyleFromPct } from '@/utils/achievement'
import { cn } from '@/utils/cn'
import {
  formatCurrency,
  formatPercent,
  formatRelativeTime,
  formatDate,
} from '@/utils/format'

import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import StatusBadge from '@/components/ui/StatusBadge'
import ProgressBar from '@/components/ui/ProgressBar'
import KPICard from '@/components/cards/KPICard'
import ChartCard from '@/components/cards/ChartCard'
import EmptyState from '@/components/feedback/EmptyState'
import { AreaChartView, BarChartView, LineChartView } from '@/components/charts'
import { CHART_COLORS } from '@/constants'

/* ------------------------------------------------------------------ */
/* Activity icon lookup (data stores icon NAMES as strings)            */
/* ------------------------------------------------------------------ */

const ACTIVITY_ICONS = {
  FiUserPlus,
  FiCheckCircle,
  FiPhone,
  FiTrendingUp,
  FiShoppingCart,
  FiTarget,
  FiEdit3,
  FiActivity,
  FiZap,
}

const ACTIVITY_TONES = {
  brand: 'bg-brand-50 text-brand-600 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20',
  emerald:
    'bg-emerald-50 text-emerald-600 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20',
  sky: 'bg-sky-50 text-sky-600 ring-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20',
  violet:
    'bg-violet-50 text-violet-600 ring-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/20',
  amber: 'bg-amber-50 text-amber-600 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20',
  rose: 'bg-rose-50 text-rose-600 ring-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20',
  slate: 'bg-slate-100 text-slate-600 ring-slate-400/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600/30',
}

const DATE_RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last quarter' },
  { value: 'ytd', label: 'Year to date' },
]

/* ------------------------------------------------------------------ */
/* Motion variants                                                     */
/* ------------------------------------------------------------------ */

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

/* ------------------------------------------------------------------ */
/* Small section header for bottom panels                              */
/* ------------------------------------------------------------------ */

function SectionHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20">
            <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </span>
        ) : null}
        <div className="min-w-0">
          <h3 className="truncate text-base font-display font-semibold text-ink dark:text-slate-100">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-0.5 truncate text-xs text-ink-soft dark:text-slate-400">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Branch performance card (target vs achievement)                     */
/* ------------------------------------------------------------------ */

const BRANCH_ACCENTS = {
  blue: { bg: 'bg-blue-50/60 dark:bg-blue-500/5', border: 'border-blue-200/70 dark:border-blue-500/20', icon: 'bg-blue-500', bar: 'sky' },
  emerald: { bg: 'bg-emerald-50/60 dark:bg-emerald-500/5', border: 'border-emerald-200/70 dark:border-emerald-500/20', icon: 'bg-emerald-500', bar: 'emerald' },
  violet: { bg: 'bg-violet-50/60 dark:bg-violet-500/5', border: 'border-violet-200/70 dark:border-violet-500/20', icon: 'bg-violet-500', bar: 'violet' },
  amber: { bg: 'bg-amber-50/60 dark:bg-amber-500/5', border: 'border-amber-200/70 dark:border-amber-500/20', icon: 'bg-amber-500', bar: 'amber' },
  rose: { bg: 'bg-rose-50/60 dark:bg-rose-500/5', border: 'border-rose-200/70 dark:border-rose-500/20', icon: 'bg-rose-500', bar: 'rose' },
}

function BranchStat({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-ink-soft dark:text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-base font-bold tabular-nums text-ink dark:text-slate-100">{value}</dd>
    </div>
  )
}

function BranchPerfCard({ card }) {
  const a = BRANCH_ACCENTS[card.accent] || BRANCH_ACCENTS.blue
  // Achievement color: below=red, met=green, exceeded=blue
  const ach = achievementStyleFromPct(card.achievementPct)
  const pctColor = ach.text

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className={cn('rounded-2xl border p-5 transition-shadow hover:shadow-card', a.bg, a.border)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white shadow-soft', a.icon)}>
            <FiHome className="h-[18px] w-[18px]" />
          </span>
          <h3 className="truncate font-display text-base font-bold text-ink dark:text-slate-100">{card.name}</h3>
        </div>
        <span className={cn('shrink-0 text-sm font-bold tabular-nums', pctColor)}>{card.achievementPct}%</span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        <BranchStat label="Target" value={card.target} />
        <BranchStat label="Achieved" value={card.achieved} />
        <BranchStat label="Remaining" value={card.remaining} />
        <BranchStat label="Conv. Rate" value={`${card.convRate}%`} />
      </dl>

      <ProgressBar value={card.achievementPct} max={100} color={ach.bar} size="md" className="mt-4" />

      <div className="mt-3 border-t border-line/70 pt-3 text-sm text-ink-soft dark:border-slate-700/60 dark:text-slate-400">
        Revenue:{' '}
        <span className="font-semibold text-ink dark:text-slate-200">{formatCurrency(card.revenue)}</span>
      </div>
    </motion.div>
  )
}

export default function Dashboard() {
  const {
    kpis,
    deltas,
    charts,
    branchPerformanceCards,
    recentActivities,
    recentLeads,
    topPerformers,
    upcomingFollowUps,
  } = useSelector(selectDashboard)
  const user = useSelector(selectUser)

  const roleLabel = user?.roleLabel || 'Admin'
  const dashTitle =
    user?.roleKey === 'branch_manager'
      ? 'Branch Dashboard'
      : user?.roleKey === 'staff'
        ? 'My Dashboard'
        : 'Admin Dashboard'
  const dashSubtitle = user
    ? `Welcome back, ${user.name.split(' ')[0]} — your ${roleLabel.toLowerCase()} overview${
        user.branchName && user.roleKey !== 'admin' ? ` · ${user.branchName}` : ''
      }`
    : "Welcome back — here's your sales overview"

  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('30d')

  // Brief shimmer on first mount so skeletons get a moment to show.
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  /* ---- KPI definitions (core 5) ----------------------------------- */
  const kpiCards = useMemo(
    () => [
      {
        label: 'Total Leads',
        value: kpis.totalLeads,
        delta: deltas.totalLeads,
        icon: FiUsers,
        tone: 'brand',
      },
      {
        label: 'Total Sales',
        value: totalSalesCount,
        delta: deltas.wonLeads,
        icon: FiShoppingCart,
        tone: 'sky',
      },
      {
        label: 'Total Revenue',
        value: formatCurrency(kpis.totalRevenue, { compact: true }),
        delta: deltas.totalRevenue,
        icon: FiDollarSign,
        tone: 'emerald',
      },
      {
        label: 'Target Achievement',
        value: kpis.targetAchievement,
        delta: deltas.targetAchievement,
        suffix: '%',
        icon: FiTarget,
        tone: achievementStyleFromPct(kpis.targetAchievement).bar,
      },
      {
        label: 'Pending Follow-Ups',
        value: upcomingFollowUps.length,
        icon: FiPhoneCall,
        tone: 'amber',
      },
    ],
    [kpis, deltas, upcomingFollowUps],
  )

  /* ---- Chart legends ---------------------------------------------- */
  const dualLegend = (a, b) => (
    <>
      <span className="flex items-center gap-2 text-xs font-medium text-ink-soft dark:text-slate-400">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: a.color }} />
        {a.label}
      </span>
      <span className="flex items-center gap-2 text-xs font-medium text-ink-soft dark:text-slate-400">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.color }} />
        {b.label}
      </span>
    </>
  )

  const currencyTooltip = (v) => formatCurrency(v, { compact: true })

  return (
    <div className="space-y-6">
      <PageHeader
        title={dashTitle}
        subtitle={dashSubtitle}
        actions={
          <>
            <Select
              options={DATE_RANGES}
              value={range}
              onChange={(e) => setRange(e.target.value)}
              containerClassName="w-40"
              aria-label="Date range"
            />
            <Button leftIcon={<FiDownload />}>Export</Button>
          </>
        }
      />

      {/* ----------------------------------------------------------- */}
      {/* KPI GRID                                                     */}
      {/* ----------------------------------------------------------- */}
      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 sm:gap-5 sm:grid-cols-3 lg:grid-cols-5"
      >
        {kpiCards.map((c) => (
          <motion.div key={c.label} variants={item}>
            <KPICard
              label={c.label}
              value={c.value}
              delta={c.delta}
              suffix={c.suffix}
              icon={c.icon}
              tone={c.tone}
              loading={loading}
            />
          </motion.div>
        ))}
      </motion.section>

      {/* ----------------------------------------------------------- */}
      {/* PRIMARY CHARTS — Revenue Trend (wide) + Lead Pipeline        */}
      {/* ----------------------------------------------------------- */}
      <section className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
        <ChartCard
          title="Revenue Trend"
          subtitle="Actual revenue against monthly target"
          icon={FiTrendingUp}
          height={320}
          loading={loading}
          className="xl:col-span-2"
          legend={dualLegend(
            { label: 'Revenue', color: CHART_COLORS[0] },
            { label: 'Target', color: '#94a3b8' },
          )}
        >
          <AreaChartView
            data={charts.revenueTrend}
            xKey="month"
            height={320}
            tooltipFormatter={currencyTooltip}
            areas={[
              { key: 'revenue', color: CHART_COLORS[0], name: 'Revenue' },
              { key: 'target', color: '#94a3b8', name: 'Target' },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Lead Pipeline"
          subtitle="Leads by funnel stage"
          icon={FiBarChart2}
          height={320}
          loading={loading}
        >
          <BarChartView
            data={charts.leadPipeline}
            xKey="stage"
            height={320}
            horizontal
            bars={[{ key: 'count', name: 'Leads' }]}
          />
        </ChartCard>
      </section>

      {/* ----------------------------------------------------------- */}
      {/* BRANCH PERFORMANCE — target vs achievement cards             */}
      {/* ----------------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300">
            <FiHome className="h-[18px] w-[18px]" />
          </span>
          <h2 className="font-display text-lg font-bold tracking-tight text-ink dark:text-slate-100">
            Branch Performance
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card p-5">
                <div className="skeleton h-9 w-9 rounded-xl" />
                <div className="skeleton mt-4 h-4 w-2/3" />
                <div className="skeleton mt-3 h-4 w-1/2" />
                <div className="skeleton mt-6 h-2.5 w-full rounded-full" />
                <div className="skeleton mt-4 h-3 w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {branchPerformanceCards.map((card) => (
              <motion.div key={card.id} variants={item}>
                <BranchPerfCard card={card} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* ----------------------------------------------------------- */}
      {/* BOTTOM GRID — Recent Leads + Upcoming Follow-Ups            */}
      {/* ----------------------------------------------------------- */}
      <section className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        {/* Recent Leads */}
        <Card padding="md">
          <SectionHeader
            icon={FiUsers}
            title="Recent Leads"
            subtitle="Newest captured leads"
            action={
              <Button variant="ghost" size="sm" to="/leads" rightIcon={<FiArrowRight />}>
                View all
              </Button>
            }
          />
          <div className="mt-4">
            {recentLeads.length === 0 ? (
              <EmptyState icon={FiUsers} title="No leads yet" />
            ) : (
              <motion.ul
                variants={container}
                initial="hidden"
                animate="show"
                className="divide-y divide-line dark:divide-slate-800"
              >
                {recentLeads.slice(0, 6).map((lead) => (
                  <motion.li
                    key={lead.id}
                    variants={item}
                    className="flex items-center gap-3 py-2.5 first:pt-0"
                  >
                    <Avatar name={lead.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink dark:text-slate-100">
                        {lead.name}
                      </p>
                      <p className="truncate text-xs text-ink-soft dark:text-slate-400">
                        {lead.company} · {lead.branchName}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-xs font-semibold tabular-nums text-ink dark:text-slate-200">
                        {formatCurrency(lead.value, { compact: true })}
                      </span>
                      <StatusBadge status={lead.status} withDot />
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </div>
        </Card>

        {/* Upcoming Follow-Ups */}
        <Card padding="md">
          <SectionHeader
            icon={FiCalendar}
            title="Upcoming Follow-Ups"
            subtitle="Scheduled touchpoints due soon"
            action={
              <Button variant="ghost" size="sm" to="/leads" rightIcon={<FiArrowRight />}>
                View all
              </Button>
            }
          />
          <div className="mt-4">
            {upcomingFollowUps.length === 0 ? (
              <EmptyState icon={FiCalendar} title="No upcoming follow-ups" />
            ) : (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                {upcomingFollowUps.slice(0, 6).map((f) => (
                  <motion.div
                    key={f.id}
                    variants={item}
                    className="group flex items-center gap-3 rounded-xl border border-line bg-surface-muted/40 p-3 transition-colors hover:border-brand-300 hover:bg-brand-50/40 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/5"
                  >
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-white text-center shadow-soft ring-1 ring-line dark:bg-slate-900 dark:ring-slate-700">
                      <span className="text-base font-bold leading-none text-brand-600 dark:text-brand-400">
                        {formatDate(f.nextDate || f.date, 'dd')}
                      </span>
                      <span className="mt-0.5 text-2xs font-semibold uppercase tracking-wide text-ink-soft dark:text-slate-400">
                        {formatDate(f.nextDate || f.date, 'MMM')}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink dark:text-slate-100">
                        {f.leadName}
                      </p>
                      <p className="truncate text-xs text-ink-soft dark:text-slate-400">
                        {f.product}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <StatusBadge status={f.type} size="sm" />
                        <span className="truncate text-2xs text-ink-faint dark:text-slate-500">
                          {f.branchName}
                        </span>
                      </div>
                    </div>
                    <FiChevronRight className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 dark:text-slate-500" />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </Card>
      </section>
    </div>
  )
}
