import { configureStore } from '@reduxjs/toolkit'; 

import authReducer from './reducers/authReducer'; 
import productReducer from './reducers/productReducer'; 
import fraudReportsReducer from './reducers/fraudReportsReducers'; 

const store = configureStore({
  reducer: {
    auth: authReducer,
    product: productReducer,
    reports: fraudReportsReducer, 
  },
});

export default store; 