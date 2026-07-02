import { useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  FiArrowLeft,
  FiUsers,
  FiUserX,
  FiUserCheck,
  FiCheckCircle,
  FiPercent,
  FiDollarSign,
  FiAward,
  FiTarget,
  FiTrendingUp,
  FiStar,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
} from 'react-icons/fi'

import { cn } from '@/utils/cn'
import { formatCurrency, formatNumber, formatPercent, formatDate } from '@/utils/format'

import {
  fetchStaffMember,
  selectStaffById,
  selectStaffStatus,
} from '@/redux/slices/staffSlice'

import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import StatusBadge from '@/components/ui/StatusBadge'
import ProgressBar from '@/components/ui/ProgressBar'
import AchievementBadge from '@/components/ui/AchievementBadge'
import KPICard from '@/components/cards/KPICard'
import ChartCard from '@/components/cards/ChartCard'
import DataTable from '@/components/data/DataTable'
import EmptyState from '@/components/feedback/EmptyState'
import { LineChartView } from '@/components/charts'

import { achievementStyleFromPct } from '@/utils/achievement'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const scoreTone = (score) => {
  if (score >= 85) return 'green'
  if (score >= 70) return 'brand'
  if (score >= 55) return 'amber'
  return 'red'
}

// Deterministic pseudo-random based on a string seed, so charts are stable.
function seededFactors(seed, count) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const out = []
  for (let i = 0; i < count; i += 1) {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    out.push((((h >>> 0) % 1000) / 1000) * 0.5 + 0.65) // range ~0.65–1.15
  }
  return out
}

