import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import {
  FiPackage,
  FiCheckCircle,
  FiSlash,
  FiTrendingUp,
  FiPlus,
  FiEye,
  FiEdit3,
  FiMoreVertical,
  FiRotateCcw,
  FiSave,
  FiX,
} from 'react-icons/fi'

import {
  selectProducts,
  selectProductStatus,
  fetchProducts,
  addProduct,
  updateProduct,
  toggleProductStatus,
  setFilter,
  resetFilters,
} from '@/redux/slices/productSlice'
import { PRODUCT_CATEGORIES } from '@/data/products'
import { formatCurrency, formatDate } from '@/utils/format'
import { searchData, sortData, paginate, unique } from '@/utils/helpers'

import PageHeader from '@/components/common/PageHeader'
import SearchBar from '@/components/common/SearchBar'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Badge from '@/components/ui/Badge'
import StatusBadge from '@/components/ui/StatusBadge'
import Dropdown from '@/components/ui/Dropdown'
import Pagination from '@/components/ui/Pagination'
import KPICard from '@/components/cards/KPICard'
import DataTable from '@/components/data/DataTable'
import Modal from '@/components/overlay/Modal'
import { useToast } from '@/hooks/useToast'

const ALL = { value: 'All', label: 'All' }
const CATEGORY_OPTS = [ALL, ...PRODUCT_CATEGORIES.map((c) => ({ value: c, label: c }))]
const STATUS_OPTS = [ALL, { value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]
const UNIT_OPTS = ['SQM', 'PCS', 'TON', 'BAG', 'LTR', 'SET', 'CUM', 'ROLL', 'BOX', 'KG'].map((u) => ({ value: u, label: u }))

const PAGE_SIZE = 8
const SEARCH_KEYS = ['name', 'code', 'brand', 'category']

export default function Products() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const toast = useToast()

  const products = useSelector(selectProducts)
  const filters = useSelector((s) => s.products.filters)
  const status = useSelector(selectProductStatus)
  const loading = status === 'loading' || status === 'idle'

  const [page, setPage] = useState(1)
  const [sort, setLocalSort] = useState({ key: 'createdDate', dir: 'desc' })
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  // Load the catalogue from the API on mount.
  useEffect(() => {
    dispatch(fetchProducts())
  }, [dispatch])

  const kpis = useMemo(() => {
    const active = products.filter((p) => p.status === 'Active')
    const top = [...products].sort((a, b) => b.price * b.sold - a.price * a.sold)[0]
    return {
      total: products.length,
      active: active.length,
      inactive: products.length - active.length,
      top: top?.name || '—',
    }
  }, [products])

  const filtered = useMemo(() => {
    let rows = searchData(products, filters.search, SEARCH_KEYS)
    if (filters.category !== 'All') rows = rows.filter((p) => p.category === filters.category)
    if (filters.status !== 'All') rows = rows.filter((p) => p.status === filters.status)
    return sortData(rows, sort.key, sort.dir)
  }, [products, filters, sort])

  const paged = paginate(filtered, page, PAGE_SIZE)
  const onSort = (key) => {
    setLocalSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))
    setPage(1)
  }
  const handleFilter = (key, value) => {
    dispatch(setFilter({ key, value }))
    setPage(1)
  }
  const hasActiveFilters = filters.search || filters.category !== 'All' || filters.status !== 'All'

  const openAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (product) => {
    setEditing(product)
    setFormOpen(true)
  }

  const columns = [
    {
      key: 'name',
      header: 'Product Name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-500/15 dark:bg-brand-500/10 dark:text-brand-300">
            <FiPackage className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink dark:text-slate-100">{row.name}</p>
            <p className="text-xs text-ink-faint dark:text-slate-500">{row.brand}</p>
          </div>
        </div>
      ),
    },
    { key: 'code', header: 'Code', sortable: true, render: (row) => (
      <span className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">{row.code}</span>
    ) },
    { key: 'category', header: 'Category', render: (row) => <Badge tone="violet">{row.category}</Badge> },
    { key: 'unit', header: 'Unit', render: (row) => <span className="text-ink-soft dark:text-slate-400">{row.unit}</span> },
    { key: 'price', header: 'Price', sortable: true, align: 'right', render: (row) => (
      <span className="font-semibold">{formatCurrency(row.price)}</span>
    ) },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} withDot /> },
    { key: 'createdDate', header: 'Created', sortable: true, render: (row) => (
      <span className="whitespace-nowrap text-sm text-ink-soft dark:text-slate-400">{formatDate(row.createdDate)}</span>
    ) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: 56,
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
          <Dropdown
            align="right"
            trigger={
              <button type="button" aria-label="Product actions" className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft transition hover:bg-surface-muted hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800">
                <FiMoreVertical className="h-4 w-4" />
              </button>
            }
            items={[
              { label: 'View details', icon: <FiEye />, onClick: () => navigate(`/products/${row.id}`) },
              { label: 'Edit product', icon: <FiEdit3 />, onClick: () => openEdit(row) },
              { divider: true },
              {
                label: row.status === 'Active' ? 'Deactivate' : 'Activate',
                icon: <FiSlash />,
                onClick: () => {
                  dispatch(toggleProductStatus(row.id))
                  toast.success(`${row.name} is now ${row.status === 'Active' ? 'Inactive' : 'Active'}.`)
                },
              },
            ]}
          />
        </div>
      ),
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
        title="Products"
        subtitle="Manage your product catalogue, categories, pricing & availability"
        icon={FiPackage}
        actions={<Button leftIcon={<FiPlus />} onClick={openAdd}>Add Product</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Total Products" value={kpis.total} icon={FiPackage} tone="brand" />
        <KPICard label="Active Products" value={kpis.active} icon={FiCheckCircle} tone="emerald" />
        <KPICard label="Inactive Products" value={kpis.inactive} icon={FiSlash} tone="rose" />
        <KPICard label="Top Selling" value={kpis.top} icon={FiTrendingUp} tone="violet" />
      </div>

      {/* Toolbar (grid — constrained widths) */}
      <div className="card space-y-3 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
          <div className="sm:col-span-2 lg:col-span-6">
            <SearchBar value={filters.search} onChange={(v) => handleFilter('search', v)} placeholder="Search by name, code, brand…" />
          </div>
          <Select options={CATEGORY_OPTS} value={filters.category} onChange={(e) => handleFilter('category', e.target.value)} aria-label="Filter by category" containerClassName="lg:col-span-3" />
          <Select options={STATUS_OPTS} value={filters.status} onChange={(e) => handleFilter('status', e.target.value)} aria-label="Filter by status" containerClassName="lg:col-span-3" />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line pt-3 text-xs text-ink-soft dark:border-slate-800 dark:text-slate-400">
          <span><span className="font-semibold text-ink dark:text-slate-200">{filtered.length}</span> products</span>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" leftIcon={<FiRotateCcw />} onClick={() => { dispatch(resetFilters()); setPage(1) }}>
              Reset filters
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paged}
        loading={loading}
        rowKey={(r) => r.id}
        sort={sort}
        onSort={onSort}
        onRowClick={(row) => navigate(`/products/${row.id}`)}
        emptyTitle="No products found"
        emptyDescription="Add your first product or adjust the filters."
        emptyIcon={FiPackage}
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />

      <ProductFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        product={editing}
        onSave={(data) => {
          if (editing) {
            dispatch(updateProduct({ id: editing.id, ...data }))
            toast.success(`"${data.name}" updated.`, { title: 'Product updated' })
          } else {
            // Backend assigns the id / created date and derives sold/growth.
            dispatch(addProduct(data))
            toast.success(`"${data.name}" added to the catalogue.`, { title: 'Product created' })
          }
          setFormOpen(false)
        }}
      />
    </motion.div>
  )
}

