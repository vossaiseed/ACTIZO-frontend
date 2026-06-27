import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { incentivesApi } from '@/services/crm'

/* ----------------------------- Thunks ----------------------------- */
export const fetchIncentives = createAsyncThunk('incentives/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await incentivesApi.list({ limit: 1000 })
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const fetchIncentiveHistory = createAsyncThunk(
  'incentives/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await incentivesApi.history({ limit: 1000 })
      return data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const fetchIncentiveSummary = createAsyncThunk(
  'incentives/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      // The summary endpoint returns the object directly (no `data` envelope list).
      const res = await incentivesApi.summary()
      return res?.data ?? res
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

const defaultFilters = { search: '', branch: 'All', status: 'All' }

const initialState = {
  items: [],
  history: [], // per product-target breakdown
  summary: { totalIncentives: 0, highestIncentive: 0, earningStaff: 0, staffCount: 0, topPerformer: null },
  filters: defaultFilters,
  page: 1,
  pageSize: 8,
  status: 'idle',
  error: null,
}

const incentiveSlice = createSlice({
  name: 'incentives',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      const { key, value } = action.payload
      state.filters[key] = value
      state.page = 1
    },
    resetFilters: (state) => {
      state.filters = { ...defaultFilters }
      state.page = 1
    },
    setPage: (state, action) => {
      state.page = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIncentives.pending, (state) => {
        if (!state.items.length) state.status = 'loading'
      })
      .addCase(fetchIncentives.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload || []
      })
      .addCase(fetchIncentives.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(fetchIncentiveHistory.fulfilled, (state, action) => {
        state.history = action.payload || []
      })
      .addCase(fetchIncentiveSummary.fulfilled, (state, action) => {
        state.summary = action.payload || initialState.summary
      })
  },
})

export const { setFilter, resetFilters, setPage } = incentiveSlice.actions
export const selectIncentives = (s) => s.incentives
export default incentiveSlice.reducer
