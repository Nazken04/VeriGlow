import React from 'react';
import ReactDOM from 'react-dom/client';  // Updated import
import './index.css';  // Import global CSS if needed
import App from './App';  // Import App component
import { Provider } from 'react-redux';  // To provide Redux state management
import store from './redux/store';  // Your Redux store

// Updated React 18 render method
const root = ReactDOM.createRoot(document.getElementById('root')); // Create root
root.render( // Use render() on the created root
  <Provider store={store}>
    <App />
  </Provider>
);
