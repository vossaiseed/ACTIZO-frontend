import axios from 'axios'
import { normalize } from './normalize'

/**
 * Pre-configured Axios instance wired to the ACTIZO CRM backend.
 *
 *  - Request interceptor attaches the persisted JWT as a Bearer token.
 *  - Response interceptor unwraps the `{ success, data, meta }` envelope and
 *    normalizes snake_case + nested relations to flat camelCase (see normalize.js),
 *    so callers receive `response.data = { data, meta, message }` ready for the UI.
 *  - Errors are flattened to a real Error whose `.message` is the server message.
 */
const api = axios.create({
  baseURL: import.meta.env?.VITE_API_URL || '/api',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
})

/** Read the persisted access token without importing the store (avoids cycles). */
function readToken() {
  try {
    const raw = localStorage.getItem('persist:actizo-crm-root')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const auth = parsed?.auth ? JSON.parse(parsed.auth) : null
    return auth?.token || null
  } catch {
    return null
  }
}

// Callback the app registers to react to 401s (e.g. dispatch logout + redirect).
let onUnauthorized = null
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn
}

api.interceptors.request.use((config) => {
  const token = readToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => {
    const body = res.data
    if (body && typeof body === 'object' && 'success' in body) {
      res.data = { data: normalize(body.data), meta: body.meta, message: body.message }
    }
    return res
  },
  (error) => {
    const status = error.response?.status
    const message =
      error.response?.data?.message ||
      error.response?.data?.details?.[0]?.msg ||
      error.message ||
      'Request failed'
    if (status === 401 && onUnauthorized) onUnauthorized()
    const err = new Error(message)
    err.status = status
    err.details = error.response?.data?.details
    return Promise.reject(err)
  },
)

/* Thin helpers returning the normalized { data, meta } payload directly. */
export const http = {
  get: (url, config) => api.get(url, config).then((r) => r.data),
  post: (url, body, config) => api.post(url, body, config).then((r) => r.data),
  patch: (url, body, config) => api.patch(url, body, config).then((r) => r.data),
  put: (url, body, config) => api.put(url, body, config).then((r) => r.data),
  del: (url, config) => api.delete(url, config).then((r) => r.data),
}

export default api
