import { mockDelay } from './api'
import * as data from '../data'

/**
 * Simulated API layer over the mock data. Each method resolves after a short
 * delay so loading states / skeletons render realistically.
 */
export const mockApi = {
  getDashboard: () =>
    mockDelay({
      kpis: data.dashboardKpis,
      charts: {
        revenueTrend: data.dashboardRevenueTrend,
        leadPipeline: data.leadPipeline,
        salesPerformance: data.salesPerformance,
        branchPerformance: data.branchPerformance,
        staffPerformance: data.staffPerformance,
      },
    }),
  getLeads: () => mockDelay(data.leads),
  getSales: () => mockDelay(data.sales),
  getBranches: () => mockDelay(data.branches),
  getStaff: () => mockDelay(data.staff),
  getIncentives: () => mockDelay(data.incentives),
  getFinance: () => mockDelay(data.financeKpis),
}

export default mockApi
