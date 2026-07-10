import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.MODE === 'production' ? '/api' : 'http://localhost:5000/api',
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.error('API 401 Error on:', err.config?.url, err.response?.data);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Delay redirect slightly so user can read the toast/console
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    }
    if (err.response?.status === 403 && err.response?.data?.code === 'PAYMENT_REQUIRED') {
      window.location.href = '/subscribe';
    }
    return Promise.reject(err);
  }
);

export default API;
