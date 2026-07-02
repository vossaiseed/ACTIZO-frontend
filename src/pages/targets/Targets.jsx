import { useEffect, useMemo, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiTarget,
  FiPlus,
  FiDownload,
  FiFilter,
  FiRotateCcw,
  FiCheckCircle,
  FiClock,
  FiPercent,
  FiBarChart2,
  FiZap,
  FiBriefcase,
  FiLayers,
  FiShare2,
  FiTrash2,
  FiShoppingBag,
} from 'react-icons/fi'

import {
  selectTargets,
  setTab,
  setFilter,
  resetFilters,
  addTarget,
  allocateBranches,
  allocateStaff,
  fetchTargets,
  fetchTargetSummary,
} from '@/redux/slices/targetSlice'
import { fetchProducts, selectProductOptions, selectProducts } from '@/redux/slices/productSlice'
import { fetchBranches, selectBranchOptions } from '@/redux/slices/branchSlice'
import { fetchStaff, selectStaffOptions, selectStaff } from '@/redux/slices/staffSlice'
import { selectRoleKey, selectUser } from '@/redux/slices/authSlice'
import { fetchFlashTargets, selectFlash } from '@/redux/slices/flashSlice'
import FlashTargetsPanel from '@/pages/flash/FlashTargets'
import { TARGET_STATUSES } from '@/data/targets'

import { cn } from '@/utils/cn'
import { formatCurrency, formatPercent } from '@/utils/format'
import { achievementStyleFromPct } from '@/utils/achievement'
import { searchData, applyFilters, sortData, sum } from '@/utils/helpers'
import { exportData } from '@/utils/export'

import PageHeader from '@/components/common/PageHeader'
import SearchBar from '@/components/common/SearchBar'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Tabs from '@/components/ui/Tabs'
import Modal from '@/components/overlay/Modal'
import ProgressBar from '@/components/ui/ProgressBar'
import StatusBadge from '@/components/ui/StatusBadge'
import KPICard from '@/components/cards/KPICard'
import ChartCard from '@/components/cards/ChartCard'
import DataTable from '@/components/data/DataTable'
import AchievementBadge from '@/components/ui/AchievementBadge'
import { useToast } from '@/components/feedback/Toast'
import { BarChartView } from '@/components/charts'

/* ------------------------------------------------------------------ */
/* Static option lists                                                 */
/* ------------------------------------------------------------------ */

const STATUS_OPTIONS = [
  { value: 'All', label: 'All Status' },
  ...TARGET_STATUSES.map((s) => ({ value: s, label: s })),
]

const TYPE_OPTIONS_BY_TAB = {
  general: [
    { value: 'All', label: 'All Scopes' },
    { value: 'Admin', label: 'Admin' },
    { value: 'Branch', label: 'Branch' },
    { value: 'Staff', label: 'Staff' },
  ],
  special: [
    { value: 'All', label: 'All Types' },
    { value: 'Festival', label: 'Festival' },
    { value: 'Seasonal', label: 'Seasonal' },
    { value: 'Product Launch', label: 'Product Launch' },
    { value: 'Flash Sale', label: 'Flash Sale' },
  ],
  project: [
    { value: 'All', label: 'All Types' },
    { value: 'Villa', label: 'Villa' },
    { value: 'Apartment', label: 'Apartment' },
    { value: 'Commercial', label: 'Commercial' },
    { value: 'Interior', label: 'Interior' },
  ],
}

const TAB_META = {
  general: { label: 'General', icon: <FiLayers /> },
  special: { label: 'Special', icon: <FiZap /> },
  project: { label: 'Project', icon: <FiBriefcase /> },
  flash: { label: 'Flash', icon: <FiZap /> },
}

/* The filter→item key map differs per tab (esp. the "type" field). */
const FILTER_MAP_BY_TAB = {
  general: { branch: 'branchId', staff: 'staffId', status: 'status', type: 'scope' },
  special: { branch: 'branchId', staff: 'staffId', status: 'status', type: 'type' },
  project: { branch: 'branchId', staff: 'staffId', status: 'status', type: 'type' },
}

const SEARCH_KEYS_BY_TAB = {
  general: ['id', 'product', 'branchName', 'staffName', 'scope'],
  special: ['id', 'name', 'type', 'branchName', 'staffName'],
  project: ['id', 'name', 'type', 'location', 'branchName'],
}

