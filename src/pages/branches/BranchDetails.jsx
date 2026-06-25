import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiArrowLeft,
  FiHome,
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiCalendar,
  FiHash,
  FiUsers,
  FiZap,
  FiShoppingBag,
  FiDollarSign,
  FiTarget,
  FiTrendingUp,
  FiAward,
  FiActivity,
  FiArrowUpRight,
} from 'react-icons/fi'

import { cn } from '@/utils/cn'
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format'
import { sum } from '@/utils/helpers'
import { achievementStyleFromPct } from '@/utils/achievement'

import { branchById } from '@/data/branches'
import { staffByBranch } from '@/data/staff'
import { leads } from '@/data/leads'
import { sales } from '@/data/sales'
import { generalTargets } from '@/data/targets'
import { MONTHS } from '@/data/_helpers'

import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import StatusBadge from '@/components/ui/StatusBadge'
import ProgressBar from '@/components/ui/ProgressBar'
import Avatar from '@/components/ui/Avatar'
import AchievementBadge from '@/components/ui/AchievementBadge'
import KPICard from '@/components/cards/KPICard'
import ChartCard from '@/components/cards/ChartCard'
import DataTable from '@/components/data/DataTable'
import EmptyState from '@/components/feedback/EmptyState'
import { AreaChartView } from '@/components/charts'

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

const pageMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' },
}