export default function StaffProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Read from the store (item or current); fetch the full member on mount.
  const member = useSelector(selectStaffById(id))
  const staffStatus = useSelector(selectStaffStatus)

  useEffect(() => {
    if (id) dispatch(fetchStaffMember(id))
  }, [id, dispatch])

  // Numeric metrics from the API, guarded so missing values never crash.
  const revenue = Number(member?.revenue) || 0
  const target = Number(member?.target) || 0

  // Hooks must run regardless of whether member exists.
  const salesHistory = useMemo(() => {
    if (!member) return []
    const months = 6
    const factors = seededFactors(member.id, months)
    const fSum = factors.reduce((a, b) => a + b, 0) || 1
    const startIdx = 0
    return factors.map((f, i) => ({
      month: MONTH_LABELS[(startIdx + i) % 12],
      revenue: Math.round((revenue * (f / fSum)) / 1000) * 1000,
      target: Math.round(target / months / 1000) * 1000,
    }))
  }, [member, revenue, target])

  // Related collections come from the API member payload when present.
  const assignedLeads = useMemo(
    () => (member?.assignedLeadsList || member?.recentLeads || []),
    [member],
  )

  const wonLeadHistory = useMemo(
    () =>
      (member?.leadHistory || assignedLeads).filter(
        (l) => l.status === 'Won' || l.status === 'Lost',
      ),
    [member, assignedLeads],
  )

  const incentives = useMemo(() => member?.incentives || [], [member])

  // ----- Loading -----
  const isLoading = !member && (staffStatus === 'loading' || staffStatus === 'idle')
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="space-y-6"
      >
        <div className="h-9 w-32 animate-pulse rounded-lg bg-surface-muted dark:bg-slate-800" />
        <div className="card relative overflow-hidden">
          <div className="h-28 animate-pulse bg-surface-muted dark:bg-slate-800 sm:h-32" />
          <div className="px-5 pb-5 sm:px-7 sm:pb-7">
            <div className="-mt-12 h-20 w-20 animate-pulse rounded-full bg-surface-muted ring-4 ring-white dark:bg-slate-800 dark:ring-slate-900 sm:h-24 sm:w-24" />
            <div className="mt-4 h-6 w-48 animate-pulse rounded bg-surface-muted dark:bg-slate-800" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-muted dark:bg-slate-800" />
          ))}
        </div>
      </motion.div>
    )
  }

  // ----- Not found -----
  if (!member) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="space-y-6"
      >
        <Button variant="outline" leftIcon={<FiArrowLeft />} onClick={() => navigate('/staff')}>
          Back to Staff
        </Button>
        <div className="card">
          <EmptyState
            icon={FiUserX}
            title="Staff member not found"
            description={`We couldn't find a staff member with ID "${id}". They may have been removed or the link is incorrect.`}
            action={
              <Button variant="primary" to="/staff" leftIcon={<FiUsers />}>
                View all staff
              </Button>
            }
            className="py-16"
          />
        </div>
      </motion.div>
    )
  }

  // ----- Table columns -----
  const leadColumns = [
    {
      key: 'id',
      header: 'Lead ID',
      width: '110px',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">
          {row.id}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Customer',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.name} size="xs" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink dark:text-slate-100">{row.name}</p>
            <p className="truncate text-xs text-ink-soft dark:text-slate-400">
              {row.company || 'Individual'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      render: (row) => (
        <span className="whitespace-nowrap text-sm text-ink dark:text-slate-200">{row.product}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} withDot />,
    },
    {
      key: 'value',
      header: 'Value',
      align: 'right',
      render: (row) => (
        <span className="whitespace-nowrap font-semibold tabular-nums text-ink dark:text-slate-100">
          {formatCurrency(row.value, { compact: true })}
        </span>
      ),
    },
    {
      key: 'createdDate',
      header: 'Created',
      align: 'right',
      render: (row) => (
        <span className="whitespace-nowrap text-sm text-ink-soft dark:text-slate-400">
          {formatDate(row.createdDate)}
        </span>
      ),
    },
  ]

  const historyColumns = [
    {
      key: 'id',
      header: 'Lead ID',
      width: '110px',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">
          {row.id}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Customer',
      render: (row) => (
        <span className="truncate font-medium text-ink dark:text-slate-100">{row.name}</span>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      render: (row) => (
        <span className="whitespace-nowrap text-sm text-ink-soft dark:text-slate-300">{row.product}</span>
      ),
    },
    {
      key: 'status',
      header: 'Outcome',
      render: (row) => <StatusBadge status={row.status} withDot />,
    },
    {
      key: 'lastActivity',
      header: 'Last Activity',
      align: 'right',
      render: (row) => (
        <span className="whitespace-nowrap text-sm text-ink-soft dark:text-slate-400">
          {formatDate(row.lastActivity)}
        </span>
      ),
    },
  ]

  const incentiveColumns = [
    {
      key: 'product',
      header: 'Product',
      render: (row) => (
        <span className="font-medium text-ink dark:text-slate-100">{row.product}</span>
      ),
    },
    {
      key: 'targetQty',
      header: 'Target',
      align: 'right',
      render: (row) => (
        <span className="tabular-nums text-ink-soft dark:text-slate-300">{formatNumber(row.targetQty)}</span>
      ),
    },
    {
      key: 'achievedQty',
      header: 'Achieved',
      align: 'right',
      render: (row) => (
        <span className="tabular-nums text-ink-soft dark:text-slate-300">{formatNumber(row.achievedQty)}</span>
      ),
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
      key: 'amount',
      header: 'Incentive',
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
      align: 'right',
      render: (row) => <StatusBadge status={row.status} withDot />,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6"
    >
      <PageHeader
        title={member.name}
        subtitle={`${member.role} • ${member.branchName}`}
        actions={
          <Button variant="outline" leftIcon={<FiArrowLeft />} onClick={() => navigate('/staff')}>
            Back to Staff
          </Button>
        }
      />

      {/* Profile header */}
      <div className="card relative overflow-hidden">
        <div className="relative h-28 bg-brand-gradient sm:h-32">
          <div className="absolute inset-0 bg-mesh opacity-40" aria-hidden />
        </div>

        <div className="px-5 pb-5 sm:px-7 sm:pb-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
              <div className="-mt-14 shrink-0 rounded-full ring-4 ring-white dark:ring-slate-900 sm:-mt-16">
                <Avatar
                  name={member.name}
                  color={member.avatarColor}
                  size="lg"
                  className="!h-20 !w-20 !text-2xl sm:!h-24 sm:!w-24 sm:!text-3xl"
                />
              </div>

              <div className="min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="font-display text-xl font-bold text-ink dark:text-slate-100 sm:text-2xl">
                    {member.name}
                  </h2>
                  <StatusBadge
                    status={member.status === 'active' ? 'Active' : 'Pending'}
                    withDot
                    size="md"
                  />
                  <Badge tone={scoreTone(member.performanceScore || 0)} size="md">
                    {member.performanceScore ?? 0} pts
                  </Badge>
                </div>
                <p className="mt-1 text-sm font-medium text-ink-soft dark:text-slate-400">
                  {member.role}
                  <span className="px-1.5 text-ink-faint dark:text-slate-600">•</span>
                  {member.branchName}
                </p>
                <div className="mt-2 flex items-center gap-1 text-sm font-semibold text-amber-500 dark:text-amber-300">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <FiStar
                      key={i}
                      className={cn(
                        'h-4 w-4',
                        i < Math.round(member.rating || 0)
                          ? 'fill-current'
                          : 'text-ink-faint/40 dark:text-slate-700',
                      )}
                    />
                  ))}
                  <span className="ml-1 text-ink-soft dark:text-slate-400">
                    {Number(member.rating || 0).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact strip */}
          <div className="mt-6 grid grid-cols-1 gap-3 border-t border-line pt-5 sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-800">
            <ContactRow icon={FiMail} label="Email" value={member.email} href={`mailto:${member.email}`} />
            <ContactRow icon={FiPhone} label="Phone" value={member.phone} href={`tel:${member.phone}`} />
            <ContactRow icon={FiMapPin} label="Branch" value={member.branchName} />
            <ContactRow icon={FiCalendar} label="Joined" value={formatDate(member.joinDate)} />
          </div>
        </div>
      </div>

      {/* Performance KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard label="Assigned Leads" value={member.assignedLeads ?? 0} icon={FiUsers} tone="brand" />
        <KPICard label="Won Leads" value={member.wonLeads ?? 0} icon={FiCheckCircle} tone="emerald" />
        <KPICard
          label="Conversion Rate"
          value={member.conversionRate ?? 0}
          suffix="%"
          icon={FiPercent}
          tone="violet"
        />
        <KPICard
          label="Revenue"
          value={formatCurrency(revenue, { compact: true })}
          icon={FiDollarSign}
          tone="sky"
        />
        <KPICard
          label="Incentive Earned"
          value={formatCurrency(member.incentiveEarned || 0, { compact: true })}
          icon={FiAward}
          tone="amber"
        />
        <KPICard
          label="Performance Score"
          value={member.performanceScore ?? 0}
          suffix=" pts"
          icon={FiTrendingUp}
          tone={(member.performanceScore || 0) >= 70 ? 'emerald' : 'rose'}
        />
      </div>

      {/* Target achievement */}
      <div className="card p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20">
            <FiTarget className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold text-ink dark:text-slate-100">
              Target Achievement
            </h3>
            <p className="text-sm text-ink-soft dark:text-slate-400">
              Units sold against assigned target
            </p>
          </div>
          <AchievementBadge
            pct={member.achievement || 0}
            size="md"
            withLabel
            className="ml-auto"
          />
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <div className="mb-2 flex items-end justify-between gap-2">
              <span className="text-sm text-ink-soft dark:text-slate-400">Achievement</span>
              <span
                className={cn(
                  'font-display text-2xl font-bold',
                  achievementStyleFromPct(member.achievement || 0).text,
                )}
              >
                {formatPercent(member.achievement || 0, 0)}
              </span>
            </div>
            <ProgressBar
              value={member.achievement || 0}
              color={achievementStyleFromPct(member.achievement || 0).bar}
              size="lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-line pt-5 dark:border-slate-800">
            <MiniStat
              icon={FiDollarSign}
              label="Revenue generated"
              value={formatCurrency(revenue)}
              tone="emerald"
            />
            <MiniStat
              icon={FiTarget}
              label="Assigned target"
              value={formatCurrency(target)}
              tone="brand"
            />
          </div>
        </div>
      </div>

      {/* Sales history (only chart) */}
      <ChartCard
        title="Sales History"
        subtitle="Monthly revenue vs target"
        icon={FiTrendingUp}
        height={300}
      >
        <LineChartView
          data={salesHistory}
          xKey="month"
          lines={[
            { key: 'revenue', name: 'Revenue', color: '#36bab3' },
            { key: 'target', name: 'Target', color: '#6366f1' },
          ]}
          height={300}
          showLegend
          tooltipFormatter={(v) => formatCurrency(v, { compact: true })}
        />
      </ChartCard>

      {/* Assigned leads */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-lg font-semibold text-ink dark:text-slate-100">
            Assigned Leads
          </h3>
          <Badge tone="brand" size="md">
            {formatNumber(assignedLeads.length)} total
          </Badge>
        </div>
        <DataTable
          columns={leadColumns}
          data={assignedLeads}
          onRowClick={(row) => navigate(`/leads/${row.id}`)}
          emptyTitle="No assigned leads"
          emptyDescription="This staff member has no leads assigned to them yet."
          emptyIcon={FiUsers}
        />
      </section>

      {/* Lead history + Incentive history */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-lg font-semibold text-ink dark:text-slate-100">
              Lead History
            </h3>
            <Badge tone="gray" size="md">
              {formatNumber(wonLeadHistory.length)} closed
            </Badge>
          </div>
          <DataTable
            columns={historyColumns}
            data={wonLeadHistory}
            onRowClick={(row) => navigate(`/leads/${row.id}`)}
            emptyTitle="No closed leads"
            emptyDescription="No won or lost leads recorded for this staff member yet."
            emptyIcon={FiUserCheck}
          />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-lg font-semibold text-ink dark:text-slate-100">
              Incentive History
            </h3>
            <Badge tone="amber" size="md">
              {formatCurrency(
                incentives.reduce((s, x) => s + (Number(x.amount) || 0), 0),
                { compact: true },
              )}{' '}
              earned
            </Badge>
          </div>
          <DataTable
            columns={incentiveColumns}
            data={incentives}
            emptyTitle="No incentive records"
            emptyDescription="This staff member has no incentive history yet."
            emptyIcon={FiAward}
          />
        </section>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function ContactRow({ icon: Icon, label, value, href }) {
  const inner = (
    <span className="flex min-w-0 items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-brand-500 ring-1 ring-line/70 dark:bg-slate-800 dark:ring-slate-700/70">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-medium uppercase tracking-wide text-ink-faint dark:text-slate-500">
          {label}
        </span>
        <span className="block truncate text-sm font-medium text-ink dark:text-slate-200">
          {value}
        </span>
      </span>
    </span>
  )

  if (href) {
    return (
      <a
        href={href}
        className="block rounded-xl p-1 transition-colors hover:bg-surface-muted/60 dark:hover:bg-slate-800/40"
      >
        {inner}
      </a>
    )
  }
  return <div className="p-1">{inner}</div>
}

const MINI_TONES = {
  brand: 'bg-brand-50 text-brand-600 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20',
  emerald:
    'bg-emerald-50 text-emerald-600 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20',
}

function MiniStat({ icon: Icon, label, value, tone = 'brand' }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1',
          MINI_TONES[tone] || MINI_TONES.brand,
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-faint dark:text-slate-500">
          {label}
        </p>
        <p className="truncate font-display text-base font-bold text-ink dark:text-slate-100">
          {value}
        </p>
      </div>
    </div>
  )
}
