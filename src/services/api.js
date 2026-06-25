import axios from 'axios'

/**
 * Pre-configured Axios instance. This is a frontend-only demo, so no live
 * backend is wired up — but the instance + interceptors are production-ready
 * for when the API is connected (set VITE_API_URL).
 */
const api = axios.create({
  baseURL: import.meta.env?.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('persist:actizo-crm-root')
    if (raw) {
      const parsed = JSON.parse(raw)
      const auth = parsed?.auth ? JSON.parse(parsed.auth) : null
      if (auth?.token) config.headers.Authorization = `Bearer ${auth.token}`
    }
  } catch {
    /* noop */
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => Promise.reject(error),
)

export const mockDelay = (data, ms = 600) =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms))

export default api
