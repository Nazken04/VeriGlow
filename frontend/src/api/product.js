// import axios from 'axios';

// // Base URL from environment variable
// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// // Register a product with Authorization header
// export const registerProductAPI = async (productData) => {
//   try {
//     const token = localStorage.getItem('token');
//     if (!token) throw new Error('Authentication required');

//     const config = {
//       headers: {
//         'Authorization': `Bearer ${token}`,
//       },
//     };

//     const response = await axios.post(
//       `${API_BASE_URL}/api/products/register`, 
//       productData, 
//       config
//     );
    
//     return {
//       success: true,
//       data: response.data
//     };
//   } catch (error) {
//     return {
//       success: false,
//       error: error.response?.data?.message || error.message
//     };
//   }
// };

// const getAuthConfig = () => {
//   const token = localStorage.getItem('token');
//   if (!token) throw new Error('Authentication required');
//   return {
//     headers: {
//       Authorization: `Bearer ${token}`
//     }
//   };
// };

// // Manufacturer Products Grouped by Batch (Paginated)
// export const fetchManufacturerProductsAPI = async (page = 1, limit = 10) => {
//   try {
//     const config = getAuthConfig();
//     const response = await axios.get(
//       `${API_BASE_URL}/api/products/manufacturer/products?page=${page}&limit=${limit}`, 
//       config
//     );
//     return { success: true, data: response.data };
//   } catch (error) {
//     return { success: false, error: error.response?.data?.message || error.message };
//   }
// };

// // Verify a product
// export const verifyProductAPI = async (qrCode) => {
//   try {
//     const response = await axios.post(`${API_BASE_URL}/api/products/verify`, { qr_code: qrCode });
//     return response.data;
//   } catch (error) {
//     throw error.response.data;
//   }
// };



// // Get manufacturer reports (for fraud detection)
// export const getManufacturerReportsAPI = async () => {
//   try {
//     const response = await axios.get(`${API_BASE_URL}/products/manufacturer/reports`);
//     // Expected response.data: { reports: [ { _id, product_name, batch_number, counterfeitReports: [] }, ... ] }
//     return response.data;
//   } catch (error) {
//     console.error("Error fetching manufacturer reports:", error);
//     // Throw a more specific error or the error data from the response
//     throw error.response?.data || new Error(error.message || 'Failed to fetch manufacturer reports');
//   }
// };

// /**
//  * Fetches detailed information for a specific product.
//  * Endpoint: GET /api/products/{productId}/details (This is an assumed endpoint structure)
//  * @param {string} productId - The ID of the product to fetch details for.
//  */
// export const getProductDetailsAPI = async (productId) => {
//   try {
//     // IMPORTANT: Replace `${API_BASE_URL}/products/${productId}/details` with your actual endpoint for product details.
//     // This endpoint should return an object containing:
//     // { _id, product_name, batch_number, ingredients, manufacturing_date (timestamp), expiry_date (timestamp), counterfeitReports: [] }
//     // It might be nested under a "product" key, e.g., { product: { ... } }
//     const response = await axios.get(`${API_BASE_URL}/products/${productId}/details`); // Example endpoint
//     return response.data; // This should be the product object or { product: productObject }
//   } catch (error) {
//     console.error(`Error fetching product details for ${productId}:`, error);
//     throw error.response?.data || new Error(error.message || 'Failed to fetch product details');
//   }
// };

// /**
//  * Reports fraud for a product. (As per your initial snippet)
//  * Endpoint: POST /api/fraud/report
//  */
// export const reportFraudAPI = async (productId, fraudReason, scanCount, locationDetails) => {
//   try {
//     const response = await axios.post(`${API_BASE_URL}/fraud/report`, {
//       productId,      // Ensure backend expects 'productId'
//       fraudReason,    // Ensure backend expects 'fraudReason'
//       scanCount,      // Ensure backend expects 'scanCount'
//       locationDetails // Ensure backend expects 'locationDetails' (e.g., string or object)
//     });
//     return response.data; // Expected: success message or report confirmation
//   } catch (error) {
//     console.error("Error reporting fraud:", error);
//     throw error.response?.data || new Error(error.message || 'Failed to report fraud');
//   }
// };
// export const fetchProductsByBatchAPI = async (batchNumber) => { // This is needed for the PDF
//     try {
//         const config = getAuthConfig();
//         const { data } = await axios.get(`${API_BASE_URL}/api/products/batch/${batchNumber}`, config);
//         return { success: true, data };
//     } catch (error) {
//         return { success: false, error: error.response?.data?.message || error.message };
//     }
// };


import axios from 'axios';

// Base URL from environment variable
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    // Throwing an error here is fine if the function's purpose is strictly to get config or fail.
    // Alternatively, it could return null/undefined and let the caller handle it.
    // For now, keeping as is, as calling functions handle this error.
    throw new Error('Authentication token not found. Please log in.');
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// Register a product with Authorization header
export const registerProductAPI = async (productData) => {
  try {
    const config = getAuthConfig(); // Throws if no token
    const response = await axios.post(
      `${API_BASE_URL}/api/products/register`,
      productData,
      config
    );
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to register product'
    };
  }
};

// Manufacturer Products Grouped by Batch (Paginated)
export const fetchManufacturerProductsAPI = async (page = 1, limit = 10) => {
  try {
    const config = getAuthConfig(); // Throws if no token
    const response = await axios.get(
      `${API_BASE_URL}/api/products/manufacturer/products?page=${page}&limit=${limit}`,
      config
    );
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch manufacturer products'
    };
  }
};

// Verify a product
export const verifyProductAPI = async (qrCode) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/products/verify`, { qr_code: qrCode });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to verify product'
    };
  }
};

// Get product details by ID
export const getProductDetailsAPI = async (productId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/products/${productId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch product details'
    };
  }
};

// Get manufacturer reports (for fraud detection)
// The prompt mentioned http://localhost:5000/api/products/manufacturer/reports with this file.
// This function already uses that endpoint structure via API_BASE_URL.
export const getManufacturerReportsAPI = async () => {
  try {
    // This endpoint likely requires authentication to see manufacturer-specific reports
    const config = getAuthConfig(); // Throws if no token
    const response = await axios.get(
      `${API_BASE_URL}/api/products/manufacturer/reports`,
      config // Added auth config
    );
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch manufacturer reports'
    };
  }
};
export const fetchProductsByBatchAPI = async (batchNumber) => { // This is needed for the PDF
    try {
        const config = getAuthConfig();
        const { data } = await axios.get(`${API_BASE_URL}/api/products/batch/${batchNumber}`, config);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || error.message };
    }
};