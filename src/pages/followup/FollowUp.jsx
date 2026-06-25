import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiPhoneCall,
  FiPhone,
  FiMail,
  FiUsers,
  FiMessageCircle,
  FiMapPin,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiPlus,
  FiArrowUpRight,
  FiChevronRight,
  FiActivity,
} from 'react-icons/fi'

import { cn } from '@/utils/cn'
import { formatDate, formatShortDate, formatRelativeTime } from '@/utils/format'
import { selectLeads, addFollowUp } from '@/redux/slices/leadSlice'
import { useToast } from '@/hooks/useToast'

import PageHeader from '@/components/common/PageHeader'
import SearchBar from '@/components/common/SearchBar'
import KPICard from '@/components/cards/KPICard'
import StatusBadge from '@/components/ui/StatusBadge'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Tabs from '@/components/ui/Tabs'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Modal from '@/components/overlay/Modal'
import EmptyState from '@/components/feedback/EmptyState'

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const FOLLOWUP_TYPES = ['Call', 'Email', 'Meeting', 'WhatsApp', 'Site Visit']
const FOLLOWUP_STATUSES = ['Completed', 'Scheduled', 'Missed']

/** Per-type icon + tinted chip styling (light + dark). */
const TYPE_CONFIG = {
  Call: {
    icon: FiPhone,
    chip: 'bg-brand-50 text-brand-600 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20',
  },
  Email: {
    icon: FiMail,
    chip: 'bg-violet-50 text-violet-600 ring-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/20',
  },
  Meeting: {
    icon: FiUsers,
    chip: 'bg-indigo-50 text-indigo-600 ring-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/20',
  },
  WhatsApp: {
    icon: FiMessageCircle,
    chip: 'bg-emerald-50 text-emerald-600 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20',
  },
  'Site Visit': {
    icon: FiMapPin,
    chip: 'bg-amber-50 text-amber-600 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20',
  },
}

const DEFAULT_TYPE_CONFIG = {
  icon: FiActivity,
  chip: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-500/20',
}

const typeConfig = (type) => TYPE_CONFIG[type] || DEFAULT_TYPE_CONFIG

const todayISO = () => new Date().toISOString().slice(0, 10)

/** Effective date used for sorting / grouping (nextDate wins, else date). */
const effectiveDate = (fu) => fu.nextDate || fu.date

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
}
const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
}

/* ------------------------------------------------------------------ */
/*  Feed item                                                          */
/* ------------------------------------------------------------------ */

