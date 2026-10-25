import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach auth tokens or local mock headers
api.interceptors.request.use(
  (config) => {
    // For local development testing convenience
    config.headers['x-mock-role'] = localStorage.getItem('mock_role') || 'PATIENT';
    config.headers['x-mock-user-id'] = localStorage.getItem('mock_user_id') || '1';

    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = error.response?.data?.error || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(customError));
  }
);

export default api;