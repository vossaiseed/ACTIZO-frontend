export const APP_NAME = 'ACTIZO CRM'
export const APP_TAGLINE = 'Enterprise Sales Intelligence'

export const PAGE_SIZES = [8, 12, 20, 50]

export const REGIONS = ['Kerala', 'Tamil Nadu']
export const ROLES = ['Sales Executive', 'Senior Sales Executive', 'Team Lead', 'Branch Manager']

// Recharts palette — brand-led
export const CHART_COLORS = ['#36bab3', '#2a9d97', '#7dd8d1', '#4ec4bc', '#267f7b', '#10b981', '#f59e0b', '#6366f1']
export const CHART_GRID = '#e5e7eb'

/**
 * Status → badge styling. Each entry returns tone classes for light & dark.
 * Used by <StatusBadge status={...} /> across leads, sales, targets, etc.
 */
export const STATUS_STYLES = {
  // Lead statuses
  'New Lead': 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300',
  Assigned: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300',
  Contacted: 'bg-brand-50 text-brand-700 ring-brand-600/20 dark:bg-brand-500/10 dark:text-brand-300',
  'Follow-Up': 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300',
  Negotiation: 'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300',
  Won: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  Lost: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300',
  // Generic / sales / target statuses
  Active: 'bg-brand-50 text-brand-700 ring-brand-600/20 dark:bg-brand-500/10 dark:text-brand-300',
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300',
  Overachieved: 'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300',
  Expired: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-700/40 dark:text-slate-300',
  Scheduled: 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300',
  Missed: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300',
  Refunded: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300',
  Paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  // Priorities
  High: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300',
  Medium: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300',
  Low: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-700/40 dark:text-slate-300',
}

export const DEFAULT_STATUS_STYLE =
  'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-700/40 dark:text-slate-300'

export const getStatusStyle = (status) => STATUS_STYLES[status] || DEFAULT_STATUS_STYLE

export const LEAD_STATUS_FLOW = ['New Lead', 'Assigned', 'Contacted', 'Follow-Up', 'Negotiation', 'Won']