/* ---------------- Add / Edit modal ---------------- */
function ProductFormModal({ open, onClose, product, onSave }) {
  const isEdit = Boolean(product)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '', category: PRODUCT_CATEGORIES[0], code: '', brand: '',
      unit: 'SQM', description: '', price: '', status: 'Active', type: 'General',
    },
  })

  // sync form when opening / switching product
  useEffect(() => {
    if (open) {
      reset(
        product
          ? {
              name: product.name, category: product.category, code: product.code,
              brand: product.brand, unit: product.unit, description: product.description || '',
              price: product.price, status: product.status, type: product.type || 'General',
            }
          : {
              name: '', category: PRODUCT_CATEGORIES[0], code: '', brand: '',
              unit: 'SQM', description: '', price: '', status: 'Active', type: 'General',
            },
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product])

  const submit = (form) => onSave({ ...form, price: Number(form.price) || 0 })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Product' : 'Add Product'}
      description={isEdit ? 'Update the product details below.' : 'Create a new product in your catalogue.'}
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" leftIcon={<FiX />} onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="product-form" leftIcon={<FiSave />}>
            {isEdit ? 'Save Changes' : 'Save Product'}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Product Name" error={errors.name?.message} {...register('name', { required: 'Product name is required' })} />
        <Select label="Product Category" options={PRODUCT_CATEGORIES.map((c) => ({ value: c, label: c }))} {...register('category', { required: true })} />
        <Input label="Product Code" placeholder="e.g. ACP-004" error={errors.code?.message} {...register('code', { required: 'Product code is required' })} />
        <Input label="Brand Name" placeholder="e.g. Alstrong" {...register('brand')} />
        <Input
          label="Unit Type"
          placeholder="e.g. SQM, PCS, TON, BAG…"
          list="product-unit-options"
          error={errors.unit?.message}
          {...register('unit', { required: 'Unit type is required' })}
        />
        <datalist id="product-unit-options">
          {UNIT_OPTS.map((u) => (
            <option key={u.value} value={u.value} />
          ))}
        </datalist>
        <Input label="Selling Price (₹)" type="number" min="0" step="1" error={errors.price?.message} {...register('price', { required: 'Selling price is required', min: { value: 0, message: 'Invalid price' } })} />
        <Select label="Type" options={[{ value: 'General', label: 'General' }, { value: 'Special', label: 'Special' }]} {...register('type', { required: true })} />
        <Select label="Status" options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]} {...register('status', { required: true })} />
        <div className="sm:col-span-2">
          <Textarea label="Description" rows={3} placeholder="Short product description…" {...register('description')} />
        </div>
      </form>
    </Modal>
  )
}
