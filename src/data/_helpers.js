// Deterministic helpers so mock data stays stable across reloads / persistence.

export const REF_DATE = new Date('2026-06-24T10:00:00')

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Seedable PRNG (mulberry32) — returns a function producing 0..1
export function makeRng(seed = 1) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)]
export const randInt = (rng, min, max) => Math.floor(rng() * (max - min + 1)) + min
export const chance = (rng, p) => rng() < p
export const round = (n, step = 1) => Math.round(n / step) * step

// returns an ISO yyyy-mm-dd string `n` days relative to REF_DATE (negative = past)
export function dateOffset(n) {
  const d = new Date(REF_DATE)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

// returns ISO datetime relative to REF_DATE in hours
export function hoursOffset(h) {
  const d = new Date(REF_DATE)
  d.setHours(d.getHours() + h)
  return d.toISOString()
}

export const id = (prefix, n, pad = 3) => `${prefix}-${String(n).padStart(pad, '0')}`

// pseudo-random but stable avatar gradient palette
export const AVATAR_COLORS = [
  'from-brand-400 to-brand-600',
  'from-indigo-400 to-indigo-600',
  'from-rose-400 to-rose-600',
  'from-amber-400 to-amber-600',
  'from-emerald-400 to-emerald-600',
  'from-sky-400 to-sky-600',
  'from-violet-400 to-violet-600',
  'from-fuchsia-400 to-fuchsia-600',
]

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
