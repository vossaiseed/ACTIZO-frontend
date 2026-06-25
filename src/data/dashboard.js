import { leads, leadCountsByStatus, upcomingFollowUps, recentLeads } from './leads'
import { branches } from './branches'
import { staff, topPerformers } from './staff'
import { totalRevenue, monthlyRevenue, revenueTrend } from './sales'
import { activities } from './activities'
import { round } from './_helpers'

const wonValue = leads.filter((l) => l.status === 'Won').reduce((s, l) => s + l.value, 0)

export const dashboardKpis = {
  totalLeads: leads.length,
  newLeads: leadCountsByStatus['New Lead'] + leadCountsByStatus['Assigned'],
  contactedLeads: leadCountsByStatus['Contacted'],
  followUpLeads: leadCountsByStatus['Follow-Up'],
  negotiationLeads: leadCountsByStatus['Negotiation'],
  wonLeads: leadCountsByStatus['Won'],
  lostLeads: leadCountsByStatus['Lost'],
  totalRevenue,
  monthlyRevenue,
  totalBranches: branches.length,
  totalStaff: staff.length,
  targetAchievement: round(
    branches.reduce((s, b) => s + b.targetAchievement, 0) / branches.length,
    1,
  ),
  conversionRate: round((leadCountsByStatus['Won'] / leads.length) * 100, 1),
  wonValue,
}

// KPI deltas (vs last period) for trend chips
export const kpiDeltas = {
  totalLeads: 12.4,
  newLeads: 8.1,
  contactedLeads: 5.6,
  followUpLeads: -2.3,
  wonLeads: 16.8,
  lostLeads: -4.2,
  totalRevenue: 14.2,
  monthlyRevenue: 9.7,
  totalBranches: 0,
  totalStaff: 6.5,
  targetAchievement: 3.4,
}

// Lead pipeline funnel
const PIPELINE_COLORS = {
  'New Lead': '#7dd8d1',
  Assigned: '#4ec4bc',
  Contacted: '#36bab3',
  'Follow-Up': '#2a9d97',
  Negotiation: '#267f7b',
  Won: '#10b981',
  Lost: '#f43f5e',
}
export const leadPipeline = Object.entries(leadCountsByStatus).map(([stage, count]) => ({
  stage,
  count,
  fill: PIPELINE_COLORS[stage],
}))

// Sales performance (sales vs leads per month)
const TREND_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
export const salesPerformance = TREND_MONTHS.map((m, i) => ({
  month: m,
  sales: round((48 + i * 7) * (1 + (i % 2 ? 0.08 : -0.04)), 0),
  leads: round((72 + i * 9) * (1 + (i % 2 ? 0.05 : -0.03)), 0),
}))

export const monthlyConversion = TREND_MONTHS.map((m, i) => ({
  month: m,
  rate: round(28 + i * 2.4 + (i % 2 ? 3 : -1.5), 1),
}))

export const branchPerformance = branches
  .map((b) => ({ branch: b.city, revenue: b.monthlyRevenue, target: round(b.targetRevenue / 12, 1000) }))
  .sort((a, b) => b.revenue - a.revenue)

// Per-branch target-vs-achievement cards for the dashboard Branch Performance grid.
export const branchPerformanceCards = branches.map((b) => ({
  id: b.id,
  name: b.name,
  target: b.monthlyTarget,
  achieved: b.monthlyAchieved,
  remaining: Math.max(0, b.monthlyTarget - b.monthlyAchieved),
  convRate: b.conversionRate,
  revenue: b.monthlyRevenue,
  achievementPct: Math.round((b.monthlyAchieved / b.monthlyTarget) * 100),
  accent: b.accent,
}))

export const staffPerformance = topPerformers
  .slice(0, 7)
  .map((s) => ({ name: s.firstName, fullName: s.name, revenue: s.revenue, score: s.performanceScore }))

export const dashboardRevenueTrend = revenueTrend

export const recentActivities = activities.slice(0, 8)
export { upcomingFollowUps, recentLeads, topPerformers }

export default dashboardKpis
