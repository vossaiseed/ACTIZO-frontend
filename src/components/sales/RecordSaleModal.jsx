import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { FiSave, FiX, FiArrowDown } from 'react-icons/fi'

import Modal from '@/components/overlay/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'

import { addSale, fetchSalesStats } from '@/redux/slices/salesSlice'
import { selectActiveProducts } from '@/redux/slices/productSlice'
import { selectBranches } from '@/redux/slices/branchSlice'
import { selectStaff } from '@/redux/slices/staffSlice'
import { selectUser, selectRoleKey } from '@/redux/slices/authSlice'
import { useToast } from '@/hooks/useToast'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/utils/cn'

const PAYMENT_STATUSES = ['Pending', 'Partial', 'Paid'].map((v) => ({ value: v, label: v }))
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Other'].map((v) => ({ value: v, label: v }))
const today = () => new Date().toISOString().slice(0, 10)

function ReadOnly({ label, value, highlight }) {
  return (
    <div className="w-full">
      <label className="mb-1.5 block text-sm font-medium text-ink dark:text-slate-200">{label}</label>
      <div
        className={cn(
          'flex h-[42px] items-center rounded-xl border border-line bg-surface-muted/60 px-3.5 text-sm font-semibold dark:border-slate-700 dark:bg-slate-800/50',
          highlight ? 'text-brand-600 dark:text-brand-300' : 'text-ink dark:text-slate-100',
        )}
      >
        {value}
      </div>
    </div>
  )
}

/**
 * RecordSaleModal — used in the Sales module and inside Won-lead details.
 * Product Category & Product Name come from the Product Management module
 * (active products only); selecting a product auto-fills its unit price.
 * Branch / Staff / Product options are sourced from the store (real ids) and
 * the sale is created against the live backend (camelCase ids on submit).
 */
