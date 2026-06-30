import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { roleByKey } from '@/constants/roles'
import { authApi } from '@/services/crm'

/**
 * Real PIN-based authentication against the backend.
 * Flow: select role -> enter 6-digit PIN -> POST /auth/login -> store JWT + user.
 *
 * The backend is the single source of truth: it verifies the PIN and returns the
 * authoritative identity (id, name, email, branchId, branchName, role, avatar) +
 * JWT. The frontend `roles.js` config only supplies the display label,
 * capabilities, permissions and post-login redirect used by nav + route guards.
 */
export const loginWithPin = createAsyncThunk(
  'auth/loginWithPin',
  async ({ roleKey, pin }, { rejectWithValue }) => {
    if (!roleKey) return rejectWithValue('Please select a role to continue.')
    try {
      const { data } = await authApi.login({ roleKey, pin })
      const role = roleByKey(roleKey)
      const identity = data.user // authoritative backend identity
      const user = {
        ...identity,
        // A staff member's account id IS their staff id (used by "my data" views).
        staffId: identity.role === 'staff' ? identity.id : null,
        role: role?.title || identity.role, // display label shown across the app
        roleKey,
        roleLabel: role?.label,
        permissions: role?.permissions ?? identity.permissions,
        capabilities: role?.capabilities,
        redirect: role?.redirect || '/',
      }
      return { user, token: data.accessToken, refreshToken: data.refreshToken }
    } catch (err) {
      return rejectWithValue(err.message || 'Invalid PIN. Please try again.')
    }
  },
)

const initialState = {
  user: null,
  roleKey: null,
  isAuthenticated: false,
  token: null,
  refreshToken: null,
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      // Fire-and-forget server logout (stateless JWT — client just discards).
      authApi.logout().catch(() => {})
      state.user = null
      state.roleKey = null
      state.isAuthenticated = false
      state.token = null
      state.refreshToken = null
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
        state.user = action.payload.user
        state.roleKey = action.payload.user.roleKey
        state.isAuthenticated = true
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
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
