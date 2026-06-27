import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { leadsApi, followupsApi } from '@/services/crm'

/* ----------------------------- Thunks ----------------------------- */
export const fetchLeads = createAsyncThunk('leads/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await leadsApi.list({ limit: 1000 })
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const fetchLeadById = createAsyncThunk('leads/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await leadsApi.get(id)
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

// Kept under the original action names so pages dispatch unchanged.
export const addLead = createAsyncThunk('leads/add', async (body, { rejectWithValue }) => {
  try {
    const { data } = await leadsApi.create(body)
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const updateLead = createAsyncThunk('leads/update', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await leadsApi.update(payload.id, payload)
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const deleteLead = createAsyncThunk('leads/delete', async (id, { rejectWithValue }) => {
  try {
    await leadsApi.remove(id)
    return id
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const assignStaff = createAsyncThunk('leads/assign', async ({ leadId, staffId, staffName }, { rejectWithValue }) => {
  try {
    const { data } = await leadsApi.assign(leadId, staffId, staffName)
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const updateLeadStatus = createAsyncThunk('leads/updateStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    const { data } = await leadsApi.updateStatus(id, status)
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const addFollowUp = createAsyncThunk('leads/addFollowUp', async ({ leadId, followUp }, { rejectWithValue }) => {
  try {
    const { data } = await leadsApi.addFollowUp(leadId, followUp)
    return { leadId, followUp: data }
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const deleteFollowUp = createAsyncThunk('leads/deleteFollowUp', async ({ leadId, followUpId }, { rejectWithValue }) => {
  try {
    await followupsApi.remove(followUpId)
    return { leadId, followUpId }
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

const defaultFilters = {
  search: '',
  status: 'All',
  branch: 'All',
  staff: 'All',
  source: 'All',
  priority: 'All',
}

const initialState = {
  items: [],
  current: null,
  filters: defaultFilters,
  sort: { key: 'createdDate', dir: 'desc' },
  page: 1,
  pageSize: 8,
  status: 'idle',
  error: null,
}

const replace = (state, lead) => {
  const idx = state.items.findIndex((l) => l.id === lead.id)
  if (idx !== -1) state.items[idx] = { ...state.items[idx], ...lead }
  if (state.current?.id === lead.id) state.current = { ...state.current, ...lead }
}

const leadSlice = createSlice({
  name: 'leads',
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
      else state.sort = { key, dir: 'asc' }
    },
    setPage: (state, action) => {
      state.page = action.payload
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload
      state.page = 1
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, (state) => {
        // Only block the UI on the first load; keep cached data visible on refetch.
        if (!state.items.length) state.status = 'loading'
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(fetchLeadById.fulfilled, (state, action) => {
        state.current = action.payload
        replace(state, action.payload)
      })
      .addCase(addLead.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
      .addCase(updateLead.fulfilled, (state, action) => replace(state, action.payload))
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.items = state.items.filter((l) => l.id !== action.payload)
      })
      .addCase(assignStaff.fulfilled, (state, action) => replace(state, action.payload))
      .addCase(updateLeadStatus.fulfilled, (state, action) => replace(state, action.payload))
      .addCase(addFollowUp.fulfilled, (state, action) => {
        const { leadId, followUp } = action.payload
        if (state.current?.id === leadId) {
          state.current.followUps = [followUp, ...(state.current.followUps || [])]
        }
      })
      .addCase(deleteFollowUp.fulfilled, (state, action) => {
        const { leadId, followUpId } = action.payload
        if (state.current?.id === leadId) {
          state.current.followUps = (state.current.followUps || []).filter((f) => f.id !== followUpId)
        }
      })
  },
})

export const { setFilter, resetFilters, setSort, setPage, setPageSize } = leadSlice.actions

export const selectLeads = (s) => s.leads.items
export const selectLeadFilters = (s) => s.leads.filters
export const selectLeadById = (id) => (s) =>
  s.leads.items.find((l) => l.id === id) || (s.leads.current?.id === id ? s.leads.current : null)
export const selectCurrentLead = (s) => s.leads.current
export const selectLeadStatus = (s) => s.leads.status

export default leadSlice.reducer
