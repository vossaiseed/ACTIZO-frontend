import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useTheme } from './hooks/useTheme'
import AppRoutes from './routes/AppRoutes'
import { setUnauthorizedHandler } from './services/api'
import { logout } from './redux/slices/authSlice'

export default function App() {
  // Applies the persisted theme (light/dark) to <html>.
  useTheme()
  const dispatch = useDispatch()

  // Auto-logout on any 401 (e.g. an expired/invalid JWT) so the user is
  // bounced back to the login screen instead of seeing broken pages.
  useEffect(() => {
    setUnauthorizedHandler(() => dispatch(logout()))
    return () => setUnauthorizedHandler(null)
  }, [dispatch])

  return <AppRoutes />
}
