import { createSlice } from '@reduxjs/toolkit'
import {
  incentives,
  incentiveHistory,
  totalIncentives,
  highestIncentive,
  monthlyIncentive,
  topPerformer,
  incentiveTrend,
  incentivesByBranch,
} from '../../data/incentives'

const defaultFilters = { search: '', branch: 'All', status: 'All', type: 'All', month: 'All' }

const initialState = {
  items: incentives,
  history: incentiveHistory,
  summary: { totalIncentives, highestIncentive, monthlyIncentive, topPerformer },
  charts: { incentiveTrend, incentivesByBranch },
  filters: defaultFilters,
  page: 1,
  pageSize: 8,
}

const incentiveSlice = createSlice({
  name: 'incentives',
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
    setPage: (state, action) => {
      state.page = action.payload
    },
  },
})

export const { setFilter, resetFilters, setPage } = incentiveSlice.actions
export const selectIncentives = (s) => s.incentives
export default incentiveSlice.reducer
