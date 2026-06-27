import { useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  FiArrowLeft,
  FiPackage,
  FiTag,
  FiDollarSign,
  FiShoppingCart,
  FiTrendingUp,
  FiBox,
  FiHash,
  FiBriefcase,
  FiCalendar,
  FiPower,
} from 'react-icons/fi'

import { selectProductById, fetchProduct, toggleProductStatus } from '@/redux/slices/productSlice'
import { formatCurrency, formatNumber, formatDate } from '@/utils/format'

import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import StatusBadge from '@/components/ui/StatusBadge'
import Avatar from '@/components/ui/Avatar'
import KPICard from '@/components/cards/KPICard'
import DataTable from '@/components/data/DataTable'
import EmptyState from '@/components/feedback/EmptyState'
import { useToast } from '@/hooks/useToast'

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-line bg-surface-base/50 px-3.5 py-3 dark:border-slate-800 dark:bg-slate-800/30">
      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-500/15 dark:bg-brand-500/10 dark:text-brand-300">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-faint dark:text-slate-500">{label}</p>
        <div className="mt-0.5 break-words text-sm font-medium text-ink dark:text-slate-100">{children}</div>
      </div>
    </div>
  )
}

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const toast = useToast()

  const product = useSelector(selectProductById(id))
  const status = useSelector((s) => s.products.status)

  // Fetch the full product (incl. salesHistory) from the API on mount.
  useEffect(() => {
    if (id) dispatch(fetchProduct(id))
  }, [id, dispatch])

  const relatedSales = useMemo(() => product?.salesHistory || [], [product])

  // Loading — product not yet in the store and a fetch is in flight.
  if (!product && (status === 'loading' || status === 'idle')) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-surface-muted dark:bg-slate-800" />
        <Card padding="lg">
          <div className="space-y-4">
            <div className="h-6 w-48 animate-pulse rounded bg-surface-muted dark:bg-slate-800" />
            <div className="h-40 animate-pulse rounded-xl bg-surface-muted dark:bg-slate-800" />
          </div>
        </Card>
      </motion.div>
    )
  }

  if (!product) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <Button variant="ghost" size="sm" leftIcon={<FiArrowLeft />} onClick={() => navigate('/products')} className="-ml-1">
          Back to Products
        </Button>
        <Card padding="lg">
          <EmptyState icon={FiPackage} title="Product not found" description={`No product matches "${id}".`} action={<Button to="/products">Back to Products</Button>} />
        </Card>
      </motion.div>
    )
  }

  const revenue = product.price * product.sold

  const saleColumns = [
    { key: 'branchName', header: 'Branch', render: (r) => (
      <div className="flex items-center gap-2.5"><Avatar name={r.branchName} size="sm" /><span className="font-medium text-ink dark:text-slate-100">{r.branchName}</span></div>
    ) },
    { key: 'quantity', header: 'Qty', align: 'right', render: (r) => `${formatNumber(r.quantity)} ${product.unit || ''}` },
    { key: 'amount', header: 'Amount', align: 'right', render: (r) => <span className="font-semibold">{formatCurrency(r.amount)}</span> },
    { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} withDot /> },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6">
      <div className="space-y-3">
        <Button variant="ghost" size="sm" leftIcon={<FiArrowLeft />} onClick={() => navigate(-1)} className="-ml-1 text-ink-soft hover:text-brand-600 dark:hover:text-brand-300">
          Back
        </Button>
        <PageHeader
          title={product.name}
          subtitle={`${product.code}  •  ${product.category}`}
          icon={FiPackage}
          breadcrumb={false}
          actions={
            <Button
              variant="outline"
              leftIcon={<FiPower />}
              onClick={() => {
                dispatch(toggleProductStatus(product.id))
                toast.success(`${product.name} is now ${product.status === 'Active' ? 'Inactive' : 'Active'}.`)
              }}
            >
              {product.status === 'Active' ? 'Deactivate' : 'Activate'}
            </Button>
          }
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Selling Price" value={formatCurrency(product.price)} icon={FiDollarSign} tone="brand" />
        <KPICard label="Units Sold" value={product.sold} icon={FiShoppingCart} tone="sky" />
        <KPICard label="Revenue" value={formatCurrency(revenue, { compact: true })} icon={FiTrendingUp} tone="emerald" />
        <KPICard label="Status" value={product.status} icon={FiPower} tone={product.status === 'Active' ? 'emerald' : 'rose'} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Product information */}
        <Card title="Product Information" subtitle="Catalogue details" icon={<FiPackage className="h-5 w-5" />} className="lg:col-span-2" action={<StatusBadge status={product.status} withDot size="md" />}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoRow icon={FiPackage} label="Product Name">{product.name}</InfoRow>
            <InfoRow icon={FiHash} label="Product Code">{product.code}</InfoRow>
            <InfoRow icon={FiTag} label="Category"><Badge tone="violet">{product.category}</Badge></InfoRow>
            <InfoRow icon={FiBriefcase} label="Brand">{product.brand || '—'}</InfoRow>
            <InfoRow icon={FiBox} label="Unit Type">{product.unit}</InfoRow>
            <InfoRow icon={FiDollarSign} label="Selling Price">
              <span className="font-display font-semibold text-brand-600 dark:text-brand-300">{formatCurrency(product.price)}</span>
            </InfoRow>
            <InfoRow icon={FiCalendar} label="Created Date">{formatDate(product.createdDate)}</InfoRow>
            <InfoRow icon={FiPower} label="Status">{product.status}</InfoRow>
          </div>
          {product.description && (
            <div className="mt-4 rounded-xl border border-line bg-surface-base/60 p-4 dark:border-slate-800 dark:bg-slate-800/30">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-faint dark:text-slate-500">Description</p>
              <p className="text-sm leading-relaxed text-ink-soft dark:text-slate-300">{product.description}</p>
            </div>
          )}
        </Card>

        {/* Quick stats */}
        <Card title="Performance" subtitle="Lifetime" icon={<FiTrendingUp className="h-5 w-5" />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-surface-muted/60 px-4 py-3 dark:bg-slate-800/40">
              <span className="text-sm text-ink-soft dark:text-slate-400">Units Sold</span>
              <span className="font-display text-lg font-bold text-ink dark:text-slate-100">{formatNumber(product.sold)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface-muted/60 px-4 py-3 dark:bg-slate-800/40">
              <span className="text-sm text-ink-soft dark:text-slate-400">Total Revenue</span>
              <span className="font-display text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(revenue, { compact: true })}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface-muted/60 px-4 py-3 dark:bg-slate-800/40">
              <span className="text-sm text-ink-soft dark:text-slate-400">Recorded Sales</span>
              <span className="font-display text-lg font-bold text-ink dark:text-slate-100">{relatedSales.length}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Related sales history */}
      <Card title="Related Sales History" subtitle={`${relatedSales.length} sale${relatedSales.length === 1 ? '' : 's'} of this product`} icon={<FiShoppingCart className="h-5 w-5" />}>
        <div className="mt-2">
          {relatedSales.length ? (
            <DataTable columns={saleColumns} data={relatedSales.slice(0, 10)} rowKey={(r, i) => r.id ?? i} />
          ) : (
            <EmptyState icon={FiShoppingCart} title="No sales yet" description="Sales recorded for this product will appear here." />
          )}
        </div>
      </Card>
    </motion.div>
  )
}
