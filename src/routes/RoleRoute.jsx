import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectPermissions } from '@/redux/slices/authSlice'
import { isPathAllowed } from '@/constants/roles'

/**
 * Guards a route by the current role's permissions. If the active user's role
 * is not permitted to view the path, redirect to the dashboard.
 * (ProtectedRoute already guarantees the user is authenticated.)
 */
export default function RoleRoute({ children }) {
  const permissions = useSelector(selectPermissions)
  const location = useLocation()

  if (!isPathAllowed(permissions, location.pathname)) {
    return <Navigate to="/" replace />
  }
  return children
}
