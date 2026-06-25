import { branches } from './branches'
import { makeRng, pick, randInt, round, id, AVATAR_COLORS, dateOffset } from './_helpers'

const FIRST = ['Ahmed', 'Mariam', 'Bilal', 'Noor', 'Hassan', 'Zainab', 'Tariq', 'Huda', 'Imran',
  'Salma', 'Faisal', 'Reem', 'Karim', 'Dana', 'Nabil', 'Lina', 'Adnan', 'Maya', 'Sami', 'Hana',
  'Waleed', 'Rana', 'Jamal', 'Sana', 'Hadi', 'Aya', 'Murad', 'Leen', 'Basel', 'Tala',
  'Ziad', 'Farah', 'Nizar', 'Dina', 'Saif']
const LAST = ['Al Mansoori', 'Haddad', 'Rahman', 'Saleh', 'Aziz', 'Darwish', 'Nasser', 'Karam',
  'Habib', 'Sultan', 'Qureshi', 'Mahmoud', 'Othman', 'Yusuf', 'Bassam']
const ROLES = ['Sales Executive', 'Sales Executive', 'Sales Executive', 'Senior Sales Executive', 'Team Lead']

const rng = makeRng(73)
let counter = 0

export const staff = branches.flatMap((branch) =>
  Array.from({ length: branch.staffCount }, (_, i) => {
    counter += 1
    const first = pick(rng, FIRST)
    const last = pick(rng, LAST)
    const name = `${first} ${last}`
    const role = i === 0 ? 'Team Lead' : pick(rng, ROLES)
    const assignedLeads = randInt(rng, 14, 38)
    const wonLeads = Math.round(assignedLeads * (0.28 + rng() * 0.22))
    const conversionRate = round((wonLeads / assignedLeads) * 100, 1)
    const revenue = round(randInt(rng, 280, 1180) * 1000, 1000)
    const target = round(revenue / (0.6 + rng() * 0.5), 10000)
    const achievement = round((revenue / target) * 100, 1)
    const incentiveEarned = round(revenue * (0.018 + rng() * 0.02), 100)
    const performanceScore = Math.min(99, round(50 + conversionRate * 0.5 + achievement * 0.3, 1))
    return {
      id: id('STF', counter),
      name,
      firstName: first,
      role,
      branchId: branch.id,
      branchName: branch.name,
      email: `${first.toLowerCase()}.${last.split(' ').pop().toLowerCase()}@actizo.com`,
      phone: `+91 ${randInt(rng, 70, 99)}${randInt(rng, 100, 999)} ${randInt(rng, 10000, 99999)}`,
      avatarColor: AVATAR_COLORS[counter % AVATAR_COLORS.length],
      joinDate: dateOffset(-randInt(rng, 120, 1400)),
      status: 'active',
      assignedLeads,
      wonLeads,
      conversionRate,
      revenue,
      target,
      achievement,
      incentiveEarned,
      performanceScore,
      rating: round(3.4 + rng() * 1.6, 0.1),
    }
  }),
)

export const staffById = (sid) => staff.find((s) => s.id === sid)
export const staffName = (sid) => staffById(sid)?.name ?? 'Unassigned'
export const staffByBranch = (bid) => staff.filter((s) => s.branchId === bid)
export const staffOptions = staff.map((s) => ({ value: s.id, label: s.name }))
export const topPerformers = [...staff].sort((a, b) => b.performanceScore - a.performanceScore)

export default staff