export default function RecordSaleModal({ open, onClose, lead = null }) {
  const dispatch = useDispatch()
  const toast = useToast()
  const activeProducts = useSelector(selectActiveProducts)
  const branches = useSelector(selectBranches)
  const staffMembers = useSelector(selectStaff)
  const currentUser = useSelector(selectUser)
  const roleKey = useSelector(selectRoleKey)
  // A staff user can only record sales for themselves in their own branch.
  const isStaff = roleKey === 'staff'

  const productById = (pid) => activeProducts.find((p) => p.id === pid) || null

  const categories = useMemo(
    () => Array.from(new Set(activeProducts.map((p) => p.category))),
    [activeProducts],
  )

  const branchOptions = useMemo(
    () => branches.map((b) => ({ value: b.id, label: b.name })),
    [branches],
  )

  const buildDefaults = (l) => {
    const prod = l ? productById(l.productId) : null
    return {
      customer: l?.customer || l?.name || '',
      branch: l?.branchId || (isStaff ? currentUser?.branchId : branchOptions[0]?.value) || '',
      staff: l?.staffId || (isStaff ? currentUser?.id : '') || '',
      category: prod ? prod.category : categories[0] || '',
      product: prod ? prod.id : '',
      quantity: 1,
      unitPrice: prod ? prod.price : '',
      discount: 0,
      saleDate: today(),
      paymentStatus: 'Paid',
      paymentMethod: 'Cash',
      remarks: '',
    }
  }

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: buildDefaults(lead),
  })

  useEffect(() => {
    if (open) reset(buildDefaults(lead))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lead, activeProducts, branches])

  const branchVal = watch('branch')
  const categoryVal = watch('category')
  const qty = Number(watch('quantity')) || 0
  const price = Number(watch('unitPrice')) || 0
  const discount = Number(watch('discount')) || 0
  const total = qty * price
  const finalAmount = Math.max(0, total - discount)

  const staffOpts = useMemo(() => {
    const list = branchVal ? staffMembers.filter((s) => s.branchId === branchVal) : staffMembers
    return [
      { value: '', label: 'Select staff' },
      ...list.map((s) => ({ value: s.id, label: s.role ? `${s.name} — ${s.role}` : s.name })),
    ]
  }, [branchVal, staffMembers])

  const productOpts = useMemo(() => {
    const list = activeProducts.filter((p) => !categoryVal || p.category === categoryVal)
    return [{ value: '', label: 'Select product' }, ...list.map((p) => ({ value: p.id, label: p.name }))]
  }, [activeProducts, categoryVal])

  // compose RHF onChange with autofill side-effects
  const productReg = register('product', { required: 'Select a product' })
  const onProduct = (e) => {
    productReg.onChange(e)
    const p = productById(e.target.value)
    if (p) setValue('unitPrice', p.price)
  }

  const onSubmit = async (form) => {
    const q = Number(form.quantity) || 0
    const up = Number(form.unitPrice) || 0
    const disc = Number(form.discount) || 0
    // Display total; the backend computes finalAmount authoritatively.
    const amount = Math.max(0, q * up - disc)

    // camelCase ids per the backend create contract.
    const body = {
      customer: form.customer.trim(),
      productId: form.product,
      quantity: q,
      unitPrice: up,
      discount: disc,
      date: form.saleDate,
      paymentStatus: form.paymentStatus,
      paymentMethod: form.paymentMethod,
      branchId: form.branch,
      staffId: form.staff || null,
      ...(lead?.id ? { leadId: lead.id } : {}),
    }

    try {
      await dispatch(addSale(body)).unwrap()
      // Refresh aggregate stats so KPIs / top products reflect the new sale.
      dispatch(fetchSalesStats())
      toast.success(
        `Sale recorded for ${body.customer} — ${formatCurrency(amount)}. Revenue, branch, staff & incentives updated.`,
        { title: 'Sale recorded' },
      )
      onClose()
    } catch (err) {
      toast.error(err || 'Failed to record sale.', { title: 'Could not record sale' })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record Sale"
      description="Create a sales entry. On save, revenue, target achievement, branch & staff performance and incentives are updated."
      size="xl"
      footer={
        <>
          <Button variant="outline" type="button" leftIcon={<FiX />} onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" form="record-sale-form" leftIcon={<FiSave />} loading={isSubmitting}>Save Sale</Button>
        </>
      }
    >
      <form id="record-sale-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Customer Name" error={errors.customer?.message} {...register('customer', { required: 'Customer name is required' })} />
        {isStaff ? (
          <>
            {/* Staff sales are always bound to the logged-in user + their branch. */}
            <ReadOnly label="Branch" value={currentUser?.branchName || '—'} />
            <ReadOnly label="Sales Staff" value={currentUser?.name || 'You'} />
            <input type="hidden" {...register('branch')} />
            <input type="hidden" {...register('staff')} />
          </>
        ) : (
          <>
            <Select label="Branch" options={branchOptions} error={errors.branch?.message} {...register('branch', { required: 'Select a branch' })} />
            <Select label="Sales Staff" options={staffOpts} {...register('staff')} />
          </>
        )}
        <Select label="Product Category" options={categories.map((c) => ({ value: c, label: c }))} {...register('category')} />
        <Select label="Product Name" options={productOpts} error={errors.product?.message} {...productReg} onChange={onProduct} />
        <Input label="Quantity" type="number" min="1" error={errors.quantity?.message} {...register('quantity', { required: 'Required', min: { value: 1, message: 'Min 1' } })} />
        <Input label="Unit Price (₹)" type="number" min="0" error={errors.unitPrice?.message} {...register('unitPrice', { required: 'Required', min: { value: 0, message: 'Invalid' } })} />
        <ReadOnly label="Total Amount" value={formatCurrency(total)} />
        <Input label="Discount (₹)" type="number" min="0" {...register('discount', { min: { value: 0, message: 'Invalid' } })} />
        <div className="sm:col-span-2 flex items-center justify-center">
          <FiArrowDown className="h-4 w-4 text-ink-faint dark:text-slate-600" />
        </div>
        <ReadOnly label="Final Amount" value={formatCurrency(finalAmount)} highlight />
        <Input label="Sale Date" type="date" {...register('saleDate', { required: true })} />
        <Select label="Payment Status" options={PAYMENT_STATUSES} {...register('paymentStatus')} />
        <Select label="Payment Method" options={PAYMENT_METHODS} {...register('paymentMethod')} />
        <div className="sm:col-span-2">
          <Textarea label="Remarks" rows={3} placeholder="Optional notes about this sale…" {...register('remarks')} />
        </div>
      </form>
    </Modal>
  )
}
