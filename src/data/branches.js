import { id } from './_helpers'

// ACTIZO operates exactly five branches. (No other branches exist in the system.)
export const branches = [
  {
    id: 'BR-01', code: 'KKD', name: 'Kozhikode', city: 'Kozhikode', region: 'Kerala',
    manager: 'Arjun Menon', phone: '+91 495 244 1001', email: 'kozhikode@actizo.com',
    address: 'Mavoor Road, Kozhikode, Kerala 673004', established: '2018',
    status: 'active', staffCount: 6, totalLeads: 142, totalSales: 88, wonLeads: 61,
    monthlyTarget: 55, monthlyAchieved: 61, conversionRate: 43,
    monthlyRevenue: 1340000, totalRevenue: 14200000, targetRevenue: 16000000,
    targetAchievement: 89, color: '#3b82f6', accent: 'blue',
  },
  {
    id: 'BR-02', code: 'MLP', name: 'Malappuram', city: 'Malappuram', region: 'Kerala',
    manager: 'Fathima Rahman', phone: '+91 483 273 1002', email: 'malappuram@actizo.com',
    address: 'Up Hill, Malappuram, Kerala 676505', established: '2019',
    status: 'active', staffCount: 5, totalLeads: 118, totalSales: 70, wonLeads: 49,
    monthlyTarget: 50, monthlyAchieved: 44, conversionRate: 38,
    monthlyRevenue: 1080000, totalRevenue: 11200000, targetRevenue: 13000000,
    targetAchievement: 86, color: '#10b981', accent: 'emerald',
  },
  {
    id: 'BR-03', code: 'COK', name: 'Kochi', city: 'Kochi', region: 'Kerala',
    manager: 'Rahul Pillai', phone: '+91 484 401 1003', email: 'kochi@actizo.com',
    address: 'MG Road, Ernakulam, Kochi, Kerala 682011', established: '2017',
    status: 'active', staffCount: 6, totalLeads: 156, totalSales: 96, wonLeads: 72,
    monthlyTarget: 65, monthlyAchieved: 71, conversionRate: 46,
    monthlyRevenue: 1620000, totalRevenue: 17400000, targetRevenue: 18500000,
    targetAchievement: 94, color: '#8b5cf6', accent: 'violet',
  },
  {
    id: 'BR-04', code: 'TSR', name: 'Thrissur', city: 'Thrissur', region: 'Kerala',
    manager: 'Vishnu Nair', phone: '+91 487 233 1004', email: 'thrissur@actizo.com',
    address: 'Round West, Thrissur, Kerala 680001', established: '2021',
    status: 'active', staffCount: 4, totalLeads: 84, totalSales: 41, wonLeads: 33,
    monthlyTarget: 35, monthlyAchieved: 28, conversionRate: 39,
    monthlyRevenue: 720000, totalRevenue: 7600000, targetRevenue: 9500000,
    targetAchievement: 80, color: '#f59e0b', accent: 'amber',
  },
  {
    id: 'BR-05', code: 'CBE', name: 'Coimbatore', city: 'Coimbatore', region: 'Tamil Nadu',
    manager: 'Karthik Subramaniam', phone: '+91 422 245 1005', email: 'coimbatore@actizo.com',
    address: 'Avinashi Road, Coimbatore, Tamil Nadu 641018', established: '2020',
    status: 'active', staffCount: 5, totalLeads: 96, totalSales: 52, wonLeads: 38,
    monthlyTarget: 45, monthlyAchieved: 33, conversionRate: 35,
    monthlyRevenue: 1100000, totalRevenue: 9800000, targetRevenue: 12500000,
    targetAchievement: 78, color: '#ec4899', accent: 'rose',
  },
]

export const branchById = (bid) => branches.find((b) => b.id === bid)
export const branchName = (bid) => branchById(bid)?.name ?? '—'
export const branchOptions = branches.map((b) => ({ value: b.id, label: b.name }))

export default branches
export { id }
