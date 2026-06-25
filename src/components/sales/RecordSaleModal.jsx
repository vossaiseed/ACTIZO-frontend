import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { FiSave, FiX, FiArrowDown } from 'react-icons/fi'

import Modal from '@/components/overlay/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'

import { addSale } from '@/redux/slices/salesSlice'
import { selectActiveProducts } from '@/redux/slices/productSlice'
import { branchOptions, branchById } from '@/data/branches'
import { staff, staffById } from '@/data/staff'
import { productById } from '@/data/products'
import { leads } from '@/data/leads'
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
 */
export default function RecordSaleModal({ open, onClose, lead = null }) {
  const dispatch = useDispatch()
  const toast = useToast()
  const activeProducts = useSelector(selectActiveProducts)

  const categories = useMemo(
    () => Array.from(new Set(activeProducts.map((p) => p.category))),
    [activeProducts],
  )

  const wonLeads = useMemo(
    () => leads.filter((l) => l.status === 'Won' || l.status === 'Negotiation'),
    [],
  )
  const leadOptions = useMemo(
    () => [{ value: '', label: '— None —' }, ...wonLeads.map((l) => ({ value: l.id, label: `${l.id} — ${l.name}` }))],
    [wonLeads],
  )

  const buildDefaults = (l) => {
    const prod = l ? productById(l.productId) : null
    const isActive = prod && activeProducts.some((p) => p.id === prod.id)
    return {
      customer: l?.name || '',
      leadRef: l?.id || '',
      branch: l?.branchId || branchOptions[0]?.value || '',
      staff: l?.staffId || '',
      category: isActive ? prod.category : categories[0] || '',
      product: isActive ? prod.id : '',
      quantity: 1,
      unitPrice: isActive ? prod.price : '',
      discount: 0,
      saleDate: today(),
      paymentStatus: 'Paid',
      paymentMethod: 'Cash',
      remarks: '',
    }
  }

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: buildDefaults(lead),
  })

  useEffect(() => {
    if (open) reset(buildDefaults(lead))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lead])

  const branchVal = watch('branch')
  const categoryVal = watch('category')
  const qty = Number(watch('quantity')) || 0
  const price = Number(watch('unitPrice')) || 0
  const discount = Number(watch('discount')) || 0
  const total = qty * price
  const finalAmount = Math.max(0, total - discount)

  const staffOpts = useMemo(() => {
    const list = branchVal ? staff.filter((s) => s.branchId === branchVal) : staff
    return [{ value: '', label: 'Select staff' }, ...list.map((s) => ({ value: s.id, label: `${s.name} — ${s.role}` }))]
  }, [branchVal])

  const productOpts = useMemo(() => {
    const list = activeProducts.filter((p) => !categoryVal || p.category === categoryVal)
    return [{ value: '', label: 'Select product' }, ...list.map((p) => ({ value: p.id, label: p.name }))]
  }, [activeProducts, categoryVal])

  // compose RHF onChange with autofill side-effects
  const leadReg = register('leadRef')
  const onLeadRef = (e) => {
    leadReg.onChange(e)
    const l = wonLeads.find((x) => x.id === e.target.value)
    if (l) {
      const prod = productById(l.productId)
      const isActive = prod && activeProducts.some((p) => p.id === prod.id)
      setValue('customer', l.name)
      setValue('branch', l.branchId)
      setValue('staff', l.staffId || '')
      if (isActive) {
        setValue('category', prod.category)
        setValue('product', prod.id)
        setValue('unitPrice', prod.price)
      }
    }
  }

  const productReg = register('product', { required: 'Select a product' })
  const onProduct = (e) => {
    productReg.onChange(e)
    const p = productById(e.target.value)
    if (p) setValue('unitPrice', p.price)
  }

  const onSubmit = (form) => {
    const branch = branchById(form.branch)
    const member = form.staff ? staffById(form.staff) : null
    const prod = productById(form.product)
    const q = Number(form.quantity) || 0
    const up = Number(form.unitPrice) || 0
    const disc = Number(form.discount) || 0
    const amount = Math.max(0, q * up - disc)
    const sale = {
      id: `SL-${Date.now()}`,
      leadId: form.leadRef || null,
      customer: form.customer.trim(),
      product: prod?.name || '',
      productId: prod?.id || form.product,
      category: form.category,
      branchId: branch?.id || form.branch,
      branchName: branch?.name || '',
      staffId: member?.id || null,
      staffName: member?.name || 'Unassigned',
      quantity: q,
      unit: prod?.unit || 'PCS',
      unitPrice: up,
      totalAmount: q * up,
      discount: disc,
      finalAmount: amount,
      amount, // used by the sales table & KPI recompute
      date: form.saleDate,
      status: form.paymentStatus === 'Paid' ? 'Completed' : 'Pending',
      paymentStatus: form.paymentStatus,
      paymentMethod: form.paymentMethod,
      paymentMode: form.paymentMethod,
      remarks: form.remarks,
    }
    dispatch(addSale(sale))
    toast.success(
      `Sale recorded for ${sale.customer} — ${formatCurrency(amount)}. Targets, branch, staff & incentives updated.`,
      { title: 'Sale recorded' },
    )
    onClose()
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
          <Button variant="outline" type="button" leftIcon={<FiX />} onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="record-sale-form" leftIcon={<FiSave />}>Save Sale</Button>
        </>
      }
    >
      <form id="record-sale-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Customer Name" error={errors.customer?.message} {...register('customer', { required: 'Customer name is required' })} />
        <Select label="Lead Reference" options={leadOptions} {...leadReg} onChange={onLeadRef} />
        <Select label="Branch" options={branchOptions} error={errors.branch?.message} {...register('branch', { required: 'Select a branch' })} />
        <Select label="Sales Staff" options={staffOpts} {...register('staff')} />
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
