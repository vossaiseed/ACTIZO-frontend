import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { flashTargetsApi } from '@/services/crm'

export const fetchFlashTargets = createAsyncThunk('flash/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await flashTargetsApi.list()
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const createFlashTarget = createAsyncThunk('flash/create', async (body, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await flashTargetsApi.create(body)
    dispatch(fetchFlashTargets())
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const submitFlashRequest = createAsyncThunk('flash/submitRequest', async ({ id, ...body }, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await flashTargetsApi.submitRequest(id, body)
    dispatch(fetchFlashTargets())
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const resolveFlashRequest = createAsyncThunk('flash/resolveRequest', async ({ requestId, ...body }, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await flashTargetsApi.resolveRequest(requestId, body)
    dispatch(fetchFlashTargets())
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const distributeFlashStaff = createAsyncThunk('flash/distribute', async ({ id, allocations }, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await flashTargetsApi.distribute(id, allocations)
    dispatch(fetchFlashTargets())
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

const initialState = {
  campaigns: [],
  branchTargets: [],
  staffTargets: [],
  status: 'idle',
  error: null,
}

const flashSlice = createSlice({
  name: 'flash',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFlashTargets.pending, (state) => {
        if (!state.campaigns.length) state.status = 'loading'
      })
      .addCase(fetchFlashTargets.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.campaigns = action.payload?.campaigns || []
        state.branchTargets = action.payload?.branchTargets || []
        state.staffTargets = action.payload?.staffTargets || []
      })
      .addCase(fetchFlashTargets.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export const selectFlash = (s) => s.flash
export default flashSlice.reducer
