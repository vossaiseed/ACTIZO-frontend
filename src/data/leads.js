import { branches } from './branches'
import { staff } from './staff'
import { products } from './products'
import { makeRng, pick, randInt, chance, round, id, dateOffset } from './_helpers'

export const LEAD_STATUSES = ['New Lead', 'Assigned', 'Contacted', 'Follow-Up', 'Negotiation', 'Won', 'Lost']
export const LEAD_SOURCES = ['Website', 'Referral', 'Walk-in', 'Social Media', 'Cold Call', 'Exhibition', 'Google Ads', 'WhatsApp']
export const LEAD_PRIORITIES = ['High', 'Medium', 'Low']
const FOLLOWUP_TYPES = ['Call', 'Email', 'Meeting', 'WhatsApp', 'Site Visit']
const CITIES = ['Kozhikode', 'Malappuram', 'Thrissur', 'Kochi', 'Coimbatore', 'Kannur', 'Palakkad', 'Kottayam', 'Thiruvananthapuram', 'Salem']
const COMPANIES = ['Skyline Interiors', 'Gulf Build Co.', 'Oasis Developers', 'Pearl Contracting', 'Vertex Realty',
  'Horizon Fit-Out', 'Marina Homes', 'Desert Rose LLC', 'Cedar Projects', 'Atlas Construction',
  'Falcon Interiors', 'Crystal Builders', 'Nova Spaces', 'Emerald Estates', 'Summit Joinery', '']
const FIRST = ['John', 'Aarav', 'Mei', 'Carlos', 'Priya', 'Liam', 'Sofia', 'Wei', 'Ananya', 'David',
  'Fatima', 'Omar', 'Elena', 'Raj', 'Sara', 'Yuki', 'Diego', 'Aisha', 'Noah', 'Zara']
const LAST = ['Smith', 'Patel', 'Chen', 'Garcia', 'Kumar', "O'Brien", 'Rossi', 'Wang', 'Sharma', 'Khan',
  'Hassan', 'Lopez', 'Nguyen', 'Ali', 'Tanaka', 'Mueller', 'Reddy', 'Costa']

const STATUS_WEIGHTS = [
  ['New Lead', 10], ['Assigned', 9], ['Contacted', 12], ['Follow-Up', 14],
  ['Negotiation', 9], ['Won', 16], ['Lost', 8],
]
function weightedStatus(rng) {
  const total = STATUS_WEIGHTS.reduce((s, [, w]) => s + w, 0)
  let r = rng() * total
  for (const [status, w] of STATUS_WEIGHTS) {
    if ((r -= w) <= 0) return status
  }
  return 'New Lead'
}

const rng = makeRng(2027)
const COUNT = 64

