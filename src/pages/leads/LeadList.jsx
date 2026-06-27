import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import {
  FiUsers,
  FiUserPlus,
  FiUserCheck,
  FiDownload,
  FiPlus,
  FiEye,
  FiEdit3,
  FiTrash2,
  FiMoreVertical,
  FiChevronDown,
  FiRotateCcw,
  FiCheckCircle,
  FiXCircle,
  FiMapPin,
  FiPhone,
  FiShoppingBag,
  FiCalendar,
} from 'react-icons/fi'

import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/format'
import {
  searchData,
  applyFilters,
  sortData,
  paginate,
  totalPages,
} from '@/utils/helpers'
import { exportData } from '@/utils/export'

import {
  selectLeads,
  selectLeadFilters,
  selectLeadStatus,
  setFilter,
  setSort,
  setPage,
  resetFilters,
  addLead,
  updateLead,
  deleteLead,
  fetchLeads,
} from '@/redux/slices/leadSlice'
import { fetchBranches, selectBranches, selectBranchOptions } from '@/redux/slices/branchSlice'
import { fetchProducts, selectProductOptions } from '@/redux/slices/productSlice'
import { fetchStaff, selectStaffOptions } from '@/redux/slices/staffSlice'

import {
  LEAD_STATUSES,
  LEAD_SOURCES,
  LEAD_PRIORITIES,
} from '@/data/leads'

import PageHeader from '@/components/common/PageHeader'
import SearchBar from '@/components/common/SearchBar'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import StatusBadge from '@/components/ui/StatusBadge'
import Dropdown from '@/components/ui/Dropdown'
import Pagination from '@/components/ui/Pagination'
import DataTable from '@/components/data/DataTable'
import KPICard from '@/components/cards/KPICard'
import Modal from '@/components/overlay/Modal'
import ConfirmDialog from '@/components/overlay/ConfirmDialog'
import { useToast } from '@/components/feedback/Toast'

// ---------------------------------------------------------------------------
// Select option builders (prepend an "All" sentinel for filter selects)
// ---------------------------------------------------------------------------
const ALL = { value: 'All', label: 'All' }
const toOpts = (arr) => arr.map((v) => ({ value: v, label: v }))

const STATUS_FILTER_OPTS = [ALL, ...toOpts(LEAD_STATUSES)]
const SOURCE_FILTER_OPTS = [ALL, ...toOpts(LEAD_SOURCES)]
const PRIORITY_FILTER_OPTS = [ALL, ...toOpts(LEAD_PRIORITIES)]

// Form selects (no "All", but a placeholder where useful)
const SOURCE_FORM_OPTS = toOpts(LEAD_SOURCES)
const PRIORITY_FORM_OPTS = toOpts(LEAD_PRIORITIES)

// Search keys used by the toolbar SearchBar.
const SEARCH_KEYS = ['name', 'company', 'mobile', 'email', 'id', 'product']

// Columns exported to CSV / Excel / PDF (over the *filtered* set).
const EXPORT_COLUMNS = [
  { key: 'id', label: 'Lead ID' },
  { key: 'name', label: 'Customer' },
  { key: 'company', label: 'Company' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'email', label: 'Email' },
  { key: 'location', label: 'Location' },
  { key: 'product', label: 'Product' },
  { key: 'source', label: 'Source' },
  { key: 'branchName', label: 'Branch' },
  { key: 'staffName', label: 'Assigned' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'value', label: 'Value (₹)' },
  { key: 'createdDate', label: 'Created' },
]

const todayISO = () => new Date().toISOString().slice(0, 10)

