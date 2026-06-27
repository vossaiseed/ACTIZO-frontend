import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { dashboardApi } from '@/services/crm'

/* ----------------------------- Thunks ----------------------------- */
export const fetchDashboard = createAsyncThunk('dashboard/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await dashboardApi.overview()
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

const initialState = {
  kpis: {},
  deltas: {},
  charts: {
    revenueTrend: [],
    leadPipeline: [],
    salesPerformance: [],
    monthlyConversion: [],
    branchPerformance: [],
    staffPerformance: [],
  },
  branchPerformanceCards: [],
  recentActivities: [],
  recentLeads: [],
  topPerformers: [],
  upcomingFollowUps: [],
  status: 'idle',
  error: null,
}

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setStatus: (state, action) => {
      state.status = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        if (!Object.keys(state.kpis || {}).length) state.status = 'loading'
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        const d = action.payload || {}
        const charts = d.charts || {}
        state.status = 'succeeded'
        state.kpis = d.kpis || {}
        state.charts = {
          revenueTrend: charts.revenueTrend || [],
          leadPipeline: charts.leadPipeline || [],
          branchPerformance: charts.branchPerformance || [],
          // Keys the backend does not provide — kept empty so the page never crashes.
          salesPerformance: [],
          monthlyConversion: [],
          staffPerformance: [],
        }
        state.branchPerformanceCards = charts.branchPerformance || []
        state.recentActivities = d.recentActivities || []
        state.recentLeads = d.recentLeads || []
        state.topPerformers = d.topPerformers || []
        state.upcomingFollowUps = d.upcomingFollowUps || []
        // deltas not provided by backend — keep as empty object.
        state.deltas = {}
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export const { setStatus } = dashboardSlice.actions
export const selectDashboard = (s) => s.dashboard
export default dashboardSlice.reducer
