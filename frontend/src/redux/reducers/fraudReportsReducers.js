import {
  FETCH_FRAUD_REPORTS_REQUEST,
  FETCH_FRAUD_REPORTS_SUCCESS,
  FETCH_FRAUD_REPORTS_FAILURE,
} from '../actions/fraudReportsActions';

const initialState = {
  allReportsWithDetails: [],
  loading: false,
  error: null,
};

const fraudReportsReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_FRAUD_REPORTS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case FETCH_FRAUD_REPORTS_SUCCESS:
      return {
        ...state,
        loading: false,
        allReportsWithDetails: action.payload,
        error: null,
      };
    case FETCH_FRAUD_REPORTS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        allReportsWithDetails: [],
      };
    default:
      return state;
  }
};

export default fraudReportsReducer;