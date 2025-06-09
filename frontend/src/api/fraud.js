import axios from 'axios';

export const reportFraudAPI = async (productId, fraudReason, scanCount, locationDetails) => {
  try {
    const response = await axios.post('/api/fraud/report', {
      productId,
      fraudReason,
      scanCount,
      locationDetails
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
