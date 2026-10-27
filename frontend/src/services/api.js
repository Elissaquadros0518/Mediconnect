import axios from 'axios';
import { supabase } from '../lib/supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach real Supabase JWT bearer token
api.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } catch (err) {
      // In unauthenticated context, proceed without bearer
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