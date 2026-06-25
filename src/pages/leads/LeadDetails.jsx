import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import {
  FiArrowLeft,
  FiUser,
  FiBriefcase,
  FiPhone,
  FiMail,
  FiMapPin,
  FiZap,
  FiShoppingBag,
  FiDollarSign,
  FiTarget,
  FiCalendar,
  FiClock,
  FiActivity,
  FiEdit3,
  FiPlus,
  FiCheck,
  FiCheckCircle,
  FiXCircle,
  FiChevronDown,
  FiAward,
  FiHome,
  FiTag,
  FiFileText,
  FiPhoneCall,
  FiLock,
  FiUserPlus,
} from 'react-icons/fi'

import { cn } from '@/utils/cn'
import { formatCurrency, formatDate, formatRelativeTime } from '@/utils/format'
import { leadById as leadByIdData, LEAD_STATUSES } from '@/data/leads'
import { staffByBranch } from '@/data/staff'
import {
  selectLeadById,
  updateLeadStatus,
  addFollowUp,
  assignStaff,
} from '@/redux/slices/leadSlice'
import {
  getWorkflowState,
  allowedStatuses,
  LEAD_WORKFLOW_STEPS,
} from '@/utils/leadWorkflow'
import { useToast } from '@/hooks/useToast'

import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import StatusBadge from '@/components/ui/StatusBadge'
import ProgressBar from '@/components/ui/ProgressBar'
import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Input from '@/components/ui/Input'
import Modal from '@/components/overlay/Modal'
import KPICard from '@/components/cards/KPICard'
import Timeline from '@/components/timeline/Timeline'
import EmptyState from '@/components/feedback/EmptyState'
import RecordSaleModal from '@/components/sales/RecordSaleModal'

const FOLLOWUP_TYPES = ['Call', 'Email', 'Meeting', 'WhatsApp', 'Site Visit']
const FOLLOWUP_STATUSES = ['Scheduled', 'Completed', 'Missed']

const FOLLOWUP_TYPE_ICONS = {
  Call: FiPhoneCall,
  Email: FiMail,
  Meeting: FiUser,
  WhatsApp: FiPhone,
  'Site Visit': FiMapPin,
}

const pageMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' },
}

const todayISO = () => new Date().toISOString().slice(0, 10)

