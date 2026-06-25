import {
  FiGrid,
  FiUsers,
  FiPhoneCall,
  FiShoppingBag,
  FiPackage,
  FiTarget,
  FiAward,
  FiHome,
  FiUserCheck,
  FiUser,
  FiBarChart2,
  FiDollarSign,
  FiSettings,
} from 'react-icons/fi'

// Sidebar navigation — core CRM modules only, grouped into sections.
export const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', to: '/', icon: FiGrid }],
  },
  {
    title: 'Sales Workspace',
    items: [
      { label: 'Leads', to: '/leads', icon: FiUsers },
      { label: 'Follow-Ups', to: '/follow-ups', icon: FiPhoneCall },
      { label: 'Sales', to: '/sales', icon: FiShoppingBag },
      { label: 'Products', to: '/products', icon: FiPackage },
      { label: 'Targets', to: '/targets', icon: FiTarget },
      { label: 'Incentives', to: '/incentives', icon: FiAward },
    ],
  },
  {
    title: 'Organization',
    items: [
      { label: 'Branches', to: '/branches', icon: FiHome },
      { label: 'Staff', to: '/staff', icon: FiUserCheck },
      { label: 'Users', to: '/users', icon: FiUser },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Finance', to: '/finance', icon: FiDollarSign },
      { label: 'Reports', to: '/reports', icon: FiBarChart2 },
    ],
  },
]

export const NAV_FOOTER = [{ label: 'Settings', to: '/settings', icon: FiSettings }]

// Flat list for global search / command palette
export const NAV_FLAT = [...NAV_SECTIONS.flatMap((s) => s.items), ...NAV_FOOTER]

/**
 * Filter nav sections by a role's permitted route base-paths.
 * `permissions` null/undefined => no filtering (full access).
 */
export const filterNavSections = (permissions) => {
  if (!permissions) return NAV_SECTIONS
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => permissions.includes(item.to)),
  })).filter((section) => section.items.length > 0)
}

export const filterNavFooter = (permissions) => {
  if (!permissions) return NAV_FOOTER
  return NAV_FOOTER.filter((item) => permissions.includes(item.to))
}
