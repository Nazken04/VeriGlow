import { toast } from 'react-toastify';
import {
  registerUserAPI,
  loginUserAPI,
  forgotPasswordAPI,
  resetPasswordAPI,
  getUserProfileAPI,
  updateUserProfileAPI,
  verifyEmailAPI,
  resendVerificationEmailAPI
} from '../../api/auth';
import {
  LOGOUT_USER,
  REGISTER_SUCCESS, REGISTER_FAILURE,
  LOGIN_SUCCESS, LOGIN_FAILURE,
  FORGOT_PASSWORD_SUCCESS, FORGOT_PASSWORD_FAILURE,
  RESET_PASSWORD_SUCCESS, RESET_PASSWORD_FAILURE,
  UPDATE_PROFILE_REQUEST, UPDATE_PROFILE_SUCCESS, UPDATE_PROFILE_FAILURE,
  USER_PROFILE_SUCCESS, USER_PROFILE_FAILURE,
  VERIFY_EMAIL_REQUEST, VERIFY_EMAIL_SUCCESS, VERIFY_EMAIL_FAILURE,
  RESEND_VERIFICATION_REQUEST, RESEND_VERIFICATION_SUCCESS, RESEND_VERIFICATION_FAILURE,
  CLEAR_AUTH_ERROR, CLEAR_AUTH_MESSAGE,
  GET_PROFILE_REQUEST
} from './types';

export const registerUser = (userData) => {
  return async (dispatch) => {
    try {
      const response = await registerUserAPI(userData);
      dispatch({ type: REGISTER_SUCCESS, payload: response.message });
      toast.success(response.message);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed! Please try again.';
      dispatch({ type: REGISTER_FAILURE, payload: errorMessage });
      toast.error(errorMessage);
    }
  };
};

export const logoutUser = () => (dispatch) => {
  localStorage.removeItem('token');
  dispatch({ type: LOGOUT_USER });
  toast.info('You have been logged out.');
};

export const loginUser = (userData) => {
  return async (dispatch) => {
    try {
      const response = await loginUserAPI(userData);
      localStorage.setItem('token', response.token);
      dispatch({ type: LOGIN_SUCCESS, payload: response });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed! Please check your credentials.';
      dispatch({ type: LOGIN_FAILURE, payload: errorMessage });
      toast.error(errorMessage);
      throw err;
    }
  };
};

export const forgotPassword = (email) => {
  return async (dispatch) => {
    try {
      const response = await forgotPasswordAPI(email);
      dispatch({ type: FORGOT_PASSWORD_SUCCESS, payload: response.message });
      toast.success(response.message || 'Password reset link sent to your email!');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Password reset failed! Please try again.';
      dispatch({ type: FORGOT_PASSWORD_FAILURE, payload: errorMessage });
      toast.error(errorMessage);
    }
  };
};

export const resetPassword = (token, newPassword) => {
  return async (dispatch) => {
    try {
      const response = await resetPasswordAPI(token, newPassword);
      dispatch({ type: RESET_PASSWORD_SUCCESS, payload: response.message });
      toast.success(response.message || 'Password reset successfully!');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Password reset failed! Please try again.';
      dispatch({ type: RESET_PASSWORD_FAILURE, payload: errorMessage });
      toast.error(errorMessage);
    }
  };
};

export const updateUserProfile = (updatedData) => {
  return async (dispatch) => {
    dispatch({ type: UPDATE_PROFILE_REQUEST });
    try {
      const response = await updateUserProfileAPI(updatedData);
      dispatch({ type: UPDATE_PROFILE_SUCCESS, payload: response });
      toast.success("Profile updated successfully!");
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "An error occurred.";
      dispatch({ type: UPDATE_PROFILE_FAILURE, payload: errorMessage });
      toast.error(errorMessage);
    }
  };
};

export const getUserProfile = () => {
  return async (dispatch) => {
    dispatch({ type: GET_PROFILE_REQUEST });
    const token = localStorage.getItem('token');
    if (!token) {
      dispatch({ type: USER_PROFILE_FAILURE, payload: 'Unauthorized, please log in.' });
      toast.error('Unauthorized, please log in.');
      return;
    }

    try {
      const response = await getUserProfileAPI();
      dispatch({ type: USER_PROFILE_SUCCESS, payload: response });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load user profile.';
      dispatch({ type: USER_PROFILE_FAILURE, payload: errorMessage });
      if (err.response?.status === 401 || err.response?.status === 403) {
         localStorage.removeItem('token');
         dispatch({ type: LOGOUT_USER });
         toast.error("Your session has expired. Please log in again.");
      } else {
         toast.error(errorMessage);
      }
    }
  };
};

export const verifyEmail = (token) => {
  return async (dispatch) => {
    dispatch({ type: VERIFY_EMAIL_REQUEST });
    try {
      const response = await verifyEmailAPI(token);
      dispatch({ type: VERIFY_EMAIL_SUCCESS, payload: response.message });
      toast.success(response.message);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Email verification failed. Invalid or expired token.';
      dispatch({ type: VERIFY_EMAIL_FAILURE, payload: errorMessage });
      toast.error(errorMessage);
    }
  };
};

export const resendVerificationEmail = (email) => {
  return async (dispatch) => {
    dispatch({ type: RESEND_VERIFICATION_REQUEST });
    try {
      const response = await resendVerificationEmailAPI(email);
      dispatch({ type: RESEND_VERIFICATION_SUCCESS, payload: response.message });
      toast.success(response.message);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to resend verification email. Please try again.';
      dispatch({ type: RESEND_VERIFICATION_FAILURE, payload: errorMessage });
      toast.error(errorMessage);
    }
  };
};

export const clearAuthMessage = () => ({ type: CLEAR_AUTH_MESSAGE });
export const clearAuthError = () => ({ type: CLEAR_AUTH_ERROR });