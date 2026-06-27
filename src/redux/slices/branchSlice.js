import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import { branchesApi } from '@/services/crm'

export const fetchBranches = createAsyncThunk('branches/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await branchesApi.list({ limit: 200 })
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const fetchBranch = createAsyncThunk('branches/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await branchesApi.get(id)
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const updateBranch = createAsyncThunk('branches/update', async ({ id, ...body }, { rejectWithValue }) => {
  try {
    const { data } = await branchesApi.update(id, body)
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

const initialState = {
  items: [],
  current: null,
  filters: { search: '', region: 'All', status: 'All' },
  sort: { key: 'totalRevenue', dir: 'desc' },
  status: 'idle',
  error: null,
}

const branchSlice = createSlice({
  name: 'branches',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      const { key, value } = action.payload
      state.filters[key] = value
    },
    resetFilters: (state) => {
      state.filters = { search: '', region: 'All', status: 'All' }
    },
    setSort: (state, action) => {
      const key = action.payload
      if (state.sort.key === key) state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc'
      else state.sort = { key, dir: 'desc' }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBranches.pending, (state) => {
        if (!state.items.length) state.status = 'loading'
      })
      .addCase(fetchBranches.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchBranches.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(fetchBranch.fulfilled, (state, action) => {
        state.current = action.payload
      })
      .addCase(updateBranch.fulfilled, (state, action) => {
        // Merge so we keep nested stats already loaded on `current`.
        const b = action.payload
        if (state.current?.id === b.id) state.current = { ...state.current, ...b }
        const idx = state.items.findIndex((x) => x.id === b.id)
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...b }
      })
  },
})

export const { setFilter, resetFilters, setSort } = branchSlice.actions
export const selectBranches = (s) => s.branches.items
export const selectBranchById = (id) => (s) =>
  s.branches.items.find((b) => b.id === id) || (s.branches.current?.id === id ? s.branches.current : null)
export const selectCurrentBranch = (s) => s.branches.current
export const selectBranchStatus = (s) => s.branches.status
export const selectBranchOptions = createSelector(
  (s) => s.branches.items,
  (items) => items.map((b) => ({ value: b.id, label: b.name })),
)
export default branchSlice.reducer
