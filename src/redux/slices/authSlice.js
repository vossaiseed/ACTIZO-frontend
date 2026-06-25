import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { roleByKey, validatePin } from '@/constants/roles'

/**
 * PIN-based authentication (no email/username/password/OTP/signup).
 * Flow: select role -> enter 6-digit PIN -> validate role + PIN -> create session.
 */
export const loginWithPin = createAsyncThunk(
  'auth/loginWithPin',
  async ({ roleKey, pin }, { rejectWithValue }) => {
    await new Promise((r) => setTimeout(r, 700))
    if (!roleKey) return rejectWithValue('Please select a role to continue.')
    if (!validatePin(roleKey, pin)) return rejectWithValue('Invalid PIN. Please try again.')
    const role = roleByKey(roleKey)
    return {
      ...role.user,
      role: role.title, // display label shown across the app (Sidebar/Header)
      roleKey: role.key,
      roleLabel: role.label,
      permissions: role.permissions,
      capabilities: role.capabilities,
      redirect: role.redirect,
    }
  },
)

const initialState = {
  user: null,
  roleKey: null,
  isAuthenticated: false,
  token: null,
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.roleKey = null
      state.isAuthenticated = false
      state.token = null
      state.status = 'idle'
      state.error = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginWithPin.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loginWithPin.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload
        state.roleKey = action.payload.roleKey
        state.isAuthenticated = true
        state.token = `demo-pin-token-${action.payload.roleKey}`
      })
      .addCase(loginWithPin.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload || 'Login failed'
      })
  },
})

export const { logout, clearError } = authSlice.actions

export const selectUser = (s) => s.auth.user
export const selectIsAuthenticated = (s) => s.auth.isAuthenticated
export const selectAuthStatus = (s) => s.auth.status
export const selectAuthError = (s) => s.auth.error
export const selectRoleKey = (s) => s.auth.user?.roleKey ?? s.auth.roleKey
// Derive permissions LIVE from the current role so nav/route access always
// reflects the latest role config — even for sessions created before a change.
export const selectPermissions = (s) => {
  const rk = s.auth.user?.roleKey ?? s.auth.roleKey
  const role = rk ? roleByKey(rk) : null
  return role?.permissions ?? s.auth.user?.permissions ?? null
}
export const selectCapabilities = (s) => s.auth.user?.capabilities ?? []

export default authSlice.reducer
