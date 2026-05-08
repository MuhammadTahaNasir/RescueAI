import axios from 'axios';

// In production (Vercel/Netlify), set VITE_API_URL to your Railway/Render backend URL.
// Locally it falls back to http://localhost:8000
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for easy data access
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
