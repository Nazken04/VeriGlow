import {
  PRODUCT_REGISTER_REQUEST,
  PRODUCT_REGISTER_SUCCESS,
  PRODUCT_REGISTER_FAIL,
  GET_PRODUCTS_REQUEST,
  GET_PRODUCTS_SUCCESS,
  GET_PRODUCTS_FAIL
} from './types'; 
import { 
    registerProductAPI, 
    fetchManufacturerProductsAPI,
    fetchProductsByBatchAPI as fetchProductsByBatchAPICall 
} from '../../api/product'; 


export const registerProduct = (productData) => async (dispatch) => {
  try {
    dispatch({ type: PRODUCT_REGISTER_REQUEST });

    const result = await registerProductAPI(productData); 
    
    if (result.success) {
      dispatch({
        type: PRODUCT_REGISTER_SUCCESS,
        payload: result.data
      });
      return { success: true, data: result.data };
    } else {
      dispatch({
        type: PRODUCT_REGISTER_FAIL,
        payload: result.error
      });
      return { success: false, error: result.error };
    }
  } catch (error) {
    const message = error.message || "An unexpected error occurred during product registration.";
    dispatch({
      type: PRODUCT_REGISTER_FAIL,
      payload: message
    });
    return { success: false, error: message };
  }
};


export const fetchManufacturerProducts = (page = 1, limit = 10) => async (dispatch) => {
  try {
    dispatch({ type: GET_PRODUCTS_REQUEST });

    const result = await fetchManufacturerProductsAPI(page, limit); 

    if (result.success) {
      dispatch({
        type: GET_PRODUCTS_SUCCESS,
        payload: result.data 
      });
    } else {
      dispatch({
        type: GET_PRODUCTS_FAIL,
        payload: result.error
      });
    }
  } catch (error) {
    const message = error.message || "Failed to fetch manufacturer products.";
    console.error('fetchManufacturerProducts Action Error:', error); // Debug log
    dispatch({
      type: GET_PRODUCTS_FAIL,
      payload: message
    });
  }
};


export { fetchProductsByBatchAPICall as fetchProductsByBatchAPI };