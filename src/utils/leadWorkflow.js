import { branches, branchById } from '@/data/branches'

/**
 * PRIMARY CRM WORKFLOW
 * Lead Creation → Branch Assignment → Staff Assignment → Follow-Up
 * Only once this is complete may a lead proceed to Negotiation / Won / Sales.
 */

// Customer location (city) → branch. Cities without their own branch route to
// the nearest branch.
const LOCATION_TO_BRANCH = {
  kozhikode: 'BR-01',
  kannur: 'BR-01',
  calicut: 'BR-01',
  malappuram: 'BR-02',
  palakkad: 'BR-02',
  kochi: 'BR-03',
  ernakulam: 'BR-03',
  kottayam: 'BR-03',
  thiruvananthapuram: 'BR-03',
  trivandrum: 'BR-03',
  thrissur: 'BR-04',
  coimbatore: 'BR-05',
  salem: 'BR-05',
}

/** Resolve the branch a lead should be assigned to, from the customer location. */
export function assignBranchByLocation(location = '') {
  const lc = String(location).trim().toLowerCase()
  if (!lc) return branchById('BR-03') || branches[0]
  if (LOCATION_TO_BRANCH[lc]) return branchById(LOCATION_TO_BRANCH[lc])
  // direct branch-city match (exact or contained)
  const direct = branches.find(
    (b) => b.city.toLowerCase() === lc || lc.includes(b.city.toLowerCase()),
  )
  if (direct) return direct
  // keyword contains map
  const hit = Object.keys(LOCATION_TO_BRANCH).find((c) => lc.includes(c))
  if (hit) return branchById(LOCATION_TO_BRANCH[hit])
  // fallback → central branch
  return branchById('BR-03') || branches[0]
}

export const LEAD_WORKFLOW_STEPS = [
  { key: 'created', label: 'Lead Created', desc: 'Captured in the system' },
  { key: 'branch', label: 'Branch Assigned', desc: 'Auto-routed by location' },
  { key: 'staff', label: 'Staff Assigned', desc: 'Allocated by branch manager' },
  { key: 'contacted', label: 'Contacted', desc: 'First customer contact made' },
  { key: 'followup', label: 'Follow-Up', desc: 'Active follow-ups logged' },
]

const STATUS_ORDER = ['New Lead', 'Assigned', 'Contacted', 'Follow-Up', 'Negotiation', 'Won', 'Lost']

/**
 * Compute the workflow progress for a lead.
 * Returns { steps:boolean[], index, isComplete }.
 */
export function getWorkflowState(lead) {
  if (!lead) return { steps: [false, false, false, false, false], index: 0, isComplete: false }

  const statusIdx = STATUS_ORDER.indexOf(lead.status)
  const hasBranch = Boolean(lead.branchId)
  const hasStaff = Boolean(lead.staffId)
  const hasFollowUp = Array.isArray(lead.followUps) && lead.followUps.length > 0
  const contacted = statusIdx >= STATUS_ORDER.indexOf('Contacted') || hasFollowUp
  const inFollowUp = statusIdx >= STATUS_ORDER.indexOf('Follow-Up') || (hasStaff && hasFollowUp)

  const steps = [true, hasBranch, hasStaff, contacted, inFollowUp]

  let index = steps.findIndex((s) => !s)
  if (index === -1) index = steps.length

  const isComplete = hasBranch && hasStaff && hasFollowUp

  return { steps, index, isComplete }
}

/** Stages allowed only AFTER the primary workflow is complete. */
export const POST_WORKFLOW_STATUSES = ['Negotiation', 'Won']

/** May this lead advance to negotiation / sales conversion? */
export function canProceedToSales(lead) {
  return getWorkflowState(lead).isComplete
}

/** Which status options are selectable right now (gating Negotiation/Won). */
export function allowedStatuses(lead) {
  const complete = canProceedToSales(lead)
  return STATUS_ORDER.filter((s) => {
    if (s === 'Lost') return true // always an allowed off-ramp
    if (POST_WORKFLOW_STATUSES.includes(s)) return complete
    return true
  })
}
