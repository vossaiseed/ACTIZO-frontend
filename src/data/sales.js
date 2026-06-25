import { branches } from './branches'
import { staff } from './staff'
import { products } from './products'
import { leads } from './leads'
import { makeRng, pick, randInt, round, id, dateOffset, MONTHS } from './_helpers'

const PAYMENTS = ['Card', 'Bank Transfer', 'Cash', 'Cheque', 'Credit']
const SALE_STATUS = ['Completed', 'Completed', 'Completed', 'Pending', 'Refunded']

const rng = makeRng(909)
const wonLeads = leads.filter((l) => l.status === 'Won')

function buildSale(n) {
  const lead = pick(rng, wonLeads.length ? wonLeads : leads)
  const product = products.find((p) => p.id === lead.productId) || pick(rng, products)
  const member = staff.find((s) => s.id === lead.staffId) || pick(rng, staff)
  const branch = branches.find((b) => b.id === (member?.branchId || lead.branchId))
  const quantity = randInt(rng, 1, product.unit === 'SET' ? 4 : 60)
  const unitPrice = round(product.price * (0.92 + rng() * 0.2), 1)
  const amount = round(quantity * unitPrice, 1)
  return {
    id: id('SL', 2000 + n, 4),
    leadId: lead.id,
    customer: lead.name,
    product: product.name,
    productId: product.id,
    branchId: branch.id,
    branchName: branch.name,
    staffId: member.id,
    staffName: member.name,
    quantity,
    unit: product.unit,
    unitPrice,
    amount,
    date: dateOffset(-randInt(rng, 0, 180)),
    status: pick(rng, SALE_STATUS),
    paymentMode: pick(rng, PAYMENTS),
  }
}

export const sales = Array.from({ length: 56 }, (_, i) => buildSale(i + 1)).sort(
  (a, b) => new Date(b.date) - new Date(a.date),
)

const completed = sales.filter((s) => s.status === 'Completed')

export const totalSales = completed.length
export const totalRevenue = completed.reduce((s, x) => s + x.amount, 0)
export const monthlyRevenue = completed
  .filter((s) => new Date(s.date) >= new Date('2026-06-01'))
  .reduce((s, x) => s + x.amount, 0)
export const avgOrderValue = round(totalRevenue / (completed.length || 1), 1)
export const conversionRate = round(
  (leads.filter((l) => l.status === 'Won').length / leads.length) * 100,
  1,
)

// Monthly sales trend (last 8 months ending Jun 2026)
const TREND_MONTHS = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const trendRng = makeRng(411)
export const monthlySalesTrend = TREND_MONTHS.map((m, i) => {
  const base = 620 + i * 48
  return {
    month: m,
    sales: round((base + trendRng() * 180) * 1000, 1000),
    target: round((base + 60) * 1000, 1000),
    orders: randInt(trendRng, 38, 92),
  }
})

export const revenueTrend = monthlySalesTrend.map((d) => ({
  month: d.month,
  revenue: d.sales,
  target: d.target,
}))

// Product performance (revenue & quantity)
export const productPerformance = products
  .map((p) => {
    const rows = completed.filter((s) => s.productId === p.id)
    const revenue = rows.reduce((s, x) => s + x.amount, 0) || p.price * (p.sold / 8)
    const qty = rows.reduce((s, x) => s + x.quantity, 0) || Math.round(p.sold / 8)
    return { name: p.name, revenue: round(revenue, 100), quantity: qty, growth: p.growth, unit: p.unit }
  })
  .sort((a, b) => b.revenue - a.revenue)

export const topProducts = productPerformance.slice(0, 6)

// Branch-wise sales comparison
export const branchSales = branches
  .map((b) => {
    const rows = completed.filter((s) => s.branchId === b.id)
    return {
      branch: b.name,
      shortName: b.city,
      revenue: rows.reduce((s, x) => s + x.amount, 0) || b.monthlyRevenue,
      orders: rows.length || b.totalSales,
      target: b.targetRevenue / 10,
    }
  })
  .sort((a, b) => b.revenue - a.revenue)

// Staff-wise sales
export const staffSales = staff
  .map((s) => ({ name: s.name, branch: s.branchName, revenue: s.revenue, orders: s.wonLeads }))
  .sort((a, b) => b.revenue - a.revenue)
  .slice(0, 10)

export const recentSales = sales.slice(0, 8)

export default sales
export { MONTHS }
