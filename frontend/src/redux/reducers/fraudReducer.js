// src/redux/reducers/fraudReducer.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  reports: [], // Renamed from fraudReports to reports for clarity, or keep if 'fraudReports' means something specific
  lastReported: null, // Example: To store the successfully submitted report data
  loading: false, // Added loading state for reporting
  error: null,
};

const fraudSlice = createSlice({
  name: 'fraud',
  initialState,
  reducers: {
    // Optional: Add a pending/loading action if you want to track loading state for reporting
    reportFraudPending: (state) => {
      state.loading = true;
      state.error = null;
    },
    reportFraudSuccess: (state, action) => {
      // state.reports.push(action.payload); // If you want to keep a list of all submitted reports
      state.lastReported = action.payload; // Store the latest successful report data
      state.loading = false;
      state.error = null;
    },
    reportFraudFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload; // action.payload should be the error message
    },
    clearFraudError: (state) => { // Utility to clear error
      state.error = null;
    }
  },
});

// Exporting reportFraudPending if added
export const { reportFraudPending, reportFraudSuccess, reportFraudFailure, clearFraudError } = fraudSlice.actions;
export default fraudSlice.reducer;