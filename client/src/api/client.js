import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eldercare_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired/invalid tokens globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403 && error.response.data?.error?.includes('token')) {
      localStorage.removeItem('eldercare_token');
      localStorage.removeItem('eldercare_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
