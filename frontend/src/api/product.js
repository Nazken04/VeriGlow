import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found. Please log in.');
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

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

export const fetchManufacturerProductsAPI = async (page = 1, limit = 10) => {
  try {
    const config = getAuthConfig(); 
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

export const getManufacturerReportsAPI = async () => {
  try {
    const config = getAuthConfig(); // Throws if no token
    const response = await axios.get(
      `${API_BASE_URL}/api/products/manufacturer/reports`,
      config 
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