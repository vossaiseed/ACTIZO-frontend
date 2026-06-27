import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { usersApi } from '@/services/crm'

/**
 * System (non-staff) user accounts: Admins + Branch Managers.
 * Sales staff live in the staff slice. The backend returns the SYSTEM role
 * ('admin' | 'branch_manager' | 'staff'); this slice keeps only admins +
 * branch managers so the Users page can merge them with sales staff.
 */

// Loads admins + branch managers from the backend (filters out sales staff).
export const fetchUsers = createAsyncThunk('users/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await usersApi.list({ limit: 500 })
    return (data || []).filter((u) => u.role !== 'staff')
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

// Kept under the original action names so the page dispatches unchanged.
// Page passes camelCase form data; returns the created user WITH a one-time pin.
export const addUser = createAsyncThunk('users/add', async (body, { rejectWithValue }) => {
  try {
    const { data } = await usersApi.create(body)
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const updateUser = createAsyncThunk('users/update', async (payload, { rejectWithValue }) => {
  try {
    const { id, ...body } = payload
    const { data } = await usersApi.update(id, body)
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const removeUser = createAsyncThunk('users/remove', async (id, { rejectWithValue }) => {
  try {
    await usersApi.remove(id)
    return id
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

// Backend generates the new PIN; arg may be an id or { id }. Returns { id, pin }.
export const resetUserPin = createAsyncThunk('users/resetPin', async (arg, { rejectWithValue }) => {
  const id = typeof arg === 'object' ? arg.id : arg
  try {
    const { data } = await usersApi.resetPin(id)
    return { id, pin: data.pin }
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

const initialState = {
  items: [],
  status: 'idle',
  error: null,
}

const upsert = (state, u) => {
  if (!u) return
  const idx = state.items.findIndex((x) => x.id === u.id)
  if (idx !== -1) state.items[idx] = { ...state.items[idx], ...u }
  else state.items.unshift(u)
}

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        if (!state.items.length) state.status = 'loading'
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(addUser.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(updateUser.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(removeUser.fulfilled, (state, action) => {
        state.items = state.items.filter((u) => u.id !== action.payload)
      })
      .addCase(resetUserPin.fulfilled, (state, action) => {
        const u = state.items.find((x) => x.id === action.payload.id)
        if (u) u.pin = action.payload.pin
      })
  },
})

export const selectExtraUsers = (s) => s.users.items
export const selectUserStatus = (s) => s.users.status
export default userSlice.reducer
