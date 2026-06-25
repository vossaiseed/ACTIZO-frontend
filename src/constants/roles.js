import { FiShield, FiHome, FiUser } from 'react-icons/fi'
import { staffById } from '@/data/staff'
import { branchById } from '@/data/branches'

/**
 * PIN-based authentication config.
 * Roles: Admin, Branch Manager and Sales Staff.
 *
 * Demo PINs:
 *   Admin          → 123456
 *   Branch Manager → 112233
 *   Sales Staff    → 445566
 */

export const ROLE_KEYS = {
  ADMIN: 'admin',
  BRANCH_MANAGER: 'branch_manager',
  STAFF: 'staff',
}

// Permitted route base-paths per role (used by nav filtering + route guards).
const ADMIN_PERMS = [
  '/', '/leads', '/follow-ups', '/sales', '/products', '/targets', '/incentives',
  '/branches', '/staff', '/users', '/finance', '/reports', '/settings',
]
// Branch Manager sees only these modules (per spec) — no Follow-Ups, Products
// or Finance. (Settings stays as a footer utility.)
const MANAGER_PERMS = [
  '/', '/leads', '/sales', '/targets', '/incentives',
  '/branches', '/staff', '/reports', '/settings',
]
// Sales Staff is limited to their own work surface.
const STAFF_PERMS = [
  '/', '/leads', '/follow-ups', '/sales', '/targets', '/incentives', '/settings',
]

const demoStaff = staffById('STF-001')
const demoBranch = branchById('BR-01')

export const ROLES = [
  {
    key: ROLE_KEYS.ADMIN,
    label: 'Admin',
    title: 'Administrator',
    description: 'Full access to every module across all branches.',
    icon: FiShield,
    color: 'brand',
    pin: '123456',
    redirect: '/',
    permissions: ADMIN_PERMS,
    capabilities: [
      'Full System Access',
      'Lead & Sales Management',
      'Branch & Staff Management',
      'Target Management',
      'Finance Dashboard',
      'Reports & Analytics',
    ],
    user: {
      id: 'USR-ADMIN',
      name: 'Alex Morgan',
      email: 'admin@actizo.com',
      avatarColor: 'from-brand-400 to-brand-600',
      branchId: null,
      branchName: 'Head Office',
      staffId: null,
    },
  },
  {
    key: ROLE_KEYS.BRANCH_MANAGER,
    label: 'Branch Manager',
    title: 'Branch Manager',
    description: 'Manage your branch staff, assign leads, oversee targets & sales.',
    icon: FiHome,
    color: 'indigo',
    pin: '112233',
    redirect: '/',
    permissions: MANAGER_PERMS,
    capabilities: [
      'Create Sales Staff',
      'Edit Sales Staff',
      'Activate / Deactivate Staff',
      'Reset Staff PIN',
      'Assign & Reassign Leads',
      'View Staff Performance',
      'View Branch Targets',
      'View Branch Sales',
    ],
    user: {
      id: 'USR-BM',
      name: demoBranch?.manager || 'Branch Manager',
      email: 'manager@actizo.com',
      avatarColor: 'from-indigo-400 to-indigo-600',
      branchId: demoBranch?.id || 'BR-01',
      branchName: demoBranch?.name || 'Kozhikode',
      staffId: null,
    },
  },
  {
    key: ROLE_KEYS.STAFF,
    label: 'Sales Staff',
    title: 'Sales Executive',
    description: 'Work your assigned leads, follow-ups, sales & incentives.',
    icon: FiUser,
    color: 'emerald',
    pin: '445566',
    redirect: '/',
    permissions: STAFF_PERMS,
    capabilities: [
      'View Assigned Leads',
      'Add Follow-Ups',
      'Update Lead Status',
      'Record Sales',
      'View Personal Targets',
      'View Incentives',
    ],
    user: {
      id: demoStaff?.id || 'STF-001',
      name: demoStaff?.name || 'Sales Executive',
      email: 'staff@actizo.com',
      avatarColor: demoStaff?.avatarColor || 'from-emerald-400 to-emerald-600',
      branchId: demoStaff?.branchId || 'BR-01',
      branchName: demoStaff?.branchName || 'Kozhikode',
      staffId: demoStaff?.id || 'STF-001',
    },
  },
]

export const roleByKey = (key) => ROLES.find((r) => r.key === key)

export const validatePin = (key, pin) => {
  const role = roleByKey(key)
  return Boolean(role) && role.pin === String(pin)
}

// Base path of a pathname: '/leads/LD-1001' -> '/leads', '/' -> '/'
const basePath = (pathname) => {
  if (!pathname || pathname === '/') return '/'
  return '/' + pathname.split('/').filter(Boolean)[0]
}

export const isPathAllowed = (permissions, pathname) => {
  if (!permissions) return true // legacy / unknown session → don't lock out
  return permissions.includes(basePath(pathname))
}
