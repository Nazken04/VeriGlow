// src/redux/reducers/fraudReportsReducers.js
// This file defines how the fraud reports state changes based on actions.

import { // Action types imported from the actions file
  FETCH_FRAUD_REPORTS_REQUEST,
  FETCH_FRAUD_REPORTS_SUCCESS,
  FETCH_FRAUD_REPORTS_FAILURE,
} from '../actions/fraudReportsActions';

// Define the initial state for fraud reports
const initialState = {
  allReportsWithDetails: [], // This array will hold your fetched reports data
  loading: false, // Indicates if data is currently being fetched
  error: null,    // Stores any error messages during fetching
};

// The reducer function: takes current state and an action, returns new state
const fraudReportsReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_FRAUD_REPORTS_REQUEST:
      return {
        ...state,
        loading: true, // Set loading to true
        error: null,   // Clear any previous errors
      };
    case FETCH_FRAUD_REPORTS_SUCCESS:
      return {
        ...state,
        loading: false, // Set loading to false
        allReportsWithDetails: action.payload, // Update with fetched data
        error: null,    // Clear any errors on success
      };
    case FETCH_FRAUD_REPORTS_FAILURE:
      return {
        ...state,
        loading: false, // Set loading to false
        error: action.payload, // Store the error message
        allReportsWithDetails: [], // Clear data on failure
      };
    default:
      return state; // Return current state for any other actions (important)
  }
};

export default fraudReportsReducer; // Crucial: This must be the default export of this file