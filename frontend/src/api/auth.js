import axios from 'axios';
import BASE_URL from '../config'; 

const API = axios.create({ baseURL: BASE_URL });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const registerUserAPI = async (userData) => {
  try {
    const response = await API.post('/api/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const loginUserAPI = async (userData) => {
  try {
    const response = await API.post('/api/auth/login', userData);
    return response.data; 
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const forgotPasswordAPI = async (email) => {
  try {
    const response = await API.post('/api/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const resetPasswordAPI = async (token, newPassword) => {
  try {
    const response = await API.post(`/api/auth/reset-password/${token}`, { newPassword });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getUserProfileAPI = async () => {
  try {
    const response = await API.get('/api/auth/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateUserProfileAPI = async (updatedData) => {
  try {
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

export const verifyEmailAPI = (token) => API.get(`/api/auth/verify-email/${token}`);
export const resendVerificationEmailAPI = (email) => API.post('/api/auth/resend-verification', { email });