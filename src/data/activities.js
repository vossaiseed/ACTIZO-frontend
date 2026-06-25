import { staff } from './staff'
import { leads } from './leads'
import { makeRng, pick, randInt, id, hoursOffset } from './_helpers'

const TEMPLATES = [
  { type: 'lead', icon: 'FiUserPlus', color: 'brand', verb: (l) => `New lead ${l.name} captured from ${l.source}` },
  { type: 'won', icon: 'FiCheckCircle', color: 'emerald', verb: (l) => `Deal won with ${l.name} — AED ${l.value.toLocaleString()}` },
  { type: 'followup', icon: 'FiPhone', color: 'sky', verb: (l) => `Follow-up logged for ${l.name}` },
  { type: 'status', icon: 'FiTrendingUp', color: 'violet', verb: (l) => `${l.name} moved to ${l.status}` },
  { type: 'sale', icon: 'FiShoppingCart', color: 'amber', verb: (l) => `Sale recorded for ${l.product}` },
  { type: 'target', icon: 'FiTarget', color: 'rose', verb: () => `Monthly target updated` },
  { type: 'note', icon: 'FiEdit3', color: 'slate', verb: (l) => `Note added to ${l.name}` },
]

const rng = makeRng(745)

export const activities = Array.from({ length: 14 }, (_, i) => {
  const tpl = pick(rng, TEMPLATES)
  const lead = pick(rng, leads)
  const member = pick(rng, staff)
  return {
    id: id('ACT', i + 1, 3),
    type: tpl.type,
    icon: tpl.icon,
    color: tpl.color,
    title: tpl.verb(lead),
    description: `${member.name} • ${member.branchName}`,
    user: member.name,
    avatarColor: member.avatarColor,
    time: hoursOffset(-randInt(rng, 1, 96)),
  }
}).sort((a, b) => new Date(b.time) - new Date(a.time))

export default activities
