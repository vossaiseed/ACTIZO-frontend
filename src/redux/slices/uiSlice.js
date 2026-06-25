import { createSlice } from '@reduxjs/toolkit'

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const initialState = {
  theme: getInitialTheme(),
  sidebarCollapsed: false,
  mobileNavOpen: false,
  commandOpen: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark'
    },
    setTheme: (state, action) => {
      state.theme = action.payload
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload
    },
    toggleMobileNav: (state) => {
      state.mobileNavOpen = !state.mobileNavOpen
    },
    setMobileNav: (state, action) => {
      state.mobileNavOpen = action.payload
    },
    setCommandOpen: (state, action) => {
      state.commandOpen = action.payload
    },
  },
})

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarCollapsed,
  toggleMobileNav,
  setMobileNav,
  setCommandOpen,
} = uiSlice.actions

export const selectTheme = (s) => s.ui.theme
export const selectSidebarCollapsed = (s) => s.ui.sidebarCollapsed

export default uiSlice.reducer
