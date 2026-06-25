import { branches } from './branches'
import { staff } from './staff'
import { products } from './products'
import { makeRng, pick, randInt, round, id, dateOffset } from './_helpers'

export const TARGET_STATUSES = ['Active', 'Completed', 'Pending', 'Overachieved', 'Expired']

function deriveStatus(achieved, target, expired = false) {
  if (expired) return 'Expired'
  const pct = (achieved / target) * 100
  if (pct >= 100) return pct >= 110 ? 'Overachieved' : 'Completed'
  if (pct <= 5) return 'Pending'
  return 'Active'
}

/* ---------------- 1) GENERAL TARGETS (product based) ---------------- */
const PERIODS = ['Monthly', 'Quarterly', 'Yearly']
const gRng = makeRng(120)
let gCount = 0
export const generalTargets = []

// Admin-level (one per product), plus branch & staff distributions
products.forEach((p) => {
  gCount += 1
  const targetQty = round(randInt(gRng, 80, 600), 10)
  const achievedQty = round(targetQty * (0.45 + gRng() * 0.75), 5)
  generalTargets.push({
    id: id('GT', gCount, 3),
    productId: p.id,
    product: p.name,
    unit: p.unit,
    scope: 'Admin',
    branchId: null,
    branchName: 'All Branches',
    staffId: null,
    staffName: '—',
    period: pick(gRng, PERIODS),
    targetQty,
    achievedQty,
    completion: round((achievedQty / targetQty) * 100, 1),
    month: 'Jun 2026',
    status: deriveStatus(achievedQty, targetQty),
  })
})
// Branch-level
branches.slice(0, 6).forEach((b) => {
  const p = pick(gRng, products)
  gCount += 1
  const targetQty = round(randInt(gRng, 40, 220), 5)
  const achievedQty = round(targetQty * (0.4 + gRng() * 0.8), 5)
  generalTargets.push({
    id: id('GT', gCount, 3),
    productId: p.id,
    product: p.name,
    unit: p.unit,
    scope: 'Branch',
    branchId: b.id,
    branchName: b.name,
    staffId: null,
    staffName: '—',
    period: pick(gRng, PERIODS),
    targetQty,
    achievedQty,
    completion: round((achievedQty / targetQty) * 100, 1),
    month: 'Jun 2026',
    status: deriveStatus(achievedQty, targetQty),
  })
})
// Staff-level
staff.slice(0, 10).forEach((s) => {
  const p = pick(gRng, products)
  gCount += 1
  const targetQty = round(randInt(gRng, 10, 90), 5)
  const achievedQty = round(targetQty * (0.35 + gRng() * 0.85), 1)
  generalTargets.push({
    id: id('GT', gCount, 3),
    productId: p.id,
    product: p.name,
    unit: p.unit,
    scope: 'Staff',
    branchId: s.branchId,
    branchName: s.branchName,
    staffId: s.id,
    staffName: s.name,
    period: pick(gRng, PERIODS),
    targetQty,
    achievedQty,
    completion: round((achievedQty / targetQty) * 100, 1),
    month: 'Jun 2026',
    status: deriveStatus(achievedQty, targetQty),
  })
})

