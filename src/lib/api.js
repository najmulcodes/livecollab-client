import axios from 'axios';

// ✅ This must point to your Render backend, not Vercel
// Set VITE_API_URL in Vercel dashboard → Settings → Environment Variables
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

console.log('[api] baseURL:', BASE_URL); // remove after debugging

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // ✅ Don't redirect if we're already on the oauth-success page
      if (!window.location.pathname.includes('oauth-success')) {
        localStorage.removeItem('lc_token');
        localStorage.removeItem('lc_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export { default } from './axios';
