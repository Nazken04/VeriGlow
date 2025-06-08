// src/components/common/Sidebar.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import '../../styles/Sidebar.css'; // We'll create this CSS

const Sidebar = () => {
  return (
    <aside className="sidebar-container" role="complementary">
      <div className="sidebar-brand">
        <NavLink to="/dashboard" aria-label="Go to Home">
            <span className="material-symbols-outlined logo-icon">track_changes</span>
            <span className="brand-text">VeriGlow</span>
        </NavLink>
      </div>
      <nav className="sidebar-nav" aria-label="Primary navigation">
        <ul>
          <li>
            <NavLink to="/dashboard" end> {/* 'end' prop ensures only exact match is active */}
              <span className="material-symbols-outlined">dashboard</span>
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/product">
              <span className="material-symbols-outlined">inventory_2</span>
              <span>My Products</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/product-register">
              <span className="material-symbols-outlined">add_box</span>
              <span>Register Product</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/fraud-reports">
              <span className="material-symbols-outlined">warning</span>
              <span>Fraud Reports</span>
            </NavLink>
          </li>
          {/* Add more links here as needed */}
        </ul>
      </nav>
      {/* Optional: Add a footer or settings link in the sidebar */}
      {/* <div className="sidebar-footer">
          <NavLink to="/settings">
              <span className="material-symbols-outlined">settings</span>
              <span>Settings</span>
          </NavLink>
      </div> */}
    </aside>
  );
};

export default Sidebar;