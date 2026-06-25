import { createSlice } from '@reduxjs/toolkit'
import { staff } from '../../data/staff'

const initialState = {
  items: staff,
  filters: { search: '', branch: 'All', role: 'All', status: 'All' },
  sort: { key: 'performanceScore', dir: 'desc' },
  page: 1,
  pageSize: 9,
}

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {
    addStaff: (state, action) => {
      state.items.unshift(action.payload)
    },
    updateStaff: (state, action) => {
      const idx = state.items.findIndex((m) => m.id === action.payload.id)
      if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload }
    },
    toggleStaffStatus: (state, action) => {
      const m = state.items.find((x) => x.id === action.payload)
      if (m) m.status = m.status === 'active' ? 'inactive' : 'active'
    },
    resetStaffPin: (state, action) => {
      const { id, pin } = action.payload
      const m = state.items.find((x) => x.id === id)
      if (m) m.pin = pin
    },
    setFilter: (state, action) => {
      const { key, value } = action.payload
      state.filters[key] = value
      state.page = 1
    },
    resetFilters: (state) => {
      state.filters = { search: '', branch: 'All', role: 'All', status: 'All' }
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
})

export const {
  addStaff,
  updateStaff,
  toggleStaffStatus,
  resetStaffPin,
  setFilter,
  resetFilters,
  setSort,
  setPage,
} = staffSlice.actions
export const selectStaff = (s) => s.staff.items
export const selectStaffById = (id) => (s) => s.staff.items.find((m) => m.id === id)
export default staffSlice.reducer
