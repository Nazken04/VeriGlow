import {
  // These types should be defined in './types.js' relative to this file
  PRODUCT_REGISTER_REQUEST,
  PRODUCT_REGISTER_SUCCESS,
  PRODUCT_REGISTER_FAIL,
  GET_PRODUCTS_REQUEST,
  GET_PRODUCTS_SUCCESS,
  GET_PRODUCTS_FAIL
} from './types'; // This path should be correct if types.js is in the same 'actions' folder

// Assuming your API functions are correctly imported from a separate API utility file
// The path '../../api/product' suggests your 'api' folder is two levels up from 'redux/actions'
// If 'api' is at the root of 'src', then 'src/api/product.js' makes sense.
// If 'api' is inside 'redux', then './../api/product.js' or similar.
// Double-check this path based on your actual folder structure.
// For now, I'll assume '../../api/product' is correct as per your code.
import { 
    registerProductAPI, 
    fetchManufacturerProductsAPI,
    // You'll also need fetchProductsByBatchAPI for the PDF generation
    // Ensure it's defined in '../../api/product.js' and exported
    fetchProductsByBatchAPI as fetchProductsByBatchAPICall // Renaming to avoid conflict if you had local one
} from '../../api/product'; // Adjust this path if necessary


export const registerProduct = (productData) => async (dispatch) => {
  try {
    dispatch({ type: PRODUCT_REGISTER_REQUEST });

    const result = await registerProductAPI(productData); // From ../../api/product.js
    
    if (result.success) {
      dispatch({
        type: PRODUCT_REGISTER_SUCCESS,
        payload: result.data
      });
      // Optionally, you can return a promise or result for the component
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
    // console.log('Making API call for summarized batches...'); // Debug log

    const result = await fetchManufacturerProductsAPI(page, limit); // From ../../api/product.js
    // console.log('API Response (summarized batches):', result); // Debug log

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

// Make sure you also EXPORT the function needed for PDF generation
// This assumes fetchProductsByBatchAPICall (which is fetchProductsByBatchAPI from your api/product.js)
// is what you intend to use.
// If you have a specific action creator for it, define that.
// For now, I'll just re-export the API call if it's directly used in the component,
// or you'd wrap it in an action creator if it needs to dispatch to Redux state.
// Based on previous full code, ManufacturerProducts.js directly called fetchProductsByBatchAPI.
export { fetchProductsByBatchAPICall as fetchProductsByBatchAPI };