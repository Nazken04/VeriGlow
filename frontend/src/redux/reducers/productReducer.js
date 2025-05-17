// src/redux/reducers/productReducer.js - (Your provided code, looks fine)
import {
  PRODUCT_REGISTER_REQUEST,
  PRODUCT_REGISTER_SUCCESS,
  PRODUCT_REGISTER_FAIL,
  GET_PRODUCTS_REQUEST,
  GET_PRODUCTS_SUCCESS,
  GET_PRODUCTS_FAIL
} from '../actions/types'; // Correctly imports from types.js

const initialState = {
  products: [],
  batches: [],
  page: 1,
  pages: 1,
  totalBatches: 0,
  loading: false,
  error: null,
  registerLoading: false,
  registerError: null,
  registerSuccess: false
};

const productReducer = (state = initialState, action) => {
  switch (action.type) {
    case PRODUCT_REGISTER_REQUEST:
      return {
        ...state,
        registerLoading: true,
        registerError: null,
        registerSuccess: false
      };
    case PRODUCT_REGISTER_SUCCESS:
      return {
        ...state,
        registerLoading: false,
        registerSuccess: true,
        // Optionally update products list if the payload contains the new product
        // products: action.payload.product ? [...state.products, action.payload.product] : state.products,
        error: null // Clear previous general errors
      };
    case PRODUCT_REGISTER_FAIL:
      return {
        ...state,
        registerLoading: false,
        registerError: action.payload,
        registerSuccess: false
      };
    case GET_PRODUCTS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case GET_PRODUCTS_SUCCESS:
      if (action.payload.batches) {
        return {
          ...state,
          loading: false,
          batches: action.payload.batches || [],
          page: action.payload.page || 1,
          pages: action.payload.pages || 1,
          totalBatches: action.payload.totalBatches || 0,
          error: null
        };
      } else {
        // This case might not be used if fetchManufacturerProducts is always for batches
        // Or it could be for a different "get all products flat" action
        return {
          ...state,
          loading: false,
          products: action.payload || [], // Assuming payload is an array of products
          error: null
        };
      }
    case GET_PRODUCTS_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

export default productReducer;