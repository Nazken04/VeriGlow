import axios from 'axios';
import BASE_URL from '../config'; // Import the BASE_URL

// Register user
export const registerUserAPI = async (userData) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, userData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Login user
export const loginUserAPI = async (userData) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, userData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Forgot password
export const forgotPasswordAPI = async (email) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/forgot-password`, { email });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Reset password
export const resetPasswordAPI = async (token, newPassword) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/reset-password/${token}`, { newPassword });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Get user profile
export const getUserProfileAPI = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Update user profile
export const updateUserProfileAPI = async (updatedData) => {
  const token = localStorage.getItem('token');
  try {
    const response = await axios.put(`${BASE_URL}/api/auth/profile`, updatedData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("API Error:", error); // Log the full error object for debugging

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Response Data:", error.response.data);
      console.error("Response Status:", error.response.status);
      throw error.response.data; // Re-throw the error data from the server
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.error("No response received:", error.request);
      throw new Error("No response received from the server."); 
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
      throw new Error("Error setting up the request.");
    }
  }
};