function FeedItem({ fu, isLast }) {
  const { icon: Icon, chip } = typeConfig(fu.type)

  return (
    <motion.li
      variants={rowVariants}
      className={cn('relative flex gap-4', isLast ? 'pb-0' : 'pb-6')}
    >
      {/* Connector */}
      {!isLast && (
        <span
          aria-hidden
          className="absolute bottom-0 left-[21px] top-11 w-px bg-line dark:bg-slate-800"
        />
      )}

      {/* Type icon */}
      <span
        className={cn(
          'relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset',
          chip,
        )}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
      </span>

      {/* Body */}
      <div className="min-w-0 flex-1 rounded-2xl border border-line bg-white/60 p-4 shadow-soft transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <Link
            to={`/leads/${fu.leadId}`}
            className="group inline-flex items-center gap-1 truncate text-sm font-semibold text-ink transition-colors hover:text-brand-600 dark:text-slate-100 dark:hover:text-brand-300"
          >
            <span className="truncate">{fu.leadName}</span>
            <FiArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>

          <Badge tone="gray" size="sm" className="font-medium">
            {fu.type}
          </Badge>
          <StatusBadge status={fu.status} size="sm" withDot />
        </div>

        {/* Product / branch context */}
        <p className="mt-1 truncate text-xs text-ink-soft dark:text-slate-400">
          {fu.product}
          {fu.branchName ? <span className="text-ink-faint dark:text-slate-500"> · {fu.branchName}</span> : null}
        </p>

        {fu.remark ? (
          <p className="mt-2 text-sm leading-relaxed text-ink-soft dark:text-slate-300">
            {fu.remark}
          </p>
        ) : null}

        {/* Footer */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
          {fu.nextDate ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2 py-1 font-semibold text-brand-700 ring-1 ring-inset ring-brand-500/15 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20">
              <FiCalendar className="h-3.5 w-3.5" />
              Next: {formatDate(fu.nextDate)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-ink-faint dark:text-slate-500">
              <FiCalendar className="h-3.5 w-3.5" />
              {formatDate(fu.date)}
            </span>
          )}

          <span className="flex flex-wrap items-center gap-1.5 text-ink-faint dark:text-slate-500">
            {fu.staffName && fu.staffName !== 'Unassigned' ? (
              <span className="font-medium text-ink-soft dark:text-slate-400">{fu.staffName}</span>
            ) : (
              <span className="font-medium text-ink-soft dark:text-slate-400">{fu.by}</span>
            )}
            <span aria-hidden>•</span>
            <span title={formatDate(effectiveDate(fu), 'dd MMM yyyy')}>
              {formatRelativeTime(effectiveDate(fu))}
            </span>
          </span>
        </div>
      </div>
    </motion.li>
  )
}

/* ------------------------------------------------------------------ */
/*  Feed group                                                         */
/* ------------------------------------------------------------------ */

function FeedGroup({ title, icon: Icon, tone, items }) {
  if (!items.length) return null

  return (
    <div>
      <div className="mb-4 flex items-center gap-2.5">
        <span
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg ring-1 ring-inset',
            tone,
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2.4} />
        </span>
        <h3 className="text-sm font-semibold text-ink dark:text-slate-100">{title}</h3>
        <Badge tone="gray" size="sm" className="tabular-nums">
          {items.length}
        </Badge>
      </div>

      <motion.ol variants={listVariants} initial="hidden" animate="show" className="relative">
        {items.map((fu, i) => (
          <FeedItem key={fu.id} fu={fu} isLast={i === items.length - 1} />
        ))}
      </motion.ol>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Add Follow-Up Modal                                               */
/* ------------------------------------------------------------------ */

function AddFollowUpModal({ open, onClose, leadOptions, leadMap }) {
  const dispatch = useDispatch()
  const toast = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      leadId: leadOptions[0]?.value ?? '',
      type: 'Call',
      status: 'Scheduled',
      date: todayISO(),
      nextDate: '',
      remark: '',
    },
  })

  const close = () => {
    reset()
    onClose()
  }

  const onSubmit = (data) => {
    const lead = leadMap[data.leadId]
    if (!lead) {
      toast.error('Please select a valid lead.')
      return
    }

    const followUp = {
      id: `fu-${Date.now()}`,
      type: data.type,
      status: data.status,
      date: data.date,
      nextDate: data.status === 'Scheduled' ? data.nextDate || null : null,
      remark: data.remark?.trim() || 'No remark added.',
      by: lead.staffName && lead.staffName !== 'Unassigned' ? lead.staffName : 'Sales',
    }

    dispatch(addFollowUp({ leadId: data.leadId, followUp }))
    toast.success(`Follow-up scheduled for ${lead.name}.`, { title: 'Follow-up added' })
    close()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add Follow-Up"
      description="Log a new touchpoint and schedule the next action for a lead."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button leftIcon={<FiPlus />} onClick={handleSubmit(onSubmit)}>
            Add Follow-Up
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Select
          label="Lead"
          placeholder="Select a lead"
          options={leadOptions}
          error={errors.leadId?.message}
          {...register('leadId', { required: 'Please select a lead.' })}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Select
            label="Type"
            options={FOLLOWUP_TYPES.map((t) => ({ value: t, label: t }))}
            {...register('type', { required: true })}
          />
          <Select
            label="Status"
            options={FOLLOWUP_STATUSES.map((s) => ({ value: s, label: s }))}
            {...register('status', { required: true })}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink dark:text-slate-200">
              Date
            </label>
            <input
              type="date"
              className="input-base"
              {...register('date', { required: 'Date is required.' })}
            />
            {errors.date ? (
              <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                {errors.date.message}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink dark:text-slate-200">
              Next Follow-Up
            </label>
            <input type="date" className="input-base" {...register('nextDate')} />
            <p className="mt-1.5 text-xs text-ink-soft dark:text-slate-400">
              Used when the status is Scheduled.
            </p>
          </div>
        </div>

        <Textarea
          label="Remark"
          rows={3}
          placeholder="What was discussed or what's the next step?"
          {...register('remark')}
        />
      </form>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/*  Upcoming rail card                                                 */
/* ------------------------------------------------------------------ */

function UpcomingItem({ fu }) {
  const { icon: Icon, chip } = typeConfig(fu.type)
  const due = effectiveDate(fu)

  return (
    <Link
      to={`/leads/${fu.leadId}`}
      className="group flex items-center gap-3 rounded-xl border border-transparent p-2.5 transition-colors hover:border-line hover:bg-surface-muted dark:hover:border-slate-800 dark:hover:bg-slate-800/50"
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
          chip,
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={2.2} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-300">
          {fu.leadName}
        </p>
        <p className="truncate text-xs text-ink-soft dark:text-slate-400">
          {fu.type} · {fu.product}
        </p>
      </div>

      <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-2xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-500/15 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20">
        <FiClock className="h-3 w-3" />
        {formatShortDate(due)}
      </span>
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function FollowUp() {
  const leads = useSelector(selectLeads)
  const [modalOpen, setModalOpen] = useState(false)

  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [search, setSearch] = useState('')

  const today = todayISO()

  /* --- flat list across all leads --- */
  const allFollowUps = useMemo(
    () =>
      leads.flatMap((lead) =>
        (lead.followUps || []).map((fu) => ({
          ...fu,
          leadId: lead.id,
          leadName: lead.name,
          product: lead.product,
          branchName: lead.branchName,
          staffName: lead.staffName,
        })),
      ),
    [leads],
  )

  /* --- KPIs --- */
  const kpis = useMemo(() => {
    const scheduled = allFollowUps.filter((f) => f.status === 'Scheduled').length
    const completed = allFollowUps.filter((f) => f.status === 'Completed').length
    const missed = allFollowUps.filter((f) => f.status === 'Missed').length
    const dueToday = allFollowUps.filter(
      (f) => (f.nextDate && f.nextDate === today) || (!f.nextDate && f.date === today),
    ).length
    return { scheduled, completed, missed, dueToday }
  }, [allFollowUps, today])

  /* --- filtered list --- */
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return allFollowUps.filter((f) => {
      if (typeFilter !== 'All' && f.type !== typeFilter) return false
      if (statusFilter !== 'All' && f.status !== statusFilter) return false
      if (term) {
        const hay = `${f.leadName} ${f.product}`.toLowerCase()
        if (!hay.includes(term)) return false
      }
      return true
    })
  }, [allFollowUps, typeFilter, statusFilter, search])

  /* --- split into upcoming vs past --- */
  const { upcoming, past } = useMemo(() => {
    const up = []
    const pa = []
    filtered.forEach((f) => {
      const isUpcoming = f.status === 'Scheduled' && effectiveDate(f) >= today
      if (isUpcoming) up.push(f)
      else pa.push(f)
    })
    up.sort((a, b) => new Date(effectiveDate(a)) - new Date(effectiveDate(b)))
    pa.sort((a, b) => new Date(effectiveDate(b)) - new Date(effectiveDate(a)))
    return { upcoming: up, past: pa }
  }, [filtered, today])

  /* --- right rail: soonest scheduled --- */
  const upcomingRail = useMemo(
    () =>
      allFollowUps
        .filter((f) => f.status === 'Scheduled' && effectiveDate(f) >= today)
        .sort((a, b) => new Date(effectiveDate(a)) - new Date(effectiveDate(b)))
        .slice(0, 7),
    [allFollowUps, today],
  )

  /* --- modal options --- */
  const leadOptions = useMemo(
    () =>
      [...leads]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((l) => ({ value: l.id, label: `${l.name} — ${l.product}` })),
    [leads],
  )
  const leadMap = useMemo(() => Object.fromEntries(leads.map((l) => [l.id, l])), [leads])

  const typeTabs = [
    { key: 'All', label: 'All', count: allFollowUps.length },
    ...FOLLOWUP_TYPES.map((t) => ({
      key: t,
      label: t,
      count: allFollowUps.filter((f) => f.type === t).length,
    })),
  ]

  const statusOptions = [
    { value: 'All', label: 'All statuses' },
    ...FOLLOWUP_STATUSES.map((s) => ({ value: s, label: s })),
  ]

  const filtersActive = typeFilter !== 'All' || statusFilter !== 'All' || search.trim() !== ''
  const isEmpty = filtered.length === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6"
    >
      <PageHeader
        title="Follow-Ups"
        subtitle="Track every touchpoint and stay ahead of upcoming actions across all leads."
        icon={FiPhoneCall}
        actions={
          <Button leftIcon={<FiPlus />} onClick={() => setModalOpen(true)}>
            Add Follow-Up
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Scheduled" value={kpis.scheduled} icon={FiCalendar} tone="sky" />
        <KPICard label="Completed" value={kpis.completed} icon={FiCheckCircle} tone="emerald" />
        <KPICard label="Missed" value={kpis.missed} icon={FiXCircle} tone="rose" />
        <KPICard label="Due Today" value={kpis.dueToday} icon={FiClock} tone="brand" />
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="-mx-1 overflow-x-auto px-1 scrollbar-thin">
            <Tabs tabs={typeTabs} active={typeFilter} onChange={setTypeFilter} variant="pills" />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              containerClassName="sm:w-44"
              aria-label="Filter by status"
            />
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search lead or product…"
              className="sm:w-72"
            />
          </div>
        </div>
      </Card>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Activity feed */}
        <div className="lg:col-span-2">
          <Card>
            {isEmpty ? (
              <EmptyState
                icon={FiPhoneCall}
                title="No follow-ups found"
                description={
                  filtersActive
                    ? 'No follow-ups match your current filters. Try clearing the search or selecting a different type.'
                    : 'There are no follow-ups yet. Add your first follow-up to start tracking touchpoints.'
                }
                action={
                  filtersActive ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setTypeFilter('All')
                        setStatusFilter('All')
                        setSearch('')
                      }}
                    >
                      Clear filters
                    </Button>
                  ) : (
                    <Button leftIcon={<FiPlus />} onClick={() => setModalOpen(true)}>
                      Add Follow-Up
                    </Button>
                  )
                }
              />
            ) : (
              <div className="space-y-8">
                <FeedGroup
                  title="Upcoming"
                  icon={FiCalendar}
                  tone="bg-brand-50 text-brand-600 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20"
                  items={upcoming}
                />
                {upcoming.length > 0 && past.length > 0 ? (
                  <div className="border-t border-dashed border-line dark:border-slate-800" />
                ) : null}
                <FeedGroup
                  title="Past Activity"
                  icon={FiClock}
                  tone="bg-slate-100 text-slate-500 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-600/30"
                  items={past}
                />
              </div>
            )}
          </Card>
        </div>

        {/* Right rail */}
        <div className="lg:col-span-1">
          <Card
            className="lg:sticky lg:top-24"
            title="Upcoming"
            subtitle="Next scheduled, soonest first"
            icon={<FiCalendar className="h-5 w-5" />}
          >
            {upcomingRail.length === 0 ? (
              <EmptyState
                icon={FiCalendar}
                title="All caught up"
                description="No upcoming follow-ups scheduled. Nice work staying on top of things."
                className="py-10"
              />
            ) : (
              <div className="space-y-1">
                <AnimatePresence initial={false}>
                  {upcomingRail.map((fu) => (
                    <motion.div
                      key={fu.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                      <UpcomingItem fu={fu} />
                    </motion.div>
                  ))}
                </AnimatePresence>

                <Link
                  to="/leads"
                  className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-brand-200 hover:bg-brand-50/60 hover:text-brand-600 dark:border-slate-800 dark:text-slate-400 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
                >
                  View all leads
                  <FiChevronRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>

      <AddFollowUpModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        leadOptions={leadOptions}
        leadMap={leadMap}
      />
    </motion.div>
  )
}
