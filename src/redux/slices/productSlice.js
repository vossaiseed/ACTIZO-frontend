import { createSlice } from '@reduxjs/toolkit'
import { products as seedProducts } from '../../data/products'

const defaultFilters = { search: '', category: 'All', status: 'All' }

const initialState = {
  items: seedProducts,
  filters: defaultFilters,
  sort: { key: 'createdDate', dir: 'desc' },
}

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    addProduct: (state, action) => {
      state.items.unshift(action.payload)
    },
    updateProduct: (state, action) => {
      const idx = state.items.findIndex((p) => p.id === action.payload.id)
      if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload }
    },
    toggleProductStatus: (state, action) => {
      const p = state.items.find((x) => x.id === action.payload)
      if (p) p.status = p.status === 'Active' ? 'Inactive' : 'Active'
    },
    setFilter: (state, action) => {
      const { key, value } = action.payload
      state.filters[key] = value
    },
    resetFilters: (state) => {
      state.filters = { ...defaultFilters }
    },
    setSort: (state, action) => {
      const key = action.payload
      if (state.sort.key === key) state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc'
      else state.sort = { key, dir: 'asc' }
    },
  },
})

export const {
  addProduct,
  updateProduct,
  toggleProductStatus,
  setFilter,
  resetFilters,
  setSort,
} = productSlice.actions

export const selectProducts = (s) => s.products.items
export const selectProductById = (id) => (s) => s.products.items.find((p) => p.id === id)
export const selectActiveProducts = (s) => s.products.items.filter((p) => p.status === 'Active')

export default productSlice.reducer
