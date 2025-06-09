import React, { useState } from 'react'; 
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../redux/actions/authActions';
import '../../styles/Navbar.css'; 


const Toast = ({ message, type = 'success', show, onClose }) => {
    return null;
};


const Navbar = () => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();



  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };



  return (
    <header className="navbar-container top-bar" role="banner">
      {isAuthenticated && (
        <div className="navbar-user-actions">
            <Link to="/dashboard" className="user-profile-link" aria-label="View Profile">
                 {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="User avatar" className="navbar-avatar" />
                ) : (
                    <span className="material-symbols-outlined navbar-avatar-placeholder">account_circle</span>
                )}
                <span className="user-name-desktop">{user ? user.name || user.email : 'Profile'}</span>
            </Link>
            <button onClick={handleLogout} className="logout-button" aria-label="Logout">
                <span className="material-symbols-outlined">logout</span> <span>Logout</span>
            </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;