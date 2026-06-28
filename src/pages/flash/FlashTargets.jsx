import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import {
  FiZap,
  FiPlus,
  FiClock,
  FiCheckCircle,
  FiInbox,
  FiSend,
  FiShare2,
  FiCheck,
  FiX,
  FiCalendar,
  FiTrendingUp,
} from 'react-icons/fi'

import {
  selectFlash,
  fetchFlashTargets,
  createFlashTarget,
  submitFlashRequest,
  resolveFlashRequest,
  distributeFlashStaff,
} from '@/redux/slices/flashSlice'
import { fetchProducts, selectProductOptions } from '@/redux/slices/productSlice'
import { fetchStaff, selectStaff } from '@/redux/slices/staffSlice'
import { selectRoleKey, selectUser } from '@/redux/slices/authSlice'

import { cn } from '@/utils/cn'
import { formatNumber, formatDate } from '@/utils/format'
import { achievementStyleFromPct } from '@/utils/achievement'

import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Modal from '@/components/overlay/Modal'
import ProgressBar from '@/components/ui/ProgressBar'
import StatusBadge from '@/components/ui/StatusBadge'
import KPICard from '@/components/cards/KPICard'
import EmptyState from '@/components/feedback/EmptyState'
import { useToast } from '@/components/feedback/Toast'

const today = () => new Date().toISOString().slice(0, 10)

