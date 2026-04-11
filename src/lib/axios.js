import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://livecollab-server-goe9.onrender.com/api';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lc_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    const isOAuthCallback = window.location.pathname.includes('oauth-success');
    if (err.response?.status === 401 && !isOAuthCallback) {
      localStorage.removeItem('lc_token');
      localStorage.removeItem('lc_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;