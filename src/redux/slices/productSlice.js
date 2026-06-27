import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import { productsApi } from '@/services/crm'

export const fetchProducts = createAsyncThunk('products/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await productsApi.list({ limit: 500 })
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const fetchProduct = createAsyncThunk('products/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await productsApi.get(id)
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

// Same name/payload as the old reducer so pages need no change.
export const addProduct = createAsyncThunk('products/add', async (body, { rejectWithValue }) => {
  try {
    const { data } = await productsApi.create(body)
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const updateProduct = createAsyncThunk('products/update', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await productsApi.update(payload.id, payload)
    return data
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const toggleProductStatus = createAsyncThunk(
  'products/toggleStatus',
  async (id, { getState, rejectWithValue }) => {
    try {
      const current = getState().products.items.find((p) => p.id === id)
      const next = current?.status === 'Active' ? 'Inactive' : 'Active'
      const { data } = await productsApi.setStatus(id, next)
      return data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

const defaultFilters = { search: '', category: 'All', status: 'All' }

const initialState = {
  items: [],
  current: null,
  filters: defaultFilters,
  sort: { key: 'createdDate', dir: 'desc' },
  status: 'idle',
  error: null,
}

const upsert = (state, p) => {
  const idx = state.items.findIndex((x) => x.id === p.id)
  if (idx !== -1) state.items[idx] = { ...state.items[idx], ...p }
  else state.items.unshift(p)
}

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
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
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        if (!state.items.length) state.status = 'loading'
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.current = action.payload
      })
      .addCase(addProduct.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(updateProduct.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(toggleProductStatus.fulfilled, (state, action) => upsert(state, action.payload))
  },
})

export const { setFilter, resetFilters, setSort } = productSlice.actions

export const selectProducts = (s) => s.products.items
export const selectProductById = (id) => (s) =>
  s.products.items.find((p) => p.id === id) || (s.products.current?.id === id ? s.products.current : null)
export const selectActiveProducts = (s) => s.products.items.filter((p) => p.status === 'Active')
export const selectProductOptions = createSelector(
  (s) => s.products.items,
  (items) => items.map((p) => ({ value: p.id, label: p.name })),
)
export const selectProductStatus = (s) => s.products.status

export default productSlice.reducer