function CompletionCell({ value }) {
  const pct = Number(value) || 0
  const style = achievementStyleFromPct(pct)
  return (
    <div className="flex min-w-[140px] items-center gap-2.5">
      <ProgressBar value={pct} color={style.bar} size="sm" className="flex-1" />
      <span
        className={cn(
          'w-12 shrink-0 text-right text-xs font-semibold tabular-nums',
          style.text,
        )}
      >
        {formatPercent(pct, 0)}
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* New Target modal (stub form)                                        */
/* ------------------------------------------------------------------ */

const TARGET_TYPE_OPTIONS = [
  { value: 'general', label: 'General Target' },
  { value: 'special', label: 'Special Target' },
  { value: 'project', label: 'Project Target' },
]
const CAMPAIGN_TYPE_OPTIONS = ['Festival', 'Seasonal', 'Product Launch', 'Flash Sale'].map((v) => ({ value: v, label: v }))
const PROJECT_TYPE_OPTIONS = ['Villa', 'Apartment', 'Commercial', 'Interior'].map((v) => ({ value: v, label: v }))
const PERIOD_OPTIONS = ['Monthly', 'Quarterly', 'Yearly'].map((v) => ({ value: v, label: v }))
const targetDefaults = () => ({
  targetType: 'general',
  // shared
  branchId: '', staffId: '', startDate: '', endDate: '', description: '',
  // general (Product Target) — branch/staff allocation happens later, per row.
  productId: '', period: 'Monthly', targetQty: '', incentiveRate: '',
  // special
  name: '', campaignType: 'Festival', targetValue: '', incentive: '',
  // project
  projectType: 'Villa', location: '', projectValue: '', revenueTarget: '', qtyTarget: '',
})

const blankSlab = () => ({ min: '', max: '', rate: '' })

function NewTargetModal({ open, onClose, onCreate }) {
  // Reference options sourced from the store (real backend UUIDs).
  const productOptions = useSelector(selectProductOptions)
  const products = useSelector(selectProducts)
  const branchOptions = useSelector(selectBranchOptions)
  const staffOptions = useSelector(selectStaffOptions)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: targetDefaults() })

  // Branch-wise target distribution (general/Product target) + incentive slabs.
  const [branchRows, setBranchRows] = useState([{ branchId: '', qty: '' }])
  const [slabs, setSlabs] = useState([{ min: '0', max: '', rate: '' }])

  useEffect(() => {
    if (open) {
      reset(targetDefaults())
      setBranchRows([{ branchId: '', qty: '' }])
      setSlabs([{ min: '0', max: '', rate: '' }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const selectedProductId = watch('productId')
  const unit = products.find((p) => p.id === selectedProductId)?.unit || 'units'
  const type = watch('targetType')
  const totalTarget = Number(watch('targetQty')) || 0

  // Branch distribution helpers
  const addBranchRow = () => setBranchRows((r) => [...r, { branchId: '', qty: '' }])
  const removeBranchRow = (i) => setBranchRows((r) => (r.length > 1 ? r.filter((_, idx) => idx !== i) : r))
  const setBranchRow = (i, key, val) => setBranchRows((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)))
  const allocated = branchRows.reduce((s, r) => s + (Number(r.qty) || 0), 0)
  const remaining = totalTarget - allocated
  const validRows = branchRows.filter((r) => r.branchId && Number(r.qty) > 0)
  const distributionMatched = totalTarget > 0 && allocated === totalTarget && validRows.length > 0
  const generalReady = type !== 'general' ? true : distributionMatched

  // Incentive slab helpers (kept exactly as before)
  const addSlab = () => setSlabs((s) => [...s, blankSlab()])
  const removeSlab = (i) => setSlabs((s) => (s.length > 1 ? s.filter((_, idx) => idx !== i) : s))
  const setSlab = (i, key, val) => setSlabs((s) => s.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)))

  const submit = (form) => {
    const branchAllocations = validRows.map((r) => ({ branchId: r.branchId, targetQty: Number(r.qty) }))
    onCreate({ ...form, unit, branchAllocations, slabs })
  }

  const close = () => {
    reset(targetDefaults())
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Create Target"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={close} type="button">
            Cancel
          </Button>
          <Button type="submit" form="new-target-form" loading={isSubmitting} disabled={!generalReady} leftIcon={<FiPlus />}>
            Create Target
          </Button>
        </>
      }
    >
      <form id="new-target-form" onSubmit={handleSubmit(submit)} className="space-y-5">
        {/* Target type selector */}
        <Select label="Target Type *" options={TARGET_TYPE_OPTIONS} {...register('targetType')} />

        {type === 'general' && (
        <>
        {/* Product + period */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Product *" placeholder="Select product" options={productOptions} error={errors.productId?.message} {...register('productId', { required: 'Select a product' })} />
          <Select label="Period" options={PERIOD_OPTIONS} {...register('period')} />
        </div>

        {/* Total target (mandatory) */}
        <Input
          label={`Total Target (${unit}) *`}
          type="number"
          min="1"
          placeholder="100"
          error={errors.targetQty?.message}
          {...register('targetQty', { required: 'Enter the total target', min: { value: 1, message: 'Must be greater than zero' } })}
        />

        {/* Dates */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Start Date" type="date" {...register('startDate')} />
          <Input label="End Date" type="date" {...register('endDate')} />
        </div>

        {/* Branch-wise target distribution */}
        <div className="rounded-xl border border-line bg-surface-base/40 p-4 dark:border-slate-800 dark:bg-slate-800/30">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink dark:text-slate-100">Branch-wise Target Distribution</p>
            <button
              type="button"
              onClick={addBranchRow}
              disabled={branchRows.length >= branchOptions.length}
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition hover:text-brand-700 disabled:opacity-40 dark:text-brand-400"
            >
              <FiPlus className="h-4 w-4" /> Add Branch
            </button>
          </div>

          <div className="space-y-2">
            {branchRows.map((row, i) => {
              const usedElsewhere = branchRows.filter((_, j) => j !== i).map((r) => r.branchId).filter(Boolean)
              const opts = branchOptions.filter((o) => !usedElsewhere.includes(o.value))
              return (
                <div key={i} className="grid grid-cols-[1fr_110px_auto] items-center gap-2">
                  <Select
                    placeholder="Select branch"
                    options={opts}
                    value={row.branchId}
                    onChange={(e) => setBranchRow(i, 'branchId', e.target.value)}
                  />
                  <Input
                    type="number"
                    min="0"
                    placeholder="Units"
                    value={row.qty}
                    onChange={(e) => setBranchRow(i, 'qty', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeBranchRow(i)}
                    disabled={branchRows.length === 1}
                    aria-label="Remove branch"
                    className="grid h-9 w-8 place-items-center rounded-lg text-ink-faint transition hover:text-rose-600 disabled:opacity-30 dark:text-slate-500"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Live allocated / remaining */}
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm dark:border-slate-800">
            <span className="font-medium text-ink-soft dark:text-slate-400">
              Allocated: <span className="font-bold text-ink dark:text-slate-100">{allocated}</span> / {totalTarget || 0}
            </span>
            <span
              className={cn(
                'font-semibold tabular-nums',
                remaining === 0 && totalTarget > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : remaining < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-amber-600 dark:text-amber-400',
              )}
            >
              Remaining: {remaining}
            </span>
          </div>
          {totalTarget > 0 && allocated !== totalTarget && (
            <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
              {allocated < totalTarget
                ? `Allocate ${remaining} more ${unit} — branch totals must equal the Total Target.`
                : `Over by ${Math.abs(remaining)} ${unit} — branch totals must equal the Total Target.`}
            </p>
          )}
        </div>

        {/* Incentive slabs (unchanged) */}
        <div className="border-t border-line pt-4 dark:border-slate-800">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint dark:text-slate-500">Incentive Slabs</p>
            <button type="button" onClick={addSlab} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400">
              <FiPlus className="h-4 w-4" /> Add Slab
            </button>
          </div>
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2 px-1 pb-1 text-[10px] font-medium uppercase tracking-wide text-ink-faint dark:text-slate-500 sm:text-[11px]">
            <span className="truncate">Min {unit}</span>
            <span className="truncate">Max {unit}</span>
            <span className="truncate">₹ / {unit}</span>
            <span className="w-7" />
          </div>
          <div className="space-y-2">
            {slabs.map((slab, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
                <input type="number" min="0" value={slab.min} onChange={(e) => setSlab(i, 'min', e.target.value)} placeholder="0" className="input-base" />
                <input type="number" min="0" value={slab.max} onChange={(e) => setSlab(i, 'max', e.target.value)} placeholder="500+" className="input-base" />
                <input type="number" min="0" value={slab.rate} onChange={(e) => setSlab(i, 'rate', e.target.value)} placeholder="10" className="input-base" />
                <button type="button" onClick={() => removeSlab(i)} disabled={slabs.length === 1} aria-label="Remove slab" className="grid h-9 w-7 place-items-center rounded-lg text-ink-faint transition hover:text-rose-600 disabled:opacity-30 dark:text-slate-500">
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-xs leading-relaxed text-ink-faint dark:text-slate-500">
            Leave Max {unit} blank for &ldquo;and above&rdquo; slabs (e.g. 500+). Incentive = Achieved {unit} × applicable slab rate.
          </p>
        </div>
        </>
        )}

        {type === 'special' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Campaign Name *" placeholder="e.g. Eid Festival Sale" error={errors.name?.message} {...register('name', { required: 'Enter a campaign name' })} />
            <Select label="Campaign Type *" options={CAMPAIGN_TYPE_OPTIONS} {...register('campaignType', { required: true })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Branch *" placeholder="Select branch" options={branchOptions} error={errors.branchId?.message} {...register('branchId', { required: 'Select a branch' })} />
            <Select label="Staff" placeholder="All Staff" options={staffOptions} {...register('staffId')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Start Date *" type="date" error={errors.startDate?.message} {...register('startDate', { required: 'Required' })} />
            <Input label="End Date *" type="date" error={errors.endDate?.message} {...register('endDate', { required: 'Required' })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Target Value (₹) *" type="number" min="0" placeholder="650000" error={errors.targetValue?.message} {...register('targetValue', { required: 'Enter the target value', min: { value: 1, message: 'Must be greater than zero' } })} />
            <Input label="Incentive (₹)" type="number" min="0" placeholder="8500" {...register('incentive')} />
          </div>
          <Textarea label="Description / Notes" rows={2} placeholder="Optional notes" {...register('description')} />
        </>
        )}

        {type === 'project' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Project Name *" placeholder="e.g. Palm Villa Estates" error={errors.name?.message} {...register('name', { required: 'Enter a project name' })} />
            <Select label="Project Type *" options={PROJECT_TYPE_OPTIONS} {...register('projectType', { required: true })} />
          </div>
          <Input label="Location *" placeholder="e.g. Kochi" error={errors.location?.message} {...register('location', { required: 'Enter a location' })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Branch *" placeholder="Select branch" options={branchOptions} error={errors.branchId?.message} {...register('branchId', { required: 'Select a branch' })} />
            <Select label="Staff" placeholder="Unassigned" options={staffOptions} {...register('staffId')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Start Date *" type="date" error={errors.startDate?.message} {...register('startDate', { required: 'Required' })} />
            <Input label="End Date *" type="date" error={errors.endDate?.message} {...register('endDate', { required: 'Required' })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Project Value (₹) *" type="number" min="0" placeholder="4500000" error={errors.projectValue?.message} {...register('projectValue', { required: 'Required', min: { value: 1, message: '> 0' } })} />
            <Input label="Revenue Target (₹) *" type="number" min="0" placeholder="1350000" error={errors.revenueTarget?.message} {...register('revenueTarget', { required: 'Required', min: { value: 1, message: '> 0' } })} />
            <Input label="Qty Target" type="number" min="0" placeholder="850" {...register('qtyTarget')} />
          </div>
          <Textarea label="Description / Notes" rows={2} placeholder="Optional notes" {...register('description')} />
        </>
        )}
      </form>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Allocation modal — distribute a parent target across entities       */
/* (branches under a product target, or staff under a branch target).  */
/* ------------------------------------------------------------------ */

function AllocationModal({
  open,
  onClose,
  title,
  description,
  entityLabel, // 'Branch' | 'Staff'
  entities, // [{ id, name }]
  parentTarget, // number — the parent's target qty (cap)
  parentLabel, // e.g. 'Target' | 'Branch Target'
  existing, // { [entityId]: qty } pre-fill from existing child targets
  unit,
  saving,
  onSave, // (allocations: [{ <key>: id, targetQty }]) => void
  allocationKey, // 'branchId' | 'staffId'
}) {
  const [values, setValues] = useState({})

  useEffect(() => {
    if (open) setValues({ ...(existing || {}) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const list = entities || []
  const floors = existing || {} // already-assigned quantities — values can only go up
  const total = list.reduce((s, e) => s + (Number(values[e.id]) || 0), 0)
  const cap = Number(parentTarget) || 0
  const remaining = cap - total
  const over = total > cap
  // No-decrease rule: a value may not drop below its already-assigned quantity.
  const belowFloor = list.some((e) => Number(values[e.id] || 0) < Number(floors[e.id] || 0))

  const setQty = (id, val) =>
    setValues((prev) => ({ ...prev, [id]: val }))

  const handleSave = () => {
    if (over || belowFloor) return
    const allocations = list
      .map((e) => ({ [allocationKey]: e.id, targetQty: Number(values[e.id]) || 0 }))
      .filter((a) => a.targetQty > 0)
    onSave(allocations)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            loading={saving}
            disabled={over || belowFloor || saving}
            leftIcon={<FiShare2 />}
          >
            Save Allocation
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Running total */}
        <div
          className={cn(
            'flex items-center justify-between rounded-xl border px-4 py-3 text-sm',
            over
              ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300'
              : 'border-line bg-surface-muted/50 text-ink dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200',
          )}
        >
          <span className="font-medium">
            Allocated{' '}
            <span className="font-semibold tabular-nums">{total.toLocaleString()}</span> / {parentLabel}{' '}
            <span className="font-semibold tabular-nums">{cap.toLocaleString()}</span>{' '}
            <span className="text-xs text-ink-faint dark:text-slate-500">{unit}</span>
          </span>
          <span
            className={cn(
              'tabular-nums text-xs font-semibold',
              over ? 'text-rose-600 dark:text-rose-400' : 'text-ink-soft dark:text-slate-400',
            )}
          >
            {over
              ? `Over by ${Math.abs(remaining).toLocaleString()}`
              : `${remaining.toLocaleString()} remaining`}
          </span>
        </div>

        {over && (
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
            Total allocation exceeds the {parentLabel.toLowerCase()}. Reduce some values before saving.
          </p>
        )}

        {belowFloor && (
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
            An assigned target can only be increased, never reduced. Restore any value to at least its current amount.
          </p>
        )}

        {list.length === 0 ? (
          <p className="rounded-xl border border-line bg-surface-muted/40 px-4 py-6 text-center text-sm text-ink-soft dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
            No {entityLabel.toLowerCase()}s available to allocate to.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_140px] items-center gap-3 px-1 pb-1 text-[11px] font-medium uppercase tracking-wide text-ink-faint dark:text-slate-500">
              <span>{entityLabel}</span>
              <span className="text-right">Target Qty</span>
            </div>
            {list.map((e) => {
              const floor = Number(floors[e.id] || 0)
              const below = Number(values[e.id] || 0) < floor
              return (
                <div key={e.id} className="grid grid-cols-[1fr_140px] items-center gap-3">
                  <span className="truncate text-sm font-medium text-ink dark:text-slate-200">
                    {e.name}
                    {floor > 0 && (
                      <span className="ml-2 text-[11px] font-normal text-ink-faint dark:text-slate-500">
                        min {floor}
                      </span>
                    )}
                  </span>
                  <Input
                    type="number"
                    min={floor}
                    placeholder="0"
                    value={values[e.id] ?? ''}
                    onChange={(ev) => setQty(e.id, ev.target.value)}
                    className={cn('text-right', below && 'border-rose-400 focus:border-rose-400')}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Target vs Achievement chart — the single chart for this page        */
/* ------------------------------------------------------------------ */

function TargetVsAchievementChart({ tab, rows }) {
  /* Per-tab "Target vs Achievement" series (top items by target). */
  const data = useMemo(() => {
    if (tab === 'general') {
      return [...rows]
        .sort((a, b) => b.targetQty - a.targetQty)
        .slice(0, 6)
        .map((r) => ({
          name: r.product,
          target: r.targetQty,
          achieved: r.achievedQty,
        }))
    }
    if (tab === 'special') {
      return [...rows]
        .sort((a, b) => b.targetValue - a.targetValue)
        .slice(0, 6)
        .map((r) => ({
          name: r.name,
          target: Math.round(r.targetValue / 1000),
          achieved: Math.round(r.achievedValue / 1000),
        }))
    }
    return [...rows]
      .sort((a, b) => b.revenueTarget - a.revenueTarget)
      .slice(0, 6)
      .map((r) => ({
        name: r.name,
        target: Math.round(r.revenueTarget / 1000),
        achieved: Math.round(r.revenueAchieved / 1000),
      }))
  }, [tab, rows])

  const valueLabel = tab === 'general' ? 'units' : '₹ 000s'

  return (
    <ChartCard
      title="Target vs Achievement"
      subtitle={`Top ${TAB_META[tab]?.label?.toLowerCase()} targets · ${valueLabel}`}
      icon={FiBarChart2}
      height={300}
    >
      <BarChartView
        data={data}
        xKey="name"
        bars={[
          { key: 'target', name: 'Target', color: '#cbd5e1' },
          { key: 'achieved', name: 'Achieved', color: '#36bab3' },
        ]}
        height={300}
        showLegend
      />
    </ChartCard>
  )
}

/* ------------------------------------------------------------------ */
/* Column definitions per tab                                          */
/* ------------------------------------------------------------------ */

function useColumns(tab, opts = {}) {
  const { onAllocate, canAllocate } = opts
  return useMemo(() => {
    if (tab === 'general') {
      const columns = [
        {
          key: 'id',
          header: 'ID',
          sortable: true,
          render: (r) => (
            <span className="font-mono text-xs font-semibold text-ink-soft dark:text-slate-400">
              {r.id}
            </span>
          ),
        },
        {
          key: 'product',
          header: 'Product',
          sortable: true,
          render: (r) => (
            <span className="font-medium text-ink dark:text-slate-100">{r.product || '—'}</span>
          ),
        },
        {
          // Hierarchy level — shows what this row actually targets.
          key: 'scope',
          header: 'Level',
          sortable: true,
          render: (r) => {
            const isBranch = r.scope === 'Branch'
            const isStaff = r.scope === 'Staff'
            const label = isStaff
              ? r.staffName || 'Staff'
              : isBranch
                ? r.branchName || 'Branch'
                : 'Product'
            const tone = isStaff
              ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300'
              : isBranch
                ? 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300'
                : 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
            return (
              <div className={cn('flex flex-col gap-0.5', isStaff && 'pl-6', isBranch && 'pl-3')}>
                <span className={cn('inline-flex w-fit items-center rounded-md px-2 py-0.5 text-xs font-semibold', tone)}>
                  {r.scope}
                </span>
                <span className="text-xs text-ink-soft dark:text-slate-400">{label}</span>
              </div>
            )
          },
        },
        {
          key: 'period',
          header: 'Period',
          sortable: true,
          render: (r) => (
            <span className="text-ink-soft dark:text-slate-400">{r.period || '—'}</span>
          ),
        },
        {
          key: 'targetQty',
          header: 'Target',
          sortable: true,
          align: 'right',
          render: (r) => (
            <span className="tabular-nums">
              {(Number(r.targetQty) || 0).toLocaleString()}{' '}
              <span className="text-xs text-ink-faint dark:text-slate-500">{r.unit}</span>
            </span>
          ),
        },
        {
          key: 'achievedQty',
          header: 'Achieved',
          sortable: true,
          align: 'right',
          render: (r) => (
            <span className="font-semibold tabular-nums text-ink dark:text-slate-100">
              {(Number(r.achievedQty) || 0).toLocaleString()}
            </span>
          ),
        },
        {
          // Count of completed sales recorded against this target (live).
          key: 'salesCount',
          header: 'Sales',
          sortable: true,
          align: 'right',
          render: (r) => (
            <span
              className="inline-flex items-center gap-1 rounded-md bg-surface-muted/70 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-ink-soft dark:bg-slate-800/60 dark:text-slate-300"
              title={`${Number(r.salesCount) || 0} completed sale${(Number(r.salesCount) || 0) === 1 ? '' : 's'} against this target`}
            >
              <FiShoppingBag className="h-3 w-3" />
              {Number(r.salesCount) || 0}
            </span>
          ),
        },
        {
          key: 'completion',
          header: 'Completion',
          sortable: true,
          width: '180px',
          render: (r) => <CompletionCell value={r.completion} />,
        },
        {
          key: 'incentiveAmount',
          header: 'Incentive',
          sortable: true,
          align: 'right',
          render: (r) => {
            const amt = Number(r.incentiveAmount) || 0
            return amt > 0 ? (
              <span className="tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(amt, { compact: true })}
              </span>
            ) : (
              <span className="text-ink-faint dark:text-slate-600">—</span>
            )
          },
        },
        {
          key: 'status',
          header: 'Status',
          sortable: true,
          render: (r) => <StatusBadge status={r.status} withDot />,
        },
      ]

      if (onAllocate) {
        columns.push({
          key: 'actions',
          header: 'Allocate',
          align: 'right',
          render: (r) => {
            // Product target -> allocate to branches; Branch target -> to staff.
            const level = r.scope === 'Admin' ? 'branch' : r.scope === 'Branch' ? 'staff' : null
            if (!level || !canAllocate?.(r)) {
              return <span className="text-ink-faint dark:text-slate-600">—</span>
            }
            return (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<FiShare2 />}
                onClick={() => onAllocate(r, level)}
              >
                {level === 'branch' ? 'Branches' : 'Staff'}
              </Button>
            )
          },
        })
      }

      return columns
    }

    if (tab === 'special') {
      return [
        {
          key: 'id',
          header: 'ID',
          sortable: true,
          render: (r) => (
            <span className="font-mono text-xs font-semibold text-ink-soft dark:text-slate-400">
              {r.id}
            </span>
          ),
        },
        {
          key: 'name',
          header: 'Campaign',
          sortable: true,
          render: (r) => (
            <span className="font-medium text-ink dark:text-slate-100">{r.name}</span>
          ),
        },
        {
          key: 'type',
          header: 'Type',
          sortable: true,
          render: (r) => (
            <span className="inline-flex items-center rounded-md bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-soft dark:bg-slate-800 dark:text-slate-300">
              {r.type}
            </span>
          ),
        },
        { key: 'branchName', header: 'Branch', sortable: true },
        {
          key: 'staffName',
          header: 'Staff',
          sortable: true,
          render: (r) => (
            <span className="text-ink-soft dark:text-slate-400">{r.staffName}</span>
          ),
        },
        {
          key: 'startDate',
          header: 'Period',
          sortable: true,
          render: (r) => (
            <span className="whitespace-nowrap text-xs text-ink-soft dark:text-slate-400">
              {r.startDate} – {r.endDate}
            </span>
          ),
        },
        {
          key: 'targetValue',
          header: 'Target',
          sortable: true,
          align: 'right',
          render: (r) => (
            <span className="tabular-nums">{formatCurrency(r.targetValue, { compact: true })}</span>
          ),
        },
        {
          key: 'achievedValue',
          header: 'Achieved',
          sortable: true,
          align: 'right',
          render: (r) => (
            <span className="font-semibold tabular-nums text-ink dark:text-slate-100">
              {formatCurrency(r.achievedValue, { compact: true })}
            </span>
          ),
        },
        {
          key: 'incentive',
          header: 'Incentive',
          sortable: true,
          align: 'right',
          render: (r) => (
            <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(r.incentive, { compact: true })}
            </span>
          ),
        },
        {
          key: 'completion',
          header: 'Completion',
          sortable: true,
          width: '180px',
          render: (r) => <CompletionCell value={r.completion} />,
        },
        {
          key: 'achievement',
          header: 'Achievement',
          render: (r) => <AchievementBadge achieved={r.achievedValue} target={r.targetValue} />,
        },
        {
          key: 'status',
          header: 'Status',
          sortable: true,
          render: (r) => <StatusBadge status={r.status} withDot />,
        },
      ]
    }

    // project
    return [
      {
        key: 'id',
        header: 'ID',
        sortable: true,
        render: (r) => (
          <span className="font-mono text-xs font-semibold text-ink-soft dark:text-slate-400">
            {r.id}
          </span>
        ),
      },
      {
        key: 'name',
        header: 'Project',
        sortable: true,
        render: (r) => (
          <span className="font-medium text-ink dark:text-slate-100">{r.name}</span>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        sortable: true,
        render: (r) => (
          <span className="inline-flex items-center rounded-md bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-soft dark:bg-slate-800 dark:text-slate-300">
            {r.type}
          </span>
        ),
      },
      {
        key: 'location',
        header: 'Location',
        sortable: true,
        render: (r) => (
          <span className="whitespace-nowrap text-ink-soft dark:text-slate-400">{r.location}</span>
        ),
      },
      { key: 'branchName', header: 'Branch', sortable: true },
      {
        key: 'projectValue',
        header: 'Project Value',
        sortable: true,
        align: 'right',
        render: (r) => (
          <span className="tabular-nums">{formatCurrency(r.projectValue, { compact: true })}</span>
        ),
      },
      {
        key: 'revenueTarget',
        header: 'Revenue Tgt / Ach',
        sortable: true,
        align: 'right',
        render: (r) => (
          <span className="whitespace-nowrap tabular-nums">
            <span className="text-ink-soft dark:text-slate-400">
              {formatCurrency(r.revenueTarget, { compact: true })}
            </span>
            <span className="mx-1 text-ink-faint dark:text-slate-600">/</span>
            <span className="font-semibold text-ink dark:text-slate-100">
              {formatCurrency(r.revenueAchieved, { compact: true })}
            </span>
          </span>
        ),
      },
      {
        key: 'completion',
        header: 'Completion',
        sortable: true,
        width: '180px',
        render: (r) => <CompletionCell value={r.completion} />,
      },
      {
        key: 'achievement',
        header: 'Achievement',
        render: (r) => <AchievementBadge achieved={r.revenueAchieved} target={r.revenueTarget} />,
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (r) => <StatusBadge status={r.status} withDot />,
      },
    ]
  }, [tab, onAllocate, canAllocate])
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Targets() {
  const dispatch = useDispatch()
  const toast = useToast()
  const { general, special, project, summary, activeTab, filters, status } =
    useSelector(selectTargets)
  const { campaigns: flashCampaigns } = useSelector(selectFlash)

  // Branch / staff filter options sourced from the backend (real ids).
  const branchOptions = useSelector(selectBranchOptions) // [{ value, label }]
  const staffOptions = useSelector(selectStaffOptions)
  const allStaff = useSelector(selectStaff) // full staff records (need branchId)
  const roleKey = useSelector(selectRoleKey)
  const user = useSelector(selectUser)
  const isAdmin = roleKey === 'admin'
  const isManager = roleKey === 'branch_manager'
  const BRANCH_OPTIONS = useMemo(
    () => [{ value: 'All', label: 'All Branches' }, ...branchOptions],
    [branchOptions],
  )
  const STAFF_OPTIONS = useMemo(
    () => [{ value: 'All', label: 'All Staff' }, ...staffOptions],
    [staffOptions],
  )

  const loading = status === 'loading' || status === 'idle'
  const [modalOpen, setModalOpen] = useState(false)
  const [sort, setSortState] = useState({ key: 'completion', dir: 'desc' })

  // Hierarchical allocation modal state.
  // { open, level: 'branch'|'staff', row } — `row` is the parent target.
  const [alloc, setAlloc] = useState({ open: false, level: null, row: null })
  const [allocSaving, setAllocSaving] = useState(false)

  // Load all tabs + summary + reference data (products/branches/staff) on mount.
  useEffect(() => {
    dispatch(fetchTargets('general'))
    dispatch(fetchTargets('special'))
    dispatch(fetchTargets('project'))
    dispatch(fetchTargetSummary())
    dispatch(fetchProducts())
    dispatch(fetchBranches())
    dispatch(fetchStaff())
    dispatch(fetchFlashTargets())
  }, [dispatch])

  const tabData = { general, special, project }
  const rawRows = tabData[activeTab] ?? []

  // Who may open the Allocate action on a given general-tab row:
  //  - Product target (Admin scope) -> Admin only (allocate to branches).
  //  - Branch target (Branch scope) -> Admin, or the Branch Manager of that branch.
  const canAllocate = useMemo(
    () => (row) => {
      if (row.scope === 'Admin') return isAdmin
      if (row.scope === 'Branch') return isAdmin || (isManager && user?.branchId === row.branchId)
      return false
    },
    [isAdmin, isManager, user?.branchId],
  )

  const openAllocate = useMemo(
    () => (row, level) => setAlloc({ open: true, level, row }),
    [],
  )

  // Only attach allocation handlers on the general tab.
  const columns = useColumns(
    activeTab,
    activeTab === 'general' ? { onAllocate: openAllocate, canAllocate } : {},
  )

  /* Apply search + filters + sort to the active tab list. */
  const rows = useMemo(() => {
    let list = applyFilters(rawRows, filters, FILTER_MAP_BY_TAB[activeTab])
    list = searchData(list, filters.search, SEARCH_KEYS_BY_TAB[activeTab])
    list = sortData(list, sort.key, sort.dir)
    return list
  }, [rawRows, filters, activeTab, sort])

  /* Charts always reflect the full (unfiltered-by-search) tab status set,
     but respect branch/staff/status/type filters for context-awareness. */
  const chartRows = useMemo(
    () => applyFilters(rawRows, filters, FILTER_MAP_BY_TAB[activeTab]),
    [rawRows, filters, activeTab],
  )

  /* General targets span a Product→Branch→Staff hierarchy — the SAME sale counts
     at every level, so summing achievedQty across all rows would multi-count.
     Total the coarsest scope present (Product for admin, Branch for a manager,
     else the leaf rows) so "units achieved" reflects real, non-duplicated units. */
  const generalAchievedUnits = useMemo(() => {
    if (activeTab !== 'general') return 0
    const admin = rows.filter((r) => r.scope === 'Admin')
    const branch = rows.filter((r) => r.scope === 'Branch')
    const level = admin.length ? admin : branch.length ? branch : rows
    return sum(level, 'achievedQty')
  }, [rows, activeTab])

  const tabs = [
    { key: 'general', label: TAB_META.general.label, icon: TAB_META.general.icon, count: general.length },
    { key: 'special', label: TAB_META.special.label, icon: TAB_META.special.icon, count: special.length },
    { key: 'project', label: TAB_META.project.label, icon: TAB_META.project.icon, count: project.length },
    { key: 'flash', label: TAB_META.flash.label, icon: TAB_META.flash.icon, count: (flashCampaigns || []).length },
  ]

  const handleSort = (key) => {
    setSortState((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    )
  }

  const handleFilter = (key, value) => dispatch(setFilter({ key, value }))

  const handleTab = (key) => {
    dispatch(setTab(key))
    setSortState({ key: 'completion', dir: 'desc' })
  }

  const hasActiveFilters =
    filters.search ||
    filters.branch !== 'All' ||
    filters.staff !== 'All' ||
    filters.status !== 'All' ||
    filters.type !== 'All'

  const handleExport = () => {
    if (rows.length === 0) {
      toast.warning('Nothing to export with the current filters.')
      return
    }
    exportData('csv', rows, `actizo-${activeTab}-targets`)
    toast.success(`Exported ${rows.length} ${TAB_META[activeTab].label.toLowerCase()} targets to CSV.`)
  }

  const handleCreateTarget = async (values) => {
    const tab = values.targetType || 'general'
    try {
      if (tab === 'general') {
        // Create the Product Target, then distribute it across branches in one flow.
        const incentiveRate = Number(values.slabs?.[0]?.rate) || 0
        const res = await dispatch(
          addTarget({
            tab: 'general',
            target: {
              productId: values.productId,
              period: values.period || 'Monthly',
              targetQty: Number(values.targetQty) || 0,
              incentiveRate,
              startDate: values.startDate || null,
              endDate: values.endDate || null,
            },
          }),
        ).unwrap()
        const productTarget = res.target
        if (productTarget?.id && (values.branchAllocations || []).length) {
          await dispatch(
            allocateBranches({ id: productTarget.id, allocations: values.branchAllocations }),
          ).unwrap()
        }
        dispatch(fetchTargets('general'))
        dispatch(fetchTargetSummary())
        if (activeTab !== 'general') dispatch(setTab('general'))
        toast.success('Product target created and distributed across branches.', { title: 'Target created' })
        setModalOpen(false)
        return
      }

      const target =
        tab === 'special'
          ? {
              name: values.name,
              type: values.campaignType,
              branchId: values.branchId || null,
              staffId: values.staffId || null,
              startDate: values.startDate || null,
              endDate: values.endDate || null,
              targetValue: Number(values.targetValue) || 0,
              incentive: Number(values.incentive) || 0,
            }
          : {
              name: values.name,
              type: values.projectType,
              location: values.location,
              branchId: values.branchId || null,
              staffId: values.staffId || null,
              startDate: values.startDate || null,
              endDate: values.endDate || null,
              projectValue: Number(values.projectValue) || 0,
              revenueTarget: Number(values.revenueTarget) || 0,
              qtyTarget: Number(values.qtyTarget) || 0,
            }

      await dispatch(addTarget({ tab, target })).unwrap()
      dispatch(fetchTargets(tab))
      dispatch(fetchTargetSummary())
      if (activeTab !== tab) dispatch(setTab(tab))
      toast.success('Target created.', { title: 'Target created' })
      setModalOpen(false)
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to create target.', {
        title: 'Create failed',
      })
    }
  }

  /* -------------------- Hierarchical allocation -------------------- */
  const closeAllocate = () => setAlloc({ open: false, level: null, row: null })

  // Derive the modal's entity list, pre-fill and cap from the current row + store.
  const allocConfig = useMemo(() => {
    const { level, row } = alloc
    if (!row) return null
    if (level === 'branch') {
      // Existing branch allocations = Branch targets whose parentId === row.id.
      const existing = {}
      ;(general || []).forEach((t) => {
        if (t.scope === 'Branch' && t.parentId === row.id && t.branchId) {
          existing[t.branchId] = Number(t.targetQty) || 0
        }
      })
      return {
        title: 'Allocate to Branches',
        description: `Distribute ${row.product || 'product'} target across branches.`,
        entityLabel: 'Branch',
        entities: (branchOptions || []).map((b) => ({ id: b.value, name: b.label })),
        existing,
        allocationKey: 'branchId',
        parentLabel: 'Target',
      }
    }
    if (level === 'staff') {
      const existing = {}
      ;(general || []).forEach((t) => {
        if (t.scope === 'Staff' && t.parentId === row.id && t.staffId) {
          existing[t.staffId] = Number(t.targetQty) || 0
        }
      })
      return {
        title: 'Allocate to Staff',
        description: `Distribute ${row.branchName || 'branch'} target across its staff.`,
        entityLabel: 'Staff',
        entities: (allStaff || [])
          .filter((s) => s.branchId === row.branchId)
          .map((s) => ({ id: s.id, name: s.name })),
        existing,
        allocationKey: 'staffId',
        parentLabel: 'Branch Target',
      }
    }
    return null
  }, [alloc, general, branchOptions, allStaff])

  const handleAllocateSave = async (allocations) => {
    const { level, row } = alloc
    if (!row) return
    setAllocSaving(true)
    const thunk = level === 'branch' ? allocateBranches : allocateStaff
    try {
      await dispatch(thunk({ id: row.id, allocations })).unwrap()
      dispatch(fetchTargets('general'))
      dispatch(fetchTargetSummary())
      toast.success(
        level === 'branch' ? 'Branch allocation saved.' : 'Staff allocation saved.',
        { title: 'Allocation saved' },
      )
      closeAllocate()
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to save allocation.', {
        title: 'Allocation failed',
      })
    } finally {
      setAllocSaving(false)
    }
  }

  const typeOptions = TYPE_OPTIONS_BY_TAB[activeTab]
  const typeFilterLabel =
    activeTab === 'general' ? 'Scope' : 'Type'

  /* KPI cards from summary */
  const kpis = [
    { label: 'Total Targets', value: summary.total, icon: FiTarget, tone: 'brand' },
    { label: 'Achieved', value: summary.achieved, icon: FiCheckCircle, tone: 'emerald' },
    { label: 'Pending', value: summary.pending, icon: FiClock, tone: 'amber' },
    {
      label: 'Avg Completion',
      value: formatPercent(summary.avgCompletion, 1),
      icon: FiPercent,
      tone: 'sky',
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
        title="Targets"
        subtitle="General, Special & Project targets"
        icon={FiTarget}
        actions={
          <>
            <Button variant="outline" leftIcon={<FiDownload />} onClick={handleExport}>
              Export
            </Button>
            {/* Creating a general (Product) target is Admin-only. Special/Project
                creation stays available on their tabs. Flash has its own action. */}
            {activeTab !== 'flash' && (activeTab !== 'general' || isAdmin) && (
              <Button leftIcon={<FiPlus />} onClick={() => setModalOpen(true)}>
                New Target
              </Button>
            )}
          </>
        }
      />

      {/* Summary KPIs (Flash tab shows its own KPIs inside the panel) */}
      {activeTab !== 'flash' && (
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {kpis.map((k) => (
            <KPICard
              key={k.label}
              label={k.label}
              value={k.value}
              icon={k.icon}
              tone={k.tone}
              loading={loading}
            />
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs tabs={tabs} active={activeTab} onChange={handleTab} variant="underline" />

      {/* Context-aware charts + table swap cleanly on tab change */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="space-y-6"
        >
          {activeTab === 'flash' ? (
            <FlashTargetsPanel />
          ) : (
          <>
          <TargetVsAchievementChart tab={activeTab} rows={chartRows} />

          {/* Filters toolbar */}
          <div className="card p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink dark:text-slate-100">
                <FiFilter className="h-4 w-4 text-brand-500" />
                <span>Filter {TAB_META[activeTab].label} Targets</span>
              </div>

              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
                <SearchBar
                  value={filters.search}
                  onChange={(v) => handleFilter('search', v)}
                  placeholder="Search targets…"
                  className="sm:w-56"
                />
                <Select
                  options={TYPE_OPTIONS_BY_TAB[activeTab]}
                  value={filters.type}
                  onChange={(e) => handleFilter('type', e.target.value)}
                  aria-label={typeFilterLabel}
                  className="sm:w-40"
                  containerClassName="sm:w-auto"
                />
                <Select
                  options={BRANCH_OPTIONS}
                  value={filters.branch}
                  onChange={(e) => handleFilter('branch', e.target.value)}
                  aria-label="Branch"
                  className="sm:w-48"
                  containerClassName="sm:w-auto"
                />
                <Select
                  options={STAFF_OPTIONS}
                  value={filters.staff}
                  onChange={(e) => handleFilter('staff', e.target.value)}
                  aria-label="Staff"
                  className="sm:w-44"
                  containerClassName="sm:w-auto"
                />
                <Select
                  options={STATUS_OPTIONS}
                  value={filters.status}
                  onChange={(e) => handleFilter('status', e.target.value)}
                  aria-label="Status"
                  className="sm:w-40"
                  containerClassName="sm:w-auto"
                />
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    leftIcon={<FiRotateCcw />}
                    onClick={() => dispatch(resetFilters())}
                    className="shrink-0"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs text-ink-soft dark:border-slate-800 dark:text-slate-400">
              <span>
                Showing{' '}
                <span className="font-semibold text-ink dark:text-slate-200">{rows.length}</span> of{' '}
                {rawRows.length} {TAB_META[activeTab].label.toLowerCase()} targets
              </span>
              <span className="hidden items-center gap-1.5 tabular-nums sm:flex">
                <FiBarChart2 className="h-3.5 w-3.5 text-brand-500" />
                {activeTab === 'general'
                  ? `${generalAchievedUnits.toLocaleString()} units achieved`
                  : activeTab === 'special'
                    ? `${formatCurrency(sum(rows, 'achievedValue'), { compact: true })} achieved`
                    : `${formatCurrency(sum(rows, 'revenueAchieved'), { compact: true })} revenue`}
              </span>
            </div>
          </div>

          {/* Table */}
          <DataTable
            columns={columns}
            data={rows}
            loading={loading}
            sort={sort}
            onSort={handleSort}
            rowKey={(r) => r.id}
            emptyIcon={FiTarget}
            emptyTitle="No targets found"
            emptyDescription={
              hasActiveFilters
                ? 'No targets match your current filters. Try adjusting or resetting them.'
                : 'There are no targets in this category yet. Create one to get started.'
            }
          />
          </>
          )}
        </motion.div>
      </AnimatePresence>

      <NewTargetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        tab={activeTab}
        onCreate={handleCreateTarget}
      />

      {allocConfig && (
        <AllocationModal
          open={alloc.open}
          onClose={closeAllocate}
          title={allocConfig.title}
          description={allocConfig.description}
          entityLabel={allocConfig.entityLabel}
          entities={allocConfig.entities}
          parentTarget={alloc.row?.targetQty}
          parentLabel={allocConfig.parentLabel}
          existing={allocConfig.existing}
          unit={alloc.row?.unit}
          saving={allocSaving}
          onSave={handleAllocateSave}
          allocationKey={allocConfig.allocationKey}
        />
      )}
    </motion.div>
  )
}
