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
  FiTrash2,
} from 'react-icons/fi'

import {
  selectTargets,
  setTab,
  setFilter,
  resetFilters,
  addTarget,
} from '@/redux/slices/targetSlice'
import { TARGET_STATUSES } from '@/data/targets'
import { branchOptions, branchById } from '@/data/branches'
import { staffOptions } from '@/data/staff'
import { productOptions, productById } from '@/data/products'

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

const BRANCH_OPTIONS = [{ value: 'All', label: 'All Branches' }, ...branchOptions]
const STAFF_OPTIONS = [{ value: 'All', label: 'All Staff' }, ...staffOptions]

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

const ASSIGNMENT_OPTIONS = [
  { value: 'Branch Only', label: 'Branch Only' },
  { value: 'Branch & Staff', label: 'Branch & Staff' },
  { value: 'All Branches', label: 'All Branches' },
]
const blankSlab = () => ({ min: '', max: '', rate: '' })
const targetDefaults = () => ({
  productId: '', branchId: '', startDate: '', endDate: '', targetQty: '', description: '', assignment: 'Branch Only',
})

function NewTargetModal({ open, onClose, onCreate }) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: targetDefaults() })

  const [slabs, setSlabs] = useState([{ min: '0', max: '', rate: '' }])

  useEffect(() => {
    if (open) {
      reset(targetDefaults())
      setSlabs([{ min: '0', max: '', rate: '' }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const unit = productById(watch('productId'))?.unit || 'units'

  const addSlab = () => setSlabs((s) => [...s, blankSlab()])
  const removeSlab = (i) => setSlabs((s) => (s.length > 1 ? s.filter((_, idx) => idx !== i) : s))
  const setSlab = (i, key, val) => setSlabs((s) => s.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)))

  const submit = (form) => onCreate({ ...form, unit, slabs })

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
          <Button type="submit" form="new-target-form" loading={isSubmitting} leftIcon={<FiPlus />}>
            Create Target
          </Button>
        </>
      }
    >
      <form id="new-target-form" onSubmit={handleSubmit(submit)} className="space-y-5">
        {/* Product + Branch */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Product *" placeholder="Select product" options={productOptions} error={errors.productId?.message} {...register('productId', { required: 'Select a product' })} />
          <Select label="Branch *" placeholder="Select branch" options={branchOptions} error={errors.branchId?.message} {...register('branchId', { required: 'Select a branch' })} />
        </div>

        {/* Dates */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Start Date *" type="date" error={errors.startDate?.message} {...register('startDate', { required: 'Required' })} />
          <Input label="End Date *" type="date" error={errors.endDate?.message} {...register('endDate', { required: 'Required' })} />
        </div>

        {/* Target quantity */}
        <Input
          label={`Target Quantity (${unit}) *`}
          type="number"
          min="0"
          placeholder="2000"
          error={errors.targetQty?.message}
          {...register('targetQty', { required: 'Enter the target quantity', min: { value: 1, message: 'Must be greater than zero' } })}
        />

        {/* Description */}
        <Textarea label="Description / Notes" rows={2} placeholder="Optional notes" {...register('description')} />

        {/* Assignment */}
        <div className="border-t border-line pt-4 dark:border-slate-800">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint dark:text-slate-500">Assignment</p>
          <Select options={ASSIGNMENT_OPTIONS} {...register('assignment')} />
        </div>

        {/* Incentive slabs */}
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
                <button
                  type="button"
                  onClick={() => removeSlab(i)}
                  disabled={slabs.length === 1}
                  aria-label="Remove slab"
                  className="grid h-9 w-7 place-items-center rounded-lg text-ink-faint transition hover:text-rose-600 disabled:opacity-30 dark:text-slate-500"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <p className="mt-2.5 text-xs leading-relaxed text-ink-faint dark:text-slate-500">
            Leave Max {unit} blank for &ldquo;and above&rdquo; slabs (e.g. 500+). Incentive = Achieved {unit} × applicable slab rate.
          </p>
        </div>
      </form>
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

  const valueLabel = tab === 'general' ? 'units' : 'AED 000s'

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

function useColumns(tab) {
  return useMemo(() => {
    if (tab === 'general') {
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
          key: 'product',
          header: 'Product',
          sortable: true,
          render: (r) => (
            <span className="font-medium text-ink dark:text-slate-100">{r.product}</span>
          ),
        },
        {
          key: 'scope',
          header: 'Scope',
          sortable: true,
          render: (r) => (
            <span className="inline-flex items-center rounded-md bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-soft dark:bg-slate-800 dark:text-slate-300">
              {r.scope}
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
          key: 'period',
          header: 'Period',
          sortable: true,
          render: (r) => (
            <span className="text-ink-soft dark:text-slate-400">{r.period}</span>
          ),
        },
        {
          key: 'targetQty',
          header: 'Target',
          sortable: true,
          align: 'right',
          render: (r) => (
            <span className="tabular-nums">
              {r.targetQty.toLocaleString()}{' '}
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
              {r.achievedQty.toLocaleString()}
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
          render: (r) => <AchievementBadge achieved={r.achievedQty} target={r.targetQty} />,
        },
        {
          key: 'status',
          header: 'Status',
          sortable: true,
          render: (r) => <StatusBadge status={r.status} withDot />,
        },
      ]
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
  }, [tab])
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Targets() {
  const dispatch = useDispatch()
  const toast = useToast()
  const { general, special, project, summary, activeTab, filters } =
    useSelector(selectTargets)

  const [loading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [sort, setSortState] = useState({ key: 'completion', dir: 'desc' })

  const tabData = { general, special, project }
  const rawRows = tabData[activeTab] ?? []
  const columns = useColumns(activeTab)

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

  const tabs = [
    { key: 'general', label: TAB_META.general.label, icon: TAB_META.general.icon, count: general.length },
    { key: 'special', label: TAB_META.special.label, icon: TAB_META.special.icon, count: special.length },
    { key: 'project', label: TAB_META.project.label, icon: TAB_META.project.icon, count: project.length },
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

  const handleCreateTarget = (values) => {
    const product = productById(values.productId)
    const branch = branchById(values.branchId)
    const total = Number(values.targetQty) || 0
    const isAllBranches = values.assignment === 'All Branches'
    const scope = isAllBranches ? 'Admin' : values.assignment === 'Branch & Staff' ? 'Staff' : 'Branch'
    const slabs = (values.slabs || []).map((s) => ({
      min: Number(s.min) || 0,
      max: s.max === '' || s.max == null ? null : Number(s.max),
      rate: Number(s.rate) || 0,
    }))

    const target = {
      id: `GT-${Math.floor(Math.random() * 900 + 100)}`,
      productId: values.productId,
      product: product?.name || 'Product',
      unit: product?.unit || values.unit || 'units',
      scope,
      branchId: isAllBranches ? null : values.branchId || null,
      branchName: isAllBranches ? 'All Branches' : branch?.name || '—',
      staffId: null,
      staffName: '—',
      period: 'Custom',
      targetQty: total,
      achievedQty: 0,
      completion: 0,
      status: 'Active',
      month: 'Jun 2026',
      startDate: values.startDate || null,
      endDate: values.endDate || null,
      description: values.description || '',
      assignment: values.assignment,
      slabs,
      incentive: slabs[0]?.rate || 0,
      threshold: 100,
    }

    dispatch(addTarget({ tab: 'general', target }))
    if (activeTab !== 'general') dispatch(setTab('general'))
    toast.success(`Target for "${target.product}" created.`, { title: 'Target created' })
    setModalOpen(false)
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
            <Button leftIcon={<FiPlus />} onClick={() => setModalOpen(true)}>
              New Target
            </Button>
          </>
        }
      />

      {/* Summary KPIs */}
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
                  ? `${sum(rows, 'achievedQty').toLocaleString()} units achieved`
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
        </motion.div>
      </AnimatePresence>

      <NewTargetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        tab={activeTab}
        onCreate={handleCreateTarget}
      />
    </motion.div>
  )
}
