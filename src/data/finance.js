import { makeRng, round, MONTHS } from './_helpers'

const rng = makeRng(880)
const TREND = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

export const revenueVsExpense = TREND.map((m, i) => {
  const revenue = round((980 + i * 70 + rng() * 120) * 1000, 1000)
  const expense = round(revenue * (0.55 + rng() * 0.12), 1000)
  return { month: m, revenue, expense, profit: revenue - expense }
})

export const profitTrend = revenueVsExpense.map((d) => ({ month: d.month, profit: d.profit }))

export const monthlyOverview = revenueVsExpense.map((d) => ({
  month: d.month,
  revenue: d.revenue,
  expense: d.expense,
  profit: d.profit,
}))

export const cashFlow = TREND.map((m, i) => {
  const inflow = round((1100 + i * 60 + rng() * 100) * 1000, 1000)
  const outflow = round(inflow * (0.6 + rng() * 0.15), 1000)
  return { month: m, inflow, outflow, net: inflow - outflow }
})

export const expenseBreakdown = [
  { name: 'Salaries & Payroll', value: 38, amount: 642000 },
  { name: 'Marketing', value: 18, amount: 304000 },
  { name: 'Operations', value: 16, amount: 270000 },
  { name: 'Logistics', value: 12, amount: 203000 },
  { name: 'Incentives', value: 9, amount: 152000 },
  { name: 'Misc', value: 7, amount: 118000 },
]

export const receivablesAging = [
  { bucket: '0–30 days', amount: 486000 },
  { bucket: '31–60 days', amount: 312000 },
  { bucket: '61–90 days', amount: 168000 },
  { bucket: '90+ days', amount: 94000 },
]

const totalRevenue = revenueVsExpense.reduce((s, d) => s + d.revenue, 0)
const totalExpense = revenueVsExpense.reduce((s, d) => s + d.expense, 0)
const totalProfit = totalRevenue - totalExpense

export const financeKpis = {
  revenue: totalRevenue,
  expenses: totalExpense,
  profit: totalProfit,
  profitMargin: round((totalProfit / totalRevenue) * 100, 1),
  receivables: receivablesAging.reduce((s, r) => s + r.amount, 0),
  incentivesPaid: 642000 * 0.24,
  healthScore: 82,
}

export default { financeKpis, revenueVsExpense, profitTrend, monthlyOverview, cashFlow, expenseBreakdown, receivablesAging }
export { MONTHS }
