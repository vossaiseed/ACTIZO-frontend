import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import {
  FiUsers,
  FiTrendingUp,
  FiDollarSign,
  FiAward,
  FiDownload,
  FiChevronDown,
  FiRotateCcw,
  FiStar,
  FiTarget,
  FiArrowRight,
  FiCheckCircle,
  FiUserCheck,
  FiUserPlus,
  FiEdit3,
  FiPower,
  FiKey,
  FiMoreVertical,
  FiX,
  FiSave,
  FiRefreshCw,
  FiEye,
  FiEyeOff,
} from 'react-icons/fi'

import { cn } from '@/utils/cn'
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format'
import { achievementStyleFromPct } from '@/utils/achievement'
import {
  searchData,
  applyFilters,
  sortData,
  paginate,
  totalPages,
  sum,
} from '@/utils/helpers'
import { exportData } from '@/utils/export'

import {
  selectStaff,
  selectStaffStatus,
  setFilter,
  setSort,
  setPage,
  resetFilters,
  addStaff,
  updateStaff,
  toggleStaffStatus,
  resetStaffPin,
  fetchStaff,
} from '@/redux/slices/staffSlice'
import { fetchBranches, selectBranchOptions } from '@/redux/slices/branchSlice'
import { selectUser, selectRoleKey } from '@/redux/slices/authSlice'

import { ROLES } from '@/constants'

import PageHeader from '@/components/common/PageHeader'
import SearchBar from '@/components/common/SearchBar'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import StatusBadge from '@/components/ui/StatusBadge'
import ProgressBar from '@/components/ui/ProgressBar'
import Pagination from '@/components/ui/Pagination'
import Dropdown from '@/components/ui/Dropdown'
import KPICard from '@/components/cards/KPICard'
import EmptyState from '@/components/feedback/EmptyState'
import Modal from '@/components/overlay/Modal'
import Input from '@/components/ui/Input'
import { SkeletonCard } from '@/components/feedback/Skeleton'
import { useToast } from '@/components/feedback/Toast'

// ---------------------------------------------------------------------------
// Select option builders (prepend an "All" sentinel for filter selects)
// ---------------------------------------------------------------------------
const ALL = { value: 'All', label: 'All' }
const toOpts = (arr) => arr.map((v) => ({ value: v, label: v }))

const ROLE_FILTER_OPTS = [ALL, ...toOpts(ROLES)]
const STATUS_FILTER_OPTS = [
  ALL,
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const SEARCH_KEYS = ['name', 'email', 'role', 'branchName']

const EXPORT_COLUMNS = [
  { key: 'id', label: 'Staff ID' },
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'branchName', label: 'Branch' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'assignedLeads', label: 'Assigned Leads' },
  { key: 'wonLeads', label: 'Won Leads' },
  { key: 'conversionRate', label: 'Conversion %' },
  { key: 'revenue', label: 'Revenue (AED)' },
  { key: 'target', label: 'Target (AED)' },
  { key: 'achievement', label: 'Achievement %' },
  { key: 'incentiveEarned', label: 'Incentive (AED)' },
  { key: 'performanceScore', label: 'Performance Score' },
  { key: 'rating', label: 'Rating' },
]

const scoreTone = (score) => {
  if (score >= 85) return 'green'
  if (score >= 70) return 'brand'
  if (score >= 55) return 'amber'
  return 'red'
}

