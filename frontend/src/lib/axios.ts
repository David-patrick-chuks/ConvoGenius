import axios from 'axios';

// Backend API base URL - adjust this based on your backend deployment
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// Create axios instance for backend API calls
export const backendApi = axios.create({
  baseURL: `${BACKEND_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add wallet address header
backendApi.interceptors.request.use(
  (config) => {
    // The wallet address will be added by individual API routes
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
backendApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Backend API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default backendApi;