/* ------------------------------------------------------------------ */
/* Lead Workflow Panel — the PRIMARY CRM process                        */
/* Lead Created → Branch Assigned → Staff Assigned → Contacted → Follow-Up */
/* ------------------------------------------------------------------ */
function LeadWorkflowPanel({ lead, onAllocate, onFollowUp }) {
  const { steps, index, isComplete } = getWorkflowState(lead)
  const isLost = lead.status === 'Lost'
  const defs = LEAD_WORKFLOW_STEPS

  // Decide the single contextual call-to-action.
  let cta = null
  if (isLost) {
    cta = (
      <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
        <FiXCircle className="h-[18px] w-[18px] shrink-0" />
        <span>This lead was marked as <strong>Lost</strong> and is no longer active.</span>
      </div>
    )
  } else if (!steps[2]) {
    cta = (
      <div className="flex flex-col gap-3 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3 dark:border-brand-500/20 dark:bg-brand-500/10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-brand-700 dark:text-brand-200">
          <strong>Next:</strong> a Branch Manager allocates this lead to a sales staff member.
        </p>
        <Button size="sm" leftIcon={<FiUserPlus />} onClick={onAllocate}>
          Allocate to Staff
        </Button>
      </div>
    )
  } else if (!isComplete) {
    cta = (
      <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-amber-700 dark:text-amber-200">
          <strong>Next:</strong> contact the customer and log a follow-up to advance the workflow.
        </p>
        <Button size="sm" leftIcon={<FiPlus />} onClick={onFollowUp}>
          Add Follow-Up
        </Button>
      </div>
    )
  } else {
    cta = (
      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
        <FiCheckCircle className="h-[18px] w-[18px] shrink-0" />
        <span>Workflow complete — this lead can now proceed to <strong>Negotiation</strong> &amp; Sales.</span>
      </div>
    )
  }

  return (
    <Card className="relative overflow-hidden" padding="lg">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-brand-500/10 blur-3xl"
      />

      <div className="relative mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold text-ink dark:text-slate-100">
            Lead Workflow
          </h3>
          <p className="mt-0.5 text-sm text-ink-soft dark:text-slate-400">
            Primary process — complete before negotiation &amp; sales
          </p>
        </div>
        {isComplete ? (
          <Badge tone="green" size="md" dot>Workflow complete</Badge>
        ) : isLost ? (
          <Badge tone="red" size="md" dot>Lost</Badge>
        ) : (
          <Badge tone="amber" size="md" dot>Step {Math.min(index + 1, defs.length)} of {defs.length}</Badge>
        )}
      </div>

      {/* Desktop horizontal stepper */}
      <div className="relative hidden sm:block">
        <div className="absolute left-0 right-0 top-5 h-0.5 bg-line dark:bg-slate-800" />
        <motion.div
          className="absolute left-0 top-5 h-0.5 origin-left rounded-full bg-brand-500"
          initial={{ width: 0 }}
          animate={{
            width: defs.length > 1 ? `${(Math.max(0, Math.min(index, defs.length - 1)) / (defs.length - 1)) * 100}%` : '0%',
          }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        />
        <ol className="relative flex items-start justify-between">
          {defs.map((step, i) => {
            const completed = steps[i]
            const current = i === index && !isComplete && !isLost
            return (
              <li
                key={step.key}
                className="flex flex-1 flex-col items-center px-1 text-center first:items-start last:items-end"
              >
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.08 + i * 0.06, type: 'spring', stiffness: 380, damping: 24 }}
                  className={cn(
                    'relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ring-4 ring-white transition-colors dark:ring-slate-900',
                    completed && 'bg-brand-500 text-white shadow-soft',
                    current && 'bg-brand-500 text-white shadow-glow',
                    !completed && !current && 'bg-surface-muted text-ink-faint dark:bg-slate-800 dark:text-slate-500',
                  )}
                >
                  {completed ? <FiCheck className="h-5 w-5" strokeWidth={2.6} /> : i + 1}
                  {current && (
                    <span className="absolute inset-0 -z-10 animate-pulse-ring rounded-full bg-brand-500/40" />
                  )}
                </motion.span>
                <span
                  className={cn(
                    'mt-2.5 max-w-[6.5rem] text-xs font-semibold leading-tight',
                    completed || current ? 'text-ink dark:text-slate-100' : 'text-ink-faint dark:text-slate-500',
                  )}
                >
                  {step.label}
                </span>
                <span className="mt-0.5 hidden max-w-[7rem] text-2xs leading-tight text-ink-faint dark:text-slate-500 lg:block">
                  {step.desc}
                </span>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Mobile vertical stepper */}
      <ol className="relative space-y-4 sm:hidden">
        {defs.map((step, i) => {
          const completed = steps[i]
          const current = i === index && !isComplete && !isLost
          const isLast = i === defs.length - 1
          return (
            <li key={step.key} className="relative flex items-center gap-3">
              {!isLast && (
                <span
                  className={cn(
                    'absolute left-[15px] top-8 h-[calc(100%-1rem)] w-0.5',
                    completed ? 'bg-brand-500' : 'bg-line dark:bg-slate-800',
                  )}
                />
              )}
              <span
                className={cn(
                  'relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold',
                  (completed || current) && 'bg-brand-500 text-white',
                  !completed && !current && 'bg-surface-muted text-ink-faint dark:bg-slate-800 dark:text-slate-500',
                )}
              >
                {completed ? <FiCheck className="h-4 w-4" strokeWidth={2.6} /> : i + 1}
              </span>
              <span
                className={cn(
                  'text-sm font-medium',
                  completed || current ? 'text-ink dark:text-slate-100' : 'text-ink-faint dark:text-slate-500',
                )}
              >
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>

      <div className="relative mt-6">{cta}</div>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Info row helper                                                     */
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
/* Main page                                                           */
/* ------------------------------------------------------------------ */
export default function LeadDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const toast = useToast()

  const leadFromStore = useSelector(selectLeadById(id))
  const lead = leadFromStore || (id ? leadByIdData(id) : null)

  const [modalOpen, setModalOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [recordSaleOpen, setRecordSaleOpen] = useState(false)
  const [staffChoice, setStaffChoice] = useState('')

  const branchStaff = useMemo(() => staffByBranch(lead?.branchId), [lead?.branchId])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      type: 'Call',
      date: todayISO(),
      nextDate: '',
      status: 'Scheduled',
      remark: '',
    },
  })

  /* ---- Not found ---- */
  if (!lead) {
    return (
      <motion.div {...pageMotion} className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<FiArrowLeft />}
          onClick={() => navigate('/leads')}
          className="-ml-1"
        >
          Back to Leads
        </Button>
        <Card padding="lg">
          <EmptyState
            icon={FiUser}
            title="Lead not found"
            description={`We couldn't find a lead matching "${id}". It may have been removed or the link is incorrect.`}
            action={
              <Button to="/leads" leftIcon={<FiArrowLeft />}>
                Back to Leads
              </Button>
            }
          />
        </Card>
      </motion.div>
    )
  }

  const onChangeStatus = (status) => {
    if (status === lead.status) return
    dispatch(updateLeadStatus({ id: lead.id, status }))
    toast.success(`Status updated to "${status}".`, { title: 'Lead updated' })
  }

  const openModal = () => {
    reset({
      type: 'Call',
      date: todayISO(),
      nextDate: '',
      status: 'Scheduled',
      remark: '',
    })
    setModalOpen(true)
  }

  const onSubmitFollowUp = (values) => {
    const followUp = {
      id: `fu-${Date.now()}`,
      type: values.type,
      status: values.status,
      date: values.date,
      nextDate: values.nextDate || null,
      remark: values.remark,
      by: lead.staffName && lead.staffName !== 'Unassigned' ? lead.staffName : 'You',
    }
    dispatch(addFollowUp({ leadId: lead.id, followUp }))
    // First logged follow-up advances the workflow into the "Contacted" stage.
    if ((lead.followUps?.length || 0) === 0 && lead.staffId && lead.status === 'Assigned') {
      dispatch(updateLeadStatus({ id: lead.id, status: 'Contacted' }))
    }
    toast.success(`${values.type} follow-up logged successfully.`, { title: 'Follow-up added' })
    setModalOpen(false)
  }

  const openAllocate = () => {
    setStaffChoice(lead.staffId || branchStaff[0]?.id || '')
    setAssignOpen(true)
  }

  const handleAllocate = () => {
    if (!staffChoice) {
      toast.warning('Please select a staff member to allocate.')
      return
    }
    dispatch(assignStaff({ leadId: lead.id, staffId: staffChoice }))
    const member = branchStaff.find((s) => s.id === staffChoice)
    toast.success(`Lead allocated to ${member?.name || 'staff'}.`, { title: 'Staff assigned' })
    setAssignOpen(false)
  }

  /* ---- Derived display data ---- */
  const subtitle = [lead.company, lead.id].filter(Boolean).join('  •  ')

  const activityItems = useMemo(
    () =>
      (lead.activities || []).map((a) => ({
        id: a.id,
        title: a.action,
        description: a.detail,
        date: a.date,
        by: a.by,
        type: 'status',
      })),
    [lead.activities],
  )

  const followUpItems = useMemo(
    () =>
      (lead.followUps || []).map((f) => ({
        id: f.id,
        title: f.type,
        status: f.status,
        description: f.remark,
        date: f.date,
        by: f.by,
        nextDate: f.nextDate,
        icon: FOLLOWUP_TYPE_ICONS[f.type] || FiActivity,
        type:
          f.status === 'Completed' ? 'won' : f.status === 'Missed' ? 'lost' : 'status',
      })),
    [lead.followUps],
  )

  const allowed = allowedStatuses(lead)
  const statusItems = LEAD_STATUSES.map((s) => {
    const isCurrent = s === lead.status
    const isAllowed = allowed.includes(s)
    return {
      label: s,
      icon: isCurrent ? (
        <FiCheck className="text-brand-500" />
      ) : !isAllowed ? (
        <FiLock className="text-ink-faint dark:text-slate-500" />
      ) : (
        <FiChevronDown className="opacity-0" />
      ),
      onClick: () => {
        if (isCurrent) return
        if (!isAllowed) {
          toast.warning(
            `Complete the lead workflow (assign staff & log a follow-up) before moving to "${s}".`,
            { title: 'Workflow required' },
          )
          return
        }
        onChangeStatus(s)
      },
    }
  })

  return (
    <motion.div {...pageMotion} className="space-y-6">
      {/* Back + header */}
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<FiArrowLeft />}
          onClick={() => navigate(-1)}
          className="-ml-1 text-ink-soft hover:text-brand-600 dark:hover:text-brand-300"
        >
          Back
        </Button>

        <PageHeader
          title={lead.name}
          subtitle={subtitle}
          icon={FiUser}
          breadcrumb={false}
          actions={
            <>
              {lead.status === 'Won' && (
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<FiShoppingBag />}
                  onClick={() => setRecordSaleOpen(true)}
                >
                  Record Sale
                </Button>
              )}
              <Dropdown
                align="right"
                width={200}
                trigger={
                  <Button variant="outline" size="md" rightIcon={<FiChevronDown />}>
                    {lead.status}
                  </Button>
                }
                items={statusItems}
              />
              <Button
                variant={lead.status === 'Won' ? 'outline' : 'primary'}
                size="md"
                leftIcon={<FiPlus />}
                onClick={openModal}
              >
                Add Follow-Up
              </Button>
              <Button variant="outline" size="icon" aria-label="Edit lead">
                <FiEdit3 className="h-[18px] w-[18px]" />
              </Button>
            </>
          }
        />
      </div>

      {/* Primary lead workflow */}
      <LeadWorkflowPanel lead={lead} onAllocate={openAllocate} onFollowUp={openModal} />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ---------------- Left / main ---------------- */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer information */}
          <Card
            title="Customer Information"
            subtitle="Contact details & lead profile"
            icon={<FiUser className="h-5 w-5" />}
            action={<StatusBadge status={lead.priority} size="md" withDot />}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoRow icon={FiUser} label="Full Name">
                {lead.name}
              </InfoRow>
              <InfoRow icon={FiBriefcase} label="Company">
                {lead.company || '—'}
              </InfoRow>
              <InfoRow icon={FiPhone} label="Mobile">
                <a
                  href={`tel:${lead.mobile}`}
                  className="hover:text-brand-600 dark:hover:text-brand-300"
                >
                  {lead.mobile}
                </a>
              </InfoRow>
              <InfoRow icon={FiMail} label="Email">
                <a
                  href={`mailto:${lead.email}`}
                  className="hover:text-brand-600 dark:hover:text-brand-300"
                >
                  {lead.email}
                </a>
              </InfoRow>
              <InfoRow icon={FiMapPin} label="Location">
                {lead.location}
              </InfoRow>
              <InfoRow icon={FiZap} label="Source">
                {lead.source}
              </InfoRow>
              <InfoRow icon={FiShoppingBag} label="Product Interest">
                {lead.product}
              </InfoRow>
              <InfoRow icon={FiDollarSign} label="Deal Value">
                <span className="font-display font-semibold text-brand-600 dark:text-brand-300">
                  {formatCurrency(lead.value)}
                </span>
              </InfoRow>
              <InfoRow icon={FiTarget} label="Lead Score">
                {lead.score} / 100
              </InfoRow>
              <InfoRow icon={FiHome} label="Branch">
                {lead.branchName}
              </InfoRow>
            </div>

            {/* Tags */}
            {lead.tags?.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-faint dark:text-slate-500">
                  <FiTag className="h-3.5 w-3.5" /> Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {lead.tags.map((tag) => (
                    <Badge key={tag} tone="brand" size="md">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {lead.notes && (
              <div className="mt-5 rounded-xl border border-line bg-surface-base/60 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-faint dark:text-slate-500">
                  <FiFileText className="h-3.5 w-3.5" /> Notes
                </p>
                <p className="text-sm leading-relaxed text-ink-soft dark:text-slate-300">
                  {lead.notes}
                </p>
              </div>
            )}
          </Card>

          {/* Lead timeline */}
          <Card
            title="Lead Timeline"
            subtitle="Key stages & milestones"
            icon={<FiActivity className="h-5 w-5" />}
          >
            {lead.timeline?.length ? (
              <Timeline items={lead.timeline} />
            ) : (
              <EmptyState
                icon={FiActivity}
                title="No timeline yet"
                description="Stage changes and milestones for this lead will appear here."
              />
            )}
          </Card>

          {/* Activity logs */}
          <Card
            title="Activity Logs"
            subtitle="Every action recorded on this lead"
            icon={<FiClock className="h-5 w-5" />}
          >
            {activityItems.length ? (
              <ul className="-my-1 divide-y divide-line dark:divide-slate-800">
                {activityItems.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 py-3.5">
                    <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-500/15 dark:bg-brand-500/10 dark:text-brand-300">
                      <FiActivity className="h-[18px] w-[18px]" strokeWidth={2.1} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink dark:text-slate-100">
                        {a.title}
                      </p>
                      {a.description && (
                        <p className="mt-0.5 text-sm leading-relaxed text-ink-soft dark:text-slate-400">
                          {a.description}
                        </p>
                      )}
                      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-faint dark:text-slate-500">
                        {a.by && (
                          <span className="font-medium text-ink-soft dark:text-slate-400">
                            {a.by}
                          </span>
                        )}
                        {a.by && a.date && <span aria-hidden>•</span>}
                        {a.date && (
                          <span title={formatDate(a.date, 'dd MMM yyyy')}>
                            {formatRelativeTime(a.date)}
                          </span>
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={FiClock}
                title="No activity yet"
                description="Logged actions for this lead will show up here."
              />
            )}
          </Card>
        </div>

        {/* ---------------- Right / aside ---------------- */}
        <aside className="space-y-6">
          {/* KPI mini cards */}
          <div className="grid grid-cols-2 gap-4">
            <KPICard
              label="Deal Value"
              value={formatCurrency(lead.value, { compact: true })}
              icon={FiDollarSign}
              tone="brand"
            />
            <KPICard
              label="Created"
              value={formatDate(lead.createdDate, 'dd MMM')}
              icon={FiCalendar}
              tone="sky"
            />
          </div>

          {/* Lead score */}
          <Card padding="md">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-inset ring-violet-500/15 dark:bg-violet-500/10 dark:text-violet-300">
                  <FiTarget className="h-[18px] w-[18px]" />
                </span>
                <span className="text-sm font-medium text-ink-soft dark:text-slate-400">
                  Lead Score
                </span>
              </div>
              <span className="font-display text-xl font-bold text-ink dark:text-slate-100">
                {lead.score}
                <span className="text-sm font-medium text-ink-faint dark:text-slate-500">
                  /100
                </span>
              </span>
            </div>
            <ProgressBar
              value={lead.score}
              color={lead.score >= 75 ? 'emerald' : lead.score >= 50 ? 'brand' : 'amber'}
              size="md"
              className="mt-3"
            />
          </Card>

          {/* Next follow-up */}
          <Card padding="md">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-500/15 dark:bg-amber-500/10 dark:text-amber-300">
                <FiClock className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-faint dark:text-slate-500">
                  Next Follow-Up
                </p>
                <p className="mt-0.5 text-base font-semibold text-ink dark:text-slate-100">
                  {lead.nextFollowUp ? formatDate(lead.nextFollowUp) : 'Not scheduled'}
                </p>
                {lead.nextFollowUp && (
                  <p className="text-xs text-ink-soft dark:text-slate-400">
                    {formatRelativeTime(lead.nextFollowUp)}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Assigned staff */}
          <Card
            title="Assigned To"
            icon={<FiUser className="h-5 w-5" />}
            action={
              <Button variant="ghost" size="sm" leftIcon={<FiUserPlus />} onClick={openAllocate}>
                {lead.staffId && lead.staffName !== 'Unassigned' ? 'Reassign' : 'Allocate'}
              </Button>
            }
          >
            {lead.staffId && lead.staffName !== 'Unassigned' ? (
              <div className="flex items-center gap-3.5">
                <Avatar name={lead.staffName} size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink dark:text-slate-100">
                    {lead.staffName}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-ink-soft dark:text-slate-400">
                    <FiHome className="h-3.5 w-3.5 shrink-0" />
                    {lead.branchName}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-line px-3.5 py-3 dark:border-slate-700">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-ink-faint dark:bg-slate-800 dark:text-slate-500">
                  <FiUser className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink dark:text-slate-100">
                    Unassigned
                  </p>
                  <p className="text-xs text-ink-soft dark:text-slate-400">
                    {lead.branchName}
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Follow-up history */}
          <Card
            title="Follow-Up History"
            subtitle={`${lead.followUps?.length || 0} interaction${
              (lead.followUps?.length || 0) === 1 ? '' : 's'
            }`}
            icon={<FiPhoneCall className="h-5 w-5" />}
            action={
              <Button variant="ghost" size="sm" leftIcon={<FiPlus />} onClick={openModal}>
                Add
              </Button>
            }
          >
            {followUpItems.length ? (
              <div className="space-y-4">
                {followUpItems.map((f) => (
                  <div
                    key={f.id}
                    className="rounded-xl border border-line bg-surface-base/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-500/15 dark:bg-brand-500/10 dark:text-brand-300">
                          <f.icon className="h-4 w-4" strokeWidth={2.2} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink dark:text-slate-100">
                            {f.title}
                          </p>
                          <p className="text-xs text-ink-faint dark:text-slate-500">
                            {formatDate(f.date)}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={f.status} size="sm" />
                    </div>

                    {f.description && (
                      <p className="mt-2.5 text-sm leading-relaxed text-ink-soft dark:text-slate-400">
                        {f.description}
                      </p>
                    )}

                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-ink-faint dark:text-slate-500">
                        by{' '}
                        <span className="font-medium text-ink-soft dark:text-slate-400">
                          {f.by}
                        </span>
                      </span>
                      {f.nextDate && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700 ring-1 ring-inset ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                          <FiCalendar className="h-3 w-3" />
                          Next: {formatDate(f.nextDate, 'dd MMM')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FiPhoneCall}
                title="No follow-ups yet"
                description="Log your first interaction to start tracking this lead."
                action={
                  <Button variant="primary" size="sm" leftIcon={<FiPlus />} onClick={openModal}>
                    Add Follow-Up
                  </Button>
                }
              />
            )}
          </Card>
        </aside>
      </div>

      {/* ---------------- Add Follow-Up Modal ---------------- */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Follow-Up"
        description={`Log a new interaction for ${lead.name}.`}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="add-followup-form"
              loading={isSubmitting}
              leftIcon={<FiCheck />}
            >
              Save Follow-Up
            </Button>
          </>
        }
      >
        <form
          id="add-followup-form"
          onSubmit={handleSubmit(onSubmitFollowUp)}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Type"
              options={FOLLOWUP_TYPES.map((t) => ({ value: t, label: t }))}
              error={errors.type?.message}
              {...register('type', { required: 'Type is required' })}
            />
            <Select
              label="Status"
              options={FOLLOWUP_STATUSES.map((s) => ({ value: s, label: s }))}
              error={errors.status?.message}
              {...register('status', { required: 'Status is required' })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Date"
              type="date"
              error={errors.date?.message}
              {...register('date', { required: 'Date is required' })}
            />
            <Input
              label="Next Follow-Up Date"
              type="date"
              hint="Optional"
              {...register('nextDate')}
            />
          </div>

          <Textarea
            label="Remark"
            rows={4}
            placeholder="Add details about this interaction…"
            error={errors.remark?.message}
            {...register('remark', {
              required: 'Please add a remark',
              minLength: { value: 4, message: 'Remark is too short' },
            })}
          />
        </form>
      </Modal>

      {/* ---------------- Allocate to Staff Modal ---------------- */}
      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Allocate Lead to Staff"
        description={`Assign ${lead.name} to a sales staff member at ${lead.branchName}.`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setAssignOpen(false)} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              type="button"
              leftIcon={<FiUserPlus />}
              onClick={handleAllocate}
              disabled={!branchStaff.length}
            >
              Allocate
            </Button>
          </>
        }
      >
        {branchStaff.length ? (
          <Select
            label="Sales Staff"
            options={branchStaff.map((s) => ({ value: s.id, label: `${s.name} — ${s.role}` }))}
            value={staffChoice}
            onChange={(e) => setStaffChoice(e.target.value)}
          />
        ) : (
          <p className="text-sm text-ink-soft dark:text-slate-400">
            No staff are available at {lead.branchName}.
          </p>
        )}
      </Modal>

      {/* ---------------- Record Sale Modal (Won leads) ---------------- */}
      <RecordSaleModal open={recordSaleOpen} onClose={() => setRecordSaleOpen(false)} lead={lead} />
    </motion.div>
  )
}
