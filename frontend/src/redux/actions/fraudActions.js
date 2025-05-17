// src/redux/actions/fraudActions.js
import { reportFraudAPI } from '../../api/fraud'; // Adjusted path to use the centralized API function
import { reportFraudSuccess, reportFraudFailure } from '../reducers/fraudReducer';

export const reportFraud = (productId, fraudReason, scanCount, locationDetails) => async (dispatch) => {
  try {
    // Using the centralized reportFraudAPI
    const response = await reportFraudAPI(productId, fraudReason, scanCount, locationDetails);

    if (response.success) {
      // Dispatch success with the data returned from the API
      // Adjust payload if your reducer expects something specific from response.data
      dispatch(reportFraudSuccess(response.data));
    } else {
      // Dispatch failure with the error message from the API response
      throw new Error(response.error || 'Fraud report failed');
    }
  } catch (error) {
    // Catch errors from the API call itself (e.g., network error) or the re-thrown error
    console.error('Fraud Reporting Error (Redux Action):', error);
    dispatch(reportFraudFailure(error.message || 'An unexpected error occurred while reporting fraud.'));
  }
};