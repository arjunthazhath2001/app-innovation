// src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.token = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth services
export const register = async (userData) => {
  const { firstname, lastname, email, password, role, enable2fa } = userData;
  return api.post(`/${role}/signup`, { firstname, lastname, email, password, enable2fa });
};

export const verifyOtp = async (data) => {
  const { email, otp, role } = data;
  return api.post(`/${role}/verify-otp`, { email, otp });
};

export const login = async (credentials) => {
  const { email, password, role } = credentials;
  return api.post(`/${role}/signin`, { email, password });
};

export const verifyLoginOtp = async (data) => {
  const { email, otp, role } = data;
  return api.post(`/${role}/verify-login-otp`, { email, otp });
};

export const getProfile = async (role) => {
  return api.get(`/${role}/profile`);
};

export const getUsersList = async () => {
  return api.get('/admin/users');
};

export default api;