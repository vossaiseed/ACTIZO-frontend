import { createSlice } from '@reduxjs/toolkit'
import {
  generalTargets,
  specialTargets,
  projectTargets,
  targetSummary,
  monthlyAchievementTrend,
} from '../../data/targets'

const defaultFilters = { search: '', branch: 'All', staff: 'All', status: 'All', type: 'All' }

const initialState = {
  general: generalTargets,
  special: specialTargets,
  project: projectTargets,
  summary: targetSummary,
  monthlyAchievementTrend,
  activeTab: 'general', // general | special | project
  filters: defaultFilters,
}

const targetSlice = createSlice({
  name: 'targets',
  initialState,
  reducers: {
    setTab: (state, action) => {
      state.activeTab = action.payload
      state.filters = { ...defaultFilters }
    },
    setFilter: (state, action) => {
      const { key, value } = action.payload
      state.filters[key] = value
    },
    resetFilters: (state) => {
      state.filters = { ...defaultFilters }
    },
    addTarget: (state, action) => {
      const { tab, target } = action.payload
      state[tab].unshift(target)
    },
    updateTarget: (state, action) => {
      const { tab, target } = action.payload
      const idx = state[tab].findIndex((t) => t.id === target.id)
      if (idx !== -1) state[tab][idx] = { ...state[tab][idx], ...target }
    },
  },
})

export const { setTab, setFilter, resetFilters, addTarget, updateTarget } = targetSlice.actions
export const selectTargets = (s) => s.targets
export default targetSlice.reducer