/* ------------------------------------------------------------------ */
/* Info row                                                            */
/* ------------------------------------------------------------------ */
function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-line bg-surface-base/50 px-3.5 py-3 transition-colors hover:border-brand-200 hover:bg-brand-50/40 dark:border-slate-800 dark:bg-slate-800/30 dark:hover:border-brand-500/30 dark:hover:bg-slate-800/60">
      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-500/15 dark:bg-brand-500/10 dark:text-brand-300">
        <Icon className="h-[18px] w-[18px]" strokeWidth={2.1} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-faint dark:text-slate-500">
          {label}
        </p>
        <div className="mt-0.5 break-words text-sm font-medium text-ink dark:text-slate-100">
          {children}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function BranchDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const branch = id ? branchById(id) : null

  /* ---- Derived data (hooks must run unconditionally) ---- */
  const branchStaff = useMemo(() => (branch ? staffByBranch(branch.id) : []), [branch])

  const branchLeads = useMemo(
    () => (branch ? leads.filter((l) => l.branchId === branch.id) : []),
    [branch],
  )

  const branchSalesRows = useMemo(
    () => (branch ? sales.filter((s) => s.branchId === branch.id) : []),
    [branch],
  )

  const revenueGenerated = useMemo(
    () => sum(branchSalesRows.filter((s) => s.status === 'Completed'), 'amount'),
    [branchSalesRows],
  )

  const branchTargets = useMemo(
    () =>
      branch
        ? generalTargets.filter((t) => t.branchId === branch.id || t.scope === 'Admin')
        : [],
    [branch],
  )

  // Synthesize a smooth monthly revenue series anchored on the branch's
  // monthlyRevenue so each branch shows a believable 8-month trend.
  const revenueTrend = useMemo(() => {
    if (!branch) return []
    const window = MONTHS.slice(-8) // Jun ... last 8 calendar months
    const base = branch.monthlyRevenue
    return window.map((m, i) => {
      const factor = 0.72 + i * 0.05 + (i % 2 ? 0.04 : -0.02)
      return {
        month: m,
        revenue: Math.round((base * factor) / 1000) * 1000,
      }
    })
  }, [branch])

  /* ---- Not found ---- */
  if (!branch) {
    return (
      <motion.div {...pageMotion} className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<FiArrowLeft />}
          onClick={() => navigate('/branches')}
          className="-ml-1"
        >
          Back to Branches
        </Button>
        <Card padding="lg">
          <EmptyState
            icon={FiHome}
            title="Branch not found"
            description={`We couldn't find a branch matching "${id}". It may have been removed or the link is incorrect.`}
            action={
              <Button to="/branches" leftIcon={<FiArrowLeft />}>
                Back to Branches
              </Button>
            }
          />
        </Card>
      </motion.div>
    )
  }

  const wonLeads = branchLeads.filter((l) => l.status === 'Won').length
  const monthlyTarget = Math.round(branch.targetRevenue / 12)

  /* ---- Staff table columns ---- */
  const staffColumns = [
    {
      key: 'name',
      header: 'Staff',
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.name} color={s.avatarColor} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink dark:text-slate-100">{s.name}</p>
            <p className="truncate text-xs text-ink-soft dark:text-slate-400">{s.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (s) => (
        <Badge tone={s.role === 'Team Lead' ? 'brand' : 'gray'} size="sm">
          {s.role}
        </Badge>
      ),
    },
    {
      key: 'assignedLeads',
      header: 'Leads',
      sortable: true,
      align: 'right',
      render: (s) => formatNumber(s.assignedLeads),
    },
    {
      key: 'revenue',
      header: 'Revenue',
      sortable: true,
      align: 'right',
      render: (s) => (
        <span className="font-semibold text-ink dark:text-slate-100">
          {formatCurrency(s.revenue, { compact: true })}
        </span>
      ),
    },
    {
      key: 'achievement',
      header: 'Achievement',
      sortable: true,
      width: 170,
      render: (s) => (
        <div className="min-w-[130px]">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className={cn('font-semibold tabular-nums', achievementStyleFromPct(s.achievement).text)}>
              {formatPercent(s.achievement)}
            </span>
          </div>
          <ProgressBar value={s.achievement} color={achievementStyleFromPct(s.achievement).bar} size="sm" />
        </div>
      ),
    },
  ]

  return (
    <motion.div {...pageMotion} className="space-y-6">
      {/* Back + header */}
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<FiArrowLeft />}
          onClick={() => navigate('/branches')}
          className="-ml-1 text-ink-soft hover:text-brand-600 dark:hover:text-brand-300"
        >
          Back to Branches
        </Button>

        <PageHeader
          title={branch.name}
          subtitle={`${branch.city} • ${branch.region}`}
          icon={FiHome}
          breadcrumb={false}
          actions={
            <>
              <Badge tone="gray" size="md" className="font-mono">
                {branch.code}
              </Badge>
              <StatusBadge status={cap(branch.status)} size="md" withDot />
            </>
          }
        />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Staff Count" value={branch.staffCount} icon={FiUsers} tone="brand" />
        <KPICard label="Total Leads" value={branch.totalLeads} icon={FiZap} tone="sky" />
        <KPICard label="Total Sales" value={branch.totalSales} icon={FiShoppingBag} tone="violet" />
        <KPICard
          label="Revenue Generated"
          value={formatCurrency(revenueGenerated || branch.totalRevenue, { compact: true })}
          icon={FiDollarSign}
          tone="emerald"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ---------------- Left / main ---------------- */}
        <div className="space-y-6 lg:col-span-2">
          {/* Branch info */}
          <Card
            title="Branch Information"
            subtitle="Contact details & profile"
            icon={<FiHome className="h-5 w-5" />}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoRow icon={FiUser} label="Branch Manager">
                {branch.manager}
              </InfoRow>
              <InfoRow icon={FiHash} label="Branch Code">
                <span className="font-mono">{branch.code}</span>
              </InfoRow>
              <InfoRow icon={FiPhone} label="Phone">
                <a href={`tel:${branch.phone}`} className="hover:text-brand-600 dark:hover:text-brand-300">
                  {branch.phone}
                </a>
              </InfoRow>
              <InfoRow icon={FiMail} label="Email">
                <a
                  href={`mailto:${branch.email}`}
                  className="hover:text-brand-600 dark:hover:text-brand-300"
                >
                  {branch.email}
                </a>
              </InfoRow>
              <InfoRow icon={FiMapPin} label="Address">
                {branch.address}
              </InfoRow>
              <InfoRow icon={FiCalendar} label="Established">
                {branch.established}
              </InfoRow>
            </div>
          </Card>

          {/* Revenue trend */}
          <ChartCard
            title="Revenue Trend"
            subtitle="Monthly revenue over the last 8 months"
            icon={FiTrendingUp}
            height={300}
          >
            <AreaChartView
              data={revenueTrend}
              xKey="month"
              dataKey="revenue"
              name="Revenue"
              color="#36bab3"
              height={300}
              tooltipFormatter={(v) => formatCurrency(v, { compact: true })}
            />
          </ChartCard>

          {/* Staff of branch */}
          <Card
            title="Branch Staff"
            subtitle={`${branchStaff.length} team member${branchStaff.length === 1 ? '' : 's'}`}
            icon={<FiUsers className="h-5 w-5" />}
            padding="sm"
          >
            <DataTable
              columns={staffColumns}
              data={branchStaff}
              rowKey={(s) => s.id}
              onRowClick={(s) => navigate(`/staff/${s.id}`)}
              emptyTitle="No staff assigned"
              emptyDescription="This branch has no team members assigned yet."
              emptyIcon={FiUsers}
              className="border-0 shadow-none"
            />
          </Card>
        </div>

        {/* ---------------- Right / aside ---------------- */}
        <aside className="space-y-6">
          {/* Target achievement */}
          <Card padding="lg" className="relative overflow-hidden">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl"
            />
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-500/15 dark:bg-brand-500/10 dark:text-brand-300">
                  <FiTarget className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium text-ink-soft dark:text-slate-400">
                  Target Achievement
                </span>
              </div>
              <span className={cn('font-display text-2xl font-bold', achievementStyleFromPct(branch.targetAchievement).text)}>
                {branch.targetAchievement}%
              </span>
            </div>
            <ProgressBar
              value={branch.targetAchievement}
              color={achievementStyleFromPct(branch.targetAchievement).bar}
              size="lg"
              className="relative mt-4"
            />
            <div className="relative mt-3">
              <AchievementBadge pct={branch.targetAchievement} size="md" withLabel />
            </div>
            <div className="relative mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-surface-muted/70 px-3 py-2.5 ring-1 ring-line/60 dark:bg-slate-800/50 dark:ring-slate-700/50">
                <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint dark:text-slate-500">
                  Target Revenue
                </p>
                <p className="mt-0.5 font-display text-sm font-bold text-ink dark:text-slate-100">
                  {formatCurrency(branch.targetRevenue, { compact: true })}
                </p>
              </div>
              <div className="rounded-xl bg-surface-muted/70 px-3 py-2.5 ring-1 ring-line/60 dark:bg-slate-800/50 dark:ring-slate-700/50">
                <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint dark:text-slate-500">
                  Total Revenue
                </p>
                <p className="mt-0.5 font-display text-sm font-bold text-ink dark:text-slate-100">
                  {formatCurrency(branch.totalRevenue, { compact: true })}
                </p>
              </div>
            </div>
          </Card>

          {/* Snapshot stats */}
          <Card title="Snapshot" icon={<FiActivity className="h-5 w-5" />}>
            <ul className="-my-1 divide-y divide-line dark:divide-slate-800">
              <SnapshotRow icon={FiAward} label="Won Leads" value={formatNumber(wonLeads)} tone="emerald" />
              <SnapshotRow
                icon={FiDollarSign}
                label="Monthly Revenue"
                value={formatCurrency(branch.monthlyRevenue, { compact: true })}
                tone="brand"
              />
              <SnapshotRow
                icon={FiTarget}
                label="Monthly Target"
                value={formatCurrency(monthlyTarget, { compact: true })}
                tone="violet"
              />
              <SnapshotRow
                icon={FiShoppingBag}
                label="Sales Records"
                value={formatNumber(branchSalesRows.length)}
                tone="sky"
              />
            </ul>
          </Card>

          {/* Branch targets */}
          <Card
            title="Branch Targets"
            subtitle={`${branchTargets.length} target${branchTargets.length === 1 ? '' : 's'} tracked`}
            icon={<FiTarget className="h-5 w-5" />}
          >
            {branchTargets.length ? (
              <div className="space-y-3">
                {branchTargets.slice(0, 6).map((t) => (
                  <div
                    key={t.id}
                    className="rounded-xl border border-line bg-surface-base/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink dark:text-slate-100">
                          {t.product}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-soft dark:text-slate-400">
                          <Badge tone={t.scope === 'Branch' ? 'brand' : 'gray'} size="sm">
                            {t.scope}
                          </Badge>
                          <span>{t.period}</span>
                        </p>
                      </div>
                      <StatusBadge status={t.status} size="sm" />
                    </div>
                    <div className="mt-2.5">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-ink-soft dark:text-slate-400">
                          {formatNumber(t.achievedQty)} / {formatNumber(t.targetQty)} {t.unit}
                        </span>
                        <span className={cn('font-semibold tabular-nums', achievementStyleFromPct(t.completion).text)}>
                          {formatPercent(t.completion)}
                        </span>
                      </div>
                      <ProgressBar value={t.completion} color={achievementStyleFromPct(t.completion).bar} size="sm" />
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  fullWidth
                  size="sm"
                  rightIcon={<FiArrowUpRight />}
                  onClick={() => navigate('/targets')}
                >
                  View all targets
                </Button>
              </div>
            ) : (
              <EmptyState
                icon={FiTarget}
                title="No targets set"
                description="Targets assigned to this branch will appear here."
              />
            )}
          </Card>
        </aside>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Snapshot row                                                        */
/* ------------------------------------------------------------------ */
const SNAP_TONES = {
  brand: 'bg-brand-50 text-brand-600 ring-brand-500/15 dark:bg-brand-500/10 dark:text-brand-300',
  emerald:
    'bg-emerald-50 text-emerald-600 ring-emerald-500/15 dark:bg-emerald-500/10 dark:text-emerald-300',
  violet: 'bg-violet-50 text-violet-600 ring-violet-500/15 dark:bg-violet-500/10 dark:text-violet-300',
  sky: 'bg-sky-50 text-sky-600 ring-sky-500/15 dark:bg-sky-500/10 dark:text-sky-300',
}

function SnapshotRow({ icon: Icon, label, value, tone = 'brand' }) {
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <span className="flex items-center gap-3">
        <span
          className={cn(
            'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
            SNAP_TONES[tone] || SNAP_TONES.brand,
          )}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.1} />
        </span>
        <span className="text-sm font-medium text-ink-soft dark:text-slate-400">{label}</span>
      </span>
      <span className="font-display text-sm font-bold text-ink dark:text-slate-100">{value}</span>
    </li>
  )
}