// ---------------------------------------------------------------------------
// Staff card
// ---------------------------------------------------------------------------
function StaffCard({ member, onView, onEdit, onToggle, onResetPin, canManage }) {
  const [showPin, setShowPin] = useState(false)
  const stats = [
    { label: 'Assigned', value: formatNumber(member.assignedLeads) },
    { label: 'Won', value: formatNumber(member.wonLeads) },
    { label: 'Conv.', value: formatPercent(member.conversionRate, 0) },
  ]

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0 },
      }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className="card-hover card group flex flex-col overflow-hidden"
    >
      {/* Banner */}
      <div className="relative h-16 bg-brand-gradient">
        <div className="absolute inset-0 bg-mesh opacity-40" aria-hidden />
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-amber-600 shadow-soft backdrop-blur dark:bg-slate-900/80 dark:text-amber-300">
          <FiStar className="h-3.5 w-3.5 fill-current" />
          {Number(member.rating || 0).toFixed(1)}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5">
        {/* Identity */}
        <div className="-mt-8 flex items-end justify-between gap-3">
          <div className="rounded-full ring-4 ring-white dark:ring-slate-900">
            <Avatar name={member.name} color={member.avatarColor} size="lg" />
          </div>
          <Badge tone={scoreTone(member.performanceScore)} size="md" className="mb-1">
            {member.performanceScore} pts
          </Badge>
        </div>

        <div className="mt-3 min-w-0">
          <h3 className="truncate font-display text-base font-semibold text-ink dark:text-slate-100">
            {member.name}
          </h3>
          <p className="mt-0.5 truncate text-sm text-ink-soft dark:text-slate-400">
            {member.role}
            <span className="px-1.5 text-ink-faint dark:text-slate-600">•</span>
            {member.branchName}
          </p>
        </div>

        {/* Login PIN (show / hide) */}
        {canManage && member.pin && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-surface-muted/60 px-3 py-2 text-xs font-medium text-ink-soft dark:bg-slate-800/50 dark:text-slate-400">
            <FiKey className="h-3.5 w-3.5 shrink-0" />
            <span>Login PIN</span>
            <span className="font-mono text-sm font-bold tracking-[0.3em] text-ink dark:text-slate-100">
              {showPin ? member.pin : '••••••'}
            </span>
            <button
              type="button"
              onClick={() => setShowPin((s) => !s)}
              aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
              aria-pressed={showPin}
              className="ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-brand-600 transition hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-slate-800"
            >
              {showPin ? <FiEyeOff className="h-3.5 w-3.5" /> : <FiEye className="h-3.5 w-3.5" />}
              {showPin ? 'Hide' : 'Show'}
            </button>
          </div>
        )}

        {/* Key stats */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl bg-surface-muted/70 px-2 py-2 text-center ring-1 ring-line/60 dark:bg-slate-800/50 dark:ring-slate-700/50"
            >
              <p className="text-sm font-display font-bold text-ink dark:text-slate-100">
                {s.value}
              </p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint dark:text-slate-500">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Revenue */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft dark:text-slate-400">
            <FiDollarSign className="h-3.5 w-3.5 text-brand-500" />
            Revenue
          </span>
          <span className="font-display text-sm font-bold text-ink dark:text-slate-100">
            {formatCurrency(member.revenue, { compact: true })}
          </span>
        </div>

        {/* Achievement */}
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-ink-soft dark:text-slate-400">
              Target Achievement
            </span>
            <span
              className={cn(
                'text-xs font-semibold tabular-nums',
                achievementStyleFromPct(member.achievement).text,
              )}
            >
              {formatPercent(member.achievement, 0)}
            </span>
          </div>
          <ProgressBar
            value={member.achievement}
            color={achievementStyleFromPct(member.achievement).bar}
            size="sm"
          />
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center gap-2 border-t border-line pt-4 dark:border-slate-800">
          <StatusBadge status={member.status === 'active' ? 'Active' : 'Inactive'} withDot />
          {canManage && (
            <Dropdown
              align="right"
              trigger={
                <button
                  type="button"
                  aria-label="Manage staff"
                  className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft transition hover:bg-surface-muted hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <FiMoreVertical className="h-4 w-4" />
                </button>
              }
              items={[
                { label: 'Edit staff', icon: <FiEdit3 />, onClick: () => onEdit(member) },
                {
                  label: member.status === 'active' ? 'Deactivate' : 'Activate',
                  icon: <FiPower />,
                  onClick: () => onToggle(member),
                },
                { label: 'Reset PIN', icon: <FiKey />, onClick: () => onResetPin(member) },
              ]}
            />
          )}
          <Button
            variant="outline"
            size="sm"
            rightIcon={<FiArrowRight />}
            onClick={() => onView(member.id)}
            className="ml-auto"
          >
            View Profile
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Leaderboard (top performers)
// ---------------------------------------------------------------------------
const MEDALS = ['text-amber-500', 'text-slate-400', 'text-amber-700']

function Leaderboard({ items, onView }) {
  if (!items.length) return null

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20">
          <FiAward className="h-[18px] w-[18px]" />
        </span>
        <div>
          <h3 className="font-display text-base font-semibold text-ink dark:text-slate-100">
            Top Performers
          </h3>
          <p className="text-sm text-ink-soft dark:text-slate-400">
            Ranked by performance score
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-2">
        {items.map((m, i) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => onView(m.id)}
              className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-surface-muted/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:hover:bg-slate-800/50"
            >
              <span
                className={cn(
                  'w-5 shrink-0 text-center font-display text-sm font-bold tabular-nums',
                  i < 3 ? MEDALS[i] : 'text-ink-faint dark:text-slate-500',
                )}
              >
                {i + 1}
              </span>
              <Avatar name={m.name} color={m.avatarColor} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink dark:text-slate-100">
                  {m.name}
                </p>
                <p className="truncate text-xs text-ink-soft dark:text-slate-400">
                  {m.branchName}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display text-sm font-bold text-brand-600 dark:text-brand-400">
                  {m.performanceScore}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-ink-faint dark:text-slate-500">
                  score
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function StaffList() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const toast = useToast()

  const allStaff = useSelector(selectStaff)
  const staffStatus = useSelector(selectStaffStatus)
  const user = useSelector(selectUser)
  const roleKey = useSelector(selectRoleKey)
  const isBranchManager = roleKey === 'branch_manager'
  const isAdmin = roleKey === 'admin'
  const canManage = isAdmin || isBranchManager

  // Branch options sourced from the backend (real branch UUIDs) for the
  // create/edit form's Branch select and the branch filter.
  const branchOptions = useSelector(selectBranchOptions)
  const BRANCH_FILTER_OPTS = useMemo(() => [ALL, ...branchOptions], [branchOptions])

  // The backend is the single source of truth for branch isolation: it already
  // returns ONLY the manager's branch staff (managers) or every staff (admin).
  // We must NOT re-filter on the client — a stale/placeholder user.branchId would
  // wrongly hide all staff. Trust the API response.
  const staff = allStaff

  const filters = useSelector((s) => s.staff.filters)
  const sort = useSelector((s) => s.staff.sort)
  const page = useSelector((s) => s.staff.page)
  const pageSize = useSelector((s) => s.staff.pageSize)

  const loading = staffStatus === 'loading' || staffStatus === 'idle'
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  // Load staff + branches (real branch UUIDs for the form) from the API on mount.
  useEffect(() => {
    dispatch(fetchStaff())
    dispatch(fetchBranches())
  }, [dispatch])

  // KPIs (over the full staff set, independent of filters)
  const kpis = useMemo(
    () => ({
      total: staff.length,
      avgScore: staff.length
        ? Math.round((sum(staff, 'performanceScore') / staff.length) * 10) / 10
        : 0,
      totalRevenue: sum(staff, 'revenue'),
      totalIncentives: sum(staff, 'incentiveEarned'),
    }),
    [staff],
  )

  // Pipeline: search → filter → sort
  const filtered = useMemo(() => {
    const searched = searchData(staff, filters.search, SEARCH_KEYS)
    const onlyFiltered = applyFilters(
      searched,
      { branch: filters.branch, role: filters.role, status: filters.status },
      { branch: 'branchId', role: 'role', status: 'status' },
    )
    return sortData(onlyFiltered, sort.key, sort.dir)
  }, [staff, filters, sort])

  const total = filtered.length
  const pageCount = totalPages(total, pageSize)

  useEffect(() => {
    if (page > pageCount) dispatch(setPage(pageCount))
  }, [page, pageCount, dispatch])

  const pageRows = useMemo(
    () => paginate(filtered, Math.min(page, pageCount), pageSize),
    [filtered, page, pageCount, pageSize],
  )

  const leaders = useMemo(
    () => [...staff].sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 5),
    [staff],
  )

  const handleFilter = (key, value) => dispatch(setFilter({ key, value }))
  const handleView = (id) => navigate(`/staff/${id}`)

  /* ----- Staff management (Branch Manager only) ----- */
  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (member) => {
    setEditing(member)
    setFormOpen(true)
  }
  const handleToggle = (member) => {
    dispatch(toggleStaffStatus(member.id))
    toast.success(`${member.name} is now ${member.status === 'active' ? 'Inactive' : 'Active'}.`)
  }
  // Backend generates the new PIN and returns it once.
  const handleResetPin = (member) => {
    dispatch(resetStaffPin(member.id))
      .unwrap()
      .then(({ pin }) => {
        toast.success(`New PIN for ${member.name}: ${pin}`, { title: 'PIN reset' })
      })
      .catch((err) => {
        toast.error(err || 'Failed to reset PIN.', { title: 'PIN reset failed' })
      })
  }
  const handleSaveStaff = (data, isEdit) => {
    if (isEdit) {
      dispatch(updateStaff(data))
        .unwrap()
        .then(() => toast.success(`${data.name} updated.`, { title: 'Staff updated' }))
        .catch((err) => toast.error(err || 'Failed to update staff.', { title: 'Update failed' }))
      setFormOpen(false)
    } else {
      // Backend creates the staff and returns the one-time plaintext PIN.
      dispatch(addStaff(data))
        .unwrap()
        .then((staff) => {
          toast.success(`${staff.name} created — PIN ${staff.pin}`, {
            title: 'Sales staff created',
          })
          setFormOpen(false)
        })
        .catch((err) => toast.error(err || 'Failed to create staff.', { title: 'Create failed' }))
    }
  }

  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.branch !== 'All' ||
    filters.role !== 'All' ||
    filters.status !== 'All'

  const handleExport = (format) => {
    if (!filtered.length) {
      toast.warning('Nothing to export — no staff match the current filters.')
      return
    }
    exportData(format, filtered, 'actizo-staff', EXPORT_COLUMNS)
    toast.success(`Exported ${filtered.length} staff members as ${format.toUpperCase()}.`)
  }

  const SORT_OPTS = [
    { value: 'performanceScore', label: 'Sort: Performance' },
    { value: 'revenue', label: 'Sort: Revenue' },
    { value: 'conversionRate', label: 'Sort: Conversion' },
    { value: 'achievement', label: 'Sort: Achievement' },
    { value: 'name', label: 'Sort: Name' },
  ]

  const exportItems = [
    { label: 'Export as CSV', icon: <FiDownload className="h-4 w-4" />, onClick: () => handleExport('csv') },
    { label: 'Export as Excel', icon: <FiDownload className="h-4 w-4" />, onClick: () => handleExport('excel') },
    { label: 'Export as PDF', icon: <FiDownload className="h-4 w-4" />, onClick: () => handleExport('pdf') },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6"
    >
      <PageHeader
        title="Staff"
        subtitle="Manage your sales team, track performance and reward top achievers."
        icon={FiUsers}
        actions={
          <>
            <Dropdown
              align="right"
              trigger={
                <Button variant="outline" leftIcon={<FiDownload />} rightIcon={<FiChevronDown />}>
                  Export
                </Button>
              }
              items={exportItems}
            />
            {canManage && (
              <Button leftIcon={<FiUserPlus />} onClick={openCreate}>
                Create Sales Staff
              </Button>
            )}
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Total Staff" value={kpis.total} icon={FiUsers} tone="brand" />
        <KPICard
          label="Avg Performance Score"
          value={kpis.avgScore}
          suffix=" pts"
          icon={FiTrendingUp}
          tone="violet"
        />
        <KPICard
          label="Total Revenue"
          value={formatCurrency(kpis.totalRevenue, { compact: true })}
          icon={FiDollarSign}
          tone="emerald"
        />
        <KPICard
          label="Total Incentives"
          value={formatCurrency(kpis.totalIncentives, { compact: true })}
          icon={FiAward}
          tone="amber"
        />
      </div>

      {/* Toolbar */}
      <div className="card p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
          <div className="sm:col-span-2 lg:col-span-4">
            <SearchBar
              value={filters.search}
              onChange={(v) => handleFilter('search', v)}
              placeholder="Search by name, email, role…"
            />
          </div>
          <Select
            aria-label="Filter by branch"
            options={BRANCH_FILTER_OPTS}
            value={filters.branch}
            onChange={(e) => handleFilter('branch', e.target.value)}
            containerClassName="lg:col-span-2"
          />
          <Select
            aria-label="Filter by role"
            options={ROLE_FILTER_OPTS}
            value={filters.role}
            onChange={(e) => handleFilter('role', e.target.value)}
            containerClassName="lg:col-span-2"
          />
          <Select
            aria-label="Filter by status"
            options={STATUS_FILTER_OPTS}
            value={filters.status}
            onChange={(e) => handleFilter('status', e.target.value)}
            containerClassName="lg:col-span-2"
          />
          <Select
            aria-label="Sort staff"
            options={SORT_OPTS}
            value={sort.key}
            onChange={(e) => dispatch(setSort(e.target.value))}
            containerClassName="lg:col-span-2"
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3 text-xs text-ink-soft dark:border-slate-800 dark:text-slate-400">
          <span>
            <span className="font-semibold text-ink dark:text-slate-200">{total}</span>{' '}
            {total === 1 ? 'staff member' : 'staff members'} found
          </span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<FiRotateCcw />}
              onClick={() => dispatch(resetFilters())}
            >
              Reset filters
            </Button>
          )}
        </div>
      </div>

      {/* Content: staff grid + leaderboard */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : total === 0 ? (
            <div className="card">
              <EmptyState
                icon={FiUsers}
                title="No staff found"
                description="No team members match your current search and filters. Try clearing them."
                action={
                  hasActiveFilters ? (
                    <Button
                      variant="outline"
                      leftIcon={<FiRotateCcw />}
                      onClick={() => dispatch(resetFilters())}
                    >
                      Reset filters
                    </Button>
                  ) : null
                }
                className="py-16"
              />
            </div>
          ) : (
            <>
              <motion.div
                variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                {pageRows.map((member) => (
                  <StaffCard
                    key={member.id}
                    member={member}
                    onView={handleView}
                    onEdit={openEdit}
                    onToggle={handleToggle}
                    onResetPin={handleResetPin}
                    canManage={canManage}
                  />
                ))}
              </motion.div>

              {total > 0 && (
                <Pagination
                  page={Math.min(page, pageCount)}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={(n) => dispatch(setPage(n))}
                />
              )}
            </>
          )}
        </div>

        {/* Leaderboard rail */}
        {!loading && (
          <aside className="space-y-6">
            <Leaderboard items={leaders} onView={handleView} />

            <div className="card p-5 sm:p-6">
              <h3 className="font-display text-base font-semibold text-ink dark:text-slate-100">
                Team Snapshot
              </h3>
              <div className="mt-4 space-y-3.5">
                <SnapshotRow
                  icon={FiUserCheck}
                  label="Active members"
                  value={formatNumber(staff.filter((s) => s.status === 'active').length)}
                />
                <SnapshotRow
                  icon={FiCheckCircle}
                  label="Leads won"
                  value={formatNumber(sum(staff, 'wonLeads'))}
                />
                <SnapshotRow
                  icon={FiTarget}
                  label="Avg achievement"
                  value={formatPercent(
                    staff.length ? sum(staff, 'achievement') / staff.length : 0,
                    0,
                  )}
                />
                <SnapshotRow
                  icon={FiTrendingUp}
                  label="Avg conversion"
                  value={formatPercent(
                    staff.length ? sum(staff, 'conversionRate') / staff.length : 0,
                    0,
                  )}
                />
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Create / Edit Sales Staff (Branch Manager only) */}
      <StaffFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        member={editing}
        branchOptions={branchOptions}
        defaultBranchId={isBranchManager ? user?.branchId : undefined}
        lockBranch={isBranchManager}
        onSave={handleSaveStaff}
      />
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Create / Edit Sales Staff form                                     */
/* ------------------------------------------------------------------ */
const STATUS_FORM_OPTS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]
const ROLE_FORM_OPTS = toOpts(ROLES)
const randomPin = () => String(Math.floor(100000 + Math.random() * 900000))

function StaffFormModal({ open, onClose, member, branchOptions = [], defaultBranchId, lockBranch, onSave }) {
  const isEdit = Boolean(member)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '', mobile: '', email: '', role: 'Sales Executive',
      branchId: defaultBranchId || branchOptions[0]?.value || '',
      pin: '', status: 'active',
    },
  })

  useEffect(() => {
    if (!open) return
    reset(
      member
        ? {
            name: member.name || '',
            mobile: member.phone || '',
            email: member.email || '',
            role: member.role || 'Sales Executive',
            branchId: member.branchId || defaultBranchId || branchOptions[0]?.value || '',
            pin: member.pin || '',
            status: member.status || 'active',
          }
        : {
            name: '', mobile: '', email: '', role: 'Sales Executive',
            branchId: defaultBranchId || branchOptions[0]?.value || '',
            pin: randomPin(),
            status: 'active',
          },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, member, branchOptions])

  const submit = (form) => {
    const branchId = lockBranch ? defaultBranchId || form.branchId : form.branchId
    if (isEdit) {
      // Backend derives display names from the ids; submit camelCase only.
      onSave(
        {
          id: member.id,
          name: form.name.trim(),
          firstName: form.name.trim().split(' ')[0],
          role: form.role,
          phone: form.mobile.trim(),
          email: form.email.trim(),
          branchId,
          status: form.status,
        },
        true,
      )
    } else {
      // Backend creates the staff (and the login PIN) from these camelCase fields.
      onSave(
        {
          name: form.name.trim(),
          firstName: form.name.trim().split(' ')[0],
          role: form.role,
          email: form.email.trim(),
          phone: form.mobile.trim(),
          pin: form.pin,
          branchId,
        },
        false,
      )
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Sales Staff' : 'Create Sales Staff'}
      description={
        isEdit
          ? 'Update this staff member’s details.'
          : 'Add a new sales staff member to your branch. They will sign in with the generated 6-digit PIN.'
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" leftIcon={<FiX />} onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="staff-form" leftIcon={<FiSave />}>
            {isEdit ? 'Save Changes' : 'Create Staff'}
          </Button>
        </>
      }
    >
      <form id="staff-form" onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Full Name" error={errors.name?.message} {...register('name', { required: 'Full name is required' })} />
        <Input label="Mobile Number" type="tel" placeholder="+91 9XXXX XXXXX" error={errors.mobile?.message} {...register('mobile', { required: 'Mobile number is required' })} />
        <Input label="Email" type="email" error={errors.email?.message} {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' } })} />
        <Select label="Role" options={ROLE_FORM_OPTS} {...register('role', { required: true })} />
        <Select label="Assigned Branch" options={branchOptions} disabled={lockBranch} {...register('branchId', { required: lockBranch ? false : 'Select a branch' })} error={errors.branchId?.message} hint={lockBranch ? 'Locked to your branch' : undefined} />
        {isEdit ? (
          <Select label="Status" options={STATUS_FORM_OPTS} {...register('status', { required: true })} />
        ) : (
          <Input label="6-Digit PIN" maxLength={6} inputMode="numeric" error={errors.pin?.message} {...register('pin', { required: 'PIN is required', pattern: { value: /^\d{6}$/, message: 'PIN must be exactly 6 digits' } })} />
        )}
      </form>
    </Modal>
  )
}

function SnapshotRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-2.5 text-sm text-ink-soft dark:text-slate-400">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-brand-500 ring-1 ring-line/70 dark:bg-slate-800 dark:ring-slate-700/70">
          <Icon className="h-4 w-4" />
        </span>
        {label}
      </span>
      <span className="font-display text-sm font-bold text-ink dark:text-slate-100">
        {value}
      </span>
    </div>
  )
}
