// src/redux/actions/types.js

// Auth related types
export const LOGOUT_USER = 'LOGOUT_USER';

// Auth related types (can be added if not present)
export const REGISTER_SUCCESS = 'REGISTER_SUCCESS';
export const REGISTER_FAILURE = 'REGISTER_FAILURE';
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAILURE = 'LOGIN_FAILURE';
export const FORGOT_PASSWORD_SUCCESS = 'FORGOT_PASSWORD_SUCCESS';
export const FORGOT_PASSWORD_FAILURE = 'FORGOT_PASSWORD_FAILURE';
export const RESET_PASSWORD_SUCCESS = 'RESET_PASSWORD_SUCCESS';
export const RESET_PASSWORD_FAILURE = 'RESET_PASSWORD_FAILURE';

// Profile related types
export const UPDATE_PROFILE_REQUEST = 'UPDATE_PROFILE_REQUEST';
export const UPDATE_PROFILE_SUCCESS = 'UPDATE_PROFILE_SUCCESS';
export const UPDATE_PROFILE_FAILURE = 'UPDATE_PROFILE_FAILURE';
export const USER_PROFILE_SUCCESS = 'USER_PROFILE_SUCCESS';
export const USER_PROFILE_FAILURE = 'USER_PROFILE_FAILURE';
export const GET_PROFILE_REQUEST = 'GET_PROFILE_REQUEST'; // Added, as it was in authReducer

// NEW: Email Verification Types
export const VERIFY_EMAIL_REQUEST = 'VERIFY_EMAIL_REQUEST'; 
export const VERIFY_EMAIL_SUCCESS = 'VERIFY_EMAIL_SUCCESS';
export const VERIFY_EMAIL_FAILURE = 'VERIFY_EMAIL_FAILURE';

// NEW: Resend Verification Types
export const RESEND_VERIFICATION_REQUEST = 'RESEND_VERIFICATION_REQUEST';
export const RESEND_VERIFICATION_SUCCESS = 'RESEND_VERIFICATION_SUCCESS';
export const RESEND_VERIFICATION_FAILURE = 'RESEND_VERIFICATION_FAILURE';

// Clear messages/errors
export const CLEAR_AUTH_MESSAGE = 'CLEAR_AUTH_MESSAGE'; 
export const CLEAR_AUTH_ERROR = 'CLEAR_AUTH_ERROR';

// Product related types (based on your error logs)
// Your error message mentioned GET_PRODUCTS_FAIL, which usually comes with SUCCESS/REQUEST
export const GET_PRODUCTS_REQUEST = 'GET_PRODUCTS_REQUEST';
export const GET_PRODUCTS_SUCCESS = 'GET_PRODUCTS_SUCCESS';
export const GET_PRODUCTS_FAIL = 'GET_PRODUCTS_FAIL'; // Keeping the specific name from your error

// Your error message mentioned PRODUCT_REGISTER_FAIL, which usually comes with SUCCESS/REQUEST
export const PRODUCT_REGISTER_REQUEST = 'PRODUCT_REGISTER_REQUEST';
export const PRODUCT_REGISTER_SUCCESS = 'PRODUCT_REGISTER_SUCCESS';
export const PRODUCT_REGISTER_FAIL = 'PRODUCT_REGISTER_FAIL'; // Keeping the specific name from your error

// Add any other types you might have that were not in the error list
// e.g., for fraud reports, etc.