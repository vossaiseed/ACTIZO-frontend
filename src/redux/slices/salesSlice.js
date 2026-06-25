import { createSlice } from '@reduxjs/toolkit'
import {
  sales as seedSales,
  totalSales,
  totalRevenue,
  monthlyRevenue,
  avgOrderValue,
  conversionRate,
  monthlySalesTrend,
  productPerformance,
  topProducts,
  branchSales,
  staffSales,
} from '../../data/sales'

const defaultFilters = { search: '', branch: 'All', status: 'All', product: 'All' }

const initialState = {
  items: seedSales,
  kpis: { totalSales, totalRevenue, monthlyRevenue, avgOrderValue, conversionRate },
  charts: { monthlySalesTrend, productPerformance, branchSales },
  topProducts,
  staffSales,
  filters: defaultFilters,
  sort: { key: 'date', dir: 'desc' },
  page: 1,
  pageSize: 8,
}

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    addSale: (state, action) => {
      state.items.unshift(action.payload)
      // Recompute KPIs so the dashboard/sales figures reflect the new entry.
      const completed = state.items.filter((s) => s.status === 'Completed')
      const totalRevenue = completed.reduce((sum, s) => sum + (s.amount || 0), 0)
      state.kpis.totalSales = completed.length
      state.kpis.totalRevenue = totalRevenue
      state.kpis.monthlyRevenue = completed
        .filter((s) => new Date(s.date) >= new Date('2026-06-01'))
        .reduce((sum, s) => sum + (s.amount || 0), 0)
      state.kpis.avgOrderValue = completed.length
        ? Math.round(totalRevenue / completed.length)
        : 0
    },
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
  },
})

export const { addSale, setFilter, resetFilters, setSort, setPage } = salesSlice.actions
export const selectSales = (s) => s.sales
export default salesSlice.reducer
