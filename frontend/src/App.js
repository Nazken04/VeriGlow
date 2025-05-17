import React from 'react';
import { Provider } from 'react-redux';
import store from './redux/store';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import Dashboard from './components/dashboard/Dashboard';
import Profile from './components/dashboard/Profile'; // Assuming you have this
import ProductRegister from './components/products/ProductRegister';
import ManufacturerProducts from './components/products/ManufacturerProducts';
import FraudReports from './components/fraud-reports/FraudReports';
import Navbar from './components/common/Navbar'; // Import Navbar
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

// A helper component to conditionally render Navbar based on route
const AppLayout = ({ children }) => {
  const location = useLocation();
  const noNavPaths = ['/login', '/register', '/forgot-password']; // Paths where Navbar is hidden

  return (
    <>
      {!noNavPaths.includes(location.pathname) && <Navbar />}
      <div className="main-content"> {/* Optional: Add a class for content below navbar */}
        {children}
      </div>
    </>
  );
};


function App() {
  return (
    <Provider store={store}>
      <Router>
        {/* 
          Navbar is rendered outside Routes for pages where it's always visible.
          If you want it to be part of the route structure to hide on certain pages,
          you can create a Layout component.
        */}
        {/* <Navbar /> REMOVED FROM HERE, will be handled by AppLayout or directly in Routes */}
        <Routes>
          {/* Routes without Navbar */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Routes with Navbar - wrap them */}
          <Route path="/dashboard" element={<AppWithNavbar><Dashboard /></AppWithNavbar>} />
          <Route path="/profile" element={<AppWithNavbar><Profile /></AppWithNavbar>} />
          <Route path="/product-register" element={<AppWithNavbar><ProductRegister /></AppWithNavbar>} />
          <Route path="/product" element={<AppWithNavbar><ManufacturerProducts /></AppWithNavbar>} />
          <Route path="/fraud-reports" element={<AppWithNavbar><FraudReports /></AppWithNavbar>} />
          
          {/* Fallback or home route - decide if it needs navbar */}
          <Route path="/" element={
            // Example: Redirect to login or dashboard based on auth
            // For now, let's assume it needs navbar and goes to dashboard if authenticated
            <AppWithNavbar><Dashboard /></AppWithNavbar> 
          } />
        </Routes>
      </Router>
    </Provider>
  );
}

// Helper component to wrap routes that need the Navbar
const AppWithNavbar = ({ children }) => {
  return (
    <>
      <Navbar />
      <div className="page-content-wrapper"> {/* Optional wrapper for styling content area */}
        {children}
      </div>
    </>
  );
};

export default App;