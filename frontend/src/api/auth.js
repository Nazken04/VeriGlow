import axios from 'axios';
import BASE_URL from '../config'; // Import the BASE_URL

// 1. Define the API instance here, at the top of the file
const API = axios.create({ baseURL: BASE_URL });

// 2. Add the request interceptor to the API instance
// This automatically attaches the token to all outgoing requests made via this API instance.
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Register user
export const registerUserAPI = async (userData) => {
  try {
    // Corrected path: /api/auth/register
    const response = await API.post('/api/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Login user
export const loginUserAPI = async (userData) => {
  try {
    const response = await API.post('/api/auth/login', userData);
    return response.data; // <--- IMPORTANT: This function *returns* response.data
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Forgot password
export const forgotPasswordAPI = async (email) => {
  try {
    // Corrected path: /api/auth/forgot-password
    const response = await API.post('/api/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Reset password
export const resetPasswordAPI = async (token, newPassword) => {
  try {
    // Corrected path: /api/auth/reset-password/
    const response = await API.post(`/api/auth/reset-password/${token}`, { newPassword });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get user profile
export const getUserProfileAPI = async () => {
  try {
    // Corrected path: /api/auth/profile
    const response = await API.get('/api/auth/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update user profile
export const updateUserProfileAPI = async (updatedData) => {
  try {
    // Corrected path: /api/auth/profile
    const response = await API.put('/api/auth/profile', updatedData);
    return response.data;
  } catch (error) {
    console.error("API Error:", error); 

    if (error.response) {
      console.error("Response Data:", error.response.data);
      console.error("Response Status:", error.response.status);
      throw error.response.data; 
    } else if (error.request) {
      console.error("No response received:", error.request);
      throw new Error("No response received from the server."); 
    } else {
      console.error('Error setting up request:', error.message);
      throw new Error("Error setting up the request.");
    }
  }
};

// Corrected paths for verification APIs as well
export const verifyEmailAPI = (token) => API.get(`/api/auth/verify-email/${token}`);
export const resendVerificationEmailAPI = (email) => API.post('/api/auth/resend-verification', { email });