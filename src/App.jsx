import { useTheme } from './hooks/useTheme'
import AppRoutes from './routes/AppRoutes'

export default function App() {
  // Applies the persisted theme (light/dark) to <html>.
  useTheme()
  return <AppRoutes />
}
