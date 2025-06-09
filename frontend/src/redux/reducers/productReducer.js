import {
  PRODUCT_REGISTER_REQUEST,
  PRODUCT_REGISTER_SUCCESS,
  PRODUCT_REGISTER_FAIL,
  GET_PRODUCTS_REQUEST,
  GET_PRODUCTS_SUCCESS,
  GET_PRODUCTS_FAIL
} from '../actions/types'; 

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
        error: null 
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
        return {
          ...state,
          loading: false,
          products: action.payload || [], 
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