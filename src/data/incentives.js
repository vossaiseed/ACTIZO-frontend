import { staff } from './staff'
import { makeRng, pick, randInt, round, id, MONTHS } from './_helpers'

const TYPES = ['Monthly', 'Monthly', 'Special', 'Project']
const STATUSES = ['Paid', 'Paid', 'Paid', 'Pending']
const RECENT_MONTHS = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026']

const rng = makeRng(660)
let counter = 0

// Current-month incentive per staff
export const incentives = staff
  .map((s) => {
    counter += 1
    const baseSales = s.revenue
    const incentiveRate = round(1.5 + rng() * 2.5, 0.1)
    const amount = round((baseSales * incentiveRate) / 100, 50)
    const bonus = rng() > 0.6 ? round(randInt(rng, 1, 8) * 500, 100) : 0
    return {
      id: id('INC', counter, 3),
      staffId: s.id,
      staffName: s.name,
      branchName: s.branchName,
      avatarColor: s.avatarColor,
      month: 'Jun 2026',
      baseSales,
      incentiveRate,
      amount,
      bonus,
      total: amount + bonus,
      type: pick(rng, TYPES),
      status: pick(rng, STATUSES),
    }
  })
  .sort((a, b) => b.total - a.total)

// Per-staff incentive history (6 months)
const hRng = makeRng(661)
export const incentiveHistory = staff.flatMap((s) =>
  RECENT_MONTHS.map((m, i) => {
    counter += 1
    const amount = round(s.incentiveEarned * (0.6 + hRng() * 0.8), 50)
    return {
      id: id('INH', counter, 4),
      staffId: s.id,
      staffName: s.name,
      branchName: s.branchName,
      month: m,
      amount,
      type: pick(hRng, TYPES),
      status: i === RECENT_MONTHS.length - 1 ? pick(hRng, STATUSES) : 'Paid',
    }
  }),
)

export const totalIncentives = incentives.reduce((s, x) => s + x.total, 0)
export const highestIncentive = Math.max(...incentives.map((i) => i.total))
export const monthlyIncentive = totalIncentives
export const topPerformer = incentives[0]

// Monthly incentive trend (company-wide)
const tRng = makeRng(662)
export const incentiveTrend = MONTHS.slice(0, 6).map((m, i) => ({
  month: m,
  incentive: round((120 + i * 14 + tRng() * 40) * 1000, 1000),
}))

export const incentivesByBranch = [...new Set(staff.map((s) => s.branchName))].map((branch) => ({
  branch,
  amount: round(
    incentives.filter((i) => i.branchName === branch).reduce((s, x) => s + x.total, 0),
    100,
  ),
}))

export default incentives
