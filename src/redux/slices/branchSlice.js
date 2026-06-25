import { createSlice } from '@reduxjs/toolkit'
import { branches } from '../../data/branches'

const initialState = {
  items: branches,
  filters: { search: '', region: 'All', status: 'All' },
  sort: { key: 'totalRevenue', dir: 'desc' },
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
})

export const { setFilter, resetFilters, setSort } = branchSlice.actions
export const selectBranches = (s) => s.branches.items
export const selectBranchById = (id) => (s) => s.branches.items.find((b) => b.id === id)
export default branchSlice.reducer
