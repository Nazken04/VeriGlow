// src/redux/store.js

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './reducers/authReducer';
import fraudReducer from './reducers/fraudReducer';
import productReducer from './reducers/productReducer';

const store = configureStore({
  reducer: {
    auth: authReducer,
    fraud: fraudReducer,
    product: productReducer,
  },
});

export default store;
