import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

import uiReducer from './slices/uiSlice'
import authReducer from './slices/authSlice'
import dashboardReducer from './slices/dashboardSlice'
import leadReducer from './slices/leadSlice'
import salesReducer from './slices/salesSlice'
import productReducer from './slices/productSlice'
import targetReducer from './slices/targetSlice'
import flashReducer from './slices/flashSlice'
import incentiveReducer from './slices/incentiveSlice'
import branchReducer from './slices/branchSlice'
import staffReducer from './slices/staffSlice'
import financeReducer from './slices/financeSlice'
import userReducer from './slices/userSlice'

const rootReducer = combineReducers({
  ui: uiReducer,
  auth: authReducer,
  dashboard: dashboardReducer,
  leads: leadReducer,
  sales: salesReducer,
  products: productReducer,
  targets: targetReducer,
  flash: flashReducer,
  incentives: incentiveReducer,
  branches: branchReducer,
  staff: staffReducer,
  finance: financeReducer,
  users: userReducer,
})

// Only persist auth + ui — data slices stay seeded from /src/data on each load.
const persistConfig = {
  key: 'actizo-crm-root',
  version: 1,
  storage,
  whitelist: ['auth', 'ui'],
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export const persistor = persistStore(store)
