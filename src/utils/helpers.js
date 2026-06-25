// Generic data utilities used by tables, filters, and lists.

export function sortData(arr, key, dir = 'asc') {
  if (!key) return arr
  const sorted = [...arr].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    if (av == null) return 1
    if (bv == null) return -1
    if (typeof av === 'number' && typeof bv === 'number') return av - bv
    // date-ish strings
    const ad = Date.parse(av)
    const bd = Date.parse(bv)
    if (!isNaN(ad) && !isNaN(bd) && /\d{4}-\d{2}-\d{2}/.test(String(av))) return ad - bd
    return String(av).localeCompare(String(bv), undefined, { numeric: true })
  })
  return dir === 'desc' ? sorted.reverse() : sorted
}

export function searchData(arr, term, keys) {
  if (!term) return arr
  const q = term.toLowerCase().trim()
  return arr.filter((item) =>
    keys.some((k) => String(item[k] ?? '').toLowerCase().includes(q)),
  )
}

export function applyFilters(arr, filters, map) {
  // map: { filterKey: itemKey }; 'All' values are ignored
  return arr.filter((item) =>
    Object.entries(filters).every(([fk, fv]) => {
      if (fv == null || fv === 'All' || fv === '') return true
      const itemKey = map[fk]
      if (!itemKey) return true
      return String(item[itemKey]) === String(fv)
    }),
  )
}

export function paginate(arr, page, pageSize) {
  const start = (page - 1) * pageSize
  return arr.slice(start, start + pageSize)
}

export const totalPages = (total, pageSize) => Math.max(1, Math.ceil(total / pageSize))

export function debounce(fn, delay = 300) {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), delay)
  }
}

export const sum = (arr, key) => arr.reduce((s, x) => s + (key ? x[key] : x) || 0, 0)

export const unique = (arr) => [...new Set(arr)]

export const groupBy = (arr, key) =>
  arr.reduce((acc, item) => {
    const k = item[key]
    ;(acc[k] = acc[k] || []).push(item)
    return acc
  }, {})

export const clamp = (n, min, max) => Math.min(Math.max(n, min), max)
