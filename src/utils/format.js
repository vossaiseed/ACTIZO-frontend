import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'

export const CURRENCY = '₹'

// Currency symbols that are letters (e.g. "AED") get a trailing space; glyphs (₹, $) don't.
const symbolGap = (symbol) => (/[A-Za-z]/.test(symbol) ? ' ' : '')

const toDate = (value) => {
  if (!value) return null
  if (value instanceof Date) return value
  const d = typeof value === 'string' ? parseISO(value) : new Date(value)
  return isValid(d) ? d : null
}

// AED 1,250,000 — compact variants for KPIs/charts
export const formatCurrency = (n, { compact = false, symbol = CURRENCY } = {}) => {
  const gap = symbolGap(symbol)
  if (n == null || isNaN(n)) return `${symbol}${gap}0`
  if (compact) return `${symbol}${gap}${formatCompact(n)}`
  return `${symbol}${gap}${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export const formatCompact = (n) => {
  if (n == null || isNaN(n)) return '0'
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B'
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (abs >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}

export const formatNumber = (n) =>
  n == null || isNaN(n) ? '0' : Number(n).toLocaleString('en-US')

export const formatPercent = (n, digits = 1) =>
  n == null || isNaN(n) ? '0%' : `${Number(n).toFixed(digits)}%`

export const formatDate = (value, pattern = 'dd MMM yyyy') => {
  const d = toDate(value)
  return d ? format(d, pattern) : '—'
}

export const formatDateTime = (value) => {
  const d = toDate(value)
  return d ? format(d, 'dd MMM yyyy, h:mm a') : '—'
}

export const formatRelativeTime = (value) => {
  const d = toDate(value)
  return d ? formatDistanceToNow(d, { addSuffix: true }) : '—'
}

export const formatShortDate = (value) => formatDate(value, 'dd MMM')
