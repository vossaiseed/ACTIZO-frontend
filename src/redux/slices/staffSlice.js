import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import { staffApi } from '@/services/crm'

export const fetchStaff = createAsyncThunk('staff/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await staffApi.list({ limit: 500 })
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const fetchStaffMember = createAsyncThunk('staff/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await staffApi.get(id)
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const addStaff = createAsyncThunk('staff/add', async (body, { rejectWithValue }) => {
  try {
    const { data } = await staffApi.create(body)
    return data // includes plaintext `pin` once
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const updateStaff = createAsyncThunk('staff/update', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await staffApi.update(payload.id, payload)
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const toggleStaffStatus = createAsyncThunk(
  'staff/toggleStatus',
  async (id, { getState, rejectWithValue }) => {
    try {
      const current = getState().staff.items.find((m) => m.id === id)
      const next = current?.status === 'active' ? 'inactive' : 'active'
      const { data } = await staffApi.setStatus(id, next)
      return data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

// Backend generates the new PIN; arg may be an id or { id }.
export const resetStaffPin = createAsyncThunk(
  'staff/resetPin',
  async (arg, { rejectWithValue }) => {
    const id = typeof arg === 'object' ? arg.id : arg
    try {
      const { data } = await staffApi.resetPin(id)
      return { id, pin: data.pin }
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

const defaultFilters = { search: '', branch: 'All', role: 'All', status: 'All' }

const initialState = {
  items: [],
  current: null,
  filters: defaultFilters,
  sort: { key: 'performanceScore', dir: 'desc' },
  page: 1,
  pageSize: 9,
  status: 'idle',
  error: null,
}

const upsert = (state, m) => {
  const idx = state.items.findIndex((x) => x.id === m.id)
  if (idx !== -1) state.items[idx] = { ...state.items[idx], ...m }
  else state.items.unshift(m)
}

const staffSlice = createSlice({
  name: 'staff',
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
    setSort: (state, action) => {
      const key = action.payload
      if (state.sort.key === key) state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc'
      else state.sort = { key, dir: 'desc' }
    },
    setPage: (state, action) => {
      state.page = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStaff.pending, (state) => {
        if (!state.items.length) state.status = 'loading'
      })
      .addCase(fetchStaff.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchStaff.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(fetchStaffMember.fulfilled, (state, action) => {
        state.current = action.payload
        upsert(state, action.payload)
      })
      .addCase(addStaff.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(updateStaff.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(toggleStaffStatus.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(resetStaffPin.fulfilled, (state, action) => {
        const m = state.items.find((x) => x.id === action.payload.id)
        if (m) m.pin = action.payload.pin
      })
  },
})

export const { setFilter, resetFilters, setSort, setPage } = staffSlice.actions
export const selectStaff = (s) => s.staff.items
export const selectStaffById = (id) => (s) =>
  s.staff.items.find((m) => m.id === id) || (s.staff.current?.id === id ? s.staff.current : null)
export const selectCurrentStaff = (s) => s.staff.current
export const selectStaffStatus = (s) => s.staff.status
export const selectStaffOptions = createSelector(
  (s) => s.staff.items,
  (items) => items.map((m) => ({ value: m.id, label: m.name })),
)
export default staffSlice.reducer