export default function FlashTargetsPanel() {
  const dispatch = useDispatch()
  const toast = useToast()
  const { campaigns, branchTargets, staffTargets, status } = useSelector(selectFlash)
  const roleKey = useSelector(selectRoleKey)
  const user = useSelector(selectUser)
  const isAdmin = roleKey === 'admin'
  const isManager = roleKey === 'branch_manager'
  const isStaff = roleKey === 'staff'

  const productOptions = useSelector(selectProductOptions)
  const allStaff = useSelector(selectStaff)
  const loading = status === 'loading' || status === 'idle'

  const [createOpen, setCreateOpen] = useState(false)
  const [requestFor, setRequestFor] = useState(null) // campaign
  const [distributeFor, setDistributeFor] = useState(null) // campaign

  useEffect(() => {
    dispatch(fetchFlashTargets())
    if (roleKey === 'admin') dispatch(fetchProducts())
    if (roleKey === 'branch_manager') dispatch(fetchStaff())
  }, [dispatch, roleKey])

  /* ---- derived ---- */
  const pendingRequests = useMemo(
    () => branchTargets.filter((b) => b.status === 'Pending'),
    [branchTargets],
  )
  const kpis = useMemo(() => {
    const active = campaigns.filter((c) => c.status === 'Active').length
    const totalQty = campaigns.reduce((s, c) => s + Number(c.totalQty || 0), 0)
    const achieved = campaigns.reduce((s, c) => s + Number(c.achieved || 0), 0)
    return { active, totalQty, achieved, completion: totalQty ? Math.round((achieved / totalQty) * 100) : 0 }
  }, [campaigns])

  /* ---- handlers ---- */
  const handleCreate = async (payload) => {
    try {
      await dispatch(createFlashTarget(payload)).unwrap()
      toast.success('Flash target created. Branch managers have been notified.', { title: 'Flash target launched' })
      setCreateOpen(false)
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to create flash target.', { title: 'Create failed' })
    }
  }
  const handleRequest = async (payload) => {
    try {
      await dispatch(submitFlashRequest(payload)).unwrap()
      toast.success('Request sent to the admin.', { title: 'Request submitted' })
      setRequestFor(null)
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to submit request.', { title: 'Request failed' })
    }
  }
  const handleResolve = async (requestId, decision, approvedQty) => {
    try {
      await dispatch(resolveFlashRequest({ requestId, status: decision, approvedQty })).unwrap()
      toast.success(`Request ${decision.toLowerCase()}.`, { title: 'Request updated' })
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update request.', { title: 'Update failed' })
    }
  }
  const handleDistribute = async (id, allocations) => {
    try {
      await dispatch(distributeFlashStaff({ id, allocations })).unwrap()
      toast.success('Flash target distributed to staff.', { title: 'Distributed' })
      setDistributeFor(null)
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to distribute.', { title: 'Distribution failed' })
    }
  }

  const branchStaff = useMemo(
    () => (allStaff || []).filter((s) => s.branchId === user?.branchId),
    [allStaff, user?.branchId],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-soft dark:text-slate-400">
          Time-boxed campaigns — request, approve, distribute and track separately from regular targets.
        </p>
        {isAdmin && (
          <Button leftIcon={<FiPlus />} onClick={() => setCreateOpen(true)}>
            Create Flash Target
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Active Campaigns" value={kpis.active} icon={FiZap} tone="brand" loading={loading} />
        <KPICard label="Total Quantity" value={formatNumber(kpis.totalQty)} icon={FiTrendingUp} tone="violet" loading={loading} />
        <KPICard label="Achieved" value={formatNumber(kpis.achieved)} icon={FiCheckCircle} tone="emerald" loading={loading} />
        <KPICard label="Overall Completion" value={kpis.completion} suffix="%" icon={FiClock} tone="amber" loading={loading} />
      </div>

      {/* Admin: pending branch requests */}
      {isAdmin && pendingRequests.length > 0 && (
        <div className="card p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300">
              <FiInbox className="h-[18px] w-[18px]" />
            </span>
            <div>
              <h3 className="font-display text-base font-semibold text-ink dark:text-slate-100">Pending Branch Requests</h3>
              <p className="text-sm text-ink-soft dark:text-slate-400">{pendingRequests.length} awaiting your review</p>
            </div>
          </div>
          <ul className="mt-4 space-y-3">
            {pendingRequests.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-3 rounded-xl border border-line bg-surface-base/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink dark:text-slate-100">
                    {r.flash?.product || r.flash?.productName || 'Product'} · {r.branchName || 'Branch'}
                    {r.requester?.name ? <span className="font-normal text-ink-soft dark:text-slate-400"> — {r.requester.name}</span> : null}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft dark:text-slate-400">
                    Requested <span className="font-semibold text-brand-600 dark:text-brand-300">{r.requestedQty}</span> units
                  </p>
                </div>
                <ResolveActions request={r} onResolve={handleResolve} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Campaigns */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton h-44 rounded-2xl" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FiZap}
            title="No flash targets"
            description={isAdmin ? 'Create a flash target to launch a time-boxed campaign.' : 'No flash targets are available for you yet.'}
            className="py-16"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {campaigns.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              role={roleKey}
              branchTargets={branchTargets.filter((b) => b.flashTargetId === c.id)}
              staffTargets={staffTargets.filter((s) => s.flashTargetId === c.id)}
              onRequest={() => setRequestFor(c)}
              onDistribute={() => setDistributeFor(c)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateFlashModal open={createOpen} onClose={() => setCreateOpen(false)} productOptions={productOptions} onCreate={handleCreate} />
      <RequestModal campaign={requestFor} onClose={() => setRequestFor(null)} onSubmit={handleRequest} />
      <DistributeModal
        campaign={distributeFor}
        branchStaff={branchStaff}
        existing={staffTargets.filter((s) => s.flashTargetId === distributeFor?.id)}
        onClose={() => setDistributeFor(null)}
        onSubmit={handleDistribute}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Campaign card — adapts to role                                      */
/* ------------------------------------------------------------------ */
function CampaignCard({ campaign: c, role, branchTargets = [], staffTargets = [], onRequest, onDistribute }) {
  const isManager = role === 'branch_manager'
  const isStaff = role === 'staff'
  const isAdmin = role === 'admin'
  const expired = c.status === 'Expired'
  const mine = c.myBranchTarget // manager's own branch request (if scoped)
  const myStaff = isStaff ? staffTargets[0] : null

  // Achievement is measured against the assigned/approved amount, per role.
  const assigned = isStaff ? Number(myStaff?.qty || 0) : isManager ? Number(mine?.approvedQty || 0) : Number(c.totalApproved || 0)
  const achieved = isStaff ? Number(myStaff?.achieved || 0) : isManager ? Number(mine?.achieved || 0) : Number(c.achieved || 0)
  const remaining = isStaff ? Number(myStaff?.remaining ?? Math.max(0, assigned - achieved)) : isManager ? Number(mine?.remaining ?? Math.max(0, assigned - achieved)) : Number(c.remaining || 0)
  const achPct = isStaff ? Number(myStaff?.achievementPct || 0) : isManager ? Number(mine?.achievementPct || 0) : Number(c.achievementPct || 0)
  const salesCount = isStaff ? Number(myStaff?.salesCount || 0) : isManager ? Number(mine?.salesCount || 0) : Number(c.salesCount || 0)
  const pctStyle = achievementStyleFromPct(achPct)

  const Stat = ({ label, value, accent }) => (
    <div className="rounded-lg bg-surface-muted/60 px-3 py-2 dark:bg-slate-800/50">
      <p className="text-[11px] text-ink-faint dark:text-slate-500">{label}</p>
      <p className={cn('font-display text-sm font-bold', accent || 'text-ink dark:text-slate-100')}>{value}</p>
    </div>
  )

  return (
    <div className="card flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-semibold text-ink dark:text-slate-100">
            {c.product || c.productName || 'Product'}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-soft dark:text-slate-400">
            <FiCalendar className="h-3.5 w-3.5" />
            {formatDate(c.startDate)} – {c.endDate ? formatDate(c.endDate) : 'open'}
          </p>
        </div>
        <StatusBadge status={c.status} withDot />
      </div>

      {c.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-ink-soft dark:text-slate-400">{c.description}</p>
      ) : null}

      {/* Achievement progress (vs assigned/approved) */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-ink-soft dark:text-slate-400">
            {formatNumber(achieved)} / {formatNumber(assigned)} units achieved
          </span>
          <span className={cn('font-semibold tabular-nums', pctStyle.text)}>{achPct}%</span>
        </div>
        <ProgressBar value={achPct} color={pctStyle.bar} size="sm" />
      </div>

      {/* Achievement stats — role-aware */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        {isAdmin && <Stat label="Total Target" value={formatNumber(c.totalQty)} />}
        <Stat label={isStaff ? 'Assigned' : 'Approved'} value={formatNumber(assigned)} />
        <Stat label="Achieved" value={formatNumber(achieved)} accent="text-emerald-600 dark:text-emerald-400" />
        <Stat label="Remaining" value={formatNumber(remaining)} accent="text-amber-600 dark:text-amber-400" />
        <Stat label="Achievement" value={`${achPct}%`} accent={pctStyle.text} />
        <Stat label="Completed Sales" value={formatNumber(salesCount)} />
        {isAdmin && <Stat label="Unallocated" value={formatNumber(c.unallocated)} />}
      </div>

      {/* Admin: branch-wise achievement */}
      {isAdmin && branchTargets.length > 0 && (
        <div className="mt-4 rounded-xl border border-line bg-surface-base/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint dark:text-slate-500">Branch-wise achievement</p>
          <ul className="space-y-1.5">
            {branchTargets.map((b) => (
              <li key={b.id} className="flex items-center justify-between text-xs">
                <span className="text-ink dark:text-slate-200">{b.branchName || 'Branch'}</span>
                <span className="tabular-nums text-ink-soft dark:text-slate-400">
                  {formatNumber(b.achieved)} / {formatNumber(b.approvedQty)} ({b.achievementPct}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Manager: request status + actions */}
      {isManager && (
        <div className="mt-4 rounded-xl border border-line bg-surface-base/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
          {!mine ? (
            expired ? (
              <p className="text-xs text-ink-soft dark:text-slate-400">This flash target has expired.</p>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-ink-soft dark:text-slate-400">You haven&apos;t requested a quantity yet.</p>
                <Button size="sm" leftIcon={<FiSend />} onClick={onRequest}>Submit Request</Button>
              </div>
            )
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 text-xs text-ink-soft dark:text-slate-400">
                Requested <span className="font-semibold">{mine.requestedQty}</span>
                {mine.approvedQty != null && mine.status !== 'Rejected' ? <> · approved <span className="font-semibold text-brand-600 dark:text-brand-300">{mine.approvedQty}</span></> : null}
                {' · '}<StatusBadge status={mine.status} size="sm" />
              </div>
              {['Approved', 'Partially Approved'].includes(mine.status) && (
                <Button size="sm" variant="outline" leftIcon={<FiShare2 />} onClick={onDistribute}>Distribute</Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Admin + Manager: staff-wise achievement */}
      {(isAdmin || isManager) && staffTargets.length > 0 && (
        <div className="mt-3 rounded-xl border border-line bg-surface-base/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint dark:text-slate-500">Staff-wise achievement</p>
          <ul className="space-y-1.5">
            {staffTargets.map((s) => (
              <li key={s.id} className="flex items-center justify-between text-xs">
                <span className="text-ink dark:text-slate-200">{s.staffName || 'Staff'}</span>
                <span className="tabular-nums text-ink-soft dark:text-slate-400">{formatNumber(s.achieved)} / {formatNumber(s.qty)} ({s.achievementPct}%)</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* Admin per-request actions: editable approved qty + Approve / Partial / Reject. */
function ResolveActions({ request, onResolve }) {
  const [qty, setQty] = useState(request.requestedQty)
  const partial = Number(qty) > 0 && Number(qty) < Number(request.requestedQty)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="number"
        min="1"
        max={request.requestedQty}
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        aria-label="Approved quantity"
        className="w-20 rounded-lg border border-line bg-surface-base px-2.5 py-1.5 text-sm tabular-nums text-ink focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
      <Button
        variant="primary"
        size="sm"
        leftIcon={<FiCheck className="h-3.5 w-3.5" />}
        onClick={() => onResolve(request.id, partial ? 'Partially Approved' : 'Approved', Number(qty) || request.requestedQty)}
      >
        {partial ? 'Partial' : 'Approve'}
      </Button>
      <Button variant="outline" size="sm" leftIcon={<FiX className="h-3.5 w-3.5" />} onClick={() => onResolve(request.id, 'Rejected')}>
        Reject
      </Button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Modals                                                              */
/* ------------------------------------------------------------------ */
function CreateFlashModal({ open, onClose, productOptions, onCreate }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { productId: '', totalQty: '', startDate: today(), endDate: '', description: '' },
  })
  useEffect(() => { if (open) reset({ productId: '', totalQty: '', startDate: today(), endDate: '', description: '' }) }, [open, reset])
  const submit = (f) => onCreate({
    productId: f.productId, totalQty: Number(f.totalQty), startDate: f.startDate, endDate: f.endDate || null, description: f.description?.trim() || '',
  })
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Flash Target"
      description="Launch a time-boxed campaign. All branch managers are notified to submit their requests."
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" leftIcon={<FiX />} onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="flash-create-form" leftIcon={<FiZap />}>Launch</Button>
        </>
      }
    >
      <form id="flash-create-form" onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select label="Product" options={[{ value: '', label: 'Select product' }, ...productOptions]} error={errors.productId?.message} {...register('productId', { required: 'Select a product' })} />
        <Input label="Total Quantity (Units)" type="number" min="1" error={errors.totalQty?.message} {...register('totalQty', { required: 'Enter total quantity', min: { value: 1, message: 'Must be at least 1' } })} />
        <Input label="Start Date" type="date" {...register('startDate', { required: true })} />
        <Input label="End Date" type="date" error={errors.endDate?.message} {...register('endDate', { required: 'Set a deadline' })} />
        <div className="sm:col-span-2">
          <Textarea label="Description" rows={3} placeholder="What is this flash campaign about?" {...register('description')} />
        </div>
      </form>
    </Modal>
  )
}

function RequestModal({ campaign, onClose, onSubmit }) {
  const open = Boolean(campaign)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: { requestedQty: '' } })
  useEffect(() => { if (open) reset({ requestedQty: '' }) }, [open, reset])
  const submit = (f) => onSubmit({ id: campaign.id, requestedQty: Number(f.requestedQty) })
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request Flash Target Quantity"
      description={campaign ? `${campaign.product || 'Product'} — total ${formatNumber(campaign.totalQty)} units, ${formatNumber(campaign.remaining)} still unallocated.` : ''}
      size="md"
      footer={
        <>
          <Button variant="outline" type="button" leftIcon={<FiX />} onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="flash-request-form" leftIcon={<FiSend />}>Send Request</Button>
        </>
      }
    >
      <form id="flash-request-form" onSubmit={handleSubmit(submit)}>
        <Input label="Quantity your branch can achieve" type="number" min="1" error={errors.requestedQty?.message} {...register('requestedQty', { required: 'Enter a quantity', min: { value: 1, message: 'Must be at least 1' } })} />
      </form>
    </Modal>
  )
}

function DistributeModal({ campaign, branchStaff, existing, onClose, onSubmit }) {
  const open = Boolean(campaign)
  const approved = Number(campaign?.myBranchTarget?.approvedQty || 0)
  const [values, setValues] = useState({})
  useEffect(() => {
    if (open) {
      const init = {}
      ;(existing || []).forEach((s) => { init[s.staffId] = s.qty })
      setValues(init)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const list = branchStaff || []
  const total = list.reduce((s, e) => s + (Number(values[e.id]) || 0), 0)
  const over = total > approved

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Distribute to Staff"
      description={campaign ? `${campaign.product || 'Product'} — approved ${approved} units for your branch.` : ''}
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" leftIcon={<FiX />} onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            type="button"
            leftIcon={<FiShare2 />}
            disabled={over}
            onClick={() => onSubmit(campaign.id, list.map((e) => ({ staffId: e.id, qty: Number(values[e.id]) || 0 })).filter((a) => a.qty > 0))}
          >
            Save Distribution
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className={cn('flex items-center justify-between rounded-xl border px-4 py-3 text-sm', over ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300' : 'border-line bg-surface-muted/50 text-ink dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200')}>
          <span className="font-medium">Allocated <span className="font-semibold tabular-nums">{total}</span> / {approved}</span>
          <span className={cn('text-xs font-semibold tabular-nums', over ? 'text-rose-600' : 'text-ink-soft dark:text-slate-400')}>
            {over ? `Over by ${total - approved}` : `${approved - total} remaining`}
          </span>
        </div>
        {list.length === 0 ? (
          <p className="rounded-xl border border-line bg-surface-muted/40 px-4 py-6 text-center text-sm text-ink-soft dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
            No staff in your branch to allocate to.
          </p>
        ) : (
          <div className="space-y-2">
            {list.map((e) => (
              <div key={e.id} className="grid grid-cols-[1fr_140px] items-center gap-3">
                <span className="truncate text-sm font-medium text-ink dark:text-slate-200">{e.name}</span>
                <Input type="number" min="0" placeholder="0" value={values[e.id] ?? ''} onChange={(ev) => setValues((p) => ({ ...p, [e.id]: ev.target.value }))} className="text-right" />
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