export default function LeadList() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const toast = useToast()

  const leads = useSelector(selectLeads)
  const filters = useSelector(selectLeadFilters)
  const sort = useSelector((s) => s.leads.sort)
  const page = useSelector((s) => s.leads.page)
  const pageSize = useSelector((s) => s.leads.pageSize)
  const leadStatus = useSelector(selectLeadStatus)

  // Branch / staff filter options sourced from the backend (real ids).
  const branchOptions = useSelector(selectBranchOptions)
  const staffOptions = useSelector(selectStaffOptions)
  const BRANCH_FILTER_OPTS = useMemo(() => [ALL, ...branchOptions], [branchOptions])
  const STAFF_FILTER_OPTS = useMemo(() => [ALL, ...staffOptions], [staffOptions])

  const loading = leadStatus === 'loading' || leadStatus === 'idle'
  const [addOpen, setAddOpen] = useState(false)
  const [editLead, setEditLead] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Load leads + reference data (branches/products/staff) from the API on mount.
  useEffect(() => {
    dispatch(fetchLeads())
    dispatch(fetchBranches())
    dispatch(fetchProducts())
    dispatch(fetchStaff())
  }, [dispatch])

  // -------------------------------------------------------------------------
  // KPI counts (computed from the full lead set, independent of filters)
  // -------------------------------------------------------------------------
  const counts = useMemo(() => {
    let total = 0
    let neu = 0
    let won = 0
    let lost = 0
    for (const l of leads) {
      total += 1
      if (l.status === 'New Lead') neu += 1
      else if (l.status === 'Won') won += 1
      else if (l.status === 'Lost') lost += 1
    }
    return { total, neu, won, lost }
  }, [leads])

  // -------------------------------------------------------------------------
  // Pipeline: search → filter → sort → (filtered for export) → paginate
  // -------------------------------------------------------------------------
  const filtered = useMemo(() => {
    const searched = searchData(leads, filters.search, SEARCH_KEYS)
    const onlyFiltered = applyFilters(
      searched,
      {
        status: filters.status,
        branch: filters.branch,
        staff: filters.staff,
        source: filters.source,
        priority: filters.priority,
      },
      {
        status: 'status',
        branch: 'branchId',
        staff: 'staffId',
        source: 'source',
        priority: 'priority',
      },
    )
    return sortData(onlyFiltered, sort.key, sort.dir)
  }, [leads, filters, sort])

  const total = filtered.length
  const pageCount = totalPages(total, pageSize)

  // Keep page within bounds when the filtered set shrinks.
  useEffect(() => {
    if (page > pageCount) dispatch(setPage(pageCount))
  }, [page, pageCount, dispatch])

  const pageRows = useMemo(
    () => paginate(filtered, Math.min(page, pageCount), pageSize),
    [filtered, page, pageCount, pageSize],
  )

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleFilter = (key, value) => dispatch(setFilter({ key, value }))

  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.status !== 'All' ||
    filters.branch !== 'All' ||
    filters.staff !== 'All' ||
    filters.source !== 'All' ||
    filters.priority !== 'All'

  const handleExport = (format) => {
    if (!filtered.length) {
      toast.warning('Nothing to export — no leads match the current filters.')
      return
    }
    exportData(format, filtered, 'actizo-leads', EXPORT_COLUMNS)
    toast.success(`Exported ${filtered.length} leads as ${format.toUpperCase()}.`)
  }

  const exportItems = [
    {
      label: 'Export as CSV',
      icon: <FiDownload className="h-4 w-4" />,
      onClick: () => handleExport('csv'),
    },
    {
      label: 'Export as Excel',
      icon: <FiDownload className="h-4 w-4" />,
      onClick: () => handleExport('excel'),
    },
    {
      label: 'Export as PDF',
      icon: <FiDownload className="h-4 w-4" />,
      onClick: () => handleExport('pdf'),
    },
  ]

  // -------------------------------------------------------------------------
  // Table columns
  // -------------------------------------------------------------------------
  const columns = useMemo(
    () => [
      {
        key: 'id',
        header: 'Lead ID',
        sortable: true,
        width: '120px',
        render: (row) => (
          <span className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">
            {row.id}
          </span>
        ),
      },
      {
        key: 'name',
        header: 'Customer',
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-3">
            <Avatar name={row.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink dark:text-slate-100">
                {row.name}
              </p>
              <p className="truncate text-xs text-ink-soft dark:text-slate-400">
                {row.company || 'Individual'}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: 'mobile',
        header: 'Mobile',
        render: (row) => (
          <span className="whitespace-nowrap text-sm text-ink-soft dark:text-slate-300">
            {row.mobile}
          </span>
        ),
      },
      {
        key: 'location',
        header: 'Location',
        sortable: true,
        render: (row) => (
          <span className="inline-flex items-center gap-1.5 text-sm text-ink-soft dark:text-slate-300">
            <FiMapPin className="h-3.5 w-3.5 text-ink-faint dark:text-slate-500" />
            {row.location}
          </span>
        ),
      },
      {
        key: 'product',
        header: 'Product',
        render: (row) => (
          <span className="whitespace-nowrap text-sm text-ink dark:text-slate-200">
            {row.product}
          </span>
        ),
      },
      {
        key: 'source',
        header: 'Source',
        render: (row) => (
          <span className="whitespace-nowrap text-sm text-ink-soft dark:text-slate-300">
            {row.source}
          </span>
        ),
      },
      {
        key: 'branchName',
        header: 'Branch',
        sortable: true,
        render: (row) => (
          <span className="whitespace-nowrap text-sm text-ink-soft dark:text-slate-300">
            {row.branchName}
          </span>
        ),
      },
      {
        key: 'staffName',
        header: 'Assigned',
        sortable: true,
        render: (row) =>
          row.staffName && row.staffName !== 'Unassigned' ? (
            <div className="flex items-center gap-2">
              <Avatar name={row.staffName} size="xs" />
              <span className="whitespace-nowrap text-sm text-ink dark:text-slate-200">
                {row.staffName}
              </span>
            </div>
          ) : (
            <span className="whitespace-nowrap text-xs font-medium text-ink-faint dark:text-slate-500">
              Unassigned
            </span>
          ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (row) => <StatusBadge status={row.status} withDot />,
      },
      {
        key: 'createdDate',
        header: 'Created',
        sortable: true,
        render: (row) => (
          <span className="whitespace-nowrap text-sm text-ink-soft dark:text-slate-400">
            {formatDate(row.createdDate)}
          </span>
        ),
      },
      {
        key: 'priority',
        header: 'Priority',
        sortable: true,
        render: (row) => <StatusBadge status={row.priority} />,
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        width: '64px',
        render: (row) => (
          <div
            className="flex justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            <Dropdown
              trigger={
                <button
                  type="button"
                  aria-label="Lead actions"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                >
                  <FiMoreVertical className="h-4 w-4" />
                </button>
              }
              items={[
                {
                  label: 'View details',
                  icon: <FiEye className="h-4 w-4" />,
                  onClick: () => navigate(`/leads/${row.id}`),
                },
                {
                  label: 'Edit lead',
                  icon: <FiEdit3 className="h-4 w-4" />,
                  onClick: () => setEditLead(row),
                },
                { divider: true },
                {
                  label: 'Delete lead',
                  icon: <FiTrash2 className="h-4 w-4" />,
                  danger: true,
                  onClick: () => setDeleteTarget(row),
                },
              ]}
            />
          </div>
        ),
      },
    ],
    [navigate],
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6"
    >
      <PageHeader
        title="Leads"
        subtitle="Track, qualify and convert your sales pipeline across every branch."
        icon={FiUsers}
        actions={
          <>
            <Dropdown
              align="right"
              trigger={
                <Button
                  variant="outline"
                  leftIcon={<FiDownload />}
                  rightIcon={<FiChevronDown />}
                >
                  Export
                </Button>
              }
              items={exportItems}
            />
            <Button
              variant="primary"
              leftIcon={<FiPlus />}
              onClick={() => setAddOpen(true)}
            >
              Add Lead
            </Button>
          </>
        }
      />

      {/* KPI chips */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard
          label="Total Leads"
          value={counts.total}
          icon={FiUsers}
          tone="brand"
        />
        <KPICard
          label="New Leads"
          value={counts.neu}
          icon={FiUserPlus}
          tone="sky"
        />
        <KPICard
          label="Won"
          value={counts.won}
          icon={FiCheckCircle}
          tone="emerald"
        />
        <KPICard
          label="Lost"
          value={counts.lost}
          icon={FiXCircle}
          tone="rose"
        />
      </div>

      {/* Toolbar */}
      <div className="card space-y-3 p-4 sm:p-5">
        <SearchBar
          value={filters.search}
          onChange={(v) => handleFilter('search', v)}
          placeholder="Search by name, company, mobile, email…"
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Select
            aria-label="Filter by status"
            options={STATUS_FILTER_OPTS}
            value={filters.status}
            onChange={(e) => handleFilter('status', e.target.value)}
          />
          <Select
            aria-label="Filter by branch"
            options={BRANCH_FILTER_OPTS}
            value={filters.branch}
            onChange={(e) => handleFilter('branch', e.target.value)}
          />
          <Select
            aria-label="Filter by staff"
            options={STAFF_FILTER_OPTS}
            value={filters.staff}
            onChange={(e) => handleFilter('staff', e.target.value)}
          />
          <Select
            aria-label="Filter by source"
            options={SOURCE_FILTER_OPTS}
            value={filters.source}
            onChange={(e) => handleFilter('source', e.target.value)}
          />
          <Select
            aria-label="Filter by priority"
            options={PRIORITY_FILTER_OPTS}
            value={filters.priority}
            onChange={(e) => handleFilter('priority', e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line pt-3 text-xs text-ink-soft dark:border-slate-800 dark:text-slate-400">
          <span>
            <span className="font-semibold text-ink dark:text-slate-200">{total}</span>{' '}
            {total === 1 ? 'lead' : 'leads'} found
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

      {/* Table */}
      <DataTable
        columns={columns}
        data={pageRows}
        loading={loading}
        sort={sort}
        onSort={(key) => dispatch(setSort(key))}
        onRowClick={(row) => navigate(`/leads/${row.id}`)}
        emptyTitle="No leads found"
        emptyDescription="No leads match your current search and filters. Try clearing them or add a new lead."
        emptyIcon={FiUsers}
      />

      {/* Pagination */}
      {!loading && total > 0 && (
        <Pagination
          page={Math.min(page, pageCount)}
          pageSize={pageSize}
          total={total}
          onPageChange={(n) => dispatch(setPage(n))}
        />
      )}

      <AddLeadModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={(lead) => {
          dispatch(addLead(lead))
          toast.success(`Lead "${lead.name}" created & routed to ${lead.branchName}.`, {
            title: 'Lead created',
          })
          setAddOpen(false)
        }}
      />

      <AddLeadModal
        open={Boolean(editLead)}
        lead={editLead}
        onClose={() => setEditLead(null)}
        onUpdate={(data) => {
          dispatch(updateLead(data))
          toast.success(`Lead "${data.name}" updated.`, { title: 'Lead updated' })
          setEditLead(null)
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            dispatch(deleteLead(deleteTarget.id))
            toast.success(`Lead "${deleteTarget.name}" deleted.`, { title: 'Lead deleted' })
          }
          setDeleteTarget(null)
        }}
        title="Delete lead?"
        description={`This permanently removes ${deleteTarget?.name || 'this lead'} (${deleteTarget?.id || ''}) from the pipeline. This action cannot be undone.`}
        confirmLabel="Delete Lead"
        tone="danger"
      />
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Add Lead modal (react-hook-form)
// ---------------------------------------------------------------------------
function AddLeadModal({ open, onClose, lead, onCreate, onUpdate }) {
  const isEdit = Boolean(lead)
  const branches = useSelector(selectBranches)
  const branchOptions = useSelector(selectBranchOptions)
  const productOptions = useSelector(selectProductOptions)
  // Best-effort: auto-pick the branch whose name/city matches the typed location.
  const matchBranchByLocation = (loc) => {
    if (!loc) return null
    const t = loc.trim().toLowerCase()
    return (
      branches.find(
        (b) =>
          (b.name || '').toLowerCase().includes(t) || (b.city || '').toLowerCase().includes(t),
      ) || null
    )
  }
  const defaultBranch = branchOptions[0]?.value || ''
  const blank = {
    name: '', company: '', mobile: '', email: '', location: '',
    branch: defaultBranch, product: productOptions[0]?.value || '',
    source: LEAD_SOURCES[0], priority: 'Medium', value: '', expectedCloseDate: '',
  }
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: blank })

  useEffect(() => {
    if (!open) return
    reset(
      lead
        ? {
            name: lead.name || '', company: lead.company || '', mobile: lead.mobile || '',
            email: lead.email || '', location: lead.location || '',
            branch: lead.branchId || defaultBranch,
            product: lead.productId || productOptions[0]?.value || '',
            source: lead.source || LEAD_SOURCES[0], priority: lead.priority || 'Medium',
            value: lead.value ?? '', expectedCloseDate: lead.expectedCloseDate || '',
          }
        : blank,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lead])

  // Auto-select the branch whenever the location changes.
  const locReg = register('location', { required: 'Location is required' })
  const onLocationChange = (e) => {
    locReg.onChange(e)
    const b = matchBranchByLocation(e.target.value)
    if (b?.id) setValue('branch', b.id)
  }

  const onSubmit = (form) => {
    const value = Number(form.value) || 0
    const branchName = branchOptions.find((o) => o.value === form.branch)?.label || ''
    // Backend derives display names from the ids and builds the timeline/activity.
    const payload = {
      name: form.name.trim(),
      company: form.company.trim(),
      mobile: form.mobile.trim(),
      email: form.email.trim(),
      location: form.location.trim(),
      branchId: form.branch,
      productId: form.product,
      source: form.source,
      priority: form.priority,
      value,
      expectedCloseDate: form.expectedCloseDate || null,
    }
    if (isEdit) onUpdate({ id: lead.id, ...payload })
    else onCreate({ ...payload, branchName })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Lead' : 'Add New Lead'}
      description={
        isEdit
          ? 'Update the lead details below.'
          : "Capture a new opportunity. The branch is auto-assigned from the customer's location; a Branch Manager then allocates it to a sales staff member."
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            leftIcon={<FiUserCheck />}
            loading={isSubmitting}
            onClick={handleSubmit(onSubmit)}
          >
            {isEdit ? 'Save Changes' : 'Create Lead'}
          </Button>
        </>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <Input
          label="Customer Name"
          placeholder="e.g. John Smith"
          error={errors.name?.message}
          {...register('name', {
            required: 'Customer name is required',
            minLength: { value: 2, message: 'Name is too short' },
          })}
        />
        <Input
          label="Company"
          placeholder="e.g. Skyline Interiors"
          hint="Optional"
          {...register('company')}
        />
        <Input
          label="Mobile"
          type="tel"
          leftIcon={<FiPhone className="h-4 w-4" />}
          placeholder="+971 5X XXX XXXX"
          error={errors.mobile?.message}
          {...register('mobile', {
            required: 'Mobile number is required',
            minLength: { value: 6, message: 'Enter a valid number' },
          })}
        />
        <Input
          label="Email"
          type="email"
          placeholder="name@email.com"
          error={errors.email?.message}
          {...register('email', {
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Enter a valid email',
            },
          })}
        />
        <Input
          label="Location"
          leftIcon={<FiMapPin className="h-4 w-4" />}
          placeholder="e.g. Kozhikode"
          error={errors.location?.message}
          {...locReg}
          onChange={onLocationChange}
        />
        <Select
          label="Branch (auto-selected)"
          options={branchOptions}
          hint="Auto-filled from location — change if needed"
          error={errors.branch?.message}
          {...register('branch', { required: 'Select a branch' })}
        />
        <Select
          label="Product"
          options={productOptions}
          {...register('product', { required: 'Select a product' })}
          error={errors.product?.message}
        />
        <Select
          label="Source"
          options={SOURCE_FORM_OPTS}
          {...register('source', { required: 'Select a source' })}
          error={errors.source?.message}
        />
        <Select
          label="Priority"
          options={PRIORITY_FORM_OPTS}
          {...register('priority', { required: true })}
        />
        <Input
          label="Estimated Value (₹)"
          type="number"
          min="0"
          step="500"
          leftIcon={<FiShoppingBag className="h-4 w-4" />}
          placeholder="e.g. 50000"
          error={errors.value?.message}
          {...register('value', {
            min: { value: 0, message: 'Value cannot be negative' },
          })}
        />
        <Input
          label="Expected Close Date"
          type="date"
          leftIcon={<FiCalendar className="h-4 w-4" />}
          hint="Optional"
          error={errors.expectedCloseDate?.message}
          {...register('expectedCloseDate')}
        />
        {!isEdit && (
          <div className="sm:col-span-2 flex items-start gap-2.5 rounded-xl border border-dashed border-brand-300/70 bg-brand-50/50 p-3 text-xs text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
            <FiMapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              The branch is <strong>auto-selected</strong> from the customer's location (editable above).
              A Branch Manager then allocates the lead to a sales staff member.
            </span>
          </div>
        )}
      </form>
    </Modal>
  )
}
