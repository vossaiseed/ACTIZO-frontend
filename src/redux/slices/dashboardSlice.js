import { createSlice } from '@reduxjs/toolkit'
import {
  dashboardKpis,
  kpiDeltas,
  leadPipeline,
  salesPerformance,
  monthlyConversion,
  branchPerformance,
  branchPerformanceCards,
  staffPerformance,
  dashboardRevenueTrend,
  recentActivities,
} from '../../data/dashboard'
import { recentLeads, upcomingFollowUps } from '../../data/leads'
import { topPerformers } from '../../data/staff'

const initialState = {
  kpis: dashboardKpis,
  deltas: kpiDeltas,
  charts: {
    revenueTrend: dashboardRevenueTrend,
    leadPipeline,
    salesPerformance,
    monthlyConversion,
    branchPerformance,
    staffPerformance,
  },
  branchPerformanceCards,
  recentActivities,
  recentLeads,
  topPerformers: topPerformers.slice(0, 5),
  upcomingFollowUps,
  status: 'idle',
}

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setStatus: (state, action) => {
      state.status = action.payload
    },
  },
})

export const { setStatus } = dashboardSlice.actions
export const selectDashboard = (s) => s.dashboard
export default dashboardSlice.reducer
