
import React from 'react';
import { NavLink } from 'react-router-dom';
import '../../styles/Sidebar.css'; 

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
            <NavLink to="/dashboard" end>
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
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;