import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../redux/actions/authActions'; // Adjust path
import { FaBars, FaTimes, FaUserCircle, FaSignOutAlt } from 'react-icons/fa'; // Example icons
import '../../styles/Navbar.css'; // We'll create this CSS file

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
    setIsOpen(false); // Close menu on logout
  };

  const closeMenu = () => {
    setIsOpen(false);
  };
  
  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);


  // Define paths where Navbar should NOT be shown
  const noNavPaths = ['/login', '/register', '/forgot-password'];
  if (noNavPaths.includes(location.pathname)) {
    return null; // Don't render Navbar on these paths
  }

  return (
    <nav className="navbar-container">
      <div className="navbar-brand">
        <Link to={isAuthenticated ? "/dashboard" : "/login"} onClick={closeMenu}>
          VeriGlow {/* Or your logo image */}
        </Link>
      </div>

      <div className="menu-icon" onClick={toggleMenu}>
        {isOpen ? <FaTimes /> : <FaBars />}
      </div>

      <ul className={isOpen ? "nav-links open" : "nav-links"}>
        {isAuthenticated ? (
          <>
            <li><Link to="/product" onClick={closeMenu}>My Products</Link></li>
            <li><Link to="/product-register" onClick={closeMenu}>Register Product</Link></li>
            <li><Link to="/fraud-reports" onClick={closeMenu}>Fraud Reports</Link></li>
            <li className="nav-user-section-mobile">
                <div className="user-info-mobile">
                    {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="User" className="navbar-avatar-small" />
                    ) : (
                        <FaUserCircle className="navbar-avatar-placeholder-small" />
                    )}
                    <span>{user ? user.name || user.email : 'User'}</span>
                </div>
                <button onClick={handleLogout} className="logout-button-mobile">
                    <FaSignOutAlt /> Logout
                </button>
            </li>
          </>
        ) : (
          <>
            {/* Links for non-authenticated users if needed, e.g., public product search */}
            {/* <li><Link to="/public-search" onClick={closeMenu}>Product Search</Link></li> */}
          </>
        )}
      </ul>

      {isAuthenticated && (
        <div className="navbar-user-actions">
            <Link to="/dashboard" className="user-profile-link">
                 {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="User" className="navbar-avatar" />
                ) : (
                    <FaUserCircle className="navbar-avatar-placeholder" />
                )}
                <span>{user ? user.name || user.email : 'Profile'}</span>
            </Link>
            <button onClick={handleLogout} className="logout-button">
                <FaSignOutAlt /> <span>Logout</span>
            </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;