import axios from 'axios';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const BASE_URL = import.meta.env.VITE_API_URL || (isLocal ? 'http://127.0.0.1:8001/api' : 'https://campusgig-api-zl9k.onrender.com/api');

const api = axios.create({
  baseURL: BASE_URL,
});

// Inject Bearer token from localStorage & handle multipart FormData
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Never override multipart boundary when uploading FormData
    if (config.data instanceof FormData) {
      if (config.headers?.delete) {
        config.headers.delete('Content-Type');
      } else if (config.headers) {
        delete (config.headers as any)['Content-Type'];
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 -> redirect to login (only if not an auth endpoint)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (err: any, fallback = 'Operation failed'): string => {
  const detail = err.response?.data?.detail;
  if (!detail) return err.message || fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d: any) => {
        if (typeof d === 'string') return d;
        const field = d.loc ? d.loc.slice(-1)[0] : '';
        return field ? `${field}: ${d.msg || 'Invalid'}` : (d.msg || JSON.stringify(d));
      })
      .join('\n');
  }
  if (typeof detail === 'object') {
    return JSON.stringify(detail);
  }
  return String(detail);
};

export default api;
