// src/redux/reducers/authReducer.js
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
  CLEAR_AUTH_MESSAGE, CLEAR_AUTH_ERROR,
  GET_PROFILE_REQUEST // Ensure GET_PROFILE_REQUEST is imported
} from '../actions/types';

const initialState = {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    message: null,
    emailVerificationPending: false,
};

const authReducer = (state = initialState, action) => {
    switch (action.type) {
      case REGISTER_SUCCESS:
        return {
          ...state,
          loading: false,
          emailVerificationPending: true,
          message: action.payload,
          error: null,
        };

      case LOGIN_SUCCESS:
        return {
          ...state,
          isAuthenticated: true,
          user: action.payload.user,
          loading: false,
          message: action.payload.message || 'Successfully logged in!',
          error: null,
          emailVerificationPending: false,
        };

      case REGISTER_FAILURE:
      case LOGIN_FAILURE:
      case FORGOT_PASSWORD_FAILURE:
      case RESET_PASSWORD_FAILURE:
      case VERIFY_EMAIL_FAILURE:
      case RESEND_VERIFICATION_FAILURE:
      case UPDATE_PROFILE_FAILURE: // Ensure this is here
        return {
          ...state,
          error: action.payload,
          loading: false,
          message: null,
        };

      case FORGOT_PASSWORD_SUCCESS:
      case RESET_PASSWORD_SUCCESS:
      case VERIFY_EMAIL_SUCCESS:
      case RESEND_VERIFICATION_SUCCESS:
        return {
          ...state,
          loading: false,
          message: action.payload,
          error: null,
        };

      case VERIFY_EMAIL_REQUEST:
      case RESEND_VERIFICATION_REQUEST:
      case UPDATE_PROFILE_REQUEST:
      case GET_PROFILE_REQUEST: // Added this as a loading state for profile fetch
        return {
            ...state,
            loading: true,
            error: null,
            message: null,
        };

      case USER_PROFILE_SUCCESS:
        return {
          ...state,
          user: action.payload,
          isAuthenticated: true, // IMPORTANT: Set isAuthenticated to true here
          loading: false,
          error: null,
        };
      case USER_PROFILE_FAILURE:
        return {
          ...state,
          error: action.payload,
          loading: false,
          user: null,
          isAuthenticated: false, // Ensure this is false on profile fetch failure
        };

      case UPDATE_PROFILE_SUCCESS:
        return {
          ...state,
          loading: false,
          user: { ...state.user, ...action.payload },
          message: "Profile updated successfully!"
        };

      case LOGOUT_USER:
        return {
          ...initialState,
          loading: false,
        };

      case CLEAR_AUTH_MESSAGE:
        return { ...state, message: null };
      case CLEAR_AUTH_ERROR:
        return { ...state, error: null };

      default:
        return state;
    }
};

export default authReducer;