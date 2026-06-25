import { createSlice } from '@reduxjs/toolkit'
import {
  financeKpis,
  revenueVsExpense,
  profitTrend,
  monthlyOverview,
  cashFlow,
  expenseBreakdown,
  receivablesAging,
} from '../../data/finance'

const initialState = {
  kpis: financeKpis,
  charts: { revenueVsExpense, profitTrend, monthlyOverview, cashFlow, expenseBreakdown, receivablesAging },
}

const financeSlice = createSlice({
  name: 'finance',
  initialState,
  reducers: {},
})

export const selectFinance = (s) => s.finance
export default financeSlice.reducer
