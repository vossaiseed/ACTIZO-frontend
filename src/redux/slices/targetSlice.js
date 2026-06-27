import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { targetsApi, targetRequestsApi } from '@/services/crm'

/* ----------------------------- Thunks ----------------------------- */
// Load one tab's targets (general | special | project) into state[tab].
export const fetchTargets = createAsyncThunk('targets/fetch', async (tab, { rejectWithValue }) => {
  try {
    const { data } = await targetsApi.list(tab, { limit: 1000 })
    return { tab, data }
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const fetchTargetSummary = createAsyncThunk('targets/summary', async (_, { rejectWithValue }) => {
  try {
    const { data } = await targetsApi.summary()
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

// Kept under the original action names so pages dispatch unchanged.
// Same payload shapes as before: { tab, target }.
export const addTarget = createAsyncThunk('targets/add', async ({ tab, target }, { rejectWithValue }) => {
  try {
    const { data } = await targetsApi.create(tab, target)
    return { tab, target: data }
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const updateTarget = createAsyncThunk('targets/update', async ({ tab, target }, { rejectWithValue }) => {
  try {
    const { data } = await targetsApi.update(tab, target.id, target)
    return { tab, target: data }
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const allocateBranches = createAsyncThunk('targets/allocateBranches', async ({ id, allocations }, { rejectWithValue }) => {
  try {
    const { data } = await targetsApi.allocateBranches(id, allocations)
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const allocateStaff = createAsyncThunk('targets/allocateStaff', async ({ id, allocations }, { rejectWithValue }) => {
  try {
    const { data } = await targetsApi.allocateStaff(id, allocations)
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

/* ----- Target increase requests (Branch Manager → Admin) ----- */
export const fetchTargetRequests = createAsyncThunk('targets/fetchRequests', async (_, { rejectWithValue }) => {
  try {
    const { data } = await targetRequestsApi.list()
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const createTargetRequest = createAsyncThunk('targets/createRequest', async (body, { rejectWithValue }) => {
  try {
    const { data } = await targetRequestsApi.create(body)
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const resolveTargetRequest = createAsyncThunk('targets/resolveRequest', async ({ id, ...body }, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await targetRequestsApi.resolve(id, body)
    // Refresh general targets so the approved quantity reflects immediately.
    dispatch(fetchTargets('general'))
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

const defaultFilters = { search: '', branch: 'All', staff: 'All', status: 'All', type: 'All' }

const initialState = {
  general: [],
  special: [],
  project: [],
  summary: {},
  requests: [], // target increase requests
  monthlyAchievementTrend: [], // not provided by backend
  activeTab: 'general', // general | special | project
  filters: defaultFilters,
  status: 'idle',
  error: null,
}

const targetSlice = createSlice({
  name: 'targets',
  initialState,
  reducers: {
    setTab: (state, action) => {
      state.activeTab = action.payload
      state.filters = { ...defaultFilters }
    },
    setFilter: (state, action) => {
      const { key, value } = action.payload
      state.filters[key] = value
    },
    resetFilters: (state) => {
      state.filters = { ...defaultFilters }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTargets.pending, (state) => {
        if (!state.general.length && !state.special.length && !state.project.length) {
          state.status = 'loading'
        }
      })
      .addCase(fetchTargets.fulfilled, (state, action) => {
        state.status = 'succeeded'
        const { tab, data } = action.payload
        state[tab] = data
      })
      .addCase(fetchTargets.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(fetchTargetSummary.fulfilled, (state, action) => {
        state.summary = action.payload
      })
      .addCase(addTarget.fulfilled, (state, action) => {
        const { tab, target } = action.payload
        state[tab].unshift(target)
      })
      .addCase(updateTarget.fulfilled, (state, action) => {
        const { tab, target } = action.payload
        const idx = state[tab].findIndex((t) => t.id === target.id)
        if (idx !== -1) state[tab][idx] = { ...state[tab][idx], ...target }
      })
      .addCase(fetchTargetRequests.fulfilled, (state, action) => {
        state.requests = action.payload || []
      })
      .addCase(createTargetRequest.fulfilled, (state, action) => {
        if (action.payload) state.requests.unshift(action.payload)
      })
      .addCase(resolveTargetRequest.fulfilled, (state, action) => {
        const r = action.payload
        if (!r) return
        const idx = state.requests.findIndex((x) => x.id === r.id)
        if (idx !== -1) state.requests[idx] = { ...state.requests[idx], ...r }
      })
  },
})

export const { setTab, setFilter, resetFilters } = targetSlice.actions
export const selectTargets = (s) => s.targets
export const selectTargetRequests = (s) => s.targets.requests
export default targetSlice.reducer
