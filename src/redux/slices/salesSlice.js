import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { salesApi } from '@/services/crm'

/* ------------------------------------------------------------------ */
/* Normalizers                                                        */
/* ------------------------------------------------------------------ */

// The sales table & KPI math read `sale.paymentMode` and `sale.amount`, but the
// backend speaks `paymentMethod` / `finalAmount`. Bridge both here so every sale
// in the store has the shape the UI expects regardless of source.
const normalizeSale = (sale) => ({
  ...sale,
  amount: sale?.amount ?? sale?.finalAmount ?? 0,
  paymentMode: sale?.paymentMode ?? sale?.paymentMethod ?? '',
})

/* ------------------------------------------------------------------ */
/* Thunks                                                             */
/* ------------------------------------------------------------------ */

export const fetchSales = createAsyncThunk('sales/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await salesApi.list({ limit: 1000 })
    return (data || []).map(normalizeSale)
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const fetchSalesStats = createAsyncThunk('sales/fetchStats', async (_, { rejectWithValue }) => {
  try {
    const { data } = await salesApi.stats()
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

// Kept under the original action name so the Sales page / RecordSaleModal dispatch
// unchanged. Body is camelCase ids (see RecordSaleModal.onSubmit).
export const addSale = createAsyncThunk('sales/add', async (body, { rejectWithValue }) => {
  try {
    const { data } = await salesApi.create(body)
    return normalizeSale(data)
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

/* ------------------------------------------------------------------ */
/* Slice                                                              */
/* ------------------------------------------------------------------ */

const defaultFilters = { search: '', branch: 'All', status: 'All', product: 'All' }

const initialState = {
  items: [],
  // analytics keys the backend does not provide default to 0 / [].
  kpis: { totalSales: 0, totalRevenue: 0, monthlyRevenue: 0, avgOrderValue: 0, conversionRate: 0 },
  charts: { monthlySalesTrend: [], productPerformance: [], branchSales: [] },
  topProducts: [],
  staffSales: [],
  filters: defaultFilters,
  sort: { key: 'date', dir: 'desc' },
  page: 1,
  pageSize: 8,
  status: 'idle',
  error: null,
}

const salesSlice = createSlice({
  name: 'sales',
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
    setSort: (state, action) => {
      const key = action.payload
      if (state.sort.key === key) state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc'
      else state.sort = { key, dir: 'asc' }
    },
    setPage: (state, action) => {
      state.page = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSales.pending, (state) => {
        if (!state.items.length) state.status = 'loading'
      })
      .addCase(fetchSales.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchSales.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(fetchSalesStats.fulfilled, (state, action) => {
        const s = action.payload || {}
        // Map backend stats into the KPIs / charts / topProducts the page reads.
        state.kpis.totalSales = s.totalSales ?? 0
        state.kpis.totalRevenue = s.totalRevenue ?? 0
        state.kpis.monthlyRevenue = s.monthlyRevenue ?? 0
        state.kpis.avgOrderValue = s.avgOrderValue ?? 0
        state.kpis.conversionRate = s.conversionRate ?? 0 // live: Won/total leads
        state.topProducts = s.topProducts ?? []
        // branchSales arrives as [{ branch, revenue }] — matches charts.branchSales.
        state.charts.branchSales = s.branchSales ?? []
        // staffSales [{ name, branch, revenue, orders }] → Top Staff panel.
        state.staffSales = s.staffSales ?? []
        // monthlySalesTrend [{ month, sales }] → Revenue Overview chart.
        state.charts.monthlySalesTrend = s.monthlySalesTrend ?? []
      })
      .addCase(addSale.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
  },
})

// addSale is exported above as a thunk; the rest are plain slice actions.
export const { setFilter, resetFilters, setSort, setPage } = salesSlice.actions

export const selectSales = (s) => s.sales
export const selectSalesStatus = (s) => s.sales.status

export default salesSlice.reducer
