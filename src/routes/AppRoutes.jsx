import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import RoleRoute from './RoleRoute'
import PageLoader from '../components/feedback/PageLoader'

// Layouts
const MainLayout = lazy(() => import('../layouts/MainLayout'))
const AuthLayout = lazy(() => import('../layouts/AuthLayout'))

// Auth (PIN + role based — no password/forgot/reset)
const Login = lazy(() => import('../pages/auth/Login'))

// App pages
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'))
const LeadList = lazy(() => import('../pages/leads/LeadList'))
const LeadDetails = lazy(() => import('../pages/leads/LeadDetails'))
const FollowUp = lazy(() => import('../pages/followup/FollowUp'))
const Sales = lazy(() => import('../pages/sales/Sales'))
const Targets = lazy(() => import('../pages/targets/Targets'))
const Incentives = lazy(() => import('../pages/incentives/Incentives'))
const BranchList = lazy(() => import('../pages/branches/BranchList'))
const BranchDetails = lazy(() => import('../pages/branches/BranchDetails'))
const StaffList = lazy(() => import('../pages/staff/StaffList'))
const StaffProfile = lazy(() => import('../pages/staff/StaffProfile'))
const Products = lazy(() => import('../pages/products/Products'))
const ProductDetails = lazy(() => import('../pages/products/ProductDetails'))
const Users = lazy(() => import('../pages/users/Users'))
const Reports = lazy(() => import('../pages/reports/Reports'))
const Finance = lazy(() => import('../pages/finance/Finance'))
const Settings = lazy(() => import('../pages/settings/Settings'))
const NotFound = lazy(() => import('../pages/NotFound'))

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public — PIN + role based auth */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Protected (authenticated). Restricted modules also wrapped in RoleRoute. */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="/leads" element={<LeadList />} />
          <Route path="/leads/:id" element={<LeadDetails />} />
          <Route path="/follow-ups" element={<FollowUp />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/targets" element={<Targets />} />
          <Route path="/incentives" element={<Incentives />} />
          <Route path="/branches" element={<RoleRoute><BranchList /></RoleRoute>} />
          <Route path="/branches/:id" element={<RoleRoute><BranchDetails /></RoleRoute>} />
          <Route path="/staff" element={<RoleRoute><StaffList /></RoleRoute>} />
          <Route path="/staff/:id" element={<RoleRoute><StaffProfile /></RoleRoute>} />
          <Route path="/users" element={<RoleRoute><Users /></RoleRoute>} />
          <Route path="/reports" element={<RoleRoute><Reports /></RoleRoute>} />
          <Route path="/finance" element={<RoleRoute><Finance /></RoleRoute>} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