function buildLead(n) {
  const branch = pick(rng, branches)
  const branchStaff = staff.filter((s) => s.branchId === branch.id)
  const status = weightedStatus(rng)
  const assigned = status !== 'New Lead'
  const member = assigned ? pick(rng, branchStaff) : null
  const product = pick(rng, products)
  const first = pick(rng, FIRST)
  const last = pick(rng, LAST)
  const createdAgo = randInt(rng, 1, 120)
  const value = round(randInt(rng, 8, 240) * 1000, 500)
  const score = randInt(rng, 28, 98)
  const priority = score > 75 ? 'High' : score > 50 ? 'Medium' : 'Low'

  // ---- timeline (oldest -> newest) ----
  const timeline = []
  let cursor = -createdAgo
  timeline.push({ id: 't1', type: 'created', title: 'Lead created', description: `New lead captured via ${pick(rng, LEAD_SOURCES)}`, date: dateOffset(cursor), by: 'System' })
  if (assigned && member) {
    cursor += randInt(rng, 1, 3)
    timeline.push({ id: 't2', type: 'assigned', title: 'Lead assigned', description: `Assigned to ${member.name}`, date: dateOffset(cursor), by: branch.manager })
  }
  const reached = LEAD_STATUSES.indexOf(status)
  const steps = ['Contacted', 'Follow-Up', 'Negotiation']
  steps.forEach((st, i) => {
    if (reached >= LEAD_STATUSES.indexOf(st) && reached < 5) {
      cursor += randInt(rng, 1, 6)
      timeline.push({ id: `t${3 + i}`, type: 'status', title: st, description: `Stage moved to ${st}`, date: dateOffset(Math.min(cursor, -1)), by: member?.name ?? 'Sales' })
    }
  })
  if (status === 'Won') timeline.push({ id: 'tw', type: 'won', title: 'Deal won', description: `Closed at AED ${value.toLocaleString()}`, date: dateOffset(-randInt(rng, 0, 4)), by: member?.name ?? 'Sales' })
  if (status === 'Lost') timeline.push({ id: 'tl', type: 'lost', title: 'Lead lost', description: pick(rng, ['Budget constraints', 'Chose competitor', 'No response', 'Timeline mismatch']), date: dateOffset(-randInt(rng, 0, 4)), by: member?.name ?? 'Sales' })

  // ---- follow ups ----
  const fuCount = assigned ? randInt(rng, 1, 5) : 0
  const followUps = Array.from({ length: fuCount }, (_, i) => {
    const past = i < fuCount - 1 || ['Won', 'Lost'].includes(status)
    const dayBase = -createdAgo + (i + 1) * randInt(rng, 2, 8)
    return {
      id: `fu-${n}-${i + 1}`,
      type: pick(rng, FOLLOWUP_TYPES),
      status: past ? pick(rng, ['Completed', 'Completed', 'Missed']) : 'Scheduled',
      date: dateOffset(Math.min(dayBase, past ? -1 : randInt(rng, 1, 12))),
      nextDate: past ? null : dateOffset(randInt(rng, 1, 12)),
      remark: pick(rng, [
        'Customer requested updated quotation.',
        'Discussed product specifications and lead time.',
        'Shared catalogue and pricing on WhatsApp.',
        'Site measurement scheduled with the team.',
        'Negotiating on bulk order discount.',
        'Awaiting customer confirmation on sample.',
        'Customer comparing with other vendors.',
        'Follow-up call — left voicemail.',
      ]),
      by: member?.name ?? 'Sales',
    }
  })

  // ---- activity log ----
  const activities = timeline.map((t, i) => ({
    id: `a-${n}-${i}`,
    action: t.title,
    detail: t.description,
    date: t.date,
    by: t.by,
  }))

  const upcoming = followUps.find((f) => f.status === 'Scheduled')

  return {
    id: id('LD', 1000 + n, 4),
    name: `${first} ${last}`,
    company: pick(rng, COMPANIES),
    mobile: `+91 ${randInt(rng, 70, 99)}${randInt(rng, 100, 999)} ${randInt(rng, 10000, 99999)}`,
    email: `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z]/g, '')}@email.com`,
    location: pick(rng, CITIES),
    product: product.name,
    productId: product.id,
    source: pick(rng, LEAD_SOURCES),
    branchId: branch.id,
    branchName: branch.name,
    staffId: member?.id ?? null,
    staffName: member?.name ?? 'Unassigned',
    status,
    priority,
    value,
    score,
    createdDate: dateOffset(-createdAgo),
    lastActivity: timeline[timeline.length - 1]?.date ?? dateOffset(-createdAgo),
    nextFollowUp: upcoming?.nextDate ?? upcoming?.date ?? null,
    tags: [product.category, branch.region, priority].filter(Boolean),
    notes: pick(rng, [
      'High-intent customer, ready to purchase within the month.',
      'Price sensitive — needs a competitive quote.',
      'Repeat customer from a previous project.',
      'Referred by an existing client. Treat as priority.',
      'Bulk requirement for an ongoing project.',
      'Still in the early evaluation phase.',
    ]),
    timeline,
    followUps,
    activities,
  }
}

export const leads = Array.from({ length: COUNT }, (_, i) => buildLead(i + 1))

export const leadById = (lid) => leads.find((l) => l.id === lid)

// Aggregations used by dashboard / pipeline
export const leadCountsByStatus = LEAD_STATUSES.reduce((acc, s) => {
  acc[s] = leads.filter((l) => l.status === s).length
  return acc
}, {})

export const upcomingFollowUps = leads
  .flatMap((l) =>
    l.followUps
      .filter((f) => f.status === 'Scheduled')
      .map((f) => ({ ...f, leadId: l.id, leadName: l.name, product: l.product, branchName: l.branchName })),
  )
  .sort((a, b) => new Date(a.nextDate || a.date) - new Date(b.nextDate || b.date))
  .slice(0, 8)

export const recentLeads = [...leads]
  .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
  .slice(0, 8)

export default leads
