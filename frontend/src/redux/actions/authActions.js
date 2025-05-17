import { toast } from 'react-toastify'; // For displaying success/error notifications
import BASE_URL from '../../config'; // Import the BASE_URL from config
import { registerUserAPI, loginUserAPI, forgotPasswordAPI, resetPasswordAPI, getUserProfileAPI, updateUserProfileAPI } from '../../api/auth'; // Import API functions
import {
  LOGOUT_USER // Make sure this type is defined and imported
} from './types';
// Action for registering a new user
export const registerUser = (userData, navigate) => {
  return async (dispatch) => {
    try {
      const response = await registerUserAPI(userData);
      dispatch({ type: 'REGISTER_SUCCESS', payload: response });
      toast.success('Registration successful!');
      navigate('/login');
    } catch (err) {
      dispatch({ type: 'REGISTER_FAILURE', payload: err });
      toast.error(err.message || 'Registration failed! Please try again.');
    }
  };
};
export const logoutUser = () => (dispatch) => {
  // 1. Remove the token from localStorage
  localStorage.removeItem('token');

  // 2. Dispatch the LOGOUT_USER action to update the Redux state
  dispatch({ type: LOGOUT_USER });

  // 3. Optionally, display a success message
  toast.info('You have been logged out.'); // Using info for logout, success is also fine

  // Note: Navigation to '/login' will be handled by the Navbar component
  // or by a protected route wrapper that redirects if not authenticated.
  // If you want to force navigation from here, you'd need to pass `navigate`
  // similar to how you do in loginUser, but it's cleaner if components handle navigation.
};
// Action for logging in an existing user
export const loginUser = (userData, navigate) => {
  return async (dispatch) => {
    try {
      const response = await loginUserAPI(userData);
      localStorage.setItem('token', response.token); // Store token in localStorage
      dispatch({ type: 'LOGIN_SUCCESS', payload: response });
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      dispatch({ type: 'LOGIN_FAILURE', payload: err });
      toast.error(err.message || 'Login failed! Please check your credentials.');
    }
  };
};

// Action for requesting a password reset
export const forgotPassword = (email) => {
  return async (dispatch) => {
    try {
      const response = await forgotPasswordAPI(email);
      dispatch({ type: 'FORGOT_PASSWORD_SUCCESS', payload: response });
      toast.success('Password reset link sent to your email!');
    } catch (err) {
      dispatch({ type: 'FORGOT_PASSWORD_FAILURE', payload: err });
      toast.error(err.message || 'Password reset failed! Please try again.');
    }
  };
};

// Action for resetting the user's password
export const resetPassword = (token, newPassword) => {
  return async (dispatch) => {
    try {
      const response = await resetPasswordAPI(token, newPassword);
      dispatch({ type: 'RESET_PASSWORD_SUCCESS', payload: response });
      toast.success('Password reset successfully!');
    } catch (err) {
      dispatch({ type: 'RESET_PASSWORD_FAILURE', payload: err });
      toast.error(err.message || 'Password reset failed! Please try again.');
    }
  };
};

// Action for updating the user's profile
// Action for updating the user's profile
export const updateUserProfile = (updatedData) => {
  return async (dispatch) => {
    dispatch({ type: 'UPDATE_PROFILE_REQUEST' });
    try {
      const response = await updateUserProfileAPI(updatedData);
      dispatch({ type: 'UPDATE_PROFILE_SUCCESS', payload: response.data });  // Make sure this uses response.data
      toast.success("Profile updated successfully!"); // Display success toast

    } catch (error) {
      dispatch({ type: 'UPDATE_PROFILE_FAILURE', payload: error.message || "An error occurred." }); // Provide a default error message
      toast.error(error.message || "An error occurred."); // Display error toast
    }
  };
};




// Action for getting the current user's profile (after login)
export const getUserProfile = () => {
  return async (dispatch) => {
    const token = localStorage.getItem('token'); // Get token from localStorage
    if (!token) {
      dispatch({ type: 'USER_PROFILE_FAILURE', payload: 'Unauthorized, please log in.' });
      toast.error('Unauthorized, please log in.');
      return;
    }

    try {
      const response = await getUserProfileAPI(token);
      dispatch({ type: 'USER_PROFILE_SUCCESS', payload: response });
    } catch (err) {
      dispatch({ type: 'USER_PROFILE_FAILURE', payload: err });
      toast.error('Failed to load user profile.');
    }
  };
};
