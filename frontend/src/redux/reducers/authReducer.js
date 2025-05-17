// authReducer.js

const initialState = {
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null,
    message: null,
  };
  
  const authReducer = (state = initialState, action) => {
    switch (action.type) {
      case 'REGISTER_SUCCESS':
      case 'LOGIN_SUCCESS':
        return {
          ...state,
          isAuthenticated: true,
          user: action.payload.user,
          loading: false,
          message: action.payload.message || 'Successfully logged in!',
        };
    
      case 'REGISTER_FAILURE':
      case 'LOGIN_FAILURE':
      case 'FORGOT_PASSWORD_FAILURE':
      case 'RESET_PASSWORD_FAILURE':
        return {
          ...state,
          error: action.payload,
          loading: false,
        };
      case 'FORGOT_PASSWORD_SUCCESS':
        return {
          ...state,
          message: action.payload.message,
        };
      case 'RESET_PASSWORD_SUCCESS':
        return {
          ...state,
          message: 'Password reset successfully.',
        };
      case 'USER_PROFILE_SUCCESS':
        return {
          ...state,
          user: action.payload,
          loading: false,
        };
      case 'USER_PROFILE_FAILURE':
        return {
          ...state,
          error: action.payload,
          loading: false,
        };
      // ...other cases
      case 'GET_PROFILE_REQUEST':
        return { ...state, loading: true, error: null};
      case 'GET_PROFILE_SUCCESS':
        return { ...state, loading:false, userProfile: action.payload };
      case 'GET_PROFILE_FAILURE':
        return {...state, loading: false, error: action.payload}
      case 'CLEAR_PROFILE_MESSAGE':
        return { ...state, message: null };
      case 'CLEAR_PROFILE_ERROR':
        return { ...state, error: null };
        
      default:
        return state;
    }
  };
  
  export default authReducer;
  