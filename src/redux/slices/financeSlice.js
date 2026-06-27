import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { financeApi } from '@/services/crm'

/* ----------------------------- Thunks ----------------------------- */
export const fetchFinance = createAsyncThunk('finance/fetch', async (_, { rejectWithValue }) => {
  try {
    const [overview, charts] = await Promise.all([financeApi.overview(), financeApi.charts()])
    return { kpis: overview.data, charts: charts.data }
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

const initialState = {
  kpis: {},
  charts: {
    revenueVsExpense: [],
    profitTrend: [],
    monthlyOverview: [],
    cashFlow: [],
    expenseBreakdown: [],
    receivablesAging: [],
  },
  status: 'idle',
  error: null,
}

const financeSlice = createSlice({
  name: 'finance',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFinance.pending, (state) => {
        if (!Object.keys(state.kpis || {}).length) state.status = 'loading'
      })
      .addCase(fetchFinance.fulfilled, (state, action) => {
        const { kpis, charts } = action.payload || {}
        const c = charts || {}
        state.status = 'succeeded'
        state.kpis = kpis || {}
        state.charts = {
          revenueVsExpense: c.revenueVsExpense || [],
          profitTrend: c.profitTrend || [],
          monthlyOverview: c.monthlyOverview || [],
          cashFlow: c.cashFlow || [],
          expenseBreakdown: c.expenseBreakdown || [],
          receivablesAging: c.receivablesAging || [],
        }
      })
      .addCase(fetchFinance.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export const selectFinance = (s) => s.finance
export default financeSlice.reducer
