import { createSlice } from '@reduxjs/toolkit'

// Holds system users created at runtime that are NOT sales staff
// (e.g. Branch Managers). Sales staff live in the staff slice.
const initialState = {
  items: [],
}

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    addUser: (state, action) => {
      state.items.unshift(action.payload)
    },
    updateUser: (state, action) => {
      const idx = state.items.findIndex((u) => u.id === action.payload.id)
      if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload }
    },
    removeUser: (state, action) => {
      state.items = state.items.filter((u) => u.id !== action.payload)
    },
  },
})

export const { addUser, updateUser, removeUser } = userSlice.actions
export const selectExtraUsers = (s) => s.users.items
export default userSlice.reducer