/* ---------------- 2) SPECIAL TARGETS (campaign based) ---------------- */
const CAMPAIGNS = [
  { name: 'Eid Festival Mega Sale', type: 'Festival' },
  { name: 'Summer Seasonal Offer', type: 'Seasonal' },
  { name: 'ACP Panel Launch Drive', type: 'Product Launch' },
  { name: 'Weekend Flash Sale', type: 'Flash Sale' },
  { name: 'Ramadan Special Campaign', type: 'Festival' },
  { name: 'Back-to-Project Season', type: 'Seasonal' },
  { name: 'New Year Clearance', type: 'Flash Sale' },
]
const sRng = makeRng(330)
export const specialTargets = CAMPAIGNS.map((c, i) => {
  const branch = pick(sRng, branches)
  const member = pick(sRng, staff.filter((s) => s.branchId === branch.id))
  const targetValue = round(randInt(sRng, 200, 900) * 1000, 5000)
  const achievedValue = round(targetValue * (0.3 + sRng() * 0.95), 1000)
  const start = -randInt(sRng, 20, 60)
  const end = start + randInt(sRng, 25, 55)
  const expired = end < 0 && achievedValue < targetValue
  return {
    id: id('ST', i + 1, 3),
    name: c.name,
    type: c.type,
    startDate: dateOffset(start),
    endDate: dateOffset(end),
    branchId: branch.id,
    branchName: branch.name,
    staffId: member?.id ?? null,
    staffName: member?.name ?? 'All Staff',
    targetValue,
    achievedValue,
    incentive: round(randInt(sRng, 5, 18) * 1000, 500),
    completion: round((achievedValue / targetValue) * 100, 1),
    status: deriveStatus(achievedValue, targetValue, expired),
  }
})

/* ---------------- 3) PROJECT TARGETS ---------------- */
const PROJECTS = [
  { name: 'Palm Villa Estates', type: 'Villa', location: 'Palm Jumeirah, Dubai' },
  { name: 'Marina Heights Apartments', type: 'Apartment', location: 'Dubai Marina' },
  { name: 'Olaya Business Tower', type: 'Commercial', location: 'Riyadh' },
  { name: 'Pearl Interior Fit-Out', type: 'Interior', location: 'Doha' },
  { name: 'Corniche Luxury Villas', type: 'Villa', location: 'Abu Dhabi' },
  { name: 'Downtown Retail Plaza', type: 'Commercial', location: 'Dubai' },
]
const pRng = makeRng(540)
export const projectTargets = PROJECTS.map((p, i) => {
  const branch = pick(pRng, branches)
  const member = pick(pRng, staff.filter((s) => s.branchId === branch.id))
  const projectValue = round(randInt(pRng, 1200, 6500) * 1000, 10000)
  const revenueTarget = round(projectValue * (0.3 + pRng() * 0.2), 10000)
  const revenueAchieved = round(revenueTarget * (0.25 + pRng() * 0.9), 5000)
  const qtyTarget = round(randInt(pRng, 200, 1200), 10)
  const qtyAchieved = round(qtyTarget * (0.3 + pRng() * 0.85), 5)
  const start = -randInt(pRng, 40, 150)
  const end = start + randInt(pRng, 120, 300)
  return {
    id: id('PT', i + 1, 3),
    name: p.name,
    type: p.type,
    location: p.location,
    projectValue,
    revenueTarget,
    revenueAchieved,
    qtyTarget,
    qtyAchieved,
    branchId: branch.id,
    branchName: branch.name,
    staffId: member?.id ?? null,
    staffName: member?.name ?? '—',
    startDate: dateOffset(start),
    endDate: dateOffset(end),
    completion: round((revenueAchieved / revenueTarget) * 100, 1),
    status: deriveStatus(revenueAchieved, revenueTarget),
  }
})

/* ---------------- Aggregations ---------------- */
const all = [
  ...generalTargets.map((t) => ({ completion: t.completion, status: t.status })),
  ...specialTargets.map((t) => ({ completion: t.completion, status: t.status })),
  ...projectTargets.map((t) => ({ completion: t.completion, status: t.status })),
]

export const targetSummary = {
  total: all.length,
  achieved: all.filter((t) => t.status === 'Completed' || t.status === 'Overachieved').length,
  pending: all.filter((t) => t.status === 'Pending' || t.status === 'Active').length,
  overachieved: all.filter((t) => t.status === 'Overachieved').length,
  avgCompletion: round(all.reduce((s, t) => s + t.completion, 0) / all.length, 1),
}

export const monthlyAchievementTrend = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m, i) => ({
  month: m,
  target: 100,
  achievement: round(62 + i * 6 + (i % 2 ? 5 : -3), 1),
}))

export default { generalTargets, specialTargets, projectTargets }
