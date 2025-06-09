// src/App.js
import React, { useEffect } from 'react'; // Import useEffect
import { Provider } from 'react-redux';
import store from './redux/store';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import ProductRegister from './components/products/ProductRegister';
import ManufacturerProducts from './components/products/ManufacturerProducts';
import FraudReports from './components/fraud-reports/FraudReports';
import MainLayout from './components/common/MainLayout'; // Import MainLayout
import VerificationPage from './components/auth/VerificationPage';

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify'; // Import ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // Base Toastify CSS


function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerificationPage />} /> 

          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/product-register" element={<ProductRegister />} />
            <Route path="/product" element={<ManufacturerProducts />} />
            <Route path="/fraud-reports" element={<FraudReports />} />
            <Route path="/" element={<Dashboard />} />
          </Route>

          <Route path="*" element={<div>404 Not Found</div>} /> 

        </Routes>
        <ToastContainer /> 
      </Router>
    </Provider>
  );
}

export default App;