import axios from 'axios';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl) return envUrl;

    const { protocol, hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }

    const codespacesHost = hostname.includes('-3000')
      ? hostname.replace('-3000', '-5000')
      : hostname;

    return `${protocol}//${codespacesHost}/api`;
  }

  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // Crucial for secure cookies
});

// Request interceptor to add JWT token
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
