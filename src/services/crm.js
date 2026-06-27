/**
 * CRM API service layer.
 *
 * One namespaced object per backend module. Every method returns the normalized
 * payload `{ data, meta }` (envelope already unwrapped + camelCased in api.js).
 * Redux thunks call these — components never touch axios directly.
 */
import { http } from './api'

/* ----------------------------- Auth ----------------------------- */
export const authApi = {
  login: ({ roleKey, pin, identifier }) =>
    http.post('/auth/login', { role: roleKey, pin, identifier }),
  me: () => http.get('/auth/me'),
  refresh: (refreshToken) => http.post('/auth/refresh', { refreshToken }),
  logout: () => http.post('/auth/logout'),
}

/* ----------------------------- Leads ---------------------------- */
export const leadsApi = {
  list: (params) => http.get('/leads', { params }),
  stats: () => http.get('/leads/stats'),
  get: (id) => http.get(`/leads/${id}`),
  create: (body) => http.post('/leads', body),
  update: (id, body) => http.patch(`/leads/${id}`, body),
  remove: (id) => http.del(`/leads/${id}`),
  assign: (id, staffId, staffName) => http.patch(`/leads/${id}/assign`, { staffId, staffName }),
  updateStatus: (id, status) => http.patch(`/leads/${id}/status`, { status }),
  addFollowUp: (id, body) => http.post(`/leads/${id}/follow-ups`, body),
}

/* --------------------------- Follow-ups ------------------------- */
export const followupsApi = {
  list: (params) => http.get('/follow-ups', { params }),
  upcoming: (limit = 8) => http.get('/follow-ups/upcoming', { params: { limit } }),
  create: (body) => http.post('/follow-ups', body),
  update: (id, body) => http.patch(`/follow-ups/${id}`, body),
  remove: (id) => http.del(`/follow-ups/${id}`),
}

/* ----------------------------- Sales ---------------------------- */
export const salesApi = {
  list: (params) => http.get('/sales', { params }),
  stats: () => http.get('/sales/stats'),
  get: (id) => http.get(`/sales/${id}`),
  create: (body) => http.post('/sales', body),
  update: (id, body) => http.patch(`/sales/${id}`, body),
  remove: (id) => http.del(`/sales/${id}`),
}

/* --------------------------- Products --------------------------- */
export const productsApi = {
  list: (params) => http.get('/products', { params }),
  categories: () => http.get('/products/categories'),
  get: (id) => http.get(`/products/${id}`),
  create: (body) => http.post('/products', body),
  update: (id, body) => http.patch(`/products/${id}`, body),
  setStatus: (id, status) => http.patch(`/products/${id}/status`, { status }),
  remove: (id) => http.del(`/products/${id}`),
}

/* --------------------------- Branches --------------------------- */
export const branchesApi = {
  list: (params) => http.get('/branches', { params }),
  get: (id) => http.get(`/branches/${id}`),
  stats: (id) => http.get(`/branches/${id}/stats`),
  create: (body) => http.post('/branches', body),
  update: (id, body) => http.patch(`/branches/${id}`, body),
  remove: (id) => http.del(`/branches/${id}`),
}

/* ----------------------------- Users ---------------------------- */
export const usersApi = {
  list: (params) => http.get('/users', { params }),
  get: (id) => http.get(`/users/${id}`),
  create: (body) => http.post('/users', body),
  update: (id, body) => http.patch(`/users/${id}`, body),
  setStatus: (id, status) => http.patch(`/users/${id}/status`, { status }),
  resetPin: (id) => http.patch(`/users/${id}/reset-pin`),
  remove: (id) => http.del(`/users/${id}`),
}

/* ----------------------------- Staff ---------------------------- */
export const staffApi = {
  list: (params) => http.get('/staff', { params }),
  get: (id) => http.get(`/staff/${id}`),
  create: (body) => http.post('/staff', body),
  update: (id, body) => http.patch(`/staff/${id}`, body),
  setStatus: (id, status) => http.patch(`/staff/${id}/status`, { status }),
  resetPin: (id) => http.patch(`/staff/${id}/reset-pin`),
  remove: (id) => http.del(`/staff/${id}`),
}

/* ---------------------------- Targets --------------------------- */
export const targetsApi = {
  summary: () => http.get('/targets/summary'),
  list: (tab, params) => http.get(`/targets/${tab}`, { params }),
  get: (tab, id) => http.get(`/targets/${tab}/${id}`),
  create: (tab, body) => http.post(`/targets/${tab}`, body),
  update: (tab, id, body) => http.patch(`/targets/${tab}/${id}`, body),
  remove: (tab, id) => http.del(`/targets/${tab}/${id}`),
  // Hierarchical allocation workflow
  allocateBranches: (productTargetId, allocations) => http.put(`/targets/product/${productTargetId}/branches`, { allocations }),
  allocateStaff: (branchTargetId, allocations) => http.put(`/targets/branch/${branchTargetId}/staff`, { allocations }),
}

/* ---------------- Target increase requests (Branch Manager → Admin) ------------- */
export const targetRequestsApi = {
  list: () => http.get('/target-requests'),
  create: (body) => http.post('/target-requests', body),
  resolve: (id, body) => http.patch(`/target-requests/${id}`, body),
}

/* -------------------------- Incentives -------------------------- */
// Read-only: incentives are computed automatically from targets + completed sales.
export const incentivesApi = {
  list: (params) => http.get('/incentives', { params }),
  history: (params) => http.get('/incentives/history', { params }),
  summary: () => http.get('/incentives/summary'),
}

/* ---------------------------- Finance --------------------------- */
export const financeApi = {
  overview: () => http.get('/finance/overview'),
  charts: () => http.get('/finance/charts'),
}

/* --------------------------- Dashboard -------------------------- */
export const dashboardApi = {
  overview: () => http.get('/dashboard'),
}

/* ---------------------------- Reports --------------------------- */
export const reportsApi = {
  get: (type) => http.get(`/reports/${type}`),
}

/* -------------------------- Activities -------------------------- */
export const activitiesApi = {
  list: (params) => http.get('/activities', { params }),
  create: (body) => http.post('/activities', body),
}

/* ------------------------ Notifications ------------------------- */
export const notificationsApi = {
  list: (params) => http.get('/notifications', { params }),
  create: (body) => http.post('/notifications', body),
  markRead: (id) => http.patch(`/notifications/${id}/read`),
  markAllRead: () => http.patch('/notifications/read-all'),
}
