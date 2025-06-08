// src/redux/store.js
// This file configures and creates the Redux store.

import { configureStore } from '@reduxjs/toolkit'; // Using Redux Toolkit's configureStore

// Import your reducer functions.
// IMPORTANT: Ensure these paths and names match your actual file structure and default exports.
import authReducer from './reducers/authReducer'; // Assuming this reducer is in './reducers/authReducer.js'
import productReducer from './reducers/productReducer'; // Assuming this reducer is in './reducers/productReducer.js'
import fraudReportsReducer from './reducers/fraudReportsReducers'; // CORRECT: Importing from './reducers/fraudReportsReducers.js'

// Configure the Redux store
const store = configureStore({
  reducer: {
    // Assign each reducer to a specific key in the Redux state.
    // The 'fraud' key in your previous store.js was problematic.
    // We'll use 'reports' to align with 'allReportsWithDetails' in Dashboard/FraudReports.
    auth: authReducer,
    product: productReducer,
    reports: fraudReportsReducer, // This is the key for accessing fraud reports state (state.reports)
  },
  // Redux Toolkit automatically includes Redux Thunk and DevTools Extension.
  // So, no need for applyMiddleware or composeWithDevTools explicitly with configureStore.
});

export default store; // Export the configured Redux store